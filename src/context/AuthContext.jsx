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
    return () => unsubscribe();
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
      {!loading && children}
    </AuthContext.Provider>
  );
}
