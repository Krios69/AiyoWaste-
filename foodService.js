import { getDatabase } from './mongodb.js';
import { ObjectId } from 'mongodb';

// 食物库存相关操作
const normalizeExpiryDate = (value) => {
  if (!value) return null;
  const dateValue = value instanceof Date ? value : new Date(value);
  return Number.isNaN(dateValue.getTime()) ? null : dateValue;
};

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
        isUsed: false,
        usedDate: null,
        usedBy: null,
        deletionReason: null,
        imagePath: foodData.imagePath || null, // 存储Unsplash生成的图片路径
        createdAt: new Date(),
        updatedAt: new Date(),
        expiryDate: normalizeExpiryDate(foodData.expiryDate)
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
      
      // 默认只显示未使用的物品
      if (filters.includeUsed !== true) {
        query.isUsed = { $ne: true };
      }
      
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
  async updateFoodItem(itemId, updateData, userId = null) {
    try {
      const collection = await this.getCollection();
      
      // 构建查询条件
      const query = { _id: new ObjectId(itemId) };
      
      // 如果提供了userId，确保只能更新自己的物品
      if (userId) {
        query.userId = userId;
      }
      
      const updatePayload = {
        ...updateData
      };

      if (Object.prototype.hasOwnProperty.call(updatePayload, 'expiryDate')) {
        updatePayload.expiryDate = normalizeExpiryDate(updatePayload.expiryDate);
      }

      const result = await collection.updateOne(
        query,
        { 
          $set: { 
            ...updatePayload,
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

  // 标记为已使用（软删除）
  async markAsUsed(itemId, userId, reason = 'used') {
    try {
      const collection = await this.getCollection();
      const result = await collection.updateOne(
        { _id: new ObjectId(itemId) },
        { 
          $set: { 
            isUsed: true,
            usedDate: new Date(),
            usedBy: userId,
            deletionReason: reason,
            updatedAt: new Date()
          } 
        }
      );
      
      console.log('✅ 物品标记为已使用:', itemId);
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('❌ 标记已使用失败:', error);
      return false;
    }
  }

  async updateReservedQuantities(userId, reservations = {}) {
    try {
      const collection = await this.getCollection();
      const reservationEntries = Object.entries(reservations || {});
      const objectIdReservations = reservationEntries.map(([itemId, value]) => ({
        objectId: new ObjectId(itemId),
        value: Number(value) || 0
      }));

      // Clear reserved info for items not in reservations
      const idsToKeep = objectIdReservations.map(entry => entry.objectId);
      if (idsToKeep.length > 0) {
        await collection.updateMany(
          {
            userId,
            _id: { $nin: idsToKeep }
          },
          {
            $unset: { reservedForMealPlan: '' },
            $set: { updatedAt: new Date() }
          }
        );
      } else {
        await collection.updateMany(
          { userId },
          {
            $unset: { reservedForMealPlan: '' },
            $set: { updatedAt: new Date() }
          }
        );
      }

      // Update reserved counts for relevant items
      for (const entry of objectIdReservations) {
        await collection.updateOne(
          { userId, _id: entry.objectId },
          {
            $set: {
              reservedForMealPlan: entry.value,
              updatedAt: new Date()
            }
          }
        );
      }
    } catch (error) {
      console.error('❌ 更新预留份数失败:', error);
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
