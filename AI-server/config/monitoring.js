/**
 * Grafana仪表板配置
 * 提供监控数据的可视化展示
 */

const dashboardConfig = {
  dashboard: {
    id: null,
    title: 'AI服务器监控仪表板',
    tags: ['ai-server', 'monitoring'],
    timezone: 'browser',
    panels: [
      {
        id: 1,
        title: '系统CPU使用率',
        type: 'graph',
        targets: [
          {
            expr: 'system_cpu_usage_percent',
            legendFormat: 'CPU使用率 (%)'
          }
        ],
        yAxes: [
          {
            label: '百分比',
            min: 0,
            max: 100
          }
        ],
        alert: {
          conditions: [
            {
              query: { params: ['A', '5m', 'now'] },
              reducer: { type: 'avg' },
              evaluator: { params: [80], type: 'gt' }
            }
          ],
          executionErrorState: 'alerting',
          frequency: '5m',
          handler: 1,
          name: 'CPU使用率过高告警'
        }
      },
      {
        id: 2,
        title: '内存使用率',
        type: 'graph',
        targets: [
          {
            expr: 'system_memory_usage_percent',
            legendFormat: '内存使用率 (%)'
          }
        ],
        yAxes: [
          {
            label: '百分比',
            min: 0,
            max: 100
          }
        ],
        alert: {
          conditions: [
            {
              query: { params: ['A', '5m', 'now'] },
              reducer: { type: 'avg' },
              evaluator: { params: [85], type: 'gt' }
            }
          ],
          executionErrorState: 'alerting',
          frequency: '5m',
          handler: 1,
          name: '内存使用率过高告警'
        }
      },
      {
        id: 3,
        title: 'HTTP请求量',
        type: 'graph',
        targets: [
          {
            expr: 'rate(http_requests_total[5m])',
            legendFormat: '请求量 (req/s)'
          }
        ],
        yAxes: [
          {
            label: '请求/秒'
          }
        ]
      },
      {
        id: 4,
        title: 'HTTP响应时间',
        type: 'graph',
        targets: [
          {
            expr: 'histogram_quantile(0.95, http_request_duration_seconds_bucket)',
            legendFormat: '95百分位响应时间 (s)'
          },
          {
            expr: 'histogram_quantile(0.50, http_request_duration_seconds_bucket)',
            legendFormat: '中位数响应时间 (s)'
          }
        ],
        yAxes: [
          {
            label: '秒'
          }
        ]
      },
      {
        id: 5,
        title: 'HTTP错误率',
        type: 'graph',
        targets: [
          {
            expr: 'rate(http_requests_total{status=~"4..|5.."}[5m]) / rate(http_requests_total[5m]) * 100',
            legendFormat: '错误率 (%)'
          }
        ],
        yAxes: [
          {
            label: '百分比',
            min: 0,
            max: 100
          }
        ],
        alert: {
          conditions: [
            {
              query: { params: ['A', '10m', 'now'] },
              reducer: { type: 'avg' },
              evaluator: { params: [10], type: 'gt' }
            }
          ],
          executionErrorState: 'alerting',
          frequency: '10m',
          handler: 1,
          name: '错误率过高告警'
        }
      },
      {
        id: 6,
        title: '数据库连接池状态',
        type: 'stat',
        targets: [
          {
            expr: 'database_pool_active_connections',
            legendFormat: '活跃连接数'
          },
          {
            expr: 'database_pool_idle_connections',
            legendFormat: '空闲连接数'
          }
        ],
        valueName: 'current'
      },
      {
        id: 7,
        title: '数据库查询性能',
        type: 'graph',
        targets: [
          {
            expr: 'histogram_quantile(0.95, database_query_duration_seconds_bucket)',
            legendFormat: '95百分位查询时间 (s)'
          },
          {
            expr: 'histogram_quantile(0.50, database_query_duration_seconds_bucket)',
            legendFormat: '中位数查询时间 (s)'
          }
        ],
        yAxes: [
          {
            label: '秒'
          }
        ]
      },
      {
        id: 8,
        title: '文件上传统计',
        type: 'graph',
        targets: [
          {
            expr: 'rate(file_uploads_total[5m])',
            legendFormat: '上传量 (files/s)'
          },
          {
            expr: 'rate(file_upload_size_bytes_total[5m])',
            legendFormat: '上传大小 (bytes/s)'
          }
        ],
        yAxes: [
          {
            label: '数量/秒'
          }
        ]
      },
      {
        id: 9,
        title: '用户注册统计',
        type: 'graph',
        targets: [
          {
            expr: 'rate(user_registrations_total[5m])',
            legendFormat: '注册量 (users/s)'
          }
        ],
        yAxes: [
          {
            label: '用户/秒'
          }
        ]
      },
      {
        id: 10,
        title: '缓存命中率',
        type: 'stat',
        targets: [
          {
            expr: 'cache_hit_rate_percent',
            legendFormat: '命中率 (%)'
          }
        ],
        valueName: 'current',
        thresholds: [
          {
            color: 'red',
            value: 0
          },
          {
            color: 'yellow',
            value: 50
          },
          {
            color: 'green',
            value: 80
          }
        ]
      },
      {
        id: 11,
        title: '磁盘使用率',
        type: 'graph',
        targets: [
          {
            expr: 'system_disk_usage_percent',
            legendFormat: '磁盘使用率 (%)'
          }
        ],
        yAxes: [
          {
            label: '百分比',
            min: 0,
            max: 100
          }
        ],
        alert: {
          conditions: [
            {
              query: { params: ['A', '5m', 'now'] },
              reducer: { type: 'avg' },
              evaluator: { params: [90], type: 'gt' }
            }
          ],
          executionErrorState: 'alerting',
          frequency: '5m',
          handler: 1,
          name: '磁盘使用率过高告警'
        }
      },
      {
        id: 12,
        title: '网络流量',
        type: 'graph',
        targets: [
          {
            expr: 'rate(system_network_bytes_received_total[5m])',
            legendFormat: '接收流量 (bytes/s)'
          },
          {
            expr: 'rate(system_network_bytes_sent_total[5m])',
            legendFormat: '发送流量 (bytes/s)'
          }
        ],
        yAxes: [
          {
            label: '字节/秒'
          }
        ]
      }
    ],
    time: {
      from: 'now-1h',
      to: 'now'
    },
    refresh: '5s',
    schemaVersion: 16,
    version: 1
  }
};

/**
 * Prometheus配置
 */
const prometheusConfig = {
  global: {
    scrape_interval: '15s',
    evaluation_interval: '15s'
  },
  scrape_configs: [
    {
      job_name: 'ai-server',
      static_configs: [
        {
          targets: ['localhost:4000'],
          labels: {
            service: 'ai-server',
            environment: 'production'
          }
        }
      ],
      metrics_path: '/metrics',
      scrape_interval: '5s',
      scrape_timeout: '3s'
    },
    {
      job_name: 'node-exporter',
      static_configs: [
        {
          targets: ['localhost:9100'],
          labels: {
            service: 'node-exporter'
          }
        }
      ]
    }
  ],
  alerting: {
    alertmanagers: [
      {
        static_configs: [
          {
            targets: ['localhost:9093']
          }
        ]
      }
    ]
  }
};

/**
 * AlertManager配置
 */
const alertManagerConfig = {
  global: {
    smtp_smarthost: 'localhost:587',
    smtp_from: 'alerts@ai-server.com'
  },
  route: {
    group_by: ['alertname'],
    group_wait: '10s',
    group_interval: '10s',
    repeat_interval: '1h',
    receiver: 'web.hook'
  },
  receivers: [
    {
      name: 'web.hook',
      email_configs: [
        {
          to: 'admin@ai-server.com',
          subject: 'AI服务器告警: {{ .GroupLabels.alertname }}',
          body: '告警详情:\n{{ range .Alerts }}\n- {{ .Annotations.description }}\n{{ end }}'
        }
      ],
      webhook_configs: [
        {
          url: 'http://localhost:4000/api/monitoring/alerts/webhook',
          send_resolved: true
        }
      ]
    }
  ],
  inhibit_rules: [
    {
      source_match: {
        severity: 'critical'
      },
      target_match: {
        severity: 'warning'
      },
      equal: ['alertname', 'dev', 'instance']
    }
  ]
};

/**
 * 告警规则配置
 */
const alertRules = [
  {
    name: 'ai-server.rules',
    rules: [
      {
        alert: 'HighCPUUsage',
        expr: 'system_cpu_usage_percent > 80',
        for: '5m',
        labels: {
          severity: 'warning'
        },
        annotations: {
          summary: 'CPU使用率过高',
          description: 'CPU使用率 {{ $value }}% 超过阈值 80%'
        }
      },
      {
        alert: 'HighMemoryUsage',
        expr: 'system_memory_usage_percent > 85',
        for: '5m',
        labels: {
          severity: 'warning'
        },
        annotations: {
          summary: '内存使用率过高',
          description: '内存使用率 {{ $value }}% 超过阈值 85%'
        }
      },
      {
        alert: 'HighErrorRate',
        expr: 'rate(http_requests_total{status=~"4..|5.."}[5m]) / rate(http_requests_total[5m]) * 100 > 10',
        for: '10m',
        labels: {
          severity: 'critical'
        },
        annotations: {
          summary: '错误率过高',
          description: '错误率 {{ $value }}% 超过阈值 10%'
        }
      },
      {
        alert: 'SlowRequests',
        expr: 'histogram_quantile(0.95, http_request_duration_seconds_bucket) > 2',
        for: '5m',
        labels: {
          severity: 'warning'
        },
        annotations: {
          summary: '慢请求过多',
          description: '95百分位响应时间 {{ $value }}s 超过阈值 2s'
        }
      },
      {
        alert: 'DatabaseConnectionFailure',
        expr: 'database_health_score == 0',
        for: '1m',
        labels: {
          severity: 'critical'
        },
        annotations: {
          summary: '数据库连接失败',
          description: '数据库健康评分为 {{ $value }}'
        }
      },
      {
        alert: 'HighDiskUsage',
        expr: 'system_disk_usage_percent > 90',
        for: '5m',
        labels: {
          severity: 'warning'
        },
        annotations: {
          summary: '磁盘使用率过高',
          description: '磁盘使用率 {{ $value }}% 超过阈值 90%'
        }
      }
    ]
  }
];

/**
 * 获取Grafana仪表板配置
 */
function getGrafanaDashboard() {
  return dashboardConfig.dashboard;
}

/**
 * 获取Prometheus配置
 */
function getPrometheusConfig() {
  return prometheusConfig;
}

/**
 * 获取AlertManager配置
 */
function getAlertManagerConfig() {
  return alertManagerConfig;
}

/**
 * 获取告警规则
 */
function getAlertRules() {
  return alertRules;
}

/**
 * 生成监控配置文档
 */
function generateMonitoringDocs() {
  return `
# AI服务器监控配置

## 1. Prometheus配置
${JSON.stringify(prometheusConfig, null, 2)}

## 2. AlertManager配置
${JSON.stringify(alertManagerConfig, null, 2)}

## 3. 告警规则
${JSON.stringify(alertRules, null, 2)}

## 4. Grafana仪表板
${JSON.stringify(dashboardConfig.dashboard, null, 2)}

## 5. 监控端点

- /metrics - Prometheus指标导出
- /api/health - 健康检查
- /api/health/performance - 性能指标
- /api/monitoring/metrics - 监控指标
- /api/monitoring/traces - 性能跟踪
- /api/monitoring/performance-stats - 性能统计
- /api/monitoring/alerts/rules - 告警规则
- /api/monitoring/alerts/status - 告警状态

## 6. 部署步骤

### 6.1 安装Prometheus
\`\`\`bash
wget https://github.com/prometheus/prometheus/releases/download/v2.40.0/prometheus-2.40.0.linux-amd64.tar.gz
tar xvfz prometheus-2.40.0.linux-amd64.tar.gz
cd prometheus-2.40.0.linux-amd64
\`\`\`

### 6.2 配置Prometheus
将上面的prometheus配置保存为prometheus.yml

### 6.3 安装AlertManager
\`\`\`bash
wget https://github.com/prometheus/alertmanager/releases/download/v0.24.0/alertmanager-0.24.0.linux-amd64.tar.gz
tar xvfz alertmanager-0.24.0.linux-amd64.tar.gz
\`\`\`

### 6.4 配置AlertManager
将上面的alertmanager配置保存为alertmanager.yml

### 6.5 安装Grafana
\`\`\`bash
sudo apt-get install -y software-properties-common
sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
sudo apt-get update
sudo apt-get install grafana
\`\`\`

### 6.6 导入仪表板
在Grafana中导入上面的仪表板配置

## 7. 监控指标说明

### 7.1 系统指标
- system_cpu_usage_percent - CPU使用率
- system_memory_usage_percent - 内存使用率
- system_disk_usage_percent - 磁盘使用率
- system_network_bytes_received_total - 网络接收字节数
- system_network_bytes_sent_total - 网络发送字节数

### 7.2 HTTP指标
- http_requests_total - HTTP请求总数
- http_request_duration_seconds_bucket - 请求时长分布
- http_request_size_bytes - 请求大小
- http_response_size_bytes - 响应大小

### 7.3 数据库指标
- database_pool_active_connections - 活跃连接数
- database_pool_idle_connections - 空闲连接数
- database_query_duration_seconds_bucket - 查询时长分布
- database_health_score - 健康评分

### 7.4 业务指标
- user_registrations_total - 用户注册数
- file_uploads_total - 文件上传数
- file_upload_size_bytes_total - 文件上传大小
- cache_hit_rate_percent - 缓存命中率
- error_total - 错误总数
`;
}

module.exports = {
  getGrafanaDashboard,
  getPrometheusConfig,
  getAlertManagerConfig,
  getAlertRules,
  generateMonitoringDocs
};