/**
 * Template Learning Service
 * Provides intelligent template recommendations based on user behavior patterns
 */

export interface UserBehaviorPattern {
  id: string;
  userId: string;
  actionType: 'template_used' | 'load_added' | 'setting_changed';
  templateId?: string;
  loadType?: string;
  projectType?: 'residential' | 'commercial' | 'solar' | 'evse';
  timestamp: Date;
  contextData?: Record<string, any>;
}

export interface PersonalizedTemplate {
  id: string;
  name: string;
  description: string;
  baseTemplateId?: string;
  customData: Record<string, any>;
  usageCount: number;
  lastUsed: Date;
  tags: string[];
  confidence: number; // 0-1 score
}

export interface PredictiveRecommendation {
  id: string;
  type: 'template' | 'load' | 'setting';
  confidence: number;
  reasoning: string;
  data: Record<string, any>;
  priority: 'low' | 'medium' | 'high';
}

export interface LearningAnalytics {
  totalInteractions: number;
  mostUsedTemplates: Array<{ templateId: string; count: number }>;
  averageProjectSize: number;
  preferredCalculationMethod: string;
  timeOfDayPatterns: Record<string, number>;
  deviceTypeUsage: Record<string, number>;
}

class TemplateLearningService {
  private patterns: UserBehaviorPattern[] = [];
  private personalizedTemplates: PersonalizedTemplate[] = [];
  private isLearningEnabled: boolean = false;

  constructor() {
    // Initialize with default settings
    this.isLearningEnabled = this.getStoredPreference('learningEnabled', false);
  }

  /**
   * Enable or disable machine learning features
   */
  setLearningEnabled(enabled: boolean): void {
    this.isLearningEnabled = enabled;
    this.storePreference('learningEnabled', enabled);
  }

  /**
   * Record user behavior pattern
   */
  recordBehaviorPattern(pattern: Omit<UserBehaviorPattern, 'id' | 'timestamp'>): void {
    if (!this.isLearningEnabled) return;

    const behaviorPattern: UserBehaviorPattern = {
      ...pattern,
      id: this.generateId(),
      timestamp: new Date()
    };

    this.patterns.push(behaviorPattern);
    this.limitStoredPatterns();
  }

  /**
   * Get personalized template recommendations
   */
  getPersonalizedRecommendations(context?: Record<string, any>): PredictiveRecommendation[] {
    if (!this.isLearningEnabled) return [];

    const recommendations: PredictiveRecommendation[] = [];

    // Analyze recent patterns
    const recentPatterns = this.patterns
      .filter(p => Date.now() - p.timestamp.getTime() < 30 * 24 * 60 * 60 * 1000) // Last 30 days
      .slice(-50); // Last 50 patterns

    // Template usage frequency analysis
    const templateUsage = new Map<string, number>();
    recentPatterns
      .filter(p => p.actionType === 'template_used' && p.templateId)
      .forEach(p => {
        const count = templateUsage.get(p.templateId!) || 0;
        templateUsage.set(p.templateId!, count + 1);
      });

    // Generate template recommendations
    Array.from(templateUsage.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .forEach(([templateId, count], index) => {
        recommendations.push({
          id: `template-rec-${index}`,
          type: 'template',
          confidence: Math.min(count / 10, 0.9), // Max confidence 0.9
          reasoning: `You've used this template ${count} times recently`,
          data: { templateId },
          priority: index === 0 ? 'high' : 'medium'
        });
      });

    return recommendations;
  }

  /**
   * Create personalized template from user patterns
   */
  createPersonalizedTemplate(
    name: string,
    description: string,
    baseData: Record<string, any>
  ): PersonalizedTemplate {
    const template: PersonalizedTemplate = {
      id: this.generateId(),
      name,
      description,
      customData: baseData,
      usageCount: 0,
      lastUsed: new Date(),
      tags: [],
      confidence: 0.5
    };

    this.personalizedTemplates.push(template);
    return template;
  }

  /**
   * Get learning analytics
   */
  getLearningAnalytics(): LearningAnalytics {
    const analytics: LearningAnalytics = {
      totalInteractions: this.patterns.length,
      mostUsedTemplates: [],
      averageProjectSize: 0,
      preferredCalculationMethod: 'standard',
      timeOfDayPatterns: {},
      deviceTypeUsage: {}
    };

    if (this.patterns.length === 0) return analytics;

    // Template usage analysis
    const templateUsage = new Map<string, number>();
    this.patterns
      .filter(p => p.actionType === 'template_used' && p.templateId)
      .forEach(p => {
        const count = templateUsage.get(p.templateId!) || 0;
        templateUsage.set(p.templateId!, count + 1);
      });

    analytics.mostUsedTemplates = Array.from(templateUsage.entries())
      .map(([templateId, count]) => ({ templateId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Time patterns
    this.patterns.forEach(p => {
      const hour = p.timestamp.getHours();
      const timeSlot = this.getTimeSlot(hour);
      analytics.timeOfDayPatterns[timeSlot] = (analytics.timeOfDayPatterns[timeSlot] || 0) + 1;
    });

    return analytics;
  }

  /**
   * Clear all learning data
   */
  clearLearningData(): void {
    this.patterns = [];
    this.personalizedTemplates = [];
    this.clearStoredData();
  }

  /**
   * Export learning data for backup
   */
  exportLearningData(): { patterns: UserBehaviorPattern[]; templates: PersonalizedTemplate[] } {
    return {
      patterns: this.patterns,
      templates: this.personalizedTemplates
    };
  }

  /**
   * Import learning data from backup
   */
  importLearningData(data: { patterns: UserBehaviorPattern[]; templates: PersonalizedTemplate[] }): void {
    this.patterns = data.patterns || [];
    this.personalizedTemplates = data.templates || [];
  }

  // Private helper methods
  private generateId(): string {
    return `learning_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private limitStoredPatterns(): void {
    // Keep only last 1000 patterns to prevent unlimited growth
    if (this.patterns.length > 1000) {
      this.patterns = this.patterns.slice(-1000);
    }
  }

  private getTimeSlot(hour: number): string {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  private getStoredPreference<T>(key: string, defaultValue: T): T {
    try {
      const stored = localStorage.getItem(`templateLearning_${key}`);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private storePreference<T>(key: string, value: T): void {
    try {
      localStorage.setItem(`templateLearning_${key}`, JSON.stringify(value));
    } catch {
      // Ignore storage errors
    }
  }

  private clearStoredData(): void {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('templateLearning_'));
      keys.forEach(key => localStorage.removeItem(key));
    } catch {
      // Ignore storage errors
    }
  }
}

// Export singleton instance
export default new TemplateLearningService();