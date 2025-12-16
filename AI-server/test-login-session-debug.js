#!/usr/bin/env node

/**
 * 登录会话调试测试
 * 详细检查登录响应中的session信息
 */

const axios = require('axios');

const BASE_URL = 'http://192.168.1.168:4000';

async function testLoginSessionDebug() {
  console.log('🔍 开始调试登录会话问题...\n');

  try {
    // 1. 执行登录
    console.log('1️⃣ 执行登录...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'admin',
      password: 'Admin123.'
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    console.log('✅ 登录成功!');
    
    // 2. 详细检查响应结构
    console.log('\n2️⃣ 详细检查响应结构:');
    console.log('响应状态码:', loginResponse.status);
    console.log('响应数据结构:', JSON.stringify(loginResponse.data, null, 2));

    // 3. 检查session信息
    console.log('\n3️⃣ 检查session信息:');
    const responseData = loginResponse.data;
    
    if (responseData.success) {
      console.log('✅ success为true');
      
      if (responseData.data) {
        console.log('✅ data存在');
        console.log('data.keys:', Object.keys(responseData.data));
        
        if (responseData.data.session) {
          console.log('✅ session存在:', JSON.stringify(responseData.data.session, null, 2));
        } else {
          console.log('❌ session不存在或为null');
        }
        
        if (responseData.data.tokens) {
          console.log('✅ tokens存在:', JSON.stringify(responseData.data.tokens, null, 2));
        } else {
          console.log('❌ tokens不存在');
        }
        
        if (responseData.data.user) {
          console.log('✅ user存在:', JSON.stringify(responseData.data.user, null, 2));
        } else {
          console.log('❌ user不存在');
        }
      } else {
        console.log('❌ data不存在');
      }
    } else {
      console.log('❌ success为false:', responseData.message);
    }

    // 4. 提取sessionToken进行注销测试
    const accessToken = responseData.data?.tokens?.accessToken;
    const sessionToken = responseData.data?.session?.sessionToken;
    
    console.log('\n4️⃣ 提取的关键信息:');
    console.log('accessToken:', accessToken ? `${accessToken.substring(0, 20)}...` : 'null');
    console.log('sessionToken:', sessionToken ? `${sessionToken.substring(0, 20)}...` : 'null');

    if (sessionToken && accessToken) {
      // 5. 测试注销
      console.log('\n5️⃣ 测试注销...');
      try {
        const logoutResponse = await axios.post(`${BASE_URL}/api/auth/logout`, {
          sessionToken: sessionToken
        }, {
          headers: { 
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });

        console.log('注销响应:', JSON.stringify(logoutResponse.data, null, 2));
      } catch (logoutError) {
        console.log('❌ 注销失败:');
        if (logoutError.response) {
          console.log('状态码:', logoutError.response.status);
          console.log('错误信息:', logoutError.response.data.message);
          console.log('完整响应:', JSON.stringify(logoutError.response.data, null, 2));
        } else {
          console.log('错误:', logoutError.message);
        }
      }
    } else {
      console.log('\n⚠️  无法测试注销，因为缺少sessionToken或accessToken');
    }

  } catch (error) {
    console.log('❌ 登录失败:');
    if (error.response) {
      console.log('状态码:', error.response.status);
      console.log('错误信息:', error.response.data.message);
      console.log('完整响应:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('错误:', error.message);
    }
  }
}

// 运行测试
testLoginSessionDebug();