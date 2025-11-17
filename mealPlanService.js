import { getDatabase } from './mongodb.js';

export class MealPlanService {
  constructor() {
    this.collectionName = 'meal_plans';
  }

  async getCollection() {
    const db = await getDatabase();
    return db.collection(this.collectionName);
  }

  async getMealPlan(userId, weekStartDate) {
    const collection = await this.getCollection();
    const plan = await collection.findOne({ userId, weekStartDate });
    return plan;
  }

  async saveMealPlan(userId, weekStartDate, plan, reservations = {}) {
    const collection = await this.getCollection();
    const now = new Date();
    const result = await collection.findOneAndUpdate(
      { userId, weekStartDate },
      {
        $set: {
          plan,
          reservations,
          updatedAt: now
        },
        $setOnInsert: {
          userId,
          weekStartDate,
          createdAt: now
        }
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    );
    return result.value;
  }
}


