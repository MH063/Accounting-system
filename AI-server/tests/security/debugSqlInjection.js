const sqlInjectionProtection = require('../../middleware/security/sqlInjectionProtection');

// 创建一个模拟的请求对象
const mockReq = {
  query: {},
  body: {},
  params: { id: '1;DELETE FROM users' },
  path: '/test/1;DELETE FROM users'
};

// 创建一个模拟的响应对象
const mockRes = {
  status: function(code) {
    this.statusCode = code;
    return this;
  },
  json: function(data) {
    this.body = data;
    return this;
  }
};

// 创建一个模拟的next函数
const mockNext = function() {
  console.log('Next function called');
};

// 测试中间件
const middleware = sqlInjectionProtection();
middleware(mockReq, mockRes, mockNext);

console.log('Request params:', mockReq.params);
console.log('Response status:', mockRes.statusCode);
console.log('Response body:', mockRes.body);