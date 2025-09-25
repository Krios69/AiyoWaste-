import { getDatabase } from './mongodb.js';
import { ObjectId } from 'mongodb';

// 食物库存相关操作
export class FoodInventoryService {
  constructor() {
    this.collectionName = 'food_items';
  }

  async getCollection() {
    const db = await getDatabase();
    return db.collection(this.collectionName);
  }

  // 添加食物物品
  async addFoodItem(userId, foodData) {
    try {
      const collection = await this.getCollection();
      const result = await collection.insertOne({
        ...foodData,
        userId,
        forDonation: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('✅ 食物物品添加成功:', result.insertedId);
      return { success: true, itemId: result.insertedId };
    } catch (error) {
      console.error('❌ 食物物品添加失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 获取用户的食物库存
  async getFoodItems(userId, filters = {}) {
    try {
      const collection = await this.getCollection();
      const query = { userId };
      
      if (filters.forDonation !== undefined) {
        query.forDonation = filters.forDonation;
      }
      
      const items = await collection.find(query).sort({ createdAt: -1 }).toArray();
      return { success: true, items };
    } catch (error) {
      console.error('❌ 获取食物库存失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 更新食物物品
  async updateFoodItem(itemId, updateData) {
    try {
      const collection = await this.getCollection();
      const result = await collection.updateOne(
        { _id: new ObjectId(itemId) },
        { 
          $set: { 
            ...updateData,
            updatedAt: new Date()
          } 
        }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('❌ 更新食物物品失败:', error);
      return false;
    }
  }

  // 删除食物物品
  async deleteFoodItem(itemId) {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({ _id: new ObjectId(itemId) });
      
      return result.deletedCount > 0;
    } catch (error) {
      console.error('❌ 删除食物物品失败:', error);
      return false;
    }
  }

  // 标记为捐赠
  async markForDonation(itemId, forDonation = true) {
    try {
      const collection = await this.getCollection();
      const result = await collection.updateOne(
        { _id: new ObjectId(itemId) },
        { 
          $set: { 
            forDonation,
            updatedAt: new Date()
          } 
        }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('❌ 标记捐赠失败:', error);
      return false;
    }
  }
}

// 捐赠管理相关操作
export class DonationService {
  constructor() {
    this.collectionName = 'donations';
  }

  async getCollection() {
    const db = await getDatabase();
    return db.collection(this.collectionName);
  }

  // 创建捐赠记录
  async createDonation(userId, donationData) {
    try {
      const collection = await this.getCollection();
      
      // 生成捐赠ID
      const donationId = 'DON' + Date.now().toString().slice(-8);
      
      const result = await collection.insertOne({
        ...donationData,
        userId,
        donationId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('✅ 捐赠记录创建成功:', result.insertedId);
      return { success: true, donationId: result.insertedId };
    } catch (error) {
      console.error('❌ 捐赠记录创建失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 获取用户的捐赠记录
  async getDonations(userId) {
    try {
      const collection = await this.getCollection();
      const donations = await collection.find({ userId }).sort({ createdAt: -1 }).toArray();
      return { success: true, donations };
    } catch (error) {
      console.error('❌ 获取捐赠记录失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 删除捐赠记录
  async deleteDonation(donationId) {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({ _id: new ObjectId(donationId) });
      
      return result.deletedCount > 0;
    } catch (error) {
      console.error('❌ 删除捐赠记录失败:', error);
      return false;
    }
  }

  // 更新捐赠记录
  async updateDonation(donationId, updateData) {
    try {
      const collection = await this.getCollection();
      const result = await collection.updateOne(
        { _id: new ObjectId(donationId) },
        { 
          $set: { 
            ...updateData,
            updatedAt: new Date()
          } 
        }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('❌ 更新捐赠记录失败:', error);
      return false;
    }
  }
}
