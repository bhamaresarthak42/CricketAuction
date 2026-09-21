import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Trophy, 
  Database, 
  Gavel, 
  Users, 
  Radio, 
  LogOut, 
  Menu, 
  X, 
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export default function Navbar() {
  const { userRole, userTeamName, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo / Brand Header */}
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 p-0.5 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Trophy className="w-5 h-5 text-amber-400 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-lg sm:text-xl tracking-wider text-slate-100 uppercase">
                  Auction<span className="gold-gradient-text">Master</span>
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  IPL LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium tracking-tight hidden sm:block">Real-Time Cricket Auction Hub</p>
            </div>
          </NavLink>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-2">
            
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-lg shadow-blue-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`
              }
            >
              <Database className="w-4 h-4" />
              <span>Admin</span>
            </NavLink>

            <NavLink
              to="/host"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-amber-600/20 text-amber-400 border border-amber-500/40 shadow-lg shadow-amber-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`
              }
            >
              <Gavel className="w-4 h-4" />
              <span>Host</span>
            </NavLink>

            <NavLink
              to="/owner"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`
              }
            >
              <Users className="w-4 h-4" />
              <span>Owner</span>
            </NavLink>

          </nav>

          {/* User Session & Logout Controls */}
          <div className="hidden md:flex items-center gap-3">
            {userRole ? (
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono font-bold flex items-center gap-1.5 text-slate-300">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="uppercase text-emerald-400">{userRole}</span>
                  {userTeamName && <span className="text-slate-400 font-normal">({userTeamName})</span>}
                </span>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/40 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <NavLink
                to="/login"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/20"
              >
                Sign In / Login
              </NavLink>
            )}
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-900 text-slate-300 border border-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Slide-Down Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 p-4 space-y-3">
          
          <nav className="flex flex-col gap-2">
            <NavLink
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-900 text-slate-200 text-sm font-semibold"
            >
              <Database className="w-4 h-4 text-blue-400" />
              <span>Admin Console</span>
            </NavLink>

            <NavLink
              to="/host"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-900 text-slate-200 text-sm font-semibold"
            >
              <Gavel className="w-4 h-4 text-amber-400" />
              <span>Host Controller</span>
            </NavLink>

            <NavLink
              to="/owner"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-900 text-slate-200 text-sm font-semibold"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Team Owner Bidding</span>
            </NavLink>
          </nav>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            {userRole ? (
              <>
                <span className="font-mono text-slate-300">
                  Role: <strong className="text-emerald-400 uppercase">{userRole}</strong>
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-lg bg-rose-950 text-rose-300 border border-rose-500/40 text-xs font-bold"
                >
                  Logout
                </button>
              </>
            ) : (
              <NavLink
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 text-center rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
              >
                Sign In / Login
              </NavLink>
            )}
          </div>

        </div>
      )}
    </header>
  );
}
