import nodemailer from 'nodemailer';

// 邮件配置 - 使用Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'kaih92224@gmail.com',
    pass: 'pmnconpsxzjkwset'  // 完全去掉所有空格的应用密码
  },
  tls: {
    rejectUnauthorized: false  // 忽略SSL证书验证问题
  }
});

// 生成6位验证码
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 发送验证码邮件
async function sendVerificationCode(email, code) {
  try {
    console.log('=== 邮件服务开始 ===');
    console.log('目标邮箱:', email);
    console.log('验证码:', code);
    
    // 验证transporter配置
    console.log('验证SMTP连接...');
    await transporter.verify();
    console.log('✅ SMTP连接验证成功');
    
    const mailOptions = {
      from: 'kaih92224@gmail.com',
      to: email,
      subject: 'AiyoWaste - Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #B6CBB3; padding: 20px; text-align: center;">
            <h1 style="color: #333; margin: 0;">AiyoWaste</h1>
          </div>
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #333;">Email Verification</h2>
            <p style="color: #666; font-size: 16px;">
              Thank you for registering with AiyoWaste! Please use the following verification code to complete your registration:
            </p>
            <div style="background-color: #DEEDDC; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <h1 style="color: #333; font-size: 32px; letter-spacing: 5px; margin: 0;">${code}</h1>
            </div>
            <p style="color: #666; font-size: 14px;">
              This code will expire in 10 minutes. If you didn't request this code, please ignore this email.
            </p>
            <p style="color: #666; font-size: 14px;">
              Best regards,<br>
              The AiyoWaste Team
            </p>
          </div>
        </div>
      `
    };

    console.log('发送邮件...');
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ 邮件发送成功');
    console.log('消息ID:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('=== 邮件发送失败 ===');
    console.error('错误类型:', error.name);
    console.error('错误代码:', error.code);
    console.error('错误信息:', error.message);
    console.error('完整错误:', error);
    
    // 根据错误类型提供具体建议
    let suggestion = '';
    if (error.code === 'EAUTH') {
      suggestion = '认证失败 - 检查邮箱和应用密码';
    } else if (error.code === 'ECONNECTION') {
      suggestion = '连接失败 - 检查网络和防火墙';
    } else if (error.code === 'ETIMEDOUT') {
      suggestion = '连接超时 - 检查网络连接';
    }
    
    console.error('建议:', suggestion);
    return { success: false, error: error.message, suggestion };
  }
}

// 发送账户激活邮件
async function sendActivationEmail(email, code, activationToken) {
  try {
    console.log('=== 发送激活邮件 ===');
    console.log('目标邮箱:', email);
    console.log('验证码:', code);
    console.log('激活令牌:', activationToken);
    
    // 验证transporter配置
    console.log('验证SMTP连接...');
    await transporter.verify();
    console.log('✅ SMTP连接验证成功');
    
    const activationLink = `http://localhost:3000/activate?token=${activationToken}&email=${encodeURIComponent(email)}`;
    
    const mailOptions = {
      from: 'kaih92224@gmail.com',
      to: email,
      subject: 'Welcome to AiyoWaste - Activate Your Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background-color: #B6CBB3; padding: 30px; text-align: center;">
            <h1 style="color: #333; margin: 0; font-size: 28px;">Welcome to AiyoWaste!</h1>
            <p style="color: #555; margin: 10px 0 0 0; font-size: 16px;">Join us in making the world a better place</p>
          </div>
          
          <!-- Body -->
          <div style="padding: 40px 30px; background-color: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">Account Activation Required</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              Thank you for registering with AiyoWaste! To complete your registration and activate your account, please:
            </p>
            
            <ol style="color: #666; font-size: 16px; line-height: 1.8; margin-bottom: 30px;">
              <li><strong>Click the activation link below</strong></li>
              <li><strong>Enter the 6-digit verification code</strong></li>
              <li><strong>Set your new password</strong></li>
            </ol>
            
            <!-- Activation Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${activationLink}" style="display: inline-block; background-color: #B6CBB3; color: #333; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Activate My Account</a>
            </div>
            
            <!-- Verification Code -->
            <div style="background-color: #DEEDDC; padding: 25px; text-align: center; margin: 25px 0; border-radius: 8px; border: 2px dashed #B6CBB3;">
              <p style="color: #333; margin: 0 0 10px 0; font-size: 16px;">Your 6-Digit Verification Code:</p>
              <h1 style="color: #333; font-size: 36px; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">${code}</h1>
            </div>
            
            <!-- Manual Link -->
            <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin-top: 25px;">
              <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">If the button doesn't work, copy and paste this link:</p>
              <p style="color: #B6CBB3; font-size: 14px; word-break: break-all; margin: 0;">${activationLink}</p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #333; padding: 20px; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">This activation link will expire in 24 hours.</p>
            <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">AiyoWaste - Sustainable Waste Management Platform</p>
          </div>
        </div>
      `
    };
    
    console.log('发送邮件...');
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ 激活邮件发送成功:', result.messageId);
    
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ 激活邮件发送失败:', error.message);
    console.error('错误详情:', error);
    return { success: false, error: error.message };
  }
}

export {
  generateVerificationCode,
  sendVerificationCode,
  sendActivationEmail
};