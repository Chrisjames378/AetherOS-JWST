import React, { useState } from 'react';
import { LogIn, LogOut, User as UserIcon, Database, Check } from 'lucide-react';
import { useAuth } from './AuthContext';

export const AuthBar: React.FC<{ onOpenObservations?: () => void }> = ({ onOpenObservations }) => {
  const { user, signInWithGoogle, signOut } = useAuth();

  return (
    <div className="flex items-center gap-2 font-mono text-xs">
      {user ? (
        <div className="flex items-center gap-2 bg-surface/90 border border-line p-1.5 rounded-lg shadow-md">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || 'User'} className="w-5 h-5 rounded-full border border-cyan-400" />
          ) : (
            <UserIcon className="w-4 h-4 text-cyan-400" />
          )}
          <span className="text-fg font-semibold text-[11px] max-w-[110px] truncate" title={user.email || ''}>
            {user.displayName || user.email?.split('@')[0]}
          </span>
          <button
            type="button"
            onClick={signOut}
            className="p-1 text-muted hover:text-red-400 transition"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={signInWithGoogle}
          className="min-h-10 px-3.5 text-xs font-mono rounded border border-cyan-500/50 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-colors flex items-center gap-1.5 shadow-lg"
          title="Sign in with Google Auth"
        >
          <LogIn className="w-3.5 h-3.5 text-cyan-400" />
          Google Sign-In
        </button>
      )}
    </div>
  );
};
