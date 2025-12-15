const axios = require('axios');

async function debugLoginFlow() {
  console.log('🔍 调试登录流程...\n');
  
  const API_BASE = 'http://10.26.120.9:4000';
  
  try {
    // 1. 测试登录API
    console.log('1. 测试登录API...');
    const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
      username: '管理员',
      password: 'Admin123.'
    });
    
    console.log('✅ 登录API调用成功');
    console.log('📥 响应数据结构:');
    console.log('- success:', loginResponse.data.success);
    console.log('- hasData:', !!loginResponse.data.data);
    console.log('- hasUser:', !!loginResponse.data.data?.user);
    console.log('- hasTokens:', !!loginResponse.data.data?.tokens);
    console.log('- hasAccessToken:', !!loginResponse.data.data?.tokens?.accessToken);
    console.log('- hasRefreshToken:', !!loginResponse.data.data?.tokens?.refreshToken);
    
    if (loginResponse.data.success && loginResponse.data.data) {
      const user = loginResponse.data.data.user;
      const tokens = loginResponse.data.data.tokens;
      
      console.log('\n👤 用户信息:');
      console.log('- ID:', user.id);
      console.log('- 用户名:', user.username);
      console.log('- 邮箱:', user.email);
      
      console.log('\n🎫 令牌信息:');
      console.log('- 访问令牌长度:', tokens?.accessToken?.length || 0);
      console.log('- 刷新令牌长度:', tokens?.refreshToken?.length || 0);
      
      // 2. 测试两步验证状态接口（使用访问令牌）
      if (tokens?.accessToken) {
        console.log('\n2. 测试两步验证状态接口...');
        
        try {
          const statusResponse = await axios.get(`${API_BASE}/api/auth/two-factor/status`, {
            headers: {
              'Authorization': `Bearer ${tokens.accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('✅ 两步验证状态接口调用成功');
          console.log('📥 两步验证状态:');
          console.log('- enabled:', statusResponse.data.data?.enabled);
          console.log('- totpEnabled:', statusResponse.data.data?.totpEnabled);
          console.log('- smsEnabled:', statusResponse.data.data?.smsEnabled);
          console.log('- emailEnabled:', statusResponse.data.data?.emailEnabled);
          
        } catch (statusError) {
          console.log('❌ 两步验证状态接口调用失败:');
          console.log('- 错误:', statusError.message);
          if (statusError.response) {
            console.log('- 状态码:', statusError.response.status);
            console.log('- 错误信息:', statusError.response.data?.message);
          }
        }
      }
      
      // 3. 测试仪表盘访问（使用访问令牌）
      if (tokens?.accessToken) {
        console.log('\n3. 测试仪表盘访问...');
        
        try {
          const dashboardResponse = await axios.get(`${API_BASE}/api/dashboard`, {
            headers: {
              'Authorization': `Bearer ${tokens.accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('✅ 仪表盘访问成功');
          console.log('📥 仪表盘数据:', dashboardResponse.data.success ? '成功获取' : '获取失败');
          
        } catch (dashboardError) {
          console.log('❌ 仪表盘访问失败:');
          console.log('- 错误:', dashboardError.message);
          if (dashboardError.response) {
            console.log('- 状态码:', dashboardError.response.status);
            console.log('- 错误信息:', dashboardError.response.data?.message);
          }
        }
      }
      
    } else {
      console.log('❌ 登录失败:', loginResponse.data.message);
    }
    
  } catch (error) {
    console.log('❌ 登录API调用失败:', error.message);
    if (error.response) {
      console.log('- 状态码:', error.response.status);
      console.log('- 错误信息:', error.response.data?.message);
    }
  }
}

debugLoginFlow();