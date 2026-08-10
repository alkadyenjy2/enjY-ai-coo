import React from 'react';
import { UserProfile } from '../types';
import { Sliders, CheckCircle, ThumbsUp, ThumbsDown, Zap, Shield, User } from 'lucide-react';

interface AdaptiveBehaviorCardProps {
  userProfile: UserProfile;
  onUpdateProfile?: (updated: UserProfile) => void;
}

export const AdaptiveBehaviorCard: React.FC<AdaptiveBehaviorCardProps> = ({ userProfile }) => {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-zinc-200">
      <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-emerald-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
              Adaptive Behavioral Engine
            </h3>
            <p className="text-[11px] text-zinc-500 font-sans">
              Core agent dynamically modifies execution style & tool choice based on user habits
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          LEARNING ACTIVE
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-3 font-mono">
        {/* Comm Style */}
        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
          <div className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Comm Style</div>
          <div className="font-semibold text-emerald-400 capitalize flex items-center gap-1.5 font-sans">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            {userProfile.communicationPreference.replace('_', ' ')}
          </div>
          <p className="text-[10px] text-zinc-500 font-sans mt-1">Short, scannable responses</p>
        </div>

        {/* Technical Level */}
        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
          <div className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Technical Level</div>
          <div className="font-semibold text-cyan-400 capitalize flex items-center gap-1.5 font-sans">
            <User className="w-3.5 h-3.5 text-cyan-400" />
            {userProfile.technicalLevel}
          </div>
          <p className="text-[10px] text-zinc-500 font-sans mt-1">Direct architectural depth</p>
        </div>

        {/* Autonomy Level */}
        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
          <div className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Autonomy Level</div>
          <div className="font-semibold text-emerald-400 capitalize flex items-center gap-1.5 font-sans">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            {userProfile.autonomyLevel.replace(/_/g, ' ')}
          </div>
          <p className="text-[10px] text-zinc-500 font-sans mt-1">Auto-executes safe tasks</p>
        </div>

        {/* Execution Speed */}
        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
          <div className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Decision Style</div>
          <div className="font-semibold text-purple-400 capitalize flex items-center gap-1.5 font-sans">
            <CheckCircle className="w-3.5 h-3.5 text-purple-400" />
            {userProfile.decisionStyle.replace('_', ' ')}
          </div>
          <p className="text-[10px] text-zinc-500 font-sans mt-1">Execute & verify first</p>
        </div>
      </div>

      {/* Disliked vs Approved Patterns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
          <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-emerald-400 mb-2">
            <ThumbsUp className="w-3.5 h-3.5" />
            PREFERRED TOOLS & PATTERNS
          </div>
          <div className="flex flex-wrap gap-1.5">
            {userProfile.preferredTools.map((t, idx) => (
              <span key={idx} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono text-[10px]">
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
          <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-rose-400 mb-2">
            <ThumbsDown className="w-3.5 h-3.5" />
            AUTO-AVOIDED DISLIKED PATTERNS
          </div>
          <div className="flex flex-wrap gap-1.5">
            {userProfile.dislikedTools.concat(userProfile.dislikedUIPatterns).map((d, idx) => (
              <span key={idx} className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-mono text-[10px]">
                {d}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
