/**
 * Personalized Recommendations Component
 * 
 * Displays AI-powered personalized recommendations, templates, and learning insights
 * based on user behavior patterns and preferences. Provides interactive feedback
 * and template application capabilities.
 */

import React, { useState, useEffect } from 'react';
import {
  Brain,
  Lightbulb,
  Star,
  ThumbsUp,
  ThumbsDown,
  Clock,
  TrendingUp,
  BookOpen,
  Zap,
  Target,
  AlertCircle,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
  Play
} from 'lucide-react';

import { useLoadCalculator } from '../../hooks/useLoadCalculator';
import type { 
  PredictiveRecommendation, 
  PersonalizedTemplate, 
  UserBehaviorPattern 
} from '../../services/templateLearningService';

interface PersonalizedRecommendationsProps {
  className?: string;
  maxRecommendations?: number;
  showTemplates?: boolean;
  showPatterns?: boolean;
}

export const PersonalizedRecommendations: React.FC<PersonalizedRecommendationsProps> = ({
  className = '',
  maxRecommendations = 5,
  showTemplates = true,
  showPatterns = false
}) => {
  const { 
    state, 
    trackUserAction, 
    applyPersonalizedTemplate, 
    recordTemplateFeedback,
    getPersonalizedRecommendations 
  } = useLoadCalculator();

  const [expandedSections, setExpandedSections] = useState({
    recommendations: true,
    templates: false,
    patterns: false
  });
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [appliedTemplates, setAppliedTemplates] = useState<Set<string>>(new Set());

  // Auto-refresh recommendations periodically
  useEffect(() => {
    if (state.enableTemplateLearning) {
      const interval = setInterval(async () => {
        try {
          setLoadingRecommendations(true);
          await getPersonalizedRecommendations();
        } catch (error) {
          console.error('Failed to refresh recommendations:', error);
        } finally {
          setLoadingRecommendations(false);
        }
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [state.enableTemplateLearning, getPersonalizedRecommendations]);

  const handleRecommendationFeedback = (
    recommendationId: string,
    helpful: boolean,
    applied: boolean = false
  ) => {
    recordTemplateFeedback(recommendationId, {
      helpful,
      applied,
      rating: helpful ? 5 : 2,
      timestamp: new Date()
    });

    trackUserAction('recommendation_feedback', {
      recommendationId,
      helpful,
      applied
    });
  };

  const handleApplyTemplate = async (templateId: string) => {
    try {
      await applyPersonalizedTemplate(templateId);
      setAppliedTemplates(prev => new Set([...prev, templateId]));
      
      trackUserAction('template_applied', {
        templateId,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to apply template:', error);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderRecommendation = (recommendation: PredictiveRecommendation) => {
    const priorityColors = {
      high: 'border-red-500 bg-red-50',
      medium: 'border-yellow-500 bg-yellow-50',
      low: 'border-blue-500 bg-blue-50'
    };

    const priorityIcons = {
      high: <AlertCircle className="h-4 w-4 text-red-600" />,
      medium: <Clock className="h-4 w-4 text-yellow-600" />,
      low: <Lightbulb className="h-4 w-4 text-blue-600" />
    };

    return (
      <div 
        key={recommendation.id} 
        className={`p-4 rounded-lg border-l-4 ${priorityColors[recommendation.priority]} mb-3`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {priorityIcons[recommendation.priority]}
              <h4 className="font-medium text-gray-900">{recommendation.title}</h4>
              <span className="text-xs px-2 py-1 bg-gray-200 rounded-full">
                {Math.round(recommendation.confidence * 100)}% confidence
              </span>
            </div>
            
            <p className="text-sm text-gray-700 mb-2">{recommendation.description}</p>
            
            {recommendation.reasoning.length > 0 && (
              <div className="text-xs text-gray-600 mb-3">
                <strong>Why:</strong> {recommendation.reasoning.join(', ')}
              </div>
            )}

            <div className="flex items-center gap-2">
              {recommendation.action.reversible && (
                <button
                  onClick={() => {
                    trackUserAction('recommendation_applied', {
                      recommendationId: recommendation.id,
                      actionType: recommendation.action.type
                    });
                    handleRecommendationFeedback(recommendation.id, true, true);
                  }}
                  className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                >
                  <Play className="h-3 w-3" />
                  Apply
                </button>
              )}

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleRecommendationFeedback(recommendation.id, true)}
                  className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                  title="Helpful"
                >
                  <ThumbsUp className="h-3 w-3" />
                </button>
                <button
                  onClick={() => handleRecommendationFeedback(recommendation.id, false)}
                  className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                  title="Not helpful"
                >
                  <ThumbsDown className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTemplate = (template: PersonalizedTemplate) => {
    const isApplied = appliedTemplates.has(template.id);

    return (
      <div key={template.id} className="p-4 border border-gray-200 rounded-lg bg-white mb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-purple-600" />
              <h4 className="font-medium text-gray-900">{template.name}</h4>
              {template.metadata.autoGenerated && (
                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                  AI Generated
                </span>
              )}
              {isApplied && (
                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                  Applied
                </span>
              )}
            </div>
            
            <p className="text-sm text-gray-700 mb-2">{template.description}</p>
            
            <div className="text-xs text-gray-600 mb-3">
              <div>Category: {template.category.replace('_', ' ')}</div>
              <div>Used {template.metadata.useCount} times</div>
              {template.metadata.successRate > 0 && (
                <div>Success rate: {Math.round(template.metadata.successRate * 100)}%</div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!isApplied && (
                <button
                  onClick={() => handleApplyTemplate(template.id)}
                  className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors"
                >
                  <Play className="h-3 w-3" />
                  Apply Template
                </button>
              )}

              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => {
                      recordTemplateFeedback(template.id, {
                        helpful: star >= 3,
                        applied: isApplied,
                        rating: star
                      });
                    }}
                    className={`p-1 rounded transition-colors ${
                      star <= template.metadata.userRating
                        ? 'text-yellow-500'
                        : 'text-gray-300 hover:text-yellow-400'
                    }`}
                  >
                    <Star className="h-3 w-3" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPattern = (pattern: UserBehaviorPattern) => {
    const confidenceColor = pattern.confidence >= 0.8 ? 'text-green-600' :
                           pattern.confidence >= 0.6 ? 'text-yellow-600' : 'text-red-600';

    return (
      <div key={pattern.id} className="p-4 border border-gray-200 rounded-lg bg-white mb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <h4 className="font-medium text-gray-900">{pattern.name}</h4>
              <span className={`text-xs px-2 py-1 rounded-full ${confidenceColor} bg-gray-100`}>
                {Math.round(pattern.confidence * 100)}% confidence
              </span>
            </div>
            
            <p className="text-sm text-gray-700 mb-2">{pattern.description}</p>
            
            <div className="text-xs text-gray-600">
              <div>Type: {pattern.type.replace('_', ' ')}</div>
              <div>Frequency: {pattern.frequency} occurrences</div>
              <div>Success rate: {Math.round(pattern.metrics.successRate * 100)}%</div>
              <div>Last seen: {pattern.temporal.lastSeen.toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!state.enableTemplateLearning) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-gray-600">
          <Brain className="h-5 w-5" />
          <span className="text-sm">Template learning is disabled</span>
        </div>
      </div>
    );
  }

  const hasRecommendations = state.predictiveRecommendations.length > 0;
  const hasTemplates = state.personalizedTemplates.length > 0;
  const hasPatterns = state.userPatterns.length > 0;

  if (!hasRecommendations && !hasTemplates && !hasPatterns) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-blue-800">
          <Brain className="h-5 w-5" />
          <div>
            <h3 className="font-medium">Learning Your Preferences</h3>
            <p className="text-sm text-blue-700">
              Continue using the calculator to receive personalized recommendations and templates.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">AI Assistant</h3>
          {loadingRecommendations && (
            <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Recommendations Section */}
        {hasRecommendations && (
          <div>
            <button
              onClick={() => toggleSection('recommendations')}
              className="flex items-center gap-2 w-full text-left mb-3"
            >
              <Target className="h-4 w-4 text-green-600" />
              <span className="font-medium text-gray-900">
                Recommendations ({state.predictiveRecommendations.length})
              </span>
              {expandedSections.recommendations ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </button>
            
            {expandedSections.recommendations && (
              <div className="space-y-2">
                {state.predictiveRecommendations
                  .slice(0, maxRecommendations)
                  .map(renderRecommendation)}
              </div>
            )}
          </div>
        )}

        {/* Templates Section */}
        {hasTemplates && showTemplates && (
          <div>
            <button
              onClick={() => toggleSection('templates')}
              className="flex items-center gap-2 w-full text-left mb-3"
            >
              <BookOpen className="h-4 w-4 text-purple-600" />
              <span className="font-medium text-gray-900">
                Your Templates ({state.personalizedTemplates.length})
              </span>
              {expandedSections.templates ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </button>
            
            {expandedSections.templates && (
              <div className="space-y-2">
                {state.personalizedTemplates.map(renderTemplate)}
              </div>
            )}
          </div>
        )}

        {/* Patterns Section */}
        {hasPatterns && showPatterns && (
          <div>
            <button
              onClick={() => toggleSection('patterns')}
              className="flex items-center gap-2 w-full text-left mb-3"
            >
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-gray-900">
                Detected Patterns ({state.userPatterns.length})
              </span>
              {expandedSections.patterns ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </button>
            
            {expandedSections.patterns && (
              <div className="space-y-2">
                {state.userPatterns.map(renderPattern)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalizedRecommendations;