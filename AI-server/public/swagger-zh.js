(function() {
  const translations = {
    'Close': '关闭',
    'Authorize': '授权',
    'Try it out': '试一试',
    'Execute': '执行',
    'Clear': '清空',
    'Cancel': '取消',
    'Download': '下载',
    'Servers': '服务器',
    'Security': '安全',
    'Responses': '响应',
    'Request': '请求',
    'Response': '响应',
    'Parameters': '参数',
    'Request body': '请求体',
    'Description': '描述',
    'Default': '默认值',
    'Example': '示例',
    'Examples': '示例',
    'Schema': '模式',
    'Example Value': '示例值',
    'Model': '模型',
    'Example Model': '示例模型',
    'No servers defined': '未定义服务器',
    'No security definition': '未定义安全方案',
    'No response': '无响应',
    'Loading...': '加载中...',
    'Request URL': '请求URL',
    'Server response': '服务器响应',
    'Response body': '响应体',
    'Response headers': '响应头',
    'Curl': 'Curl命令',
    'Request headers': '请求头',
    'Hide': '隐藏',
    'Show': '显示',
    'List': '列表',
    'Expand': '展开',
    'Collapse': '收起',
    'Full': '完整',
    'Compact': '紧凑',
    'Filter': '筛选',
    'Filter by tag': '按标签筛选',
    'Clear value': '清空值',
    'Delete': '删除',
    'Edit': '编辑',
    'Save': '保存',
    'Copy': '复制',
    'Paste': '粘贴',
    'Cut': '剪切',
    'Select all': '全选',
    'Deselect all': '取消全选',
    'Available authorizations': '可用授权',
    'Application': '应用',
    'API key value': 'API密钥值',
    'API key prefix': 'API密钥前缀',
    'API key': 'API密钥',
    'Header name': '请求头名称',
    'Client ID': '客户端ID',
    'Client secret': '客户端密钥',
    'Client authentication': '客户端认证',
    'Scopes': '作用域',
    'Request token': '请求令牌',
    'Authorize with': '授权方式',
    'Authorization URL': '授权URL',
    'Token URL': '令牌URL',
    'Flow': '流程',
    'Authorization code': '授权码',
    'Implicit': '隐式',
    'Password': '密码',
    'Client credentials': '客户端凭证',
    'No parameters': '无参数',
    'No request body': '无请求体',
    'No examples': '无示例',
    'No response examples': '无响应示例',
    'No response headers': '无响应头',
    'No request headers': '无请求头',
    'Status': '状态',
    'Code': '代码',
    'Duration': '耗时',
    'Size': '大小',
    'Links': '链接',
    'No links': '无链接',
    'Deprecated': '已弃用',
    'This operation is deprecated': '此操作已弃用',
    'This parameter is deprecated': '此参数已弃用',
    'This property is deprecated': '此属性已弃用',
    'Required': '必填',
    'Optional': '可选',
    'Read only': '只读',
    'Write only': '只写',
    'Default value': '默认值',
    'Allowed values': '允许的值',
    'Pattern': '模式',
    'Min length': '最小长度',
    'Max length': '最大长度',
    'Minimum': '最小值',
    'Maximum': '最大值',
    'Multiple of': '倍数',
    'Format': '格式',
    'Type': '类型',
    'Array': '数组',
    'Object': '对象',
    'String': '字符串',
    'Number': '数字',
    'Integer': '整数',
    'Boolean': '布尔值',
    'File': '文件',
    'Date': '日期',
    'Date-time': '日期时间',
    'Email': '邮箱',
    'Password': '密码',
    'URI': 'URI',
    'UUID': 'UUID',
    'Binary': '二进制',
    'Byte': '字节',
    'Base64': 'Base64',
    'One of': '其中一个',
    'All of': '全部',
    'Any of': '任意',
    'Not': '非',
    'Ref': '引用',
    'Items': '项目',
    'Additional properties': '附加属性',
    'Discriminator': '鉴别器',
    'XML': 'XML',
    'External Docs': '外部文档',
    'Terms of service': '服务条款',
    'Contact': '联系方式',
    'License': '许可证',
    'Version': '版本',
    'Host': '主机',
    'Base Path': '基础路径',
    'Schemes': '协议',
    'Consumes': '接受',
    'Produces': '生成',
    'Tags': '标签',
    'Paths': '路径',
    'Definitions': '定义',
    'Security Definitions': '安全定义',
    'Parameters': '参数',
    'Responses': '响应',
    'Examples': '示例',
    'External Documentation': '外部文档'
  };

  function translatePage() {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      if (node.textContent.trim()) {
        textNodes.push(node);
      }
    }

    textNodes.forEach(textNode => {
      let text = textNode.textContent;
      let changed = false;

      for (const [english, chinese] of Object.entries(translations)) {
        if (text.includes(english)) {
          const escapedEnglish = english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          text = text.replace(new RegExp(escapedEnglish, 'g'), chinese);
          changed = true;
        }
      }

      if (changed) {
        textNode.textContent = text;
      }
    });

    const placeholders = document.querySelectorAll('[placeholder]');
    placeholders.forEach(element => {
      const placeholder = element.getAttribute('placeholder');
      if (placeholder && translations[placeholder]) {
        element.setAttribute('placeholder', translations[placeholder]);
      }
    });

    const titles = document.querySelectorAll('[title]');
    titles.forEach(element => {
      const title = element.getAttribute('title');
      if (title && translations[title]) {
        element.setAttribute('title', translations[title]);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', translatePage);
  } else {
    translatePage();
  }

  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes.length) {
        translatePage();
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();
