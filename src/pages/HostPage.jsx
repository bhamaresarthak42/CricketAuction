import React, { useState, useEffect } from 'react';
import { db, rtdb } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  setDoc,
  deleteDoc,
  runTransaction,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, set, onValue } from 'firebase/database';
import { formatCurrency, getDefaultPlayerImage, getDefaultTeamLogo } from '../utils/formatters';
import { 
  Gavel, 
  Radio, 
  PlayCircle, 
  CheckCircle, 
  XCircle, 
  Zap, 
  Shield, 
  Users, 
  DollarSign, 
  Award, 
  AlertCircle,
  RefreshCw,
  Flame,
  ChevronRight,
  TrendingUp,
  RotateCcw,
  Sparkles,
  Trophy,
  PieChart,
  Activity
} from 'lucide-react';

export default function HostPage() {
  // Teams List from Firestore for Dashboard
  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(true);

  // Upcoming players queue from Firestore ('status' == 'upcoming')
  const [upcomingPlayers, setUpcomingPlayers] = useState([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);

  // Unsold players queue from Firestore ('status' == 'unsold')
  const [unsoldPlayers, setUnsoldPlayers] = useState([]);
  const [loadingUnsold, setLoadingUnsold] = useState(true);

  // Live Auction State from Realtime Database (RTDB)
  const [liveAuction, setLiveAuction] = useState(null);
  const [loadingLive, setLoadingLive] = useState(true);

  // Processing states
  const [processingSell, setProcessingSell] = useState(false);
  const [processingUnsold, setProcessingUnsold] = useState(false);

  // Action status toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 4000);
  };

  // 1. Subscribe to Firestore Collections: Teams, Upcoming Players, Unsold Players
  useEffect(() => {
    // Subscribe Teams for Live Dashboard
    const unsubTeams = onSnapshot(
      collection(db, 'teams'),
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTeams(list);
        setLoadingTeams(false);
      },
      (error) => {
        console.error("Firestore Teams error:", error);
        setLoadingTeams(false);
      }
    );

    // Subscribe Upcoming Players
    const qUpcoming = query(collection(db, 'players'), where('status', '==', 'upcoming'));
    const unsubUpcoming = onSnapshot(
      qUpcoming,
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUpcomingPlayers(list);
        setLoadingUpcoming(false);
      },
      (error) => {
        console.error("Firestore upcoming players error:", error);
        setLoadingUpcoming(false);
      }
    );

    // Subscribe Unsold Players
    const qUnsold = query(collection(db, 'players'), where('status', '==', 'unsold'));
    const unsubUnsold = onSnapshot(
      qUnsold,
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUnsoldPlayers(list);
        setLoadingUnsold(false);
      },
      (error) => {
        console.error("Firestore unsold players error:", error);
        setLoadingUnsold(false);
      }
    );

    return () => {
      unsubTeams();
      unsubUpcoming();
      unsubUnsold();
    };
  }, []);

  // 2. Dual Real-Time Listener for Firestore `live_auction/current` & RTDB `live_auction`
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

    // 2a. Firestore Listener (Primary Sync)
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

    // 2b. RTDB Listener (Secondary Sync)
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

  // 3. Action: Bring Next Player to Hammer
  const handleBringNextPlayer = async (targetPlayer = null) => {
    const playerToHammer = targetPlayer || (upcomingPlayers.length > 0 ? upcomingPlayers[0] : null);

    if (!playerToHammer) {
      showToast("No upcoming players available in the auction pool!", "warning");
      return;
    }

    try {
      const liveData = {
        player_id: playerToHammer.id,
        player_name: playerToHammer.name,
        player_role: playerToHammer.role || 'Batter',
        player_nationality: playerToHammer.nationality || 'Domestic',
        player_image_url: playerToHammer.image_url || getDefaultPlayerImage(playerToHammer.role),
        base_price: playerToHammer.base_price,
        current_bid: playerToHammer.base_price,
        highest_bidder_team_id: null,
        highest_bidder_team_name: null,
        status: 'bidding',
        timestamp: Date.now()
      };

      // Dual Sync Update to Firestore (Primary) & RTDB
      await setDoc(doc(db, 'live_auction', 'current'), liveData);
      try {
        await set(ref(rtdb, 'live_auction'), liveData);
      } catch (rtdbErr) {
        console.warn("RTDB set warning:", rtdbErr);
      }

      showToast(`🔨 Brought "${playerToHammer.name}" to the hammer!`, "success");
    } catch (error) {
      console.error("Error setting live_auction:", error);
      showToast(`Failed to update live auction: ${error.message}`, "error");
    }
  };

  // 4. ATOMIC TRANSACTION: SELL PLAYER & DEDUCT PURSE
  const handleSellPlayer = async () => {
    if (!liveAuction || liveAuction.status !== 'bidding') {
      showToast("No active player under the hammer!", "warning");
      return;
    }

    if (!liveAuction.highest_bidder_team_id) {
      showToast("Cannot sell: No team has placed a bid yet! Mark as Unsold instead.", "warning");
      return;
    }

    setProcessingSell(true);
    try {
      const playerId = liveAuction.player_id;
      const winningTeamId = liveAuction.highest_bidder_team_id;
      const winningTeamName = liveAuction.highest_bidder_team_name;
      const finalPrice = Number(liveAuction.current_bid);
      const isOverseas = liveAuction.player_nationality === 'Overseas';

      // Atomic Firestore Transaction: Update player and team docs together safely
      await runTransaction(db, async (transaction) => {
        const playerRef = doc(db, 'players', playerId);
        const teamRef = doc(db, 'teams', winningTeamId);

        const teamSnap = await transaction.get(teamRef);
        if (!teamSnap.exists()) {
          throw new Error("Winning team record was not found in Firestore!");
        }

        const teamData = teamSnap.data();
        const currentPurse = Number(teamData.current_purse) || 0;
        const newPurse = Math.max(0, currentPurse - finalPrice);
        const newSquadCount = (Number(teamData.squad_count) || 0) + 1;
        const newOverseasCount = isOverseas 
          ? (Number(teamData.overseas_count) || 0) + 1 
          : (Number(teamData.overseas_count) || 0);

        // Update player status
        transaction.update(playerRef, {
          status: 'sold',
          sold_to_team_id: winningTeamId,
          sold_price: finalPrice,
          soldAt: serverTimestamp()
        });

        // Update winning team purse and rosters
        transaction.update(teamRef, {
          current_purse: newPurse,
          squad_count: newSquadCount,
          overseas_count: newOverseasCount
        });
      });

      // Clear Firestore & RTDB live_auction nodes
      await deleteDoc(doc(db, 'live_auction', 'current'));
      try {
        await set(ref(rtdb, 'live_auction'), null);
      } catch (rtdbErr) {
        console.warn("RTDB clear warning:", rtdbErr);
      }

      showToast(`🎉 SOLD! ${liveAuction.player_name} to ${winningTeamName} for ${formatCurrency(finalPrice)}!`, "success");
    } catch (error) {
      console.error("Error finalizing atomic sale transaction:", error);
      showToast(`Failed to finalize sale: ${error.message}`, "error");
    } finally {
      setProcessingSell(false);
    }
  };

  // 5. MARK UNSOLD TRANSACTION
  const handleMarkUnsold = async () => {
    if (!liveAuction || liveAuction.status !== 'bidding') {
      showToast("No active player under the hammer!", "warning");
      return;
    }

    setProcessingUnsold(true);
    try {
      const playerId = liveAuction.player_id;

      // Update Player Document in Firestore
      const playerRef = doc(db, 'players', playerId);
      await updateDoc(playerRef, {
        status: 'unsold',
        sold_to_team_id: null,
        sold_price: null
      });

      // Clear Firestore & RTDB live_auction nodes
      await deleteDoc(doc(db, 'live_auction', 'current'));
      try {
        await set(ref(rtdb, 'live_auction'), null);
      } catch (rtdbErr) {
        console.warn("RTDB clear warning:", rtdbErr);
      }

      showToast(`❌ ${liveAuction.player_name} marked as UNSOLD and moved to Unsold Queue!`, "warning");
    } catch (error) {
      console.error("Error marking unsold:", error);
      showToast(`Failed to mark unsold: ${error.message}`, "error");
    } finally {
      setProcessingUnsold(false);
    }
  };

  // 6. RECALL UNSOLD PLAYER BACK TO AUCTION
  const handleRecallPlayer = async (player) => {
    try {
      const playerRef = doc(db, 'players', player.id);
      await updateDoc(playerRef, {
        status: 'upcoming',
        sold_to_team_id: null,
        sold_price: null
      });

      showToast(`🔄 "${player.name}" recalled back to auction pool!`, "success");
    } catch (error) {
      console.error("Error recalling player:", error);
      showToast(`Failed to recall player: ${error.message}`, "error");
    }
  };

  // 7. Action: Clear Live Stage
  const handleClearStage = async () => {
    try {
      await deleteDoc(doc(db, 'live_auction', 'current'));
      try {
        await set(ref(rtdb, 'live_auction'), null);
      } catch (rtdbErr) {
        console.warn("RTDB clear warning:", rtdbErr);
      }
      setLiveAuction(null);
      showToast("Live stage cleared", "info");
    } catch (error) {
      showToast(`Failed to clear stage: ${error.message}`, "error");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Toast Alert */}
      {toast.show && (
        <div className={`fixed top-20 right-4 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border transition-all animate-bounce ${
          toast.type === 'error' ? 'bg-rose-950/95 text-rose-300 border-rose-500/50' :
          toast.type === 'success' ? 'bg-emerald-950/95 text-emerald-300 border-emerald-500/50' :
          'bg-amber-950/95 text-amber-300 border-amber-500/50'
        }`}>
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Broadcast Live Ticker Banner */}
      <div className="overflow-hidden rounded-xl bg-slate-900 border border-amber-500/30 py-2.5 px-4 shadow-lg flex items-center gap-3 text-xs font-mono">
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500 text-slate-950 font-bold shrink-0 uppercase tracking-wider text-[10px]">
          <Activity className="w-3.5 h-3.5" /> LIVE TICKER
        </span>
        <div className="text-slate-300 flex items-center gap-6 overflow-x-auto whitespace-nowrap scrollbar-none">
          <span>Registered Franchises: <strong className="text-amber-400">{teams.length}</strong></span>
          <span>•</span>
          <span>Upcoming Pool: <strong className="text-blue-400">{upcomingPlayers.length} Players</strong></span>
          <span>•</span>
          <span>Unsold Queue: <strong className="text-rose-400">{unsoldPlayers.length} Players</strong></span>
          <span>•</span>
          <span>Current Hammer: <strong className="text-emerald-400">{liveAuction ? liveAuction.player_name : 'Stage Empty'}</strong></span>
        </div>
      </div>

      {/* Host Controller Header */}
      <div className="relative overflow-hidden rounded-2xl glass-panel p-6 sm:p-8 border border-amber-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider mb-2">
              <Gavel className="w-4 h-4" /> Live Auctioneer Controller
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 font-heading">
              Host <span className="gold-gradient-text">Auction Desk</span>
            </h1>
            <p className="text-slate-400 mt-1 max-w-xl text-sm">
              Control the hammer stage, finalize deals with atomic database syncing, and monitor live franchise team budgets & squad counts in real time.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3.5 py-2 rounded-xl bg-amber-950/80 border border-amber-800/50 text-amber-300 text-xs font-semibold flex items-center gap-2 shadow-lg shadow-amber-500/10">
              <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
              RTDB Live Room Active
            </span>

            <button
              onClick={() => handleBringNextPlayer()}
              disabled={upcomingPlayers.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
            >
              <Gavel className="w-4 h-4" />
              Bring Next Player to Hammer
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Live Stage (Left 2 cols) & Queues (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT 2 COLS: THE LIVE HAMMER STAGE */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-amber-500/30 relative overflow-hidden space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                <h2 className="text-lg font-bold text-slate-100 font-heading uppercase tracking-wider">
                  Live Hammer Stage
                </h2>
              </div>

              {liveAuction && (
                <button
                  onClick={handleClearStage}
                  className="text-xs text-slate-500 hover:text-slate-300 underline font-mono cursor-pointer"
                >
                  Clear Stage
                </button>
              )}
            </div>

            {/* LIVE PLAYER DISPLAY */}
            {!liveAuction || liveAuction.status === 'waiting' ? (
              <div className="text-center py-16 space-y-4 border border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
                <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Gavel className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-200 font-heading">No Active Player on Hammer</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Click "Bring Next Player to Hammer" or select a player from the queue on the right to start bidding.
                  </p>
                </div>
                <button
                  onClick={() => handleBringNextPlayer()}
                  disabled={upcomingPlayers.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  <PlayCircle className="w-4 h-4" />
                  Start Next Bidding
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Active Player Card Header */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 bg-slate-900/90 rounded-2xl p-6 border border-slate-800 relative">
                  
                  {/* Player Image */}
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-yellow-400 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                    <img
                      src={liveAuction.player_image_url || getDefaultPlayerImage(liveAuction.player_role)}
                      alt={liveAuction.player_name}
                      className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-xl object-cover border-2 border-amber-500/40 bg-slate-950 shadow-2xl"
                    />
                  </div>

                  {/* Player Details */}
                  <div className="flex-1 space-y-3 text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
                        {liveAuction.player_role}
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium">
                        {liveAuction.player_nationality === 'Overseas' ? '✈️ Overseas' : '🇮🇳 Domestic'}
                      </span>
                    </div>

                    <h3 className="text-3xl font-extrabold text-slate-100 font-heading">
                      {liveAuction.player_name}
                    </h3>

                    <div className="flex items-center justify-center sm:justify-start gap-4 text-xs font-mono text-slate-400 pt-1">
                      <div>Base Price: <span className="text-slate-200 font-bold">{formatCurrency(liveAuction.base_price)}</span></div>
                      <div>•</div>
                      <div>Status: <span className="text-emerald-400 font-bold uppercase">LIVE BIDDING</span></div>
                    </div>
                  </div>
                </div>

                {/* REALTIME CURRENT HIGHEST BID DISPLAY BOX */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-900/90 rounded-2xl p-5 border border-amber-500/30 text-center space-y-1 relative">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                      Current Highest Bid
                    </span>
                    <div className="text-3xl sm:text-4xl font-extrabold gold-gradient-text font-mono">
                      {formatCurrency(liveAuction.current_bid)}
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono">Realtime RTDB Synchronized</p>
                  </div>

                  <div className="bg-slate-900/90 rounded-2xl p-5 border border-emerald-500/30 text-center flex flex-col items-center justify-center space-y-1">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                      Highest Bidder Team
                    </span>
                    {liveAuction.highest_bidder_team_name ? (
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-emerald-400" />
                        <span className="text-xl font-bold text-emerald-400 font-heading">
                          {liveAuction.highest_bidder_team_name}
                        </span>
                      </div>
                    ) : (
                      <div className="text-sm font-semibold text-slate-400 italic flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-amber-400 animate-pulse" />
                        Waiting for Opening Bid...
                      </div>
                    )}
                  </div>
                </div>

                {/* HOST CONTROL ACTION BUTTONS */}
                <div className="pt-4 border-t border-slate-800/80 space-y-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Host Control Actions (Atomic Transaction Sync)
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={handleSellPlayer}
                      disabled={processingSell || !liveAuction.highest_bidder_team_id}
                      className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-40 cursor-pointer"
                    >
                      <CheckCircle className="w-5 h-5" />
                      {processingSell ? 'Processing Atomic Sale...' : `Sell Player (${formatCurrency(liveAuction.current_bid)})`}
                    </button>

                    <button
                      onClick={handleMarkUnsold}
                      disabled={processingUnsold}
                      className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-slate-100 font-bold text-sm transition-all shadow-lg shadow-rose-500/20 disabled:opacity-40 cursor-pointer"
                    >
                      <XCircle className="w-5 h-5" />
                      {processingUnsold ? 'Updating...' : 'Mark Unsold'}
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>

        {/* RIGHT 1 COL: UPCOMING QUEUE & UNSOLD RECALL QUEUE */}
        <div className="space-y-6">
          
          {/* UPCOMING PLAYERS QUEUE */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-slate-100 text-base font-heading">
                  Upcoming Queue ({upcomingPlayers.length})
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Firestore</span>
            </div>

            {loadingUpcoming ? (
              <div className="text-center py-6 text-slate-500 text-xs animate-pulse">Loading upcoming pool...</div>
            ) : upcomingPlayers.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                No upcoming players in pool.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                {upcomingPlayers.map((p, idx) => (
                  <div
                    key={p.id}
                    onClick={() => handleBringNextPlayer(p)}
                    className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 flex items-center justify-between cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-slate-500 group-hover:text-amber-400 w-4">
                        #{idx + 1}
                      </span>
                      <img
                        src={p.image_url || getDefaultPlayerImage(p.role)}
                        alt={p.name}
                        className="w-9 h-9 rounded-lg object-cover bg-slate-950 border border-slate-800"
                      />
                      <div>
                        <h4 className="font-bold text-slate-200 text-xs group-hover:text-slate-100">{p.name}</h4>
                        <span className="text-[10px] text-slate-400">{p.role} • {formatCurrency(p.base_price)}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-colors" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* UNSOLD RECALL QUEUE */}
          <div className="glass-panel rounded-2xl p-6 border border-rose-500/20 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-rose-400" />
                <h3 className="font-bold text-slate-100 text-base font-heading">
                  Unsold Queue ({unsoldPlayers.length})
                </h3>
              </div>
              <span className="text-[10px] text-rose-400 font-mono font-semibold">Recall Ready</span>
            </div>

            {loadingUnsold ? (
              <div className="text-center py-6 text-slate-500 text-xs animate-pulse">Loading unsold pool...</div>
            ) : unsoldPlayers.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                No unsold players currently in queue.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                {unsoldPlayers.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-slate-900/90 border border-rose-500/20 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image_url || getDefaultPlayerImage(p.role)}
                        alt={p.name}
                        className="w-9 h-9 rounded-lg object-cover bg-slate-950 border border-slate-800"
                      />
                      <div>
                        <h4 className="font-bold text-slate-200 text-xs">{p.name}</h4>
                        <span className="text-[10px] text-slate-400">{p.role} • {formatCurrency(p.base_price)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRecallPlayer(p)}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Recall
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* STEP 6 DASHBOARD: FRANCHISE TEAMS REAL-TIME DASHBOARD */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <PieChart className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 font-heading">
                Franchise Teams Live Standings & Budget Dashboard
              </h2>
              <p className="text-xs text-slate-400">Real-time purse utilization, squad filling rate, and overseas quota metrics</p>
            </div>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 font-mono flex items-center gap-1.5 self-start sm:self-auto">
            <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
            Live Firestore Sync
          </span>
        </div>

        {loadingTeams ? (
          <div className="text-center py-10 text-slate-500 text-xs animate-pulse">Loading team standings...</div>
        ) : teams.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
            No teams registered in the tournament yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {teams.map((t) => {
              const totalBudget = Number(t.total_budget) || 1;
              const currentPurse = Number(t.current_purse) || 0;
              const spentAmount = totalBudget - currentPurse;
              const spentPercentage = Math.min(100, Math.max(0, (spentAmount / totalBudget) * 100));

              return (
                <div key={t.id} className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 space-y-4 relative group hover:border-amber-500/40 transition-all">
                  
                  {/* Header: Logo & Name */}
                  <div className="flex items-center gap-3">
                    <img
                      src={t.logo_url || getDefaultTeamLogo(t.name)}
                      alt={t.name}
                      className="w-12 h-12 rounded-xl object-cover bg-slate-950 border border-slate-800 shadow-md"
                    />
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm leading-tight">{t.name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                        Budget: {formatCurrency(t.total_budget)}
                      </span>
                    </div>
                  </div>

                  {/* Purse Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400 text-[11px]">Remaining Purse</span>
                      <span className="font-extrabold text-emerald-400">{formatCurrency(t.current_purse)}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                        style={{ width: `${100 - spentPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Roster Metrics */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Squad Size</span>
                      <span className="font-bold text-blue-400">{t.squad_count || 0} / {t.max_squad_size || 25}</span>
                    </div>

                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Overseas</span>
                      <span className="font-bold text-purple-400">{t.overseas_count || 0} / 8</span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
