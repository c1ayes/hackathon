import React from 'react';
import { formatTenge } from '../utils/formatters';

/**
 * Executive Summary component for the Almaty Smart City Dashboard
 * Displays AI analysis overview with key metrics and confidence indicators
 */
export default function ExecutiveSummary({ data }) {
  if (!data) {
    return (
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-xl px-4 py-3 text-white">
        <p className="text-slate-300">Загрузка данных анализа...</p>
      </div>
    );
  }

  const {
    brain1_roads,
    brain1_cameras,
    brain2,
    key_insights,
    analysis_metadata,
  } = data;

  // Extract aggregates with fallbacks
  const roadAggregates = brain1_roads?.aggregates || {};
  const cameraAggregates = brain1_cameras?.aggregates || {};

  const criticalCount = roadAggregates.critical_count || 0;
  const unmonitoredCount = cameraAggregates.unmonitored_count || 0;
  const totalSavings = roadAggregates.total_potential_savings_tenge || 0;
  const projectedRevenue = cameraAggregates.projected_additional_revenue_tenge || 0;

  // Extract key insights with fallbacks
  const insights = key_insights || {};
  const overallConfidence = insights.overall_confidence_pct ?? brain2?.overall_confidence?.score_pct ?? null;
  const hasDataQualityIssues = insights.has_data_quality_issues || false;
  const hasCrossDomainInsights = insights.has_cross_domain_insights || false;

  // Pipeline mode
  const pipelineMode = analysis_metadata?.pipeline_mode || 'brain1_only';
  const isFullAnalysis = pipelineMode === 'full';

  // Generate headline
  const getHeadline = () => {
    if (criticalCount > 0 && unmonitoredCount > 0) {
      return `Пересечение рисков: ${criticalCount} критических дорог + ${unmonitoredCount} слепых зон камер`;
    }
    if (criticalCount > 0) {
      return `${criticalCount} критических участков требуют немедленного внимания`;
    }
    if (unmonitoredCount > 0) {
      return `${unmonitoredCount} слепых зон без мониторинга`;
    }
    return 'Инфраструктура стабильна';
  };

  // Determine urgency level for styling
  const hasUrgentIssues = criticalCount > 0 || unmonitoredCount > 0;
  const hasCriticalRisk = criticalCount > 0 && unmonitoredCount > 0;

  // Gradient based on urgency
  const getGradientClass = () => {
    if (hasCriticalRisk) {
      return 'from-red-600 via-purple-600 to-red-700';
    }
    if (hasUrgentIssues) {
      return 'from-amber-500 via-orange-600 to-red-600';
    }
    return 'from-blue-600 via-indigo-600 to-purple-600';
  };

  // Confidence meter color
  const getConfidenceColor = (confidence) => {
    if (confidence >= 70) return 'text-green-400';
    if (confidence >= 40) return 'text-amber-400';
    return 'text-red-400';
  };

  const getConfidenceStrokeColor = (confidence) => {
    if (confidence >= 70) return '#4ade80'; // green-400
    if (confidence >= 40) return '#fbbf24'; // amber-400
    return '#f87171'; // red-400
  };

  return (
    <div
      className={`bg-gradient-to-r ${getGradientClass()} rounded-xl px-4 py-3 text-white shadow-lg relative overflow-hidden`}
    >
      {/* Background pattern for visual interest */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24" />
      </div>

      <div className="relative z-10">
        {/* Top row: Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {/* Pipeline mode badge */}
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
              isFullAnalysis
                ? 'bg-emerald-500/90 text-white'
                : 'bg-slate-500/90 text-white'
            }`}
          >
            {isFullAnalysis ? (
              <>
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Полный анализ
              </>
            ) : (
              <>
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Только Brain 1
              </>
            )}
          </span>

          {/* Cross-domain insights badge */}
          {hasCrossDomainInsights && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/90 text-white">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" />
              </svg>
              Обнаружены пересечения
            </span>
          )}

          {/* Data quality warning */}
          {hasDataQualityIssues && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/90 text-white">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Проблемы с данными
            </span>
          )}
        </div>

        {/* Headline */}
        <h2 className={`text-lg font-bold mb-3 leading-tight ${hasCriticalRisk ? 'animate-pulse' : ''}`}>
          {hasUrgentIssues && (
            <span className="inline-block mr-2">
              <svg className="w-4 h-4 inline-block text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </span>
          )}
          {getHeadline()}
        </h2>

        {/* Key metrics row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-3">
          {/* Savings */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2.5">
            <div className="text-white/70 text-xs uppercase tracking-wide mb-1">
              Экономия
            </div>
            <div className="text-base font-bold text-white">
              {formatTenge(totalSavings, true)}
            </div>
          </div>

          {/* Projected revenue */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2.5">
            <div className="text-white/70 text-xs uppercase tracking-wide mb-1">
              Прогноз доходов
            </div>
            <div className="text-base font-bold text-white">
              {formatTenge(projectedRevenue, true)}
            </div>
          </div>

          {/* Critical segments */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2.5">
            <div className="text-white/70 text-xs uppercase tracking-wide mb-1">
              Критичные участки
            </div>
            <div className={`text-base font-bold ${criticalCount > 0 ? 'text-red-300' : 'text-green-300'}`}>
              {criticalCount}
            </div>
          </div>

          {/* Camera blind spots */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2.5">
            <div className="text-white/70 text-xs uppercase tracking-wide mb-1">
              Слепые зоны камер
            </div>
            <div className={`text-base font-bold ${unmonitoredCount > 0 ? 'text-amber-300' : 'text-green-300'}`}>
              {unmonitoredCount}
            </div>
          </div>
        </div>

        {/* Bottom row: Confidence meter and additional info */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Confidence meter */}
          {overallConfidence !== null && (
            <div className="flex items-center gap-2.5">
              <div className="relative w-12 h-12">
                {/* Circular progress */}
                <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background circle */}
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="3"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke={getConfidenceStrokeColor(overallConfidence)}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${(overallConfidence / 100) * 94.2} 94.2`}
                  />
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-sm font-bold ${getConfidenceColor(overallConfidence)}`}>
                    {Math.round(overallConfidence)}%
                  </span>
                </div>
              </div>
              <div>
                <div className="text-white/70 text-xs uppercase tracking-wide">
                  Уверенность анализа
                </div>
                <div className={`text-sm font-medium ${getConfidenceColor(overallConfidence)}`}>
                  {overallConfidence >= 70
                    ? 'Высокая'
                    : overallConfidence >= 40
                    ? 'Средняя'
                    : 'Низкая'}
                </div>
              </div>
            </div>
          )}

          {/* Timestamp */}
          {analysis_metadata?.timestamp && (
            <div className="text-white/50 text-xs">
              Обновлено: {new Date(analysis_metadata.timestamp).toLocaleString('ru-RU', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
