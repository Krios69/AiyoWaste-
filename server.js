import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { generateVerificationCode, sendVerificationCode, sendActivationEmail } from './src/services/emailService.js';
import { connectToDatabase, UserService, VerificationService, getDatabase } from './src/database/mongodb.js';
import { FoodInventoryService, DonationService } from './src/database/foodService.js';
import unsplashImageService from './src/services/unsplashImageService.js';
import { ObjectId } from 'mongodb';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 静态文件服务 - 用于提供生成的图片
app.use('/generated-images', express.static(path.join(process.cwd(), 'public', 'generated-images')));

// 初始化数据库连接
let userService, verificationService, foodInventoryService, donationService;

async function initializeDatabase() {
  try {
    await connectToDatabase();
    userService = new UserService();
    verificationService = new VerificationService();
    foodInventoryService = new FoodInventoryService();
    donationService = new DonationService();
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
      
      // 生成激活令牌和验证码
      const activationToken = generateVerificationCode() + Date.now().toString().slice(-4); // 10位激活令牌
      const activationCode = generateVerificationCode(); // 6位验证码
      
      // 保存激活令牌到数据库
      const activationCollection = db.collection('activation_tokens');
      await activationCollection.insertOne({
        email,
        token: activationToken,
        code: activationCode,
        used: false,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时后过期
      });
      
      // 清理旧的验证码记录
      await verificationCollection.deleteOne({ email });
      console.log('✅ 旧验证码已清理');
      
      // 发送激活邮件
      try {
        const emailResult = await sendActivationEmail(email, activationCode, activationToken);
        if (emailResult.success) {
          console.log('✅ 激活邮件发送成功');
        } else {
          console.log('⚠️ 激活邮件发送失败:', emailResult.error);
        }
      } catch (emailError) {
        console.error('❌ 激活邮件发送异常:', emailError);
      }
      
      res.json({ 
        success: true, 
        message: 'Registration successful! Please check your email to activate your account.',
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
    
    // 检查账户是否已激活
    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account not activated. Please check your email and activate your account first.' 
      });
    }
    
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

// 账户激活API
app.post('/api/activate-account', async (req, res) => {
  try {
    console.log('=== 开始账户激活 ===');
    const { email, token, verificationCode, newPassword } = req.body;
    console.log('激活数据:', { email, token, verificationCode: '******' });
    
    // 验证必填字段
    if (!email || !token || !verificationCode || !newPassword) {
      console.log('错误: 必填字段缺失');
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    
    // 验证验证码格式
    if (verificationCode.length !== 6 || !/^\d{6}$/.test(verificationCode)) {
      console.log('错误: 验证码格式无效');
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid verification code format',
        field: 'code'
      });
    }
    
    // 验证密码长度
    if (newPassword.length < 6) {
      console.log('错误: 密码太短');
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    
    // 查找激活令牌
    const db = await getDatabase();
    const activationCollection = db.collection('activation_tokens');
    const verificationCollection = db.collection('verification_codes');
    const tokenRecord = await activationCollection.findOne({ 
      email, 
      token,
      used: false,
      expiresAt: { $gt: new Date() }
    });
    
    if (!tokenRecord) {
      console.log('错误: 激活令牌无效或已过期');
      return res.status(400).json({ success: false, message: 'Invalid or expired activation link' });
    }
    
    // 验证验证码（从激活令牌记录中获取）
    console.log('验证验证码...');
    if (tokenRecord.code !== verificationCode) {
      console.log('错误: 验证码不匹配');
      console.log('期望的验证码:', tokenRecord.code);
      console.log('用户输入的验证码:', verificationCode);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid verification code',
        field: 'code'
      });
    }
    
    console.log('✅ 验证码验证成功');
    
    // 更新用户密码并激活账户
    const updateResult = await userService.updateUser(email, {
      password: newPassword, // 注意：生产环境应该加密密码
      isActive: true,
      emailVerified: true,
      activatedAt: new Date()
    });
    
    if (!updateResult) {
      console.log('错误: 用户更新失败');
      return res.status(500).json({ success: false, message: 'Failed to activate account' });
    }
    
    // 标记激活令牌为已使用
    await activationCollection.updateOne(
      { email, token },
      { $set: { used: true, usedAt: new Date() } }
    );
    
    // 删除验证码
    await verificationCollection.deleteOne({ email });
    console.log('✅ 验证码已清理');
    
    console.log('✅ 账户激活成功');
    res.json({ 
      success: true, 
      message: 'Account activated successfully! You can now login.'
    });
    
  } catch (error) {
    console.error('=== 激活API错误 ===');
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

// 管理API - 获取所有用户
app.get('/api/admin/users', async (req, res) => {
  try {
    const db = await getDatabase();
    const usersCollection = db.collection('users');
    const users = await usersCollection.find({}).toArray();
    
    // 移除密码字段
    const safeUsers = users.map(user => {
      const { password, ...safeUser } = user;
      return safeUser;
    });
    
    res.json({ success: true, users: safeUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// 管理API - 删除用户
app.delete('/api/admin/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('删除用户ID:', userId);
    
    const db = await getDatabase();
    const usersCollection = db.collection('users');
    const activationCollection = db.collection('activation_tokens');
    const verificationCollection = db.collection('verification_codes');
    
    // 转换ObjectId并查找用户
    let user;
    try {
      const objectId = new ObjectId(userId);
      user = await usersCollection.findOne({ _id: objectId });
    } catch (idError) {
      console.error('Invalid ObjectId:', userId);
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }
    
    if (!user) {
      console.log('用户未找到:', userId);
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    console.log('找到用户:', user.email);
    
    // 删除用户相关数据
    const objectId = new ObjectId(userId);
    await usersCollection.deleteOne({ _id: objectId });
    await activationCollection.deleteMany({ email: user.email });
    await verificationCollection.deleteMany({ email: user.email });
    
    console.log(`✅ 用户 ${user.email} 及其相关数据已删除`);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
});

// 管理API - 获取所有激活令牌
app.get('/api/admin/tokens', async (req, res) => {
  try {
    const db = await getDatabase();
    const activationCollection = db.collection('activation_tokens');
    const tokens = await activationCollection.find({}).toArray();
    
    res.json({ success: true, tokens });
  } catch (error) {
    console.error('Error fetching tokens:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tokens' });
  }
});

// 管理API - 删除激活令牌
app.delete('/api/admin/tokens/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params;
    const db = await getDatabase();
    const activationCollection = db.collection('activation_tokens');
    
    const objectId = new ObjectId(tokenId);
    const result = await activationCollection.deleteOne({ _id: objectId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }
    
    console.log(`✅ 激活令牌 ${tokenId} 已删除`);
    res.json({ success: true, message: 'Token deleted successfully' });
  } catch (error) {
    console.error('Error deleting token:', error);
    res.status(500).json({ success: false, message: 'Failed to delete token' });
  }
});

// 管理API - 获取所有验证码
app.get('/api/admin/codes', async (req, res) => {
  try {
    const db = await getDatabase();
    const verificationCollection = db.collection('verification_codes');
    const codes = await verificationCollection.find({}).toArray();
    
    res.json({ success: true, codes });
  } catch (error) {
    console.error('Error fetching codes:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch codes' });
  }
});

// 管理API - 删除验证码
app.delete('/api/admin/codes/:codeId', async (req, res) => {
  try {
    const { codeId } = req.params;
    const db = await getDatabase();
    const verificationCollection = db.collection('verification_codes');
    
    const objectId = new ObjectId(codeId);
    const result = await verificationCollection.deleteOne({ _id: objectId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Code not found' });
    }
    
    console.log(`✅ 验证码 ${codeId} 已删除`);
    res.json({ success: true, message: 'Code deleted successfully' });
  } catch (error) {
    console.error('Error deleting code:', error);
    res.status(500).json({ success: false, message: 'Failed to delete code' });
  }
});


// ========== 图片生成 API ==========

// 生成食物图片（使用Unsplash）
app.post('/api/generate-food-image', async (req, res) => {
  try {
    const { foodName } = req.body;
    
    if (!foodName) {
      return res.status(400).json({ success: false, message: 'Food name is required' });
    }
    
    console.log(`🌐 收到图片生成请求: ${foodName}`);
    
    // 调用Unsplash图片生成服务
    const result = await unsplashImageService.generateFoodImage(foodName);
    
    if (result.success) {
      res.json({ 
        success: true, 
        imagePath: result.imagePath,
        imageUrl: result.imageUrl,
        message: 'Image generated successfully from Unsplash'
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to generate image',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error generating food image:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message
    });
  }
});

// ========== 食物库存管理 API ==========

// 获取食物库存
app.get('/api/food-inventory', async (req, res) => {
  try {
    // 从请求头获取用户ID（实际应用中应该从认证token中获取）
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User authentication required' });
    }
    
    const forDonation = req.query.forDonation === 'true';
    
    const filters = {};
    if (req.query.forDonation !== undefined) {
      filters.forDonation = forDonation;
    }
    
    const result = await foodInventoryService.getFoodItems(userId, filters);
    
    if (result.success) {
      res.json({ success: true, items: result.items });
    } else {
      res.status(500).json({ success: false, message: result.error });
    }
  } catch (error) {
    console.error('Error fetching food inventory:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// 添加食物物品
app.post('/api/food-inventory', async (req, res) => {
  try {
    // 从请求头获取用户ID
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User authentication required' });
    }
    
    const result = await foodInventoryService.addFoodItem(userId, req.body);
    
    if (result.success) {
      res.json({ success: true, itemId: result.itemId });
    } else {
      res.status(400).json({ success: false, message: result.error });
    }
  } catch (error) {
    console.error('Error adding food item:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// 更新食物物品
app.put('/api/food-inventory/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User authentication required' });
    }
    
    const result = await foodInventoryService.updateFoodItem(itemId, req.body, userId);
    
    if (result) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, message: 'Food item not found or update failed' });
    }
  } catch (error) {
    console.error('Error updating food item:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// 删除食物物品
app.delete('/api/food-inventory/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const result = await foodInventoryService.deleteFoodItem(itemId);
    
    if (result) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, message: 'Food item not found or delete failed' });
    }
  } catch (error) {
    console.error('Error deleting food item:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// 标记为捐赠/取消捐赠
app.patch('/api/food-inventory/:itemId/donate', async (req, res) => {
  try {
    const { itemId } = req.params;
    const forDonation = req.body.forDonation !== undefined ? req.body.forDonation : true;
    
    const result = await foodInventoryService.markForDonation(itemId, forDonation);
    
    if (result) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, message: 'Food item not found or update failed' });
    }
  } catch (error) {
    console.error('Error marking for donation:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ========== 捐赠管理 API ==========

// 获取捐赠记录
app.get('/api/donations', async (req, res) => {
  try {
    // 从请求头获取用户ID
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User authentication required' });
    }
    
    const result = await donationService.getDonations(userId);
    
    if (result.success) {
      res.json({ success: true, donations: result.donations });
    } else {
      res.status(500).json({ success: false, message: result.error });
    }
  } catch (error) {
    console.error('Error fetching donations:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// 创建捐赠记录
app.post('/api/donations', async (req, res) => {
  try {
    // 从请求头获取用户ID
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User authentication required' });
    }
    
    const result = await donationService.createDonation(userId, req.body);
    
    if (result.success) {
      res.json({ success: true, donationId: result.donationId });
    } else {
      res.status(400).json({ success: false, message: result.error });
    }
  } catch (error) {
    console.error('Error creating donation:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// 删除捐赠记录
app.delete('/api/donations/:donationId', async (req, res) => {
  try {
    const { donationId } = req.params;
    const result = await donationService.deleteDonation(donationId);
    
    if (result) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, message: 'Donation not found or delete failed' });
    }
  } catch (error) {
    console.error('Error deleting donation:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// 获取用户的捐赠食物列表
app.get('/api/donation-items', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User authentication required' });
    }
    
    const result = await foodInventoryService.getFoodItems(userId, { forDonation: true });
    
    if (result.success) {
      // 为每个捐赠物品添加是否可以取消的信息
      const donationItems = result.items.map(item => {
        const donationTime = new Date(item.donationInfo?.createdAt || item.updatedAt);
        const now = new Date();
        const hoursSinceDonation = (now - donationTime) / (1000 * 60 * 60);
        const canCancel = hoursSinceDonation <= 8;
        
        return {
          ...item,
          canCancel,
          hoursSinceDonation: Math.round(hoursSinceDonation * 10) / 10
        };
      });
      
      res.json({ success: true, items: donationItems });
    } else {
      res.status(500).json({ success: false, message: result.error });
    }
  } catch (error) {
    console.error('Error fetching donation items:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// 取消捐赠
app.put('/api/donation-items/:itemId/cancel', async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User authentication required' });
    }
    
    // 首先获取物品信息，检查是否可以取消
    const itemsResult = await foodInventoryService.getFoodItems(userId, { forDonation: true });
    if (!itemsResult.success) {
      return res.status(500).json({ success: false, message: 'Failed to fetch item information' });
    }
    
    const item = itemsResult.items.find(i => i._id.toString() === itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Donation item not found' });
    }
    
    // 检查是否超过8小时
    const donationTime = new Date(item.donationInfo?.createdAt || item.updatedAt);
    const now = new Date();
    const hoursSinceDonation = (now - donationTime) / (1000 * 60 * 60);
    
    if (hoursSinceDonation > 8) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot cancel donation after 8 hours',
        hoursSinceDonation: Math.round(hoursSinceDonation * 10) / 10
      });
    }
    
    // 取消捐赠：将forDonation设为false，清除donationInfo
    const updateResult = await foodInventoryService.updateFoodItem(itemId, {
      forDonation: false,
      donationInfo: null
    }, userId);
    
    if (updateResult) {
      res.json({ success: true, message: 'Donation cancelled successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Failed to cancel donation' });
    }
  } catch (error) {
    console.error('Error cancelling donation:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
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