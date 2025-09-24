import { MongoClient } from 'mongodb';

// MongoDB连接字符串
const MONGODB_URI = 'mongodb+srv://jiongzhengwu_db_user:Gjz53234@aiyowaste.muibkcf.mongodb.net/?retryWrites=true&w=majority&appName=AiyoWaste';

// 数据库名称
const DB_NAME = 'aiyowaste';

let client;
let db;

// 连接到MongoDB
export async function connectToDatabase() {
  try {
    if (client && db) {
      return { client, db };
    }

    console.log('🔗 连接到MongoDB...');
    client = new MongoClient(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await client.connect();
    console.log('✅ MongoDB连接成功');

    db = client.db(DB_NAME);
    
    // 创建集合索引
    await createIndexes();
    
    return { client, db };
  } catch (error) {
    console.error('❌ MongoDB连接失败:', error);
    throw error;
  }
}

// 创建数据库索引
async function createIndexes() {
  try {
    const usersCollection = db.collection('users');
    
    // 为邮箱创建唯一索引
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    console.log('✅ 用户邮箱索引创建成功');
    
    // 为验证码创建TTL索引（10分钟后自动删除）
    const verificationCollection = db.collection('verification_codes');
    await verificationCollection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 600 });
    console.log('✅ 验证码TTL索引创建成功');
    
  } catch (error) {
    console.error('❌ 索引创建失败:', error);
  }
}

// 获取数据库实例
export async function getDatabase() {
  if (!db) {
    await connectToDatabase();
  }
  return db;
}

// 关闭数据库连接
export async function closeDatabase() {
  if (client) {
    await client.close();
    console.log('🔌 MongoDB连接已关闭');
  }
}

// 用户相关操作
export class UserService {
  constructor() {
    this.collectionName = 'users';
  }

  async getCollection() {
    const db = await getDatabase();
    return db.collection(this.collectionName);
  }

  // 创建用户
  async createUser(userData) {
    try {
      const collection = await this.getCollection();
      const result = await collection.insertOne({
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true, // 注册后直接激活
        emailVerified: true
      });
      
      console.log('✅ 用户创建成功:', result.insertedId);
      return { success: true, userId: result.insertedId };
    } catch (error) {
      if (error.code === 11000) {
        return { success: false, error: 'Email already exists' };
      }
      console.error('❌ 用户创建失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 根据邮箱查找用户
  async findByEmail(email) {
    try {
      const collection = await this.getCollection();
      const user = await collection.findOne({ email });
      return user;
    } catch (error) {
      console.error('❌ 查找用户失败:', error);
      return null;
    }
  }

  // 激活用户账户
  async activateUser(email) {
    try {
      const collection = await this.getCollection();
      const result = await collection.updateOne(
        { email },
        { 
          $set: { 
            isActive: true, 
            emailVerified: true,
            updatedAt: new Date()
          } 
        }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('❌ 用户激活失败:', error);
      return false;
    }
  }
}

// 验证码相关操作
export class VerificationService {
  constructor() {
    this.collectionName = 'verification_codes';
  }

  async getCollection() {
    const db = await getDatabase();
    return db.collection(this.collectionName);
  }

  // 存储验证码
  async storeCode(email, code) {
    try {
      const collection = await this.getCollection();
      
      // 删除该邮箱的旧验证码
      await collection.deleteMany({ email });
      
      // 插入新验证码
      const result = await collection.insertOne({
        email,
        code,
        createdAt: new Date(),
        attempts: 0
      });
      
      console.log('✅ 验证码存储成功');
      return { success: true, id: result.insertedId };
    } catch (error) {
      console.error('❌ 验证码存储失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 验证验证码
  async verifyCode(email, code) {
    try {
      const collection = await this.getCollection();
      const verification = await collection.findOne({ email });
      
      if (!verification) {
        return { success: false, error: 'No verification code found' };
      }

      if (verification.attempts >= 3) {
        await collection.deleteOne({ email });
        return { success: false, error: 'Too many failed attempts' };
      }

      if (verification.code === code) {
        // 验证成功，标记为已验证而不是删除
        await collection.updateOne(
          { email },
          { 
            $set: { 
              verified: true,
              verifiedAt: new Date()
            } 
          }
        );
        return { success: true };
      } else {
        // 增加尝试次数
        await collection.updateOne(
          { email },
          { $inc: { attempts: 1 } }
        );
        return { success: false, error: 'Invalid verification code' };
      }
    } catch (error) {
      console.error('❌ 验证码验证失败:', error);
      return { success: false, error: error.message };
    }
  }
}
