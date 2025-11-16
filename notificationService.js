import { getDatabase } from './mongodb.js';
import { ObjectId } from 'mongodb';

const NOTIFICATION_TYPES = {
  INVENTORY: 'inventory',
  DONATION: 'donation',
  MEAL_PLAN: 'meal-plan',
  ACCOUNT: 'account'
};

export class NotificationService {
  constructor() {
    this.collectionName = 'notifications';
  }

  async getCollection() {
    const db = await getDatabase();
    return db.collection(this.collectionName);
  }

  /**
   * Ensure the user has notifications generated for current inventory state.
   * This method performs idempotent upserts so it can be safely executed on every fetch.
   */
  async generateNotificationsForUser(userId) {
    const db = await getDatabase();
    const foodCollection = db.collection('food_items');

    const items = await foodCollection
      .find({ userId, isUsed: { $ne: true } })
      .toArray();

    const collection = await this.getCollection();
    const now = new Date();
    const toDeleteKeys = new Set();

    // Keep track of keys we touched, used later to prune stale notifications
    const touchedKeys = new Set();

    for (const item of items) {
      const itemId = item._id.toString();
      const expiry = item.expiryDate ? new Date(item.expiryDate) : null;

      // Inventory expiry notifications
      if (expiry && !Number.isNaN(expiry.getTime())) {
        const msPerDay = 1000 * 60 * 60 * 24;
        const daysUntilExpiry = Math.ceil((expiry - now) / msPerDay);

        const inventoryKey = `inventory-${itemId}`;
        if (daysUntilExpiry >= 0 && daysUntilExpiry <= 4) {
          touchedKeys.add(inventoryKey);
          const message =
            daysUntilExpiry === 0
              ? `${item.name} expires today. Consider using or donating it.`
              : `${item.name} expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'} on ${expiry.toLocaleDateString()}.`;

          await collection.updateOne(
            { userId, uniqueKey: inventoryKey },
            {
              $set: {
                type: NOTIFICATION_TYPES.INVENTORY,
                title: 'Inventory Alert',
                message,
                status: 'unread',
                relatedItemId: item._id,
                metadata: {
                  itemId,
                  expiryDate: item.expiryDate,
                  daysUntilExpiry,
                  category: item.category || null
                },
                link: '/food-inventory',
                updatedAt: now
              },
              $setOnInsert: {
                userId,
                uniqueKey: inventoryKey,
                createdAt: now
              }
            },
            { upsert: true }
          );
        } else {
          toDeleteKeys.add(inventoryKey);
        }
      }

      // Donation update notifications
      const donationKey = `donation-${itemId}`;
      if (item.forDonation && item.donationInfo) {
        touchedKeys.add(donationKey);
        const donationInfo = item.donationInfo || {};
        const messageParts = [];
        if (donationInfo.pickupLocation) {
          messageParts.push(`Pickup at ${donationInfo.pickupLocation}`);
        }
        if (donationInfo.availableTime) {
          messageParts.push(`Available: ${donationInfo.availableTime}`);
        }

        const message =
          messageParts.length > 0
            ? `${item.name} donation scheduled. ${messageParts.join(' • ')}`
            : `${item.name} donation record has been created.`;

        await collection.updateOne(
          { userId, uniqueKey: donationKey },
          {
            $set: {
              type: NOTIFICATION_TYPES.DONATION,
              title: 'Donation Update',
              message,
              status: 'unread',
              relatedItemId: item._id,
              metadata: {
                itemId,
                pickupLocation: donationInfo.pickupLocation || null,
                availableTime: donationInfo.availableTime || null,
                contact: donationInfo.contact || null
              },
              link: '/donations',
              updatedAt: now
            },
            $setOnInsert: {
              userId,
              uniqueKey: donationKey,
              createdAt: now
            }
          },
          { upsert: true }
        );
      } else {
        toDeleteKeys.add(donationKey);
      }

      // Meal planning reminders based on notes or category naming
      const notes = (item.notes || '').toLowerCase();
      const category = (item.category || '').toLowerCase();
      const isMealRelated =
        ['meal', 'dinner', 'lunch', 'breakfast'].some(keyword => notes.includes(keyword)) ||
        ['meal prep', 'prepared meals', 'meal plan'].some(keyword => category.includes(keyword));

      const mealKey = `meal-${itemId}`;
      if (isMealRelated && expiry && !Number.isNaN(expiry.getTime())) {
        touchedKeys.add(mealKey);
        const message = `${item.name} is part of your meal plan. Ensure it is ready for ${expiry.toLocaleDateString()}.`;
        await collection.updateOne(
          { userId, uniqueKey: mealKey },
          {
            $set: {
              type: NOTIFICATION_TYPES.MEAL_PLAN,
              title: 'Meal Planning Reminder',
              message,
              status: 'unread',
              relatedItemId: item._id,
              metadata: {
                itemId,
                expiryDate: item.expiryDate,
                notes: item.notes || ''
              },
              link: '/food-inventory',
              updatedAt: now
            },
            $setOnInsert: {
              userId,
              uniqueKey: mealKey,
              createdAt: now
            }
          },
          { upsert: true }
        );
      } else {
        toDeleteKeys.add(mealKey);
      }
    }

    // Remove obsolete notifications that are no longer relevant
    if (toDeleteKeys.size > 0) {
      await collection.deleteMany({
        userId,
        uniqueKey: { $in: Array.from(toDeleteKeys).filter(key => !touchedKeys.has(key)) }
      });
    }
  }

  async getNotifications(userId) {
    const collection = await this.getCollection();
    const notifications = await collection
      .find({ userId })
      .sort({ createdAt: -1, updatedAt: -1 })
      .toArray();
    return { success: true, notifications };
  }

  async markAsRead(notificationId, userId) {
    const collection = await this.getCollection();
    const result = await collection.updateOne(
      { _id: new ObjectId(notificationId), userId },
      {
        $set: {
          status: 'read',
          updatedAt: new Date()
        }
      }
    );
    return result.modifiedCount > 0;
  }

  async markAllAsRead(userId) {
    const collection = await this.getCollection();
    const result = await collection.updateMany(
      { userId, status: { $ne: 'read' } },
      {
        $set: {
          status: 'read',
          updatedAt: new Date()
        }
      }
    );
    return result.modifiedCount;
  }

  async syncMealPlanReminders(userId, weekStartDate, plan = {}) {
    const collection = await this.getCollection();
    const now = new Date();
    const mealTimes = {
      breakfast: '08:00',
      lunch: '12:00',
      dinner: '18:00',
      snacks: '15:00'
    };

    const keysToKeep = new Set();

    for (const [dayKey, dayData] of Object.entries(plan || {})) {
      const dayDate = dayData?.date;
      const meals = dayData?.meals || {};
      if (!dayDate) {
        continue;
      }

      for (const [mealType, meal] of Object.entries(meals)) {
        if (!meal || meal.type === 'empty' || (!meal.itemName && !meal.customName)) {
          continue;
        }

        const uniqueKey = `mealplan-${weekStartDate}-${dayKey}-${mealType}`;
        keysToKeep.add(uniqueKey);

        const timeString = mealTimes[mealType] || '09:00';
        const scheduledDate = new Date(`${dayDate}T${timeString}:00`);
        const mealLabel = meal.type === 'inventory' ? meal.itemName : meal.customName;

        await collection.updateOne(
          { userId, uniqueKey },
          {
            $set: {
              type: NOTIFICATION_TYPES.MEAL_PLAN,
              title: `Meal Reminder: ${mealLabel}`,
              message: `Remember to prepare ${mealLabel} for ${mealType} on ${new Date(dayDate).toLocaleDateString()}.`,
              status: 'unread',
              link: '/meal-planner',
              metadata: {
                weekStartDate,
                dayKey,
                date: dayDate,
                mealType,
                scheduledAt: scheduledDate.toISOString(),
                itemId: meal.itemId || null,
                itemName: meal.itemName || null,
                customName: meal.customName || null
              },
              updatedAt: now
            },
            $setOnInsert: {
              userId,
              uniqueKey,
              createdAt: now
            }
          },
          { upsert: true }
        );
      }
    }

    const existingKeys = await collection
      .find({ userId, 'metadata.weekStartDate': weekStartDate })
      .project({ uniqueKey: 1 })
      .toArray();

    const keysToRemove = existingKeys
      .map(doc => doc.uniqueKey)
      .filter(key => key.startsWith(`mealplan-${weekStartDate}`) && !keysToKeep.has(key));

    if (keysToRemove.length > 0) {
      await collection.deleteMany({
        userId,
        uniqueKey: { $in: keysToRemove }
      });
    }
  }
}

export { NOTIFICATION_TYPES };

