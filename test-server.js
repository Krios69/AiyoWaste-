// 简单测试脚本
import fetch from 'node-fetch';

async function testServer() {
  try {
    console.log('🧪 测试服务器连接...');
    
    // 测试健康检查
    const healthResponse = await fetch('http://localhost:3001/api/health');
    const healthData = await healthResponse.json();
    console.log('✅ 健康检查:', healthData);
    
    // 测试邮件发送
    console.log('📧 测试邮件发送...');
    const emailResponse = await fetch('http://localhost:3001/api/send-verification-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'kaih92224@gmail.com' })
    });
    
    const emailData = await emailResponse.json();
    console.log('📧 邮件测试结果:', emailData);
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testServer();
