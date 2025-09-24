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

export {
  generateVerificationCode,
  sendVerificationCode
};