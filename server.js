import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateVerificationCode, sendVerificationCode } from './src/services/emailService.js';
import { connectToDatabase, UserService, VerificationService, getDatabase } from './src/database/mongodb.js';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 初始化数据库连接
let userService, verificationService;

async function initializeDatabase() {
  try {
    await connectToDatabase();
    userService = new UserService();
    verificationService = new VerificationService();
    console.log('✅ 数据库服务初始化完成');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
}

// 启动时初始化数据库
initializeDatabase();

// 发送验证码API
app.post('/api/send-verification-code', async (req, res) => {
  try {
    console.log('=== 开始发送验证码 ===');
    const { email } = req.body;
    console.log('请求邮箱:', email);
    
    if (!email) {
      console.log('错误: 邮箱为空');
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // 检查用户是否已存在
    const existingUser = await userService.findByEmail(email);
    if (existingUser) {
      console.log('用户已存在:', email);
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // 生成验证码
    const code = generateVerificationCode();
    console.log('生成验证码:', code);
    
    // 存储验证码到数据库
    const storeResult = await verificationService.storeCode(email, code);
    if (!storeResult.success) {
      console.log('验证码存储失败:', storeResult.error);
      return res.status(500).json({ success: false, message: 'Failed to store verification code' });
    }
    
    // 发送邮件
    console.log('准备发送邮件...');
    const result = await sendVerificationCode(email, code);
    console.log('邮件发送结果:', result);
    
    if (result.success) {
      console.log('验证码发送成功');
      res.json({ 
        success: true, 
        message: 'Verification code sent successfully',
        messageId: result.messageId
      });
    } else {
      console.log('验证码发送失败:', result.error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send verification code',
        error: result.error
      });
    }
  } catch (error) {
    console.error('=== API错误 ===');
    console.error('错误类型:', error.name);
    console.error('错误信息:', error.message);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message
    });
  }
});

// 验证验证码API
app.post('/api/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email and code are required' });
    }

    const result = await verificationService.verifyCode(email, code);
    
    if (result.success) {
      res.json({ success: true, message: 'Verification code is valid' });
    } else {
      res.status(400).json({ success: false, message: result.error });
    }
  } catch (error) {
    console.error('Error in verify-code:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message
    });
  }
});

// 用户注册API
app.post('/api/register', async (req, res) => {
  try {
    console.log('=== 开始用户注册 ===');
    const { fullName, email, password, confirmPassword, householdSize } = req.body;
    console.log('注册数据:', { fullName, email, householdSize });
    
    // 验证必填字段
    if (!fullName || !email || !password || !confirmPassword) {
      console.log('错误: 必填字段缺失');
      return res.status(400).json({ success: false, message: 'All required fields must be filled' });
    }
    
    // 验证密码匹配
    if (password !== confirmPassword) {
      console.log('错误: 密码不匹配');
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('错误: 邮箱格式无效');
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }
    
    // 检查用户是否已存在
    const existingUser = await userService.findByEmail(email);
    if (existingUser) {
      console.log('错误: 用户已存在');
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    
    // 检查验证码是否已验证
    const db = await getDatabase();
    const verificationCollection = db.collection('verification_codes');
    const existingCode = await verificationCollection.findOne({ email });
    
    if (!existingCode) {
      console.log('错误: 没有找到验证码');
      return res.status(400).json({ success: false, message: 'Please send and verify your email first' });
    }
    
    if (!existingCode.verified) {
      console.log('错误: 验证码未验证');
      return res.status(400).json({ success: false, message: 'Please verify your email first' });
    }
    
    // 创建用户
    const userData = {
      fullName,
      email,
      password, // 注意：生产环境应该加密密码
      householdSize: householdSize || null
    };
    
    console.log('准备创建用户...');
    const result = await userService.createUser(userData);
    
    if (result.success) {
      console.log('✅ 用户创建成功');
      
      // 用户创建成功后删除验证码
      await verificationCollection.deleteOne({ email });
      console.log('✅ 验证码已清理');
      
      res.json({ 
        success: true, 
        message: 'User registered successfully! You can now login.',
        userId: result.userId
      });
    } else {
      console.log('❌ 用户创建失败:', result.error);
      res.status(400).json({ 
        success: false, 
        message: result.error
      });
    }
  } catch (error) {
    console.error('=== 注册API错误 ===');
    console.error('错误类型:', error.name);
    console.error('错误信息:', error.message);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message
    });
  }
});

// 用户登录API
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    
    const user = await userService.findByEmail(email);
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    // 注意：生产环境应该使用bcrypt比较密码
    if (user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    // 移除账户激活检查 - 注册后可直接登录
    
    res.json({ 
      success: true, 
      message: 'Login successful',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        householdSize: user.householdSize
      }
    });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message
    });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 测试邮件配置
app.get('/api/test-email', async (req, res) => {
  try {
    const testResult = await sendVerificationCode('kaih92224@gmail.com', '123456');
    res.json({ 
      status: 'Test completed', 
      result: testResult,
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'Test failed', 
      error: error.message,
      timestamp: new Date().toISOString() 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Email service running on port ${PORT}`);
  console.log(`📧 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test email: http://localhost:${PORT}/api/test-email`);
});