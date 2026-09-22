import React from 'react';
import { formatCurrency } from '../utils/formatters';
import { 
  BarChart2, 
  X, 
  TrendingUp, 
  PieChart, 
  DollarSign, 
  Users, 
  Award, 
  Trophy,
  Zap,
  Globe
} from 'lucide-react';

export default function AnalyticsModal({ isOpen, onClose, teams = [], players = [] }) {
  if (!isOpen) return null;

  // Calculate Real-Time Tournament Analytics Metrics
  const totalBudget = teams.reduce((acc, t) => acc + (Number(t.total_budget) || 0), 0);
  const totalRemainingPurse = teams.reduce((acc, t) => acc + (Number(t.current_purse) || 0), 0);
  const totalSpent = Math.max(0, totalBudget - totalRemainingPurse);
  const overallUtilizationPercent = totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0;

  const soldPlayers = players.filter(p => p.status === 'sold');
  const unsoldPlayers = players.filter(p => p.status === 'unsold');
  const upcomingPlayers = players.filter(p => p.status === 'upcoming' || !p.status);

  // Role Breakdown of Sold Players & Spending
  const roleStats = {
    Batter: { count: 0, spent: 0 },
    Bowler: { count: 0, spent: 0 },
    'All-Rounder': { count: 0, spent: 0 },
    'Wicket Keeper': { count: 0, spent: 0 }
  };

  soldPlayers.forEach(p => {
    const role = p.role || 'Batter';
    if (!roleStats[role]) roleStats[role] = { count: 0, spent: 0 };
    roleStats[role].count += 1;
    roleStats[role].spent += Number(p.sold_price) || 0;
  });

  // Average Price vs Base Price Inflation
  const totalBasePriceOfSold = soldPlayers.reduce((acc, p) => acc + (Number(p.base_price) || 0), 0);
  const inflationMultiplier = totalBasePriceOfSold > 0 ? (totalSpent / totalBasePriceOfSold).toFixed(2) : '1.0';

  // Overseas vs Domestic Breakdown
  const overseasSold = soldPlayers.filter(p => p.nationality === 'Overseas').length;
  const domesticSold = soldPlayers.filter(p => p.nationality !== 'Overseas').length;

  // Top 5 Most Expensive Players
  const topPlayers = [...soldPlayers]
    .sort((a, b) => (Number(b.sold_price) || 0) - (Number(a.sold_price) || 0))
    .slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <BarChart2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-100 font-heading">
                Auction Real-Time Analytics & Insights
              </h2>
              <p className="text-xs text-slate-400">100% Free Financial, Roster, & Player Inflation Analytics</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative z-10 font-mono">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Purse Utilization</span>
            <div className="text-2xl font-extrabold text-emerald-400">{overallUtilizationPercent}%</div>
            <p className="text-[10px] text-slate-500">{formatCurrency(totalSpent)} Spent</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Market Inflation</span>
            <div className="text-2xl font-extrabold text-amber-400">{inflationMultiplier}x</div>
            <p className="text-[10px] text-slate-500">Sale vs Base Price</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Players Sold</span>
            <div className="text-2xl font-extrabold text-blue-400">{soldPlayers.length}</div>
            <p className="text-[10px] text-slate-500">{unsoldPlayers.length} Unsold / {upcomingPlayers.length} Pool</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Overseas Slot Ratio</span>
            <div className="text-2xl font-extrabold text-purple-400">{overseasSold}</div>
            <p className="text-[10px] text-slate-500">{domesticSold} Domestic Players</p>
          </div>
        </div>

        {/* Role Wise Spend Distribution */}
        <div className="space-y-4 relative z-10">
          <h3 className="text-sm font-bold text-slate-200 font-heading uppercase tracking-wider flex items-center gap-2">
            <PieChart className="w-4 h-4 text-cyan-400" />
            Spending Breakdown by Playing Role
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
            {Object.entries(roleStats).map(([role, stat]) => {
              const rolePercent = totalSpent > 0 ? Math.round((stat.spent / totalSpent) * 100) : 0;
              const colorClass = 
                role === 'Batter' ? 'bg-amber-500' :
                role === 'Bowler' ? 'bg-blue-500' :
                role === 'All-Rounder' ? 'bg-emerald-500' : 'bg-purple-500';

              return (
                <div key={role} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">{role} ({stat.count} Players)</span>
                    <span className="font-bold text-slate-400">{formatCurrency(stat.spent)} ({rolePercent}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                    <div className={`h-full ${colorClass} rounded-full transition-all duration-500`} style={{ width: `${rolePercent}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 5 Most Expensive Players */}
        <div className="space-y-3 relative z-10">
          <h3 className="text-sm font-bold text-slate-200 font-heading uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            Top 5 Most Expensive Player Acquisitions
          </h3>

          {topPlayers.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
              No players sold yet in this auction.
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {topPlayers.map((p, idx) => (
                <div key={p.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-amber-400 w-4">#{idx + 1}</span>
                    <img src={p.image_url} alt={p.name} className="w-8 h-8 rounded-lg object-cover bg-slate-900" />
                    <div>
                      <h4 className="font-bold text-slate-100">{p.name}</h4>
                      <span className="text-[10px] text-slate-400">{p.role} • {p.nationality}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-emerald-400 text-sm block">{formatCurrency(p.sold_price)}</span>
                    <span className="text-[10px] text-slate-500">Base: {formatCurrency(p.base_price)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between relative z-10 text-xs">
          <span className="text-slate-400">Powered by CricAuction Pro Analytics Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-lg cursor-pointer"
          >
            Close Analytics
          </button>
        </div>

      </div>
    </div>
  );
}
