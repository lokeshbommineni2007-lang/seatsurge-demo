import React from 'react';
import { Users, Clock, ShieldCheck, Ticket, X, Zap } from 'lucide-react';

interface WaitingRoomProps {
  queuePosition: number;
  totalInQueue: number;
  estimatedWaitSeconds: number;
  isAdmitted: boolean;
  onEnterVenue: () => void;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({
  queuePosition,
  totalInQueue,
  estimatedWaitSeconds,
  isAdmitted,
  onEnterVenue
}) => {
  const progressPercent = totalInQueue > 0
    ? Math.max(5, Math.min(100, Math.round(((totalInQueue - queuePosition) / totalInQueue) * 100)))
    : 0;

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onEnterVenue}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition cursor-pointer"
          title="Close waiting room"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Glow background */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex p-3 bg-cyan-500/10 text-cyan-400 rounded-2xl mb-4 border border-cyan-500/20">
          <Ticket className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">Yuktik '26 Virtual Waiting Room</h2>
        <p className="text-xs text-slate-400 mb-6">
          High demand flash sale in progress. Enforcing strict FIFO ordering on Redis Sorted Sets to protect downstream instances.
        </p>

        {isAdmitted ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 mb-6">
            <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-emerald-300 mb-1">Pass Issued!</h3>
            <p className="text-xs text-slate-300 mb-4">Your turn has arrived. You have a 10-minute hold pass to select and book seats.</p>
            <button
              onClick={onEnterVenue}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition shadow-lg shadow-emerald-500/25 cursor-pointer"
            >
              Enter 3D Arena Now →
            </button>
          </div>
        ) : (
          <div>
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-slate-400 mb-2 font-mono">
                <span>Queue Position</span>
                <span className="text-cyan-400 font-bold">#{queuePosition} of {totalInQueue}</span>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-500 shadow-sm shadow-cyan-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
                <Users className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
                <span className="text-xs text-slate-400">People Ahead</span>
                <p className="text-xl font-bold text-white font-mono">{Math.max(0, queuePosition - 1)}</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
                <Clock className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                <span className="text-xs text-slate-400">Estimated Wait</span>
                <p className="text-xl font-bold text-white font-mono">{estimatedWaitSeconds}s</p>
              </div>
            </div>

            {/* Instant Skip / Demo Button */}
            <button
              onClick={onEnterVenue}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-400 font-bold rounded-xl transition flex items-center justify-center gap-2 mb-4 cursor-pointer text-xs"
            >
              <Zap className="w-4 h-4 text-cyan-400" />
              Skip Queue & Enter 3D Arena (Judge Demo Mode)
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Queue spot is synchronized across all load balancer instances via Redis</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
