/**
 * 模板控制器
 * 处理各种导入模板的下载
 */

const XLSX = require('xlsx');
const logger = require('../config/logger');

class TemplateController {
  /**
   * 下载导入模板
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async downloadTemplate(req, res) {
    try {
      const { type } = req.params;
      logger.info(`[TEMPLATE] 正在下载模板: ${type}`, { operatorId: req.user?.id });

      if (type === 'user') {
        const headers = ['用户名', '邮箱', '密码', '角色', '手机号', '寝室号', '状态'];
        const exampleData = [
          ['testuser', 'test@example.com', '123456', 'user', '13800138000', '101', 'active']
        ];
        
        const worksheetData = [headers, ...exampleData];
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, '用户导入模板');
        
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=User_Import_Template.xlsx');
        return res.send(buffer);
      }

      // 如果未找到模板类型
      return res.status(404).json({
        success: false,
        message: `未找到类型为 ${type} 的模板`
      });
    } catch (error) {
      logger.error(`[TEMPLATE] 下载模板失败: ${error.message}`, { error });
      return res.status(500).json({
        success: false,
        message: '下载模板失败',
        error: error.message
      });
    }
  }
}

module.exports = new TemplateController();
