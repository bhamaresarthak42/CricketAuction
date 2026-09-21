/**
 * Format currency amount into Indian Crore (Cr) / Lakh (L) or standard INR format
 * @param {number} amount - Amount in INR (e.g., 20000000 for 2 Cr)
 * @returns {string} Formatted string
 */
export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return '₹0';
  const num = Number(amount);
  
  if (num >= 10000000) {
    const cr = (num / 10000000).toFixed(2);
    return `₹${cr.endsWith('.00') ? cr.slice(0, -3) : cr} Cr`;
  }
  if (num >= 100000) {
    const lakh = (num / 100000).toFixed(2);
    return `₹${lakh.endsWith('.00') ? lakh.slice(0, -3) : lakh} L`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Default fallback avatar SVG generator for players when no image is provided
 */
export function getDefaultPlayerImage(role = 'Batter') {
  const roleColors = {
    Batter: 'f59e0b',
    Bowler: '3b82f6',
    'All-Rounder': '10b981',
    'Wicket Keeper': '8b5cf6',
  };
  const color = roleColors[role] || '64748b';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(role)}&background=${color}&color=fff&size=256&bold=true`;
}

/**
 * Default team logo fallback
 */
export function getDefaultTeamLogo(name = 'Team') {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1e293b&color=f59e0b&size=256&bold=true`;
}
