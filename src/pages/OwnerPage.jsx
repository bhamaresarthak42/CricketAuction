import React, { useState, useEffect } from 'react';
import { db, rtdb } from '../firebase';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { ref, onValue, update } from 'firebase/database';
import { formatCurrency, getDefaultPlayerImage, getDefaultTeamLogo } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  DollarSign, 
  AlertCircle, 
  ShieldAlert, 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  Zap,
  Shield,
  ChevronDown,
  Flame,
  Radio,
  Clock,
  Sparkles,
  Trophy,
  PieChart,
  UserCheck
} from 'lucide-react';

export default function OwnerPage() {
  const { userTeamId, userTeamName } = useAuth();

  // Teams list from Firestore
  const [teams, setTeams] = useState([]);
  
  // Tab-specific team selection state stored in sessionStorage
  const [selectedTeamId, setSelectedTeamId] = useState(() => {
    return userTeamId || sessionStorage.getItem('ca_user_team_id') || '';
  });
  
  const [loadingTeams, setLoadingTeams] = useState(true);

  // Purchased Squad Players from Firestore (`sold_to_team_id` == `selectedTeamId`)
  const [mySquad, setMySquad] = useState([]);
  const [loadingSquad, setLoadingSquad] = useState(false);
  const [activeRoleTab, setActiveRoleTab] = useState('all');

  // Live Auction state from RTDB
  const [liveAuction, setLiveAuction] = useState(null);
  const [loadingLive, setLoadingLive] = useState(true);

  // Custom Bid Input (in Lakhs)
  const [customBidLakhs, setCustomBidLakhs] = useState('');
  const [submittingBid, setSubmittingBid] = useState(false);

  // Toast / Error Notification state
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' });

  const showNotification = (message, type = 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 4000);
  };

  // Handle Team Selection Change
  const handleTeamChange = (newTeamId) => {
    setSelectedTeamId(newTeamId);
    sessionStorage.setItem('ca_user_team_id', newTeamId);
    const teamObj = teams.find(t => t.id === newTeamId);
    if (teamObj) sessionStorage.setItem('ca_user_team_name', teamObj.name);
  };

  // 1. Subscribe to Firestore `teams` Collection
  useEffect(() => {
    const unsubTeams = onSnapshot(
      collection(db, 'teams'),
      (snapshot) => {
        const teamList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTeams(teamList);

        // Auto select first team if no team selected in sessionStorage
        if (teamList.length > 0 && !selectedTeamId) {
          const defaultId = userTeamId || teamList[0].id;
          setSelectedTeamId(defaultId);
          sessionStorage.setItem('ca_user_team_id', defaultId);
        }
        setLoadingTeams(false);
      },
      (error) => {
        console.error("Firestore Teams error:", error);
        setLoadingTeams(false);
      }
    );

    return () => unsubTeams();
  }, [userTeamId]);

  // 2. Subscribe to Firestore Purchased Players (`sold_to_team_id` == `selectedTeamId`)
  useEffect(() => {
    if (!selectedTeamId) {
      setMySquad([]);
      return;
    }

    setLoadingSquad(true);
    const qSquad = query(
      collection(db, 'players'),
      where('status', '==', 'sold'),
      where('sold_to_team_id', '==', selectedTeamId)
    );

    const unsubSquad = onSnapshot(
      qSquad,
      (snapshot) => {
        const squadList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMySquad(squadList);
        setLoadingSquad(false);
      },
      (error) => {
        console.error("Firestore my squad error:", error);
        setLoadingSquad(false);
      }
    );

    return () => unsubSquad();
  }, [selectedTeamId]);

  // 3. Dual Real-Time Listener for Firestore `live_auction/current` & RTDB `live_auction`
  useEffect(() => {
    const handleSnapshotUpdate = (newData) => {
      if (!newData || newData.status !== 'bidding') {
        setLiveAuction(null);
        return;
      }
      setLiveAuction(prev => {
        if (!prev || (newData.timestamp || 0) >= (prev.timestamp || 0)) {
          return newData;
        }
        return prev;
      });
    };

    // 3a. Firestore Listener (Primary Sync)
    const unsubFirestoreLive = onSnapshot(
      doc(db, 'live_auction', 'current'),
      (snapshot) => {
        if (snapshot.exists()) {
          handleSnapshotUpdate(snapshot.data());
        } else {
          setLiveAuction(null);
        }
        setLoadingLive(false);
      },
      (error) => {
        console.warn("Firestore live_auction sync error:", error);
        setLoadingLive(false);
      }
    );

    // 3b. RTDB Listener (Secondary Sync)
    const liveAuctionRef = ref(rtdb, 'live_auction');
    const unsubRtdbLive = onValue(
      liveAuctionRef,
      (snapshot) => {
        if (snapshot.exists()) {
          handleSnapshotUpdate(snapshot.val());
        }
        setLoadingLive(false);
      },
      (error) => {
        console.warn("RTDB live_auction sync warning:", error);
        setLoadingLive(false);
      }
    );

    return () => {
      unsubFirestoreLive();
      unsubRtdbLive();
    };
  }, []);

  // Selected Team Object
  const selectedTeam = teams.find(t => t.id === selectedTeamId);

  // Categorize Purchased Players by Roles
  const batters = mySquad.filter(p => p.role === 'Batter');
  const bowlers = mySquad.filter(p => p.role === 'Bowler');
  const allRounders = mySquad.filter(p => p.role === 'All-Rounder');
  const keepers = mySquad.filter(p => p.role === 'Wicket Keeper');

  const totalSpent = mySquad.reduce((acc, p) => acc + (Number(p.sold_price) || 0), 0);

  // 4. CRUCIAL BIDDING VALIDATION & PLACEMENT LOGIC
  const placeBid = async (proposedBidAmount) => {
    if (!selectedTeam) {
      showNotification("Please select your Franchise Team first!", "error");
      return;
    }

    if (!liveAuction || liveAuction.status !== 'bidding') {
      showNotification("No active player is currently under the hammer!", "warning");
      return;
    }

    // Rule 0: Cannot bid against yourself
    if (liveAuction.highest_bidder_team_id === selectedTeam.id) {
      showNotification("Your team already holds the highest bid!", "warning");
      return;
    }

    const currentBid = Number(liveAuction.current_bid) || Number(liveAuction.base_price) || 0;
    const bidAmount = Number(proposedBidAmount);
    const isOpeningBid = !liveAuction.highest_bidder_team_id;

    // Rule 1: Bid Increment / Opening Bid Check
    if (isOpeningBid) {
      if (bidAmount < currentBid) {
        showNotification(`Opening bid rejected: ${formatCurrency(bidAmount)} must be at least the base price ${formatCurrency(currentBid)}!`, "error");
        return;
      }
    } else {
      if (bidAmount <= currentBid) {
        showNotification(`Bid rejected: ${formatCurrency(bidAmount)} must be strictly higher than current bid ${formatCurrency(currentBid)}!`, "error");
        return;
      }
    }

    // Rule 2: Budget Check (bid_amount <= team.current_purse)
    const currentPurse = Number(selectedTeam.current_purse) || 0;
    if (bidAmount > currentPurse) {
      showNotification(`Purse exceeded: Bid of ${formatCurrency(bidAmount)} exceeds remaining budget ${formatCurrency(currentPurse)}!`, "error");
      return;
    }

    // Rule 3: Squad Size Check (team.squad_count < max_squad_size)
    const squadCount = Number(selectedTeam.squad_count) || 0;
    const maxSquad = Number(selectedTeam.max_squad_size) || 25;
    if (squadCount >= maxSquad) {
      showNotification(`Squad full: ${selectedTeam.name} has reached max squad capacity of ${maxSquad} players!`, "error");
      return;
    }

    // Rule 4: Overseas Limit Check (if player is Overseas, team.overseas_count < 8)
    const isOverseas = liveAuction.player_nationality === 'Overseas';
    const overseasCount = Number(selectedTeam.overseas_count) || 0;
    if (isOverseas && overseasCount >= 8) {
      showNotification(`Overseas limit reached: ${selectedTeam.name} already has ${overseasCount}/8 overseas players!`, "error");
      return;
    }

    // ALL RULES PASSED -> DUAL SYNC UPDATE TO FIRESTORE & RTDB
    setSubmittingBid(true);
    try {
      const bidPayload = {
        current_bid: bidAmount,
        highest_bidder_team_id: selectedTeam.id,
        highest_bidder_team_name: selectedTeam.name,
        timestamp: Date.now()
      };

      await updateDoc(doc(db, 'live_auction', 'current'), bidPayload);
      try {
        await update(ref(rtdb, 'live_auction'), bidPayload);
      } catch (rtdbErr) {
        console.warn("RTDB update bid warning:", rtdbErr);
      }

      showNotification(`🎉 Bid of ${formatCurrency(bidAmount)} placed by ${selectedTeam.name}!`, "success");
      setCustomBidLakhs('');
    } catch (error) {
      console.error("Error placing bid:", error);
      showNotification(`Failed to submit bid: ${error.message}`, "error");
    } finally {
      setSubmittingBid(false);
    }
  };

  // Quick Bid Handlers
  const handleQuickBid = (incrementLakhs) => {
    if (!liveAuction) return;
    const currentBid = Number(liveAuction.current_bid) || Number(liveAuction.base_price) || 0;
    const incrementINR = incrementLakhs * 100000;
    placeBid(currentBid + incrementINR);
  };

  // Custom Bid Handler
  const handleCustomBidSubmit = (e) => {
    e.preventDefault();
    if (!customBidLakhs || isNaN(customBidLakhs)) {
      showNotification("Please enter a valid numeric bid amount in Lakhs", "error");
      return;
    }
    const customBidINR = Number(customBidLakhs) * 100000;
    placeBid(customBidINR);
  };

  const isHighestBidder = liveAuction && selectedTeam && liveAuction.highest_bidder_team_id === selectedTeam.id;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Toast Alert Banner */}
      {toast.show && (
        <div className={`fixed top-20 right-4 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border transition-all animate-bounce ${
          toast.type === 'error' ? 'bg-rose-950/95 text-rose-300 border-rose-500/50' :
          toast.type === 'warning' ? 'bg-amber-950/95 text-amber-300 border-amber-500/50' :
          'bg-emerald-950/95 text-emerald-300 border-emerald-500/50'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5 text-rose-400" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl glass-panel p-6 sm:p-8 border border-emerald-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider mb-2">
              <Users className="w-4 h-4" /> Live Bidding Desk & Squad Manager
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 font-heading">
              Team Owner <span className="emerald-gradient-text">Console</span>
            </h1>
            <p className="text-slate-400 mt-1 max-w-xl text-sm">
              Select your franchise team, track your remaining purse & roster capacity, place live bids, and inspect your purchased squad in real time.
            </p>
          </div>

          {/* SELECT TEAM DROPDOWN */}
          <div className="w-full md:w-72 space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Playing Team (Tab Session) *
            </label>
            {loadingTeams ? (
              <div className="text-xs text-slate-500 animate-pulse">Loading teams...</div>
            ) : (
              <select
                value={selectedTeamId}
                onChange={(e) => handleTeamChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-emerald-500/40 text-slate-100 font-bold text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all shadow-lg shadow-emerald-500/10"
              >
                {teams.length === 0 && <option value="">No teams found in Firestore</option>}
                {teams.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} (Purse: {formatCurrency(t.current_purse)})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* ACTIVE TEAM STATS CARDS */}
      {selectedTeam && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-1 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider">Remaining Purse</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold emerald-gradient-text font-mono">
              {formatCurrency(selectedTeam.current_purse)}
            </div>
            <p className="text-[10px] text-slate-500 font-mono">Spent: {formatCurrency(totalSpent)}</p>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-1 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider">Squad Count</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-400 font-mono">
              {selectedTeam.squad_count || 0} <span className="text-sm font-normal text-slate-500">/ {selectedTeam.max_squad_size || 25}</span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono">Bought: {mySquad.length} Players</p>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-1 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider">Overseas Count</span>
              <Award className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-400 font-mono">
              {selectedTeam.overseas_count || 0} <span className="text-sm font-normal text-slate-500">/ 8</span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono">Max Limit: 8 Overseas Players</p>
          </div>
        </div>
      )}

      {/* LIVE AUCTION HAMMER STAGE & BIDDING CONTROLS */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <h2 className="text-xl font-bold text-slate-100 font-heading">Live Bidding Stage</h2>
          </div>

          {isHighestBidder && (
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold animate-pulse flex items-center gap-1.5">
              👑 YOU HOLD HIGHEST BID!
            </span>
          )}
        </div>

        {!liveAuction || liveAuction.status !== 'bidding' ? (
          <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30 space-y-3">
            <Clock className="w-12 h-12 mx-auto text-slate-600" />
            <h3 className="text-xl font-bold text-slate-300 font-heading">Waiting for Host to Bring Player</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              The auctioneer has not initiated the hammer for a player yet. Bidding controls will unlock automatically here in real time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            
            {/* Player Under Hammer Info */}
            <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-900/90 rounded-2xl p-6 border border-slate-800">
              <img
                src={liveAuction.player_image_url || getDefaultPlayerImage(liveAuction.player_role)}
                alt={liveAuction.player_name}
                className="w-32 h-32 rounded-xl object-cover border-2 border-emerald-500/40 bg-slate-950"
              />

              <div className="space-y-2 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                    {liveAuction.player_role}
                  </span>
                  <span className="px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-medium">
                    {liveAuction.player_nationality === 'Overseas' ? '✈️ Overseas' : '🇮🇳 Domestic'}
                  </span>
                </div>

                <h3 className="text-2xl font-extrabold text-slate-100 font-heading">
                  {liveAuction.player_name}
                </h3>

                <div className="text-xs font-mono text-slate-400">
                  Base Price: <span className="text-slate-200 font-bold">{formatCurrency(liveAuction.base_price)}</span>
                </div>

                <div className="pt-2 border-t border-slate-800 text-xs">
                  <span className="text-slate-400 block text-[10px]">CURRENT HIGHEST BID</span>
                  <span className="text-2xl font-extrabold gold-gradient-text font-mono">
                    {formatCurrency(liveAuction.current_bid)}
                  </span>
                  <span className="text-slate-400 text-[11px] block mt-0.5 font-medium">
                    Held by: <span className="text-emerald-400 font-bold">{liveAuction.highest_bidder_team_name || 'No Bids Yet'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* DYNAMIC BIDDING CONTROLS PANEL */}
            <div className="space-y-6 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
              <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                Place Live Bid (Realtime)
              </h4>

              {/* Dynamic Increment Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => handleQuickBid(20)}
                  disabled={submittingBid || isHighestBidder}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 transition-all font-bold group disabled:opacity-40 cursor-pointer"
                >
                  <span className="text-xs text-emerald-300">Quick Bid</span>
                  <span className="text-base font-mono font-extrabold text-emerald-400 group-hover:scale-105 transition-transform">
                    + ₹20 Lakhs
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                    = {formatCurrency((Number(liveAuction.current_bid) || 0) + 2000000)}
                  </span>
                </button>

                <button
                  onClick={() => handleQuickBid(50)}
                  disabled={submittingBid || isHighestBidder}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-400 transition-all font-bold group disabled:opacity-40 cursor-pointer"
                >
                  <span className="text-xs text-amber-300">Quick Bid</span>
                  <span className="text-base font-mono font-extrabold text-amber-400 group-hover:scale-105 transition-transform">
                    + ₹50 Lakhs
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                    = {formatCurrency((Number(liveAuction.current_bid) || 0) + 5000000)}
                  </span>
                </button>

                <button
                  onClick={() => handleQuickBid(100)}
                  disabled={submittingBid || isHighestBidder}
                  className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center p-3 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-400 transition-all font-bold group disabled:opacity-40 cursor-pointer"
                >
                  <span className="text-xs text-cyan-300">Power Bid</span>
                  <span className="text-base font-mono font-extrabold text-cyan-400 group-hover:scale-105 transition-transform">
                    + ₹1 Crore
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                    = {formatCurrency((Number(liveAuction.current_bid) || 0) + 10000000)}
                  </span>
                </button>
              </div>

              {/* Custom Bid Input Form */}
              <form onSubmit={handleCustomBidSubmit} className="space-y-2 pt-4 border-t border-slate-800">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Custom Bid Amount (in ₹ Lakhs)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-bold">₹</span>
                    <input
                      type="number"
                      step="5"
                      placeholder="e.g. 250 (for ₹2.5 Cr)"
                      value={customBidLakhs}
                      onChange={(e) => setCustomBidLakhs(e.target.value)}
                      className="w-full pl-7 pr-12 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 font-mono"
                    />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 text-xs">Lakhs</span>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingBid || isHighestBidder}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all disabled:opacity-40 shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    Custom Bid
                  </button>
                </div>
              </form>

            </div>

          </div>
        )}
      </div>

      {/* MY SQUAD ROSTER (CATEGORIZED BY ROLE) */}
      {selectedTeam && (
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-emerald-500/30 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100 font-heading">
                  My Squad Roster - {selectedTeam.name} ({mySquad.length} Players Bought)
                </h2>
                <p className="text-xs text-slate-400">Live synchronized roster categorized by playing role & final price paid</p>
              </div>
            </div>

            {/* Role Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto scrollbar-none">
              {[
                { id: 'all', label: `All (${mySquad.length})` },
                { id: 'Batter', label: `Batters (${batters.length})` },
                { id: 'Bowler', label: `Bowlers (${bowlers.length})` },
                { id: 'All-Rounder', label: `All-Rounders (${allRounders.length})` },
                { id: 'Wicket Keeper', label: `Keepers (${keepers.length})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveRoleTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
                    activeRoleTab === tab.id
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {loadingSquad ? (
            <div className="text-center py-10 text-slate-500 text-xs animate-pulse">Loading squad roster...</div>
          ) : mySquad.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30 space-y-2">
              <Trophy className="w-10 h-10 mx-auto text-slate-600" />
              <h4 className="text-base font-bold text-slate-300">No Players Purchased Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Win live player bidding under the hammer to build your franchise squad roster!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {mySquad
                .filter(p => activeRoleTab === 'all' || p.role === activeRoleTab)
                .map((p) => (
                  <div key={p.id} className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 hover:border-emerald-500/40 space-y-3 transition-all relative group">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image_url || getDefaultPlayerImage(p.role)}
                        alt={p.name}
                        className="w-12 h-12 rounded-xl object-cover bg-slate-950 border border-slate-800"
                      />
                      <div>
                        <h4 className="font-bold text-slate-100 text-sm truncate">{p.name}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-semibold">
                            {p.role}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {p.nationality === 'Overseas' ? '✈️ Overseas' : '🇮🇳 Domestic'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-500 text-[10px]">Winning Bid Paid</span>
                      <span className="font-extrabold emerald-gradient-text text-sm">{formatCurrency(p.sold_price)}</span>
                    </div>
                  </div>
                ))}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
