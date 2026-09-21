import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { formatCurrency } from '../utils/formatters';
import { 
  Trophy, 
  Database, 
  Gavel, 
  Users, 
  Lock, 
  Key, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck,
  Flame
} from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState('owner'); // 'admin', 'host', 'owner'
  const [pin, setPin] = useState('');
  
  // Teams for Owner Role
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [loadingTeams, setLoadingTeams] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch Teams from Firestore for Team Owner Selection
  useEffect(() => {
    async function fetchTeams() {
      try {
        const snap = await getDocs(collection(db, 'teams'));
        const teamList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTeams(teamList);
        if (teamList.length > 0) {
          setSelectedTeamId(teamList[0].id);
        }
      } catch (err) {
        console.error("Error fetching teams for login:", err);
      } finally {
        setLoadingTeams(false);
      }
    }
    fetchTeams();
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      const selectedTeamObj = teams.find(t => t.id === selectedTeamId);
      
      await login({
        role: selectedRole,
        pin,
        teamId: selectedRole === 'owner' ? selectedTeamId : '',
        teamName: selectedRole === 'owner' && selectedTeamObj ? selectedTeamObj.name : ''
      });

      // Redirect to authorized role path
      if (selectedRole === 'admin') navigate('/admin');
      else if (selectedRole === 'host') navigate('/host');
      else if (selectedRole === 'owner') navigate('/owner');
    } catch (err) {
      setErrorMsg(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      
      {/* Brand Header */}
      <div className="text-center space-y-4 max-w-xl mx-auto">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 p-0.5 shadow-2xl shadow-amber-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <Trophy className="w-8 h-8 text-amber-400" />
          </div>
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-semibold uppercase tracking-wider mb-2">
            <Flame className="w-3.5 h-3.5" /> Authentication Portal
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-100 font-heading">
            Live Cricket Auction <span className="gold-gradient-text">Role Sign In</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Select your tournament role and enter authorization credentials to access protected dashboards.
          </p>
        </div>
      </div>

      {/* Role Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Admin Card */}
        <div
          onClick={() => { setSelectedRole('admin'); setErrorMsg(''); }}
          className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
            selectedRole === 'admin'
              ? 'bg-blue-950/40 border-blue-500 shadow-lg shadow-blue-500/10 scale-[1.02]'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2.5 rounded-xl ${selectedRole === 'admin' ? 'bg-blue-500 text-slate-950' : 'bg-blue-500/10 text-blue-400'}`}>
              <Database className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase text-blue-400">PIN: 1234</span>
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-base font-heading">Admin Setup</h3>
            <p className="text-slate-400 text-xs mt-1">Manage Teams & Player Pool</p>
          </div>
        </div>

        {/* Host Card */}
        <div
          onClick={() => { setSelectedRole('host'); setErrorMsg(''); }}
          className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
            selectedRole === 'host'
              ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-500/10 scale-[1.02]'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2.5 rounded-xl ${selectedRole === 'host' ? 'bg-amber-500 text-slate-950' : 'bg-amber-500/10 text-amber-400'}`}>
              <Gavel className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase text-amber-400">PIN: 5678</span>
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-base font-heading">Host Auctioneer</h3>
            <p className="text-slate-400 text-xs mt-1">Control Live Bidding Stage</p>
          </div>
        </div>

        {/* Owner Card */}
        <div
          onClick={() => { setSelectedRole('owner'); setErrorMsg(''); }}
          className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
            selectedRole === 'owner'
              ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-500/10 scale-[1.02]'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2.5 rounded-xl ${selectedRole === 'owner' ? 'bg-emerald-500 text-slate-950' : 'bg-emerald-500/10 text-emerald-400'}`}>
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase text-emerald-400">Team Choice</span>
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-base font-heading">Team Owner</h3>
            <p className="text-slate-400 text-xs mt-1">Live Bidding & Squad Roster</p>
          </div>
        </div>

      </div>

      {/* Login Form Box */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 max-w-md mx-auto space-y-6 shadow-2xl">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <Lock className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-bold text-slate-100 font-heading capitalize">
            {selectedRole} Authorization
          </h2>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          
          {/* PIN Input for Admin / Host */}
          {(selectedRole === 'admin' || selectedRole === 'host') && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Security Access PIN (Default: {selectedRole === 'admin' ? '1234' : '5678'})
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Key className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  placeholder="Enter PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-mono text-sm focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>
          )}

          {/* Team Dropdown for Team Owner */}
          {selectedRole === 'owner' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Select Your Franchise Team *
              </label>
              {loadingTeams ? (
                <div className="text-xs text-slate-500 animate-pulse py-2">Loading teams from Firestore...</div>
              ) : teams.length === 0 ? (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs">
                  No teams found. Log in as Admin first to add teams or run Quick Auto-Seed!
                </div>
              ) : (
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-bold text-sm focus:outline-none focus:border-emerald-500"
                  required
                >
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Purse: {formatCurrency(t.current_purse)})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg cursor-pointer ${
              selectedRole === 'admin' ? 'bg-blue-600 hover:bg-blue-500 text-slate-950 shadow-blue-500/20' :
              selectedRole === 'host' ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20' :
              'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
            }`}
          >
            <span>Sign In to {selectedRole.toUpperCase()} Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>

        </form>
      </div>

    </div>
  );
}
