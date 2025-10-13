import * as fs from "node:fs";
import * as path from "node:path";
import https from "https";
import fetch from 'node-fetch';

class UnsplashImageService {
  constructor() {
    // 确保图片存储目录存在
    this.imageDir = path.join(process.cwd(), 'public', 'generated-images');
    if (!fs.existsSync(this.imageDir)) {
      fs.mkdirSync(this.imageDir, { recursive: true });
    }
    
    // 食物关键词映射，用于更好的搜索结果
    this.foodKeywordMap = {
      // 水果类
      'apple': 'red apple fruit fresh',
      'banana': 'yellow banana fruit fresh',
      'orange': 'orange citrus fruit fresh',
      'strawberry': 'strawberry red berry fruit',
      'grape': 'grape purple fruit cluster',
      'watermelon': 'watermelon red fruit slice',
      'pineapple': 'pineapple tropical fruit',
      'mango': 'mango tropical fruit yellow',
      'lemon': 'lemon citrus fruit yellow',
      'cherry': 'cherry red fruit small',
      
      // 蔬菜类
      'tomato': 'tomato red vegetable fresh',
      'carrot': 'carrot orange vegetable',
      'broccoli': 'broccoli green vegetable',
      'lettuce': 'lettuce green salad vegetable',
      'onion': 'onion white vegetable',
      'potato': 'potato vegetable brown',
      'pepper': 'bell pepper colorful vegetable',
      'cucumber': 'cucumber green vegetable',
      
      // 主食类
      'rice': 'white rice grain bowl',
      'bread': 'fresh bread loaf bakery',
      'pasta': 'pasta italian noodles',
      'pizza': 'pizza italian food cheese',
      'burger': 'hamburger fast food',
      'sandwich': 'sandwich bread food',
      'noodles': 'noodles asian food',
      'sushi': 'sushi japanese food',
      
      // 蛋白质类
      'chicken': 'chicken meat protein food',
      'fish': 'fish seafood protein',
      'beef': 'beef meat protein red',
      'pork': 'pork meat protein',
      'egg': 'egg protein white',
      'tofu': 'tofu soy protein white',
      
      // 乳制品
      'milk': 'milk dairy white glass',
      'cheese': 'cheese dairy yellow',
      'yogurt': 'yogurt dairy white bowl',
      'butter': 'butter dairy yellow',
      
      // 饮品类
      'coffee': 'coffee drink hot cup',
      'tea': 'tea drink hot cup',
      'juice': 'fruit juice drink glass',
      'water': 'water drink clear glass',
      'smoothie': 'smoothie drink healthy',
      
      // 甜点类
      'cake': 'cake dessert sweet layered',
      'cookie': 'cookies dessert sweet',
      'ice cream': 'ice cream dessert cold',
      'chocolate': 'chocolate sweet dark',
      'pie': 'pie dessert fruit'
    };
  }

  /**
   * 根据食物名称生成图片 - 多层备用方案
   * @param {string} foodName - 食物名称
   * @returns {Promise<{success: boolean, imagePath?: string, imageUrl?: string, error?: string}>}
   */
  async generateFoodImage(foodName) {
    try {
      console.log(`🎨 开始为 "${foodName}" 生成图片...`);
      
      // 第1优先级：尝试Unsplash Source API
      try {
        console.log(`🌐 尝试Unsplash Source API...`);
        const unsplashResult = await this.tryUnsplashSource(foodName);
        if (unsplashResult.success) {
          return unsplashResult;
        }
        console.log(`⚠️ Unsplash Source失败: ${unsplashResult.error}`);
      } catch (error) {
        console.log(`⚠️ Unsplash Source异常: ${error.message}`);
      }
      
      // 第2优先级：尝试Unsplash API（需要API密钥）
      try {
        console.log(`📷 尝试Unsplash API...`);
        const unsplashApiResult = await this.tryUnsplashApi(foodName);
        if (unsplashApiResult.success) {
          return unsplashApiResult;
        }
        console.log(`⚠️ Unsplash API失败: ${unsplashApiResult.error}`);
      } catch (error) {
        console.log(`⚠️ Unsplash API异常: ${error.message}`);
      }
      
      // 第3优先级：使用Picsum随机图片
      try {
        console.log(`🖼️ 尝试Picsum随机图片...`);
        const picsumResult = await this.tryPicsum(foodName);
        if (picsumResult.success) {
          return picsumResult;
        }
        console.log(`⚠️ Picsum失败: ${picsumResult.error}`);
      } catch (error) {
        console.log(`⚠️ Picsum异常: ${error.message}`);
      }
      
      // 第4优先级：生成SVG占位符
      console.log(`🎨 生成SVG占位符...`);
      const svgPath = this.generateSVGPlaceholder(foodName);
      return {
        success: true,
        imagePath: svgPath,
        imageUrl: `http://localhost:3001${svgPath}`
      };

    } catch (error) {
      console.error(`❌ 图片生成完全失败 for "${foodName}":`, error);
      
      // 最终兜底：简单SVG
      try {
        const svgPath = this.generateSVGPlaceholder(foodName);
        return {
          success: true,
          imagePath: svgPath,
          imageUrl: `http://localhost:3001${svgPath}`
        };
      } catch (svgError) {
        return {
          success: false,
          error: `All image generation methods failed: ${error.message}`
        };
      }
    }
  }

  /**
   * 尝试使用Unsplash Source API
   */
  async tryUnsplashSource(foodName) {
    const cleanName = foodName.toLowerCase().trim();
    let searchQuery = this.foodKeywordMap[cleanName] || `${cleanName} food fresh`;
    
    const imageUrl = `https://source.unsplash.com/400x400/?${encodeURIComponent(searchQuery)}`;
    console.log(`📷 Unsplash Source搜索URL: ${imageUrl}`);
    
    const savedPath = await this.downloadAndSaveImage(imageUrl, foodName, 'unsplash-source');
    
    if (savedPath) {
      return {
        success: true,
        imagePath: savedPath,
        imageUrl: `http://localhost:3001${savedPath}`
      };
    }
    
    return { success: false, error: 'Unsplash Source API failed' };
  }

  /**
   * 尝试使用Unsplash API（需要API密钥）
   */
  async tryUnsplashApi(foodName) {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY || 'Ma4Fv-T57IKio9eLJg6CIBeiiEmqpR_-2FJyj49-yTk';
    
    if (!accessKey) {
      return { success: false, error: 'Unsplash API not configured' };
    }
    
    try {
      const cleanName = foodName.toLowerCase().trim();
      let searchQuery = this.foodKeywordMap[cleanName] || `${cleanName} food fresh`;
      
      const apiUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=1&orientation=landscape`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Client-ID ${accessKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const imageUrl = data.results[0].urls.regular;
        console.log(`📷 Unsplash API图片URL: ${imageUrl}`);
        
        const savedPath = await this.downloadAndSaveImage(imageUrl, foodName, 'unsplash-api');
        
        if (savedPath) {
          return {
            success: true,
            imagePath: savedPath,
            imageUrl: `http://localhost:3001${savedPath}`
          };
        }
      }
      
      return { success: false, error: 'No images found' };
    } catch (error) {
      console.error('Unsplash API error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 尝试使用Picsum随机图片
   */
  async tryPicsum(foodName) {
    try {
      // 尝试直接访问图片URL（避免302重定向）
      const imageUrl = `https://picsum.photos/400/400?random=${Date.now()}`;
      console.log(`🖼️ Picsum图片URL: ${imageUrl}`);
      
      const savedPath = await this.downloadAndSaveImageWithRedirect(imageUrl, foodName, 'picsum');
      
      if (savedPath) {
        return {
          success: true,
          imagePath: savedPath,
          imageUrl: `http://localhost:3001${savedPath}`
        };
      }
      
      return { success: false, error: 'Picsum download failed' };
    } catch (error) {
      console.error('Picsum error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 尝试使用Lorem Picsum（备用方案）
   */
  async tryLoremPicsum(foodName) {
    try {
      // 使用不同的Lorem Picsum端点
      const imageUrl = `https://picsum.photos/id/${Math.floor(Math.random() * 1000)}/400/400`;
      console.log(`🖼️ Lorem Picsum图片URL: ${imageUrl}`);
      
      const savedPath = await this.downloadAndSaveImage(imageUrl, foodName, 'lorem-picsum');
      
      if (savedPath) {
        return {
          success: true,
          imagePath: savedPath,
          imageUrl: `http://localhost:3001${savedPath}`
        };
      }
      
      return { success: false, error: 'Lorem Picsum failed' };
    } catch (error) {
      console.error('Lorem Picsum error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 生成SVG占位符
   */
  generateSVGPlaceholder(foodName) {
    const timestamp = Date.now();
    const sanitizedName = foodName.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]/g, '-');
    const fileName = `svg-${sanitizedName}-${timestamp}.svg`;
    const filePath = path.join(this.imageDir, fileName);
    
    // 生成一个更好看的食物图标SVG
    const svgContent = `<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f8f9fa;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#e9ecef;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="food" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#28a745;stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:#20c997;stop-opacity:0.6" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill="url(#bg)"/>
      <circle cx="200" cy="160" r="70" fill="url(#food)"/>
      <rect x="150" y="210" width="100" height="50" rx="8" fill="url(#food)"/>
      <text x="200" y="290" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#495057">
        ${foodName}
      </text>
      <text x="200" y="320" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#6c757d">
        Food Item
      </text>
      <text x="200" y="350" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#adb5bd">
        Generated Placeholder
      </text>
    </svg>`;
    
    fs.writeFileSync(filePath, svgContent);
    return `/generated-images/${fileName}`;
  }

  /**
   * 下载并保存图片
   * @param {string} imageUrl - 图片URL
   * @param {string} foodName - 食物名称
   * @param {string} source - 图片源标识
   * @returns {Promise<string|null>} 返回相对路径或null
   */
  async downloadAndSaveImage(imageUrl, foodName, source = 'web') {
    return new Promise((resolve, reject) => {
      try {
        const timestamp = Date.now();
        const sanitizedName = foodName.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]/g, '-');
        const fileName = `${source}-${sanitizedName}-${timestamp}.jpg`;
        const filePath = path.join(this.imageDir, fileName);
        const file = fs.createWriteStream(filePath);

        console.log(`⬇️ 开始下载图片: ${imageUrl}`);

        const request = https.get(imageUrl, (response) => {
          // 检查响应状态
          if (response.statusCode !== 200) {
            console.error(`❌ 下载失败，状态码: ${response.statusCode}`);
            fs.unlink(filePath, () => {}); // 删除不完整的文件
            resolve(null);
            return;
          }

          response.pipe(file);
          
          file.on('finish', () => {
            file.close();
            const relativePath = `/generated-images/${fileName}`;
            console.log(`💾 图片保存成功: ${relativePath}`);
            resolve(relativePath);
          });
        });

        request.on('error', (error) => {
          fs.unlink(filePath, () => {}); // 删除不完整的文件
          console.error('❌ 图片下载失败:', error.message);
          resolve(null);
        });

        // 设置超时
        request.setTimeout(15000, () => {
          request.abort();
          fs.unlink(filePath, () => {});
          console.error('❌ 图片下载超时');
          resolve(null);
        });

      } catch (error) {
        console.error('❌ 下载保存图片失败:', error);
        resolve(null);
      }
    });
  }

  /**
   * 下载并保存图片（支持重定向）
   * @param {string} imageUrl - 图片URL
   * @param {string} foodName - 食物名称
   * @param {string} source - 图片源标识
   * @returns {Promise<string|null>} 返回相对路径或null
   */
  async downloadAndSaveImageWithRedirect(imageUrl, foodName, source = 'web') {
    return new Promise((resolve, reject) => {
      try {
        const timestamp = Date.now();
        const sanitizedName = foodName.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]/g, '-');
        const fileName = `${source}-${sanitizedName}-${timestamp}.jpg`;
        const filePath = path.join(this.imageDir, fileName);
        const file = fs.createWriteStream(filePath);

        console.log(`⬇️ 开始下载图片（支持重定向）: ${imageUrl}`);

        const request = https.get(imageUrl, (response) => {
          // 处理重定向
          if (response.statusCode === 302 || response.statusCode === 301) {
            const redirectUrl = response.headers.location;
            console.log(`🔄 重定向到: ${redirectUrl}`);
            
            // 递归调用处理重定向
            this.downloadAndSaveImage(redirectUrl, foodName, source)
              .then(resolve)
              .catch(() => resolve(null));
            return;
          }
          
          // 检查响应状态
          if (response.statusCode !== 200) {
            console.error(`❌ 下载失败，状态码: ${response.statusCode}`);
            fs.unlink(filePath, () => {}); // 删除不完整的文件
            resolve(null);
            return;
          }

          response.pipe(file);
          
          file.on('finish', () => {
            file.close();
            const relativePath = `/generated-images/${fileName}`;
            console.log(`💾 图片保存成功: ${relativePath}`);
            resolve(relativePath);
          });
        });

        request.on('error', (error) => {
          fs.unlink(filePath, () => {}); // 删除不完整的文件
          console.error(`❌ 图片下载失败:`, error.message);
          resolve(null);
        });

        // 设置超时
        request.setTimeout(15000, () => {
          request.abort();
          fs.unlink(filePath, () => {});
          console.error(`❌ 图片下载超时`);
          resolve(null);
        });

      } catch (error) {
        console.error(`❌ 下载保存图片失败:`, error);
        resolve(null);
      }
    });
  }

  /**
   * 删除生成的图片文件
   * @param {string} imagePath - 图片路径
   */
  deleteImage(imagePath) {
    try {
      if (imagePath && imagePath.startsWith('/generated-images/')) {
        const fileName = imagePath.replace('/generated-images/', '');
        const fullPath = path.join(this.imageDir, fileName);
        
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          console.log(`🗑️ 删除Unsplash图片: ${imagePath}`);
        }
      }
    } catch (error) {
      console.error('删除图片失败:', error);
    }
  }

  /**
   * 获取生成图片的统计信息
   */
  getStats() {
    try {
      const files = fs.readdirSync(this.imageDir);
      const imageFiles = files.filter(file => file.match(/^(unsplash-|picsum-|svg-)/));
      
      return {
        totalImages: imageFiles.length,
        directory: this.imageDir,
        service: 'Multi-source Image Generator'
      };
    } catch (error) {
      return {
        totalImages: 0,
        directory: this.imageDir,
        service: 'Multi-source Image Generator',
        error: error.message
      };
    }
  }
}

export default new UnsplashImageService();
