import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, signInAnonymously, onAuthStateChanged, signOut as firebaseSignOut } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Read role and team selection from sessionStorage (tab-specific isolation)
  const [userRole, setUserRole] = useState(() => sessionStorage.getItem('ca_user_role') || null);
  const [userTeamId, setUserTeamId] = useState(() => sessionStorage.getItem('ca_user_team_id') || '');
  const [userTeamName, setUserTeamName] = useState(() => sessionStorage.getItem('ca_user_team_name') || '');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    // Fallback safety timer: ensure loading never hangs indefinitely
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  // Perform Login with Role & PIN Validation
  const login = async ({ role, pin = '', teamId = '', teamName = '' }) => {
    // Role PIN Validations
    if (role === 'admin' && pin !== '1234') {
      throw new Error("Invalid Admin Security PIN! Default PIN is 1234.");
    }
    if (role === 'host' && pin !== '5678') {
      throw new Error("Invalid Host Security PIN! Default PIN is 5678.");
    }
    if (role === 'owner' && !teamId) {
      throw new Error("Please select your Franchise Team to log in as Team Owner!");
    }

    // Ensure Firebase Anonymous Authentication (fallback gracefully if not enabled in Firebase console)
    if (!auth.currentUser) {
      try {
        await signInAnonymously(auth);
      } catch (authErr) {
        console.warn("Firebase Anonymous Auth warning (proceeding with PIN session):", authErr);
      }
    }

    // Persist in Tab Session Storage
    sessionStorage.setItem('ca_user_role', role);
    if (teamId) sessionStorage.setItem('ca_user_team_id', teamId);
    if (teamName) sessionStorage.setItem('ca_user_team_name', teamName);

    setUserRole(role);
    setUserTeamId(teamId);
    setUserTeamName(teamName);
  };

  // Perform Logout
  const logout = async () => {
    try {
      sessionStorage.removeItem('ca_user_role');
      sessionStorage.removeItem('ca_user_team_id');
      sessionStorage.removeItem('ca_user_team_name');
      setUserRole(null);
      setUserTeamId('');
      setUserTeamName('');
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const value = {
    currentUser,
    userRole,
    userTeamId,
    userTeamName,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4 font-sans text-slate-400">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 animate-bounce shadow-lg shadow-amber-500/10">
            <span className="font-bold text-xl font-heading">C</span>
          </div>
          <div className="text-xs font-mono font-semibold tracking-wider uppercase text-amber-400 animate-pulse">
            Verifying CricAuction Security Session...
          </div>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}

