import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Database, Gavel, Users, ArrowRight, ShieldCheck, Flame, Radio } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      
      {/* Hero Banner */}
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
          <Flame className="w-4 h-4" /> Real-Time IPL Style Cricket Auction Platform
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight font-heading text-slate-100">
          Experience the <br />
          <span className="gold-gradient-text">Live Cricket Auction</span>
        </h1>
        
        <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
          Multi-device synchronized auction platform powered by Firebase Realtime Database & Firestore. Manage teams, run live player bidding, and build dream squads.
        </p>
      </div>

      {/* Role Selector Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Admin Card */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-6 sm:p-8 flex flex-col justify-between border border-blue-500/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/15 transition-all"></div>
          <div className="space-y-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-blue-400 font-bold">Role 01</span>
              <h2 className="text-2xl font-bold text-slate-100 font-heading">Admin Portal</h2>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                Create teams, set budgets, register players, assign base prices, and upload assets into Firestore & Storage.
              </p>
            </div>
          </div>
          <div className="pt-6 mt-6 border-t border-slate-800 relative z-10">
            <Link
              to="/admin"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-slate-950 font-bold text-sm transition-colors shadow-lg shadow-blue-500/20"
            >
              Go to Admin (<code className="font-mono text-xs">/admin</code>)
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Host Card */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-6 sm:p-8 flex flex-col justify-between border border-amber-500/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/15 transition-all"></div>
          <div className="space-y-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Gavel className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">Role 02</span>
              <h2 className="text-2xl font-bold text-slate-100 font-heading">Host Controller</h2>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                Control the hammer stage, initiate bids, monitor live bid stream in real-time, and trigger SOLD / UNSOLD decisions.
              </p>
            </div>
          </div>
          <div className="pt-6 mt-6 border-t border-slate-800 relative z-10">
            <Link
              to="/host"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-colors shadow-lg shadow-amber-500/20"
            >
              Go to Host (<code className="font-mono text-xs">/host</code>)
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Owner Card */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-6 sm:p-8 flex flex-col justify-between border border-emerald-500/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/15 transition-all"></div>
          <div className="space-y-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold">Role 03</span>
              <h2 className="text-2xl font-bold text-slate-100 font-heading">Team Owner</h2>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                Live bidding interface for franchise owners with purse constraints, squad size checks, and overseas limits.
              </p>
            </div>
          </div>
          <div className="pt-6 mt-6 border-t border-slate-800 relative z-10">
            <Link
              to="/owner"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-colors shadow-lg shadow-emerald-500/20"
            >
              Go to Owner (<code className="font-mono text-xs">/owner</code>)
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
