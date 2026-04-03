/**
 * Utility functions for formatting data in the Smart City Dashboard
 * Uses Russian localization and Tenge currency
 */

/**
 * Format number as Tenge currency
 * @param {number} amount - Amount in Tenge
 * @param {boolean} [compact=false] - Use compact notation (e.g., 450M instead of 450,000,000)
 * @returns {string} Formatted string like "450 000 000 ₸" or "450M ₸"
 */
export function formatTenge(amount, compact = false) {
  if (amount === null || amount === undefined) return '—';
  
  if (compact) {
    if (amount >= 1_000_000_000) {
      return `${(amount / 1_000_000_000).toFixed(1).replace('.0', '')} млрд ₸`;
    }
    if (amount >= 1_000_000) {
      return `${(amount / 1_000_000).toFixed(1).replace('.0', '')} млн ₸`;
    }
    if (amount >= 1_000) {
      return `${(amount / 1_000).toFixed(0)} тыс ₸`;
    }
  }
  
  return `${amount.toLocaleString('ru-RU')} ₸`;
}

/**
 * Get severity level from priority score
 * @param {number} score - Priority score (0-100)
 * @returns {'critical' | 'warning' | 'good'}
 */
export function getSeverityLevel(score) {
  if (score >= 60) return 'critical';
  if (score >= 30) return 'warning';
  return 'good';
}

/**
 * Get color for severity/priority
 * @param {number} score - Priority score (0-100)
 * @returns {string} Tailwind color class or hex
 */
export function getSeverityColor(score) {
  if (score >= 60) return '#E53935'; // Red
  if (score >= 30) return '#FF9800'; // Orange
  return '#4CAF50'; // Green
}

/**
 * Get Tailwind class for severity
 * @param {number} score - Priority score (0-100)
 * @returns {string} Tailwind color class
 */
export function getSeverityClass(score) {
  if (score >= 60) return 'text-red-500 bg-red-50';
  if (score >= 30) return 'text-amber-500 bg-amber-50';
  return 'text-green-500 bg-green-50';
}

/**
 * Get severity badge class
 * @param {number} score - Priority score (0-100)
 * @returns {string} Tailwind classes for badge
 */
export function getSeverityBadgeClass(score) {
  if (score >= 60) return 'bg-red-500 text-white';
  if (score >= 30) return 'bg-amber-500 text-white';
  return 'bg-green-500 text-white';
}

/**
 * Get Russian label for severity
 * @param {number} score - Priority score (0-100)
 * @returns {string} Russian severity label
 */
export function getSeverityLabel(score) {
  if (score >= 60) return 'Срочно';
  if (score >= 30) return 'Внимание';
  return 'Стабильно';
}

/**
 * Get Russian label for urgency
 * @param {'immediate' | 'this_quarter' | 'next_quarter' | 'monitor'} urgency
 * @returns {string} Russian urgency label
 */
export function getUrgencyLabel(urgency) {
  const labels = {
    immediate: 'Немедленно',
    this_quarter: 'В этом квартале',
    next_quarter: 'В следующем квартале',
    monitor: 'Мониторинг',
  };
  return labels[urgency] || urgency;
}

/**
 * Get color for urgency
 * @param {'immediate' | 'this_quarter' | 'next_quarter' | 'monitor'} urgency
 * @returns {string} Hex color
 */
export function getUrgencyColor(urgency) {
  const colors = {
    immediate: '#E53935',
    this_quarter: '#FF9800',
    next_quarter: '#FFC107',
    monitor: '#4CAF50',
  };
  return colors[urgency] || '#9E9E9E';
}

/**
 * Format percentage
 * @param {number} value - Value between 0 and 1 (or 0 and 100)
 * @returns {string} Formatted percentage like "78%"
 */
export function formatPercent(value) {
  if (value === null || value === undefined) return '—';
  // If value is 0-1, convert to percentage
  const pct = value <= 1 ? value * 100 : value;
  return `${Math.round(pct)}%`;
}

/**
 * Format months for breakeven display
 * @param {number} months
 * @returns {string} Russian formatted months
 */
export function formatMonths(months) {
  if (months === null || months === undefined) return '—';
  const rounded = Math.round(months * 10) / 10;
  if (rounded === 1) return '1 месяц';
  if (rounded >= 2 && rounded <= 4) return `${rounded} месяца`;
  return `${rounded} мес.`;
}

/**
 * Format date for display
 * @param {string} isoDate - ISO date string
 * @returns {string} Russian formatted date
 */
export function formatDate(isoDate) {
  if (!isoDate) return '—';
  return new Date(isoDate).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get Russian label for road class
 * @param {string} roadClass
 * @returns {string} Russian label
 */
export function getRoadClassLabel(roadClass) {
  const labels = {
    arterial: 'Магистраль',
    arterial_6lane: 'Магистраль (6 полос)',
    arterial_new_industrial: 'Магистраль (промзона)',
    sub_arterial: 'Городская',
    sub_arterial_industrial: 'Городская (промзона)',
    sub_arterial_central: 'Городская (центр)',
    sub_arterial_entry_corridor: 'Въездной коридор',
    city_entry_arterial: 'Въездная магистраль',
    collector: 'Распределительная',
    collector_residential: 'Распределительная (жилая)',
    collector_slope: 'Распределительная (уклон)',
    collector_mixed: 'Распределительная (смешанная)',
    residential: 'Жилая',
  };
  return labels[roadClass] || roadClass;
}

/**
 * Get Russian label for traffic tier
 * @param {'low' | 'medium' | 'high' | 'arterial'} tier
 * @returns {string} Russian label
 */
export function getTrafficTierLabel(tier) {
  const labels = {
    low: 'Низкий',
    medium: 'Средний',
    high: 'Высокий',
    arterial: 'Магистральный',
  };
  return labels[tier] || tier;
}

/**
 * Get Russian label for overlap type
 * @param {'geographic' | 'corridor' | 'causal'} type
 * @returns {string} Russian label
 */
export function getOverlapTypeLabel(type) {
  const labels = {
    geographic: 'Географический',
    corridor: 'Коридорный',
    causal: 'Причинный',
  };
  return labels[type] || type;
}

/**
 * Interpolate color for gradient (green to red via orange)
 * @param {number} score - Score 0-100
 * @returns {string} Hex color
 */
export function interpolateScoreColor(score) {
  // Green (0-30) -> Orange (30-60) -> Red (60-100)
  const green = { r: 76, g: 175, b: 80 };   // #4CAF50
  const orange = { r: 255, g: 152, b: 0 };  // #FF9800
  const red = { r: 229, g: 57, b: 53 };     // #E53935
  
  let from, to, t;
  if (score <= 30) {
    from = green;
    to = orange;
    t = score / 30;
  } else if (score <= 60) {
    from = orange;
    to = red;
    t = (score - 30) / 30;
  } else {
    from = red;
    to = red;
    t = 0;
  }
  
  const r = Math.round(from.r + (to.r - from.r) * t);
  const g = Math.round(from.g + (to.g - from.g) * t);
  const b = Math.round(from.b + (to.b - from.b) * t);
  
  return `rgb(${r}, ${g}, ${b})`;
}
