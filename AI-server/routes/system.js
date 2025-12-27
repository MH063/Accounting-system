const express = require('express');
const router = express.Router();

/**
 * 获取服务器当前时间戳
 * 用于前端校准时间偏移量，确保令牌过期判断准确
 */
router.get('/time', (req, res) => {
  res.json({
    success: true,
    data: {
      timestamp: Date.now(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  });
});

module.exports = router;
