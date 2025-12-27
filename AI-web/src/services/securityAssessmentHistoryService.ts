/**
 * 安全评估历史记录服务
 * 负责记录和管理用户的安全评估历史
 */

export interface SecurityAssessmentHistory {
  id: string;
  userId: string;
  timestamp: number;
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  factors: {
    name: string;
    score: number;
    description: string;
  }[];
}

/**
 * 记录安全评估历史
 * @param assessment 安全评估结果
 */
export const logSecurityAssessment = (assessment: Omit<SecurityAssessmentHistory, 'id' | 'timestamp'>): void => {
  try {
    const assessmentEntry: SecurityAssessmentHistory = {
      ...assessment,
      id: generateId(),
      timestamp: Date.now()
    };

    // 获取现有的安全评估历史
    const assessmentsStr = localStorage.getItem('security_assessment_history');
    let assessments: SecurityAssessmentHistory[] = [];
    if (assessmentsStr) {
      assessments = JSON.parse(assessmentsStr);
    }

    // 添加新的评估记录
    assessments.push(assessmentEntry);

    // 只保留最近的10条记录
    if (assessments.length > 10) {
      assessments = assessments.slice(-10);
    }

    // 保存评估历史
    localStorage.setItem('security_assessment_history', JSON.stringify(assessments));
  } catch (error) {
    console.error('记录安全评估历史失败:', error);
  }
};

/**
 * 获取安全评估历史
 * @param userId 用户ID
 * @param limit 返回条数限制
 * @returns 安全评估历史列表
 */
export const getSecurityAssessmentHistory = (userId: string, limit: number = 10): SecurityAssessmentHistory[] => {
  try {
    const assessmentsStr = localStorage.getItem('security_assessment_history');
    if (!assessmentsStr) {
      return [];
    }

    const assessments: SecurityAssessmentHistory[] = JSON.parse(assessmentsStr);
    
    // 过滤指定用户的评估历史
    const userAssessments = assessments.filter(assessment => assessment.userId === userId);
    
    // 按时间倒序排列并限制数量
    return userAssessments
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  } catch (error) {
    console.error('获取安全评估历史失败:', error);
    return [];
  }
};

/**
 * 清除安全评估历史
 * @param userId 用户ID
 */
export const clearSecurityAssessmentHistory = (userId: string): void => {
  try {
    const assessmentsStr = localStorage.getItem('security_assessment_history');
    if (!assessmentsStr) {
      return;
    }

    let assessments: SecurityAssessmentHistory[] = JSON.parse(assessmentsStr);
    
    // 过滤掉指定用户的评估历史
    assessments = assessments.filter(assessment => assessment.userId !== userId);
    
    // 保存评估历史
    localStorage.setItem('security_assessment_history', JSON.stringify(assessments));
  } catch (error) {
    console.error('清除安全评估历史失败:', error);
  }
};

/**
 * 生成唯一ID
 * @returns 唯一ID
 */
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

export default {
  logSecurityAssessment,
  getSecurityAssessmentHistory,
  clearSecurityAssessmentHistory
};