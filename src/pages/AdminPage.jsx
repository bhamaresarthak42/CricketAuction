import React, { useState, useEffect } from 'react';
import { db, rtdb, storage } from '../firebase';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  updateDoc,
  setDoc,
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { ref as rtdbRef, set } from 'firebase/database';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { formatCurrency, getDefaultPlayerImage, getDefaultTeamLogo } from '../utils/formatters';
import { PRESET_TEAMS, PRESET_PLAYERS } from '../utils/presetData';
import { fetchLiveCricketPlayers } from '../utils/cricketApi';
import { 
  ShieldPlus, 
  UserPlus, 
  Trash2, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Image as ImageIcon,
  DollarSign,
  Users,
  Award,
  Layers,
  Search,
  Filter,
  Globe,
  Download,
  Calendar,
  Clock,
  BarChart2,
  TrendingUp,
  PieChart,
  Trophy
} from 'lucide-react';

export default function AdminPage() {
  // Real-time Collections State
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingPlayers, setLoadingPlayers] = useState(true);

  // Status Alerts
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Team Form State
  const [teamForm, setTeamForm] = useState({
    name: '',
    budgetCrores: '100',
    maxSquadSize: '25',
    logoUrl: '',
    logoFile: null
  });
  const [submittingTeam, setSubmittingTeam] = useState(false);

  // Player Form State
  const [playerForm, setPlayerForm] = useState({
    name: '',
    role: 'Batter',
    nationality: 'Domestic',
    basePriceLakhs: '200',
    imageUrl: '',
    imageFile: null
  });
  const [submittingPlayer, setSubmittingPlayer] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // API Importer State
  const [cricApiKey, setCricApiKey] = useState('');
  const [fetchingApi, setFetchingApi] = useState(false);
  const [playerFilterStatus, setPlayerFilterStatus] = useState('all');

  // Event Schedule & Title State
  const [eventConfig, setEventConfig] = useState({
    title: 'Premier Cricket Auction 2026',
    startTime: '',
    endTime: '',
    status: 'live'
  });
  const [savingConfig, setSavingConfig] = useState(false);

  // Trigger Toast Notification
  const showNotification = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  // Real-time Firestore Listeners
  useEffect(() => {
    // Event Config Listener
    const unsubConfig = onSnapshot(
      doc(db, 'auction_event', 'config'),
      (snap) => {
        if (snap.exists()) {
          setEventConfig(snap.data());
        }
      },
      (err) => console.warn("Event config snapshot error:", err)
    );
    // Teams Listener
    const qTeams = query(collection(db, 'teams'), orderBy('name', 'asc'));
    const unsubTeams = onSnapshot(
      qTeams, 
      (snapshot) => {
        const teamList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTeams(teamList);
        setLoadingTeams(false);
      },
      (error) => {
        console.error("Firestore Teams error:", error);
        setLoadingTeams(false);
      }
    );

    // Players Listener
    const qPlayers = query(collection(db, 'players'), orderBy('name', 'asc'));
    const unsubPlayers = onSnapshot(
      qPlayers,
      (snapshot) => {
        const playerList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPlayers(playerList);
        setLoadingPlayers(false);
      },
      (error) => {
        console.error("Firestore Players error:", error);
        setLoadingPlayers(false);
      }
    );

    return () => {
      unsubTeams();
      unsubPlayers();
    };
  }, []);

  // Handle Image Upload Helper
  const uploadImageToStorage = async (file, folder) => {
    if (!file) return null;
    const fileRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  };

  // Handle Team Submission
  const handleAddTeam = async (e) => {
    e.preventDefault();
    if (!teamForm.name.trim()) {
      showNotification('Please enter a team name', 'error');
      return;
    }

    setSubmittingTeam(true);
    try {
      let finalLogoUrl = teamForm.logoUrl.trim();

      if (teamForm.logoFile) {
        finalLogoUrl = await uploadImageToStorage(teamForm.logoFile, 'team_logos');
      }

      if (!finalLogoUrl) {
        finalLogoUrl = getDefaultTeamLogo(teamForm.name);
      }

      const totalBudget = Number(teamForm.budgetCrores) * 10000000;

      await addDoc(collection(db, 'teams'), {
        name: teamForm.name.trim(),
        total_budget: totalBudget,
        current_purse: totalBudget,
        squad_count: 0,
        overseas_count: 0,
        max_squad_size: Number(teamForm.maxSquadSize) || 25,
        logo_url: finalLogoUrl,
        createdAt: serverTimestamp()
      });

      showNotification(`Franchise Team "${teamForm.name}" added successfully!`);
      setTeamForm({ name: '', budgetCrores: '100', maxSquadSize: '25', logoUrl: '', logoFile: null });
    } catch (error) {
      console.error('Error adding team:', error);
      showNotification(`Failed to save team: ${error.message}`, 'error');
    } finally {
      setSubmittingTeam(false);
    }
  };

  // Handle Player Submission
  const handleAddPlayer = async (e) => {
    e.preventDefault();
    if (!playerForm.name.trim()) {
      showNotification('Please enter player name', 'error');
      return;
    }

    setSubmittingPlayer(true);
    try {
      let finalImageUrl = playerForm.imageUrl.trim();

      if (playerForm.imageFile) {
        finalImageUrl = await uploadImageToStorage(playerForm.imageFile, 'player_images');
      }

      if (!finalImageUrl) {
        finalImageUrl = getDefaultPlayerImage(playerForm.role);
      }

      const basePriceINR = Number(playerForm.basePriceLakhs) * 100000;

      await addDoc(collection(db, 'players'), {
        name: playerForm.name.trim(),
        role: playerForm.role,
        nationality: playerForm.nationality,
        base_price: basePriceINR,
        status: 'upcoming',
        sold_to_team_id: null,
        sold_price: null,
        image_url: finalImageUrl,
        createdAt: serverTimestamp()
      });

      showNotification(`Player "${playerForm.name}" added to auction pool!`);
      setPlayerForm({
        name: '',
        role: 'Batter',
        nationality: 'Domestic',
 basePriceLakhs: '200',
        imageUrl: '',
        imageFile: null
      });
    } catch (error) {
      console.error('Error adding player:', error);
      showNotification(`Failed to save player: ${error.message}`, 'error');
    } finally {
      setSubmittingPlayer(false);
    }
  };

  // Quick Auto-Seed Function
  const handleAutoSeed = async () => {
    setSeeding(true);
    try {
      let teamCount = 0;
      let playerCount = 0;

      for (const t of PRESET_TEAMS) {
        await addDoc(collection(db, 'teams'), {
          ...t,
          createdAt: serverTimestamp()
        });
        teamCount++;
      }

      for (const p of PRESET_PLAYERS) {
        await addDoc(collection(db, 'players'), {
          ...p,
          createdAt: serverTimestamp()
        });
        playerCount++;
      }

      showNotification(`Seeded ${teamCount} IPL Teams & ${playerCount} Star Players successfully!`);
    } catch (error) {
      console.error('Seeding error:', error);
      showNotification(`Seeding failed: ${error.message}`, 'error');
    } finally {
      setSeeding(false);
    }
  };

  // Live Cricket API Fetch & Import
  const handleImportLiveApi = async () => {
    setFetchingApi(true);
    try {
      const apiPlayers = await fetchLiveCricketPlayers(cricApiKey);
      let count = 0;

      for (const p of apiPlayers) {
        await addDoc(collection(db, 'players'), {
          ...p,
          createdAt: serverTimestamp()
        });
        count++;
      }

      showNotification(`Fetched & imported ${count} live cricket players into Firestore!`);
    } catch (error) {
      console.error("API import error:", error);
      showNotification(`Failed to import live players: ${error.message}`, 'error');
    } finally {
      setFetchingApi(false);
    }
  };

  // 1-Click Reset Season for New Auction Event
  const [resetting, setResetting] = useState(false);
  const handleResetSeason = async () => {
    if (!window.confirm("Are you sure you want to reset the season for a NEW auction event? This will restore all team purses, reset squad counts to 0, move all sold players back to upcoming, and clear the live stage.")) return;

    setResetting(true);
    try {
      // 1. Reset team budgets & rosters
      for (const t of teams) {
        await updateDoc(doc(db, 'teams', t.id), {
          current_purse: t.total_budget || 1000000000,
          squad_count: 0,
          overseas_count: 0
        });
      }

      // 2. Reset player statuses to upcoming
      for (const p of players) {
        await updateDoc(doc(db, 'players', p.id), {
          status: 'upcoming',
          sold_to_team_id: null,
          sold_price: null
        });
      }

      // 3. Clear live stage
      await deleteDoc(doc(db, 'live_auction', 'current'));
      try {
        await set(rtdbRef(rtdb, 'live_auction'), null);
      } catch (err) {}

      showNotification("🔄 Season Reset Complete! Team purses restored and players reset to upcoming pool!", "success");
    } catch (error) {
      console.error("Reset error:", error);
      showNotification(`Failed to reset season: ${error.message}`, "error");
    } finally {
      setResetting(false);
    }
  };

  // Save Tournament Event Title & Schedule Config
  const handleSaveEventConfig = async (e) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      await setDoc(doc(db, 'auction_event', 'config'), {
        ...eventConfig,
        updatedAt: serverTimestamp()
      });
      showNotification("📅 Tournament Event Title & Schedule saved successfully!");
    } catch (error) {
      showNotification(`Failed to save event schedule: ${error.message}`, 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  // Delete Team Document
  const handleDeleteTeam = async (teamId, teamName) => {
    if (!window.confirm(`Are you sure you want to delete "${teamName}"?`)) return;
    try {
      await deleteDoc(doc(db, 'teams', teamId));
      showNotification(`Deleted team "${teamName}"`);
    } catch (error) {
      showNotification(`Failed to delete team: ${error.message}`, 'error');
    }
  };

  // Delete Player Document
  const handleDeletePlayer = async (playerId, playerName) => {
    if (!window.confirm(`Are you sure you want to delete "${playerName}"?`)) return;
    try {
      await deleteDoc(doc(db, 'players', playerId));
      showNotification(`Deleted player "${playerName}"`);
    } catch (error) {
      showNotification(`Failed to delete player: ${error.message}`, 'error');
    }
  };

  const filteredPlayers = players.filter(p => {
    if (playerFilterStatus === 'all') return true;
    return p.status === playerFilterStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Toast Alert */}
      {toast.show && (
        <div className={`fixed top-20 right-4 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border transition-all animate-bounce ${
          toast.type === 'error'
            ? 'bg-rose-950/90 text-rose-300 border-rose-500/50'
            : 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5 text-rose-400" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl glass-panel p-6 sm:p-8 border border-blue-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs uppercase tracking-wider mb-2">
              <Layers className="w-4 h-4" /> Data Entry Console
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 font-heading">
              Admin <span className="cyan-gradient-text">Data Setup</span>
            </h1>
            <p className="text-slate-400 mt-1 max-w-xl text-sm">
              Register franchise teams & auction players into Firestore with automatic Firebase Storage asset uploads and live preview lists.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleResetSeason}
              disabled={resetting}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-300 font-bold text-xs transition-all shadow-lg cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              {resetting ? 'Resetting Season...' : '🔄 Reset Season for New Auction'}
            </button>

            <button
              onClick={handleAutoSeed}
              disabled={seeding}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              {seeding ? 'Seeding Demo Data...' : '⚡ Quick Auto-Seed Demo Data'}
            </button>
          </div>
        </div>
      </div>

      {/* TOURNAMENT EVENT SCHEDULE & REBRANDING CARD */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-purple-500/30 space-y-4 shadow-xl">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100 font-heading">
              Tournament Event Settings & Schedule
            </h2>
            <p className="text-xs text-slate-400">Set custom event title (Universal League / Corporate / College) and start & end date/time</p>
          </div>
        </div>

        <form onSubmit={handleSaveEventConfig} className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Auction Tournament Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Corporate Premier League 2026 Mega Auction"
              value={eventConfig.title || ''}
              onChange={(e) => setEventConfig({ ...eventConfig, title: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-purple-400"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Start Date & Time
            </label>
            <input
              type="datetime-local"
              value={eventConfig.startTime || ''}
              onChange={(e) => setEventConfig({ ...eventConfig, startTime: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-purple-400 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              End Date & Time
            </label>
            <input
              type="datetime-local"
              value={eventConfig.endTime || ''}
              onChange={(e) => setEventConfig({ ...eventConfig, endTime: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-purple-400 font-mono"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={savingConfig}
              className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-slate-100 font-bold text-xs transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 cursor-pointer"
            >
              {savingConfig ? 'Saving Schedule...' : 'Save Event Schedule'}
            </button>
          </div>
        </form>
      </div>

      {/* LIVE CRICKET API IMPORTER CARD */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-cyan-500/30 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 font-heading">
                Import Live Players via Cricket API
              </h2>
              <p className="text-xs text-slate-400">Fetch real player lists from CricAPI / CricketData.org directly into Firestore</p>
            </div>
          </div>

          <button
            onClick={handleImportLiveApi}
            disabled={fetchingApi}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            {fetchingApi ? 'Fetching API Data...' : '🌐 Fetch & Import Live API Players'}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <input
            type="text"
            placeholder="Optional CricAPI Key (Leave empty to use free built-in live endpoint)"
            value={cricApiKey}
            onChange={(e) => setCricApiKey(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-400 font-mono"
          />
        </div>
      </div>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* SECTION 1: ADD TEAM FORM */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800/80">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <ShieldPlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 font-heading">Section 1: Add Team</h2>
              <p className="text-xs text-slate-400">Stores in Firestore <code className="text-blue-400 font-mono">teams</code> collection</p>
            </div>
          </div>

          <form onSubmit={handleAddTeam} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Franchise Team Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Chennai Super Kings"
                value={teamForm.name}
                onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Initial Budget (₹ Crores)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm font-bold">₹</span>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    placeholder="100"
                    value={teamForm.budgetCrores}
                    onChange={(e) => setTeamForm({ ...teamForm, budgetCrores: e.target.value })}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-100 text-sm focus:outline-none focus:border-blue-500 font-mono"
                    required
                  />
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 text-xs">Cr</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Max Squad Size
                </label>
                <input
                  type="number"
                  min="11"
                  max="30"
                  value={teamForm.maxSquadSize}
                  onChange={(e) => setTeamForm({ ...teamForm, maxSquadSize: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-100 text-sm focus:outline-none focus:border-blue-500 font-mono"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Team Logo (Upload File or Paste Image URL)
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative border border-dashed border-slate-700 hover:border-blue-500/50 rounded-xl p-3 text-center bg-slate-900/50 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setTeamForm({ ...teamForm, logoFile: e.target.files[0] })}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-5 h-5 mx-auto text-blue-400 mb-1" />
                  <span className="text-xs text-slate-300 font-medium truncate block">
                    {teamForm.logoFile ? teamForm.logoFile.name : 'Upload Logo File'}
                  </span>
                </div>

                <input
                  type="url"
                  placeholder="Or paste image URL"
                  value={teamForm.logoUrl}
                  onChange={(e) => setTeamForm({ ...teamForm, logoUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingTeam}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 mt-2 cursor-pointer"
            >
              <ShieldPlus className="w-4 h-4" />
              {submittingTeam ? 'Saving Team...' : 'Save Team to Firestore'}
            </button>
          </form>
        </div>

        {/* SECTION 2: ADD PLAYER FORM */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800/80">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 font-heading">Section 2: Add Player</h2>
              <p className="text-xs text-slate-400">Stores in Firestore <code className="text-amber-400 font-mono">players</code> collection</p>
            </div>
          </div>

          <form onSubmit={handleAddPlayer} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Player Full Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Virat Kohli"
                value={playerForm.name}
                onChange={(e) => setPlayerForm({ ...playerForm, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-100 text-sm focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Player Role
                </label>
                <select
                  value={playerForm.role}
                  onChange={(e) => setPlayerForm({ ...playerForm, role: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-100 text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="Batter">Batter</option>
                  <option value="Bowler">Bowler</option>
                  <option value="All-Rounder">All-Rounder</option>
                  <option value="Wicket Keeper">Wicket Keeper</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Nationality
                </label>
                <div className="flex items-center gap-3 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-200">
                    <input
                      type="radio"
                      name="nationality"
                      value="Domestic"
                      checked={playerForm.nationality === 'Domestic'}
                      onChange={(e) => setPlayerForm({ ...playerForm, nationality: e.target.value })}
                      className="text-amber-500 focus:ring-amber-500"
                    />
                    🇮🇳 Domestic
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-200">
                    <input
                      type="radio"
                      name="nationality"
                      value="Overseas"
                      checked={playerForm.nationality === 'Overseas'}
                      onChange={(e) => setPlayerForm({ ...playerForm, nationality: e.target.value })}
                      className="text-amber-500 focus:ring-amber-500"
                    />
                    ✈️ Overseas
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Base Price (in ₹ Lakhs, e.g. 200 = ₹2 Cr)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm font-bold">₹</span>
                <input
                  type="number"
                  step="10"
                  min="20"
                  placeholder="200"
                  value={playerForm.basePriceLakhs}
                  onChange={(e) => setPlayerForm({ ...playerForm, basePriceLakhs: e.target.value })}
                  className="w-full pl-8 pr-12 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-100 text-sm focus:outline-none focus:border-amber-500 font-mono"
                  required
                />
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 text-xs">Lakhs</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Player Photo (Upload File or Paste Image URL)
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative border border-dashed border-slate-700 hover:border-amber-500/50 rounded-xl p-3 text-center bg-slate-900/50 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPlayerForm({ ...playerForm, imageFile: e.target.files[0] })}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-5 h-5 mx-auto text-amber-400 mb-1" />
                  <span className="text-xs text-slate-300 font-medium truncate block">
                    {playerForm.imageFile ? playerForm.imageFile.name : 'Upload Photo File'}
                  </span>
                </div>

                <input
                  type="url"
                  placeholder="Or paste image URL"
                  value={playerForm.imageUrl}
                  onChange={(e) => setPlayerForm({ ...playerForm, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingPlayer}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 mt-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              {submittingPlayer ? 'Uploading & Saving...' : 'Save Player to Firestore'}
            </button>
          </form>
        </div>

      </div>

      {/* REAL-TIME FIRESTORE LISTS DISPLAY */}
      <div className="space-y-8 pt-6">
        
        {/* TEAMS LIST DISPLAY */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-100 font-heading">
                Registered Teams ({teams.length})
              </h2>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                Live Firestore
              </span>
            </div>
          </div>

          {loadingTeams ? (
            <div className="text-center py-8 text-slate-500 text-xs animate-pulse">Loading teams from Firestore...</div>
          ) : teams.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
              No teams registered yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {teams.map((t) => (
                <div key={t.id} className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 space-y-3 relative group">
                  <button
                    onClick={() => handleDeleteTeam(t.id, t.name)}
                    className="absolute top-3 right-3 text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Delete Team"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-3">
                    <img
                      src={t.logo_url || getDefaultTeamLogo(t.name)}
                      alt={t.name}
                      className="w-10 h-10 rounded-lg object-cover bg-slate-800 border border-slate-700"
                    />
                    <div className="pr-6">
                      <h4 className="font-bold text-slate-100 text-sm truncate">{t.name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">Squad Limit: {t.max_squad_size || 25}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Total Purse</span>
                      <span className="font-bold text-emerald-400">{formatCurrency(t.total_budget)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Squad Count</span>
                      <span className="font-bold text-blue-400">{t.squad_count || 0} / {t.max_squad_size || 25}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PLAYERS LIST DISPLAY */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-100 font-heading">
                Auction Player Pool ({players.length})
              </h2>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                Live Firestore
              </span>
            </div>

            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              {['all', 'upcoming', 'sold', 'unsold'].map((st) => (
                <button
                  key={st}
                  onClick={() => setPlayerFilterStatus(st)}
                  className={`px-3 py-1 rounded-lg font-medium capitalize transition-all cursor-pointer ${
                    playerFilterStatus === st
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {loadingPlayers ? (
            <div className="text-center py-8 text-slate-500 text-xs animate-pulse">Loading players from Firestore...</div>
          ) : filteredPlayers.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
              No players found in this category.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredPlayers.map((p) => (
                <div key={p.id} className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 space-y-3 relative group">
                  <button
                    onClick={() => handleDeletePlayer(p.id, p.name)}
                    className="absolute top-3 right-3 text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-colors z-10 cursor-pointer"
                    title="Delete Player"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-3">
                    <img
                      src={p.image_url || getDefaultPlayerImage(p.role)}
                      alt={p.name}
                      className="w-12 h-12 rounded-xl object-cover bg-slate-800 border border-slate-700"
                    />
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm truncate">{p.name}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 font-medium">
                          {p.role}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {p.nationality === 'Overseas' ? '✈️ Overseas' : '🇮🇳 Domestic'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Base Price</span>
                      <span className="font-bold text-amber-400">{formatCurrency(p.base_price)}</span>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                      p.status === 'sold'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : p.status === 'unsold'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    }`}>
                      {p.status || 'upcoming'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
