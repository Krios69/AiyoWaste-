import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { generateVerificationCode, sendVerificationCode, sendActivationEmail } from './src/services/emailService.js';
import { connectToDatabase, UserService, VerificationService, getDatabase } from './src/database/mongodb.js';
import { FoodInventoryService, DonationService } from './src/database/foodService.js';
import { AnalyticsService } from './src/database/analyticsService.js';
import unsplashImageService from './src/services/unsplashImageService.js';
import { ObjectId } from 'mongodb';
import { NotificationService } from './src/database/notificationService.js';
import { MealPlanService } from './src/database/mealPlanService.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
let userService, verificationService, foodInventoryService, donationService, analyticsService, notificationService, mealPlanService;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyAqRjNksBoeAtUht_ab31qDvhwOfk4gBiE';
let geminiClient = null;

if (GEMINI_API_KEY) {
  try {
    geminiClient = new GoogleGenerativeAI(GEMINI_API_KEY);
    console.log('✅ Gemini client initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Gemini client:', error);
  }
} else {
  console.warn('⚠️ GEMINI_API_KEY not set. AI recipe suggestions will use fallback data.');
}

async function initializeDatabase() {
  try {
    await connectToDatabase();
    userService = new UserService();
    verificationService = new VerificationService();
    foodInventoryService = new FoodInventoryService();
    donationService = new DonationService();
    analyticsService = new AnalyticsService();
    notificationService = new NotificationService();
    mealPlanService = new MealPlanService();
    console.log('✅ 数据库服务初始化完成');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
}

// 启动时初始化数据库
initializeDatabase();

function calculateReservationsFromPlan(plan = {}) {
  const reservations = {};
  for (const dayData of Object.values(plan || {})) {
    const meals = dayData?.meals || {};
    for (const meal of Object.values(meals)) {
      if (meal && meal.type === 'inventory' && meal.itemId) {
        const quantity = Number(meal.quantity) || 0;
        if (quantity > 0) {
          if (!reservations[meal.itemId]) {
            reservations[meal.itemId] = 0;
          }
          reservations[meal.itemId] += quantity;
        }
      }
    }
  }
  return reservations;
}

function getWeekStartISO(dateInput = new Date()) {
  const date = new Date(dateInput);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date.toISOString().split('T')[0];
}

const FALLBACK_RECIPES = [
  {
    title: 'Hearty Vegetable Stir-Fry',
    description: 'Quick stir-fry that uses mixed vegetables and pantry staples for a balanced dinner.',
    focusItems: ['mixed vegetables', 'garlic', 'rice'],
    ingredients: [
      '2 cups mixed vegetables (broccoli, carrots, peppers)',
      '2 cloves garlic, minced',
      '1 tbsp soy sauce',
      '1 tsp sesame oil',
      '1 cup cooked rice'
    ],
    steps: [
      'Heat a pan with a small amount of oil over medium-high heat.',
      'Add garlic and mixed vegetables. Stir-fry until vegetables are tender-crisp.',
      'Add soy sauce and sesame oil. Toss to coat evenly.',
      'Serve the stir-fry over warm cooked rice.'
    ],
    tips: 'Add any protein you have on hand, such as tofu or cooked chicken.'
  },
  {
    title: 'Creamy Tomato Pasta Bake',
    description: 'Comforting baked pasta that helps use up tomatoes, dairy, and leftover vegetables.',
    focusItems: ['pasta', 'tomatoes', 'cheese'],
    ingredients: [
      '200g pasta (any shape)',
      '2 cups diced tomatoes or tomato sauce',
      '1 cup shredded cheese',
      '1/2 cup milk or cream',
      '1 cup chopped vegetables (spinach, mushrooms, peppers)'
    ],
    steps: [
      'Preheat oven to 190°C (375°F). Cook pasta until just al dente.',
      'Combine cooked pasta, tomatoes, vegetables, and milk in a baking dish.',
      'Top with shredded cheese.',
      'Bake for 15-20 minutes until bubbly and golden on top.'
    ],
    tips: 'Use any cheese or vegetables you need to finish. Add herbs for extra flavor.'
  },
  {
    title: 'Breakfast Egg Muffins',
    description: 'Portable breakfast option that uses eggs and leftover vegetables or meats.',
    focusItems: ['eggs', 'spinach', 'cheese'],
    ingredients: [
      '6 eggs',
      '1 cup chopped vegetables (spinach, onions, peppers)',
      '1/2 cup shredded cheese',
      'Salt and pepper to taste'
    ],
    steps: [
      'Preheat oven to 180°C (350°F). Grease a muffin tin.',
      'Whisk eggs, salt, and pepper in a bowl.',
      'Stir in chopped vegetables and cheese.',
      'Pour mixture into muffin cups and bake for 18-20 minutes until set.'
    ],
    tips: 'Great for meal prep. Store in the fridge and reheat for quick breakfasts.'
  }
];

function extractJsonFromText(text) {
  if (!text) return null;
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.warn('Unable to parse AI response as JSON:', error);
    return null;
  }
}

function buildRecipePrompt(ingredientsSummary, recipeCount) {
  const intro = `
  You are an assistant chef that helps households reduce food waste by proposing meals using ingredients they currently own.
  `;
  const instructions = `
  Based on the following ingredient list, propose exactly ${recipeCount} recipe idea${recipeCount > 1 ? 's' : ''}. Focus on items that are nearing expiry first.

  Ingredients:
  ${ingredientsSummary}

  Respond with JSON ONLY in the following format:
  [
    {
      "title": "Recipe name",
      "description": "Short enticing summary",
      "focusItems": ["ingredient1", "ingredient2"],
      "ingredients": ["list of ingredients with measures"],
      "steps": ["step 1", "step 2", "step 3"],
      "tips": "Optional extra tips"
    }
  ]

  Do not include any additional commentary or markdown. Keep recipes practical for a household kitchen.
  `;
  return `${intro}\n${instructions}`;
}

async function generateRecipeSuggestionsFromAI(ingredients, recipeCount) {
  if (!geminiClient) {
    return { suggestions: FALLBACK_RECIPES, source: 'fallback', message: 'Gemini API not configured.' };
  }

  try {
    const model = geminiClient.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = buildRecipePrompt(ingredients, recipeCount);
    const result = await model.generateContent(prompt);
    const text = result?.response?.text?.();
    const parsed = extractJsonFromText(text);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return { suggestions: parsed.slice(0, recipeCount), source: 'ai' };
    }
    return { suggestions: FALLBACK_RECIPES, source: 'fallback', message: 'AI response could not be parsed.' };
  } catch (error) {
    console.error('Error generating AI recipes:', error);
    return { suggestions: FALLBACK_RECIPES, source: 'fallback', message: 'AI service error.' };
  }
}

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
    const { fullName, email, password, householdSize } = req.body;
    console.log('注册数据:', { fullName, email, householdSize });
    
    // 验证必填字段
    if (!fullName || !email || !password) {
      console.log('错误: 必填字段缺失');
      return res.status(400).json({ success: false, message: 'All required fields must be filled' });
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

// ========== 餐食计划 API ==========

app.get('/api/meal-plans', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User authentication required' });
    }

    const weekStartDate = req.query.weekStartDate || getWeekStartISO();
    const mealPlan = await mealPlanService.getMealPlan(userId, weekStartDate);

    res.json({
      success: true,
      mealPlan
    });
  } catch (error) {
    console.error('Error fetching meal plan:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch meal plan' });
  }
});

app.post('/api/meal-plans', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User authentication required' });
    }

    const { weekStartDate, plan } = req.body;
    if (!weekStartDate || !plan) {
      return res.status(400).json({ success: false, message: 'Week start date and plan are required' });
    }

    const reservations = calculateReservationsFromPlan(plan);
    const savedPlan = await mealPlanService.saveMealPlan(userId, weekStartDate, plan, reservations);

    await foodInventoryService.updateReservedQuantities(userId, reservations);
    await notificationService.syncMealPlanReminders(userId, weekStartDate, plan);

    res.json({
      success: true,
      mealPlan: savedPlan
    });
  } catch (error) {
    console.error('Error saving meal plan:', error);
    res.status(500).json({ success: false, message: 'Failed to save meal plan' });
  }
});

app.post('/api/meal-plans/suggestions', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User authentication required' });
    }

    const { focusExpiringOnly = false } = req.body || {};
    const inventoryResult = await foodInventoryService.getFoodItems(userId);

    if (!inventoryResult.success) {
      return res.status(500).json({ success: false, message: inventoryResult.error || 'Failed to load inventory' });
    }

    const now = new Date();
    const normalizeItem = item => {
      const expiryDate = item.expiryDate ? new Date(item.expiryDate) : null;
      let daysUntilExpiry = null;
      if (expiryDate && !Number.isNaN(expiryDate.getTime())) {
        daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
      }
      return {
        id: item._id?.toString(),
        name: item.name,
        quantity: item.quantity || 1,
        category: item.category || '',
        expiryDate: item.expiryDate || null,
        daysUntilExpiry,
        forDonation: item.forDonation || false
      };
    };

    const normalizedItems = (inventoryResult.items || [])
      .filter(item => !item.forDonation)
      .map(normalizeItem);

    const activeItems = normalizedItems.filter(item =>
      item.daysUntilExpiry === null || item.daysUntilExpiry >= 0
    );

    const expiringItems = activeItems.filter(item => item.daysUntilExpiry !== null && item.daysUntilExpiry <= 5);
    const candidateItems = focusExpiringOnly && expiringItems.length > 0 ? expiringItems : activeItems;
    if (candidateItems.length === 0) {
      return res.json({
        success: true,
        suggestions: [],
        source: 'none',
        message: 'No fresh ingredients available for recipe suggestions.',
        usedIngredients: []
      });
    }

    const limitedItems = candidateItems
      .sort((a, b) => {
        const aVal = a.daysUntilExpiry === null ? Number.MAX_SAFE_INTEGER : a.daysUntilExpiry;
        const bVal = b.daysUntilExpiry === null ? Number.MAX_SAFE_INTEGER : b.daysUntilExpiry;
        return aVal - bVal;
      })
      .slice(0, 12);

    const ingredientSummary = limitedItems
      .map(item => {
        const expiryText = item.daysUntilExpiry === null
          ? 'no expiry data'
          : item.daysUntilExpiry < 0
            ? `expired ${Math.abs(item.daysUntilExpiry)} day(s) ago`
            : `expires in ${item.daysUntilExpiry} day(s)`;
        return `- ${item.name} (qty: ${item.quantity}) • ${expiryText}`;
      })
      .join('\n');

    let recipeCount = 1;
    if (limitedItems.length === 1) {
      recipeCount = 3;
    } else if (limitedItems.length === 2) {
      recipeCount = 2;
    }

    const aiResult = await generateRecipeSuggestionsFromAI(ingredientSummary, recipeCount);

    res.json({
      success: true,
      suggestions: aiResult.suggestions,
      source: aiResult.source,
      message: aiResult.message,
      usedIngredients: limitedItems
    });
  } catch (error) {
    console.error('Error generating meal plan suggestions:', error);
    res.status(500).json({ success: false, message: 'Failed to generate recipe suggestions' });
  }
});

// ========== 通知管理 API ==========

// 获取通知列表（并自动生成最新提醒）
app.get('/api/notifications', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User authentication required' });
    }

    await notificationService.generateNotificationsForUser(userId);
    const result = await notificationService.getNotifications(userId);

    res.json({ success: true, notifications: result.notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

// 标记单条通知为已读
app.post('/api/notifications/:notificationId/read', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User authentication required' });
    }

    const { notificationId } = req.params;
    const updated = await notificationService.markAsRead(notificationId, userId);

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
  }
});

// 标记全部通知为已读
app.post('/api/notifications/mark-all-read', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User authentication required' });
    }

    const count = await notificationService.markAllAsRead(userId);
    res.json({ success: true, updated: count });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: 'Failed to update notifications' });
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

// ==================== Analytics APIs ====================

// 获取分析摘要
app.get('/api/analytics/summary', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User ID is required' });
    }

    const { startDate, endDate } = req.query;
    const dateRange = {};
    if (startDate) dateRange.startDate = startDate;
    if (endDate) dateRange.endDate = endDate;

    const result = await analyticsService.getAnalyticsSummary(userId, dateRange);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error getting analytics summary:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取已使用的物品列表
app.get('/api/analytics/used-items', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User ID is required' });
    }

    const { startDate, endDate } = req.query;
    const dateRange = {};
    if (startDate) dateRange.startDate = startDate;
    if (endDate) dateRange.endDate = endDate;

    const result = await analyticsService.getUsedItems(userId, dateRange);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error getting used items:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取图表数据
app.get('/api/analytics/chart-data', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User ID is required' });
    }

    const { type, startDate, endDate } = req.query;
    const chartType = type || 'weekly';
    const dateRange = {};
    if (startDate) dateRange.startDate = startDate;
    if (endDate) dateRange.endDate = endDate;

    const result = await analyticsService.getChartData(userId, chartType, dateRange);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error getting chart data:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取类别统计
app.get('/api/analytics/category-stats', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User ID is required' });
    }

    const result = await analyticsService.getCategoryStats(userId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error getting category stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取时间序列数据
app.get('/api/analytics/time-series', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User ID is required' });
    }

    const days = parseInt(req.query.days) || 30;
    const result = await analyticsService.getTimeSeriesData(userId, days);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error getting time series data:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 标记物品为已使用（软删除）
app.put('/api/food-inventory/:id/mark-used', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User ID is required' });
    }

    const { id } = req.params;
    const { reason } = req.body;
    
    const success = await foodInventoryService.markAsUsed(id, userId, reason || 'used');
    
    if (success) {
      res.json({ success: true, message: 'Item marked as used successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Item not found or could not be updated' });
    }
  } catch (error) {
    console.error('Error marking item as used:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Email service running on port ${PORT}`);
  console.log(`📧 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test email: http://localhost:${PORT}/api/test-email`);
});