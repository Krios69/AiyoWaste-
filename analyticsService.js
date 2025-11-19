import { getDatabase } from './mongodb.js';
import { ObjectId } from 'mongodb';

const normalizeDateRange = (dateRange = {}) => {
  const normalized = {};
  if (dateRange.startDate) {
    const start = new Date(dateRange.startDate);
    if (!Number.isNaN(start.getTime())) {
      normalized.start = start;
    }
  }
  if (dateRange.endDate) {
    const end = new Date(dateRange.endDate);
    if (!Number.isNaN(end.getTime())) {
      end.setHours(23, 59, 59, 999);
      normalized.end = end;
    }
  }
  return normalized;
};

const buildDateCondition = (range = {}) => {
  const condition = {};
  if (range.start) {
    condition.$gte = range.start;
  }
  if (range.end) {
    condition.$lte = range.end;
  }
  return Object.keys(condition).length ? condition : null;
};

const buildExpiryDateCondition = (now = new Date(), range = null) => ({
  $expr: {
    $let: {
      vars: {
        expiryValue: {
          $cond: [
            { $eq: [{ $type: '$expiryDate' }, 'date'] },
            '$expiryDate',
            {
              $convert: {
                input: '$expiryDate',
                to: 'date',
                onError: null,
                onNull: null
              }
            }
          ]
        }
      },
      in: {
        $and: [
          { $ne: ['$$expiryValue', null] },
          { $lt: ['$$expiryValue', now] },
          ...(range?.start ? [{ $gte: ['$$expiryValue', range.start] }] : []),
          ...(range?.end ? [{ $lte: ['$$expiryValue', range.end] }] : [])
        ].filter(Boolean)
      }
    }
  }
});

const getConvertedExpiryExpression = () => ({
  $cond: [
    { $eq: [{ $type: '$expiryDate' }, 'date'] },
    '$expiryDate',
    {
      $convert: {
        input: '$expiryDate',
        to: 'date',
        onError: null,
        onNull: null
      }
    }
  ]
});

const buildUnexpiredDateCondition = (now = new Date(), range = null) => ({
  $expr: {
    $let: {
      vars: {
        expiryValue: getConvertedExpiryExpression()
      },
      in: {
        $and: [
          {
            $or: [
              { $eq: ['$$expiryValue', null] },
              { $gte: ['$$expiryValue', now] }
            ]
          },
          ...(range?.start ? [{ $gte: ['$$expiryValue', range.start] }] : []),
          ...(range?.end ? [{ $lte: ['$$expiryValue', range.end] }] : [])
        ].filter(Boolean)
      }
    }
  }
});

// 食物分析统计相关操作
export class AnalyticsService {
  constructor() {
    this.collectionName = 'food_items';
  }

  async getCollection() {
    const db = await getDatabase();
    return db.collection(this.collectionName);
  }

  // 获取分析摘要
  async getAnalyticsSummary(userId, dateRange = {}) {
    try {
      const collection = await this.getCollection();
      const normalizedRange = normalizeDateRange(dateRange);
      const hasRangeFilter = Boolean(normalizedRange.start || normalizedRange.end);
      const createdAtCondition = buildDateCondition(normalizedRange);

      // 总物品数（包括历史或指定范围内）
      const totalItemsLoggedQuery = { userId };
      if (createdAtCondition) {
        totalItemsLoggedQuery.createdAt = { ...createdAtCondition };
      }
      const totalItemsLogged = await collection.countDocuments(totalItemsLoggedQuery);

      // 已使用的物品数
      const usedQuery = { userId, isUsed: true };
      const usedDateCondition = buildDateCondition(normalizedRange);
      if (usedDateCondition) {
        usedQuery.usedDate = { ...usedDateCondition };
      }
      const totalItemsUsed = await collection.countDocuments(usedQuery);

      // 已捐赠的物品数
      const donatedQuery = { userId, forDonation: true };
      const donationDateCondition = buildDateCondition(normalizedRange);
      if (donationDateCondition) {
        donatedQuery.$or = [
          { 'donationInfo.createdAt': { ...donationDateCondition } },
          { updatedAt: { ...donationDateCondition } }
        ];
      }
      const totalItemsDonated = await collection.countDocuments(donatedQuery);

      const now = new Date();

      // 已过期的物品数
      const expiredQuery = { 
        userId, 
        isUsed: { $ne: true },
        ...buildExpiryDateCondition(now, hasRangeFilter ? normalizedRange : null)
      };
      const totalItemsExpired = await collection.countDocuments(expiredQuery);

      // 未过期且未使用的物品数（当前可用库存）
      const unexpiredQuery = {
        userId,
        isUsed: { $ne: true },
        ...buildUnexpiredDateCondition(now, hasRangeFilter ? normalizedRange : null)
      };
      const totalUnexpiredItems = await collection.countDocuments(unexpiredQuery);

      // 从浪费中拯救的食物数 = 已使用 + 已捐赠
      const foodSavedFromWaste = totalItemsUsed + totalItemsDonated;

      // 获取类别分布
      const matchStage = { userId };
      if (createdAtCondition) {
        matchStage.createdAt = { ...createdAtCondition };
      }

      const categoryBreakdown = await collection.aggregate([
        { $match: matchStage },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray();

      return {
        success: true,
        summary: {
          totalItemsLogged,
          totalItemsUsed,
          totalItemsDonated,
          totalItemsExpired,
          totalUnexpiredItems,
          foodSavedFromWaste,
          donationCount: totalItemsDonated,
          categoryBreakdown: categoryBreakdown.map(cat => ({
            category: cat._id,
            count: cat.count
          }))
        }
      };
    } catch (error) {
      console.error('❌ 获取分析摘要失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 获取已使用的物品列表
  async getUsedItems(userId, dateRange = {}) {
    try {
      const collection = await this.getCollection();
      
      const query = { userId, isUsed: true };
      
      // 添加日期过滤
      if (dateRange.startDate || dateRange.endDate) {
        query.usedDate = {};
        if (dateRange.startDate) {
          query.usedDate.$gte = new Date(dateRange.startDate);
        }
        if (dateRange.endDate) {
          query.usedDate.$lte = new Date(dateRange.endDate);
        }
      }

      const items = await collection.find(query)
        .sort({ usedDate: -1 })
        .toArray();

      return { success: true, items };
    } catch (error) {
      console.error('❌ 获取已使用物品列表失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 获取图表数据
  async getChartData(userId, chartType = 'weekly', dateRange = {}) {
    try {
      const collection = await this.getCollection();
      
      // 根据图表类型构建聚合管道
      let groupBy = {};
      
      switch (chartType) {
        case 'daily':
          groupBy = {
            year: { $year: '$usedDate' },
            month: { $month: '$usedDate' },
            day: { $dayOfMonth: '$usedDate' }
          };
          break;
        case 'weekly':
          groupBy = {
            year: { $year: '$usedDate' },
            week: { $week: '$usedDate' }
          };
          break;
        case 'monthly':
          groupBy = {
            year: { $year: '$usedDate' },
            month: { $month: '$usedDate' }
          };
          break;
        default:
          groupBy = {
            year: { $year: '$usedDate' },
            month: { $month: '$usedDate' }
          };
      }

      // 构建查询
      const matchQuery = { userId, isUsed: true };
      if (dateRange.startDate || dateRange.endDate) {
        matchQuery.usedDate = {};
        if (dateRange.startDate) {
          matchQuery.usedDate.$gte = new Date(dateRange.startDate);
        }
        if (dateRange.endDate) {
          matchQuery.usedDate.$lte = new Date(dateRange.endDate);
        }
      }

      const chartData = await collection.aggregate([
        { $match: matchQuery },
        { $group: { _id: groupBy, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
      ]).toArray();

      return { success: true, chartData };
    } catch (error) {
      console.error('❌ 获取图表数据失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 获取按类别统计的数据
  async getCategoryStats(userId, dateRange = {}) {
    try {
      const collection = await this.getCollection();
      const normalizedRange = normalizeDateRange(dateRange);
      const createdAtCondition = buildDateCondition(normalizedRange);

      const matchStage = { userId };
      if (createdAtCondition) {
        matchStage.createdAt = { ...createdAtCondition };
      }
      
      const stats = await collection.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$category',
            total: { $sum: 1 },
            used: {
              $sum: { $cond: [{ $eq: ['$isUsed', true] }, 1, 0] }
            },
            donated: {
              $sum: { $cond: [{ $eq: ['$forDonation', true] }, 1, 0] }
            },
            expired: {
              $sum: { 
                $cond: [
                  { 
                    $and: [
                      { $ne: ['$isUsed', true] },
                      {
                        $let: {
                          vars: {
                            expiryValue: getConvertedExpiryExpression()
                          },
                          in: {
                            $and: [
                              { $ne: ['$$expiryValue', null] },
                              { $lt: ['$$expiryValue', new Date()] }
                            ]
                          }
                        }
                      }
                    ]
                  }, 
                  1, 
                  0
                ] 
              }
            }
          }
        },
        { $sort: { total: -1 } }
      ]).toArray();

      return { success: true, stats };
    } catch (error) {
      console.error('❌ 获取类别统计失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 获取时间序列趋势数据
  async getTimeSeriesData(userId, days = 30) {
    try {
      const collection = await this.getCollection();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const data = await collection.aggregate([
        {
          $match: {
            userId,
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            added: { $sum: 1 },
            used: {
              $sum: { 
                $cond: [
                  { 
                    $and: [
                      { $eq: ['$isUsed', true] },
                      { $gte: ['$usedDate', startDate] }
                    ]
                  }, 
                  1, 
                  0
                ] 
              }
            }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]).toArray();

      return { success: true, data };
    } catch (error) {
      console.error('❌ 获取时间序列数据失败:', error);
      return { success: false, error: error.message };
    }
  }

  async getItemsByType(userId, type, dateRange = {}) {
    try {
      if (type === 'saved') {
        const [usedResult, donatedResult] = await Promise.all([
          this.getItemsByType(userId, 'used', dateRange),
          this.getItemsByType(userId, 'donated', dateRange)
        ]);

        if (!usedResult.success) return usedResult;
        if (!donatedResult.success) return donatedResult;

        return {
          success: true,
          items: [...usedResult.items, ...donatedResult.items]
        };
      }

      const collection = await this.getCollection();
      const query = { userId };

      const projection = {
        name: 1,
        category: 1,
        quantity: 1,
        expiryDate: 1,
        usedDate: 1,
        updatedAt: 1,
        donationInfo: 1,
        forDonation: 1,
        isUsed: 1
      };

      switch (type) {
        case 'used': {
          query.isUsed = true;
          if (dateRange.startDate || dateRange.endDate) {
            query.usedDate = {};
            if (dateRange.startDate) {
              query.usedDate.$gte = new Date(dateRange.startDate);
            }
            if (dateRange.endDate) {
              query.usedDate.$lte = new Date(dateRange.endDate);
            }
          }
          break;
        }
        case 'donated': {
          query.forDonation = true;
          break;
        }
        case 'expired': {
          query.isUsed = { $ne: true };
          Object.assign(query, buildExpiryDateCondition(new Date()));
          break;
        }
        default:
          return { success: false, message: 'Invalid type specified' };
      }

      const items = await collection
        .find(query)
        .project(projection)
        .sort({ updatedAt: -1 })
        .limit(100)
        .toArray();

      return { success: true, items };
    } catch (error) {
      console.error('❌ 获取指定类型物品失败:', error);
      return { success: false, error: error.message };
    }
  }
}





