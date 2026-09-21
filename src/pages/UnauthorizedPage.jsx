import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft, Lock, Gavel, Database, Users } from 'lucide-react';

export default function UnauthorizedPage() {
  const { userRole, logout } = useAuth();
  const navigate = useNavigate();

  const getAuthorizedPath = () => {
    if (userRole === 'admin') return '/admin';
    if (userRole === 'host') return '/host';
    if (userRole === 'owner') return '/owner';
    return '/login';
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
      
      <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-2xl">
        <ShieldAlert className="w-10 h-10" />
      </div>

      <div className="space-y-2">
        <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-mono font-bold uppercase tracking-wider">
          403 Access Denied
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-100 font-heading">
          Unauthorized Access Attempt
        </h1>
        <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
          Your current active session role is <strong className="text-rose-400 uppercase font-mono">{userRole || 'Guest'}</strong>. You do not have security credentials to access this portal route.
        </p>
      </div>

      <div className="pt-6 flex flex-wrap items-center justify-center gap-4">
        <Link
          to={getAuthorizedPath()}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Authorized Dashboard (<code className="font-mono text-xs">{getAuthorizedPath()}</code>)
        </Link>

        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-sm transition-all cursor-pointer"
        >
          Switch Role / Re-login
        </button>
      </div>

    </div>
  );
}
