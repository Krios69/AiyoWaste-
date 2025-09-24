# AiyoWaste Email Verification Setup

## 配置步骤

### 1. 设置Gmail应用密码
1. 登录你的Gmail账户
2. 进入 Google账户设置 > 安全性
3. 启用两步验证（如果未启用）
4. 生成应用专用密码：
   - 选择"应用" > "邮件"
   - 选择"设备" > "其他（自定义名称）"
   - 输入"AiyoWaste"
   - 复制生成的16位密码

### 2. 配置环境变量
在项目根目录创建 `.env` 文件，内容如下：
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-digit-app-password
PORT=3001
```

### 3. 启动服务
```bash
# 同时启动前端和后端
npm run dev:full

# 或者分别启动
npm run server  # 后端邮件服务 (端口3001)
npm run dev     # 前端开发服务器 (端口3000)
```

### 4. 测试功能
1. 访问 http://localhost:3000/register
2. 输入有效的邮箱地址
3. 点击"Send Code"按钮
4. 检查邮箱收件箱（包括垃圾邮件文件夹）
5. 输入收到的6位验证码
6. 完成注册

## 注意事项
- 验证码有效期为10分钟
- 每个邮箱最多尝试3次验证
- 发送验证码后需要等待60秒才能重新发送
- 确保防火墙允许端口3001的访问

## 故障排除
- 如果收不到邮件，检查垃圾邮件文件夹
- 确保Gmail应用密码正确
- 检查网络连接和防火墙设置
- 查看控制台错误信息
