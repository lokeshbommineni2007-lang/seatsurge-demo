import React from 'react';
import { Activity, ShieldAlert, Zap, Server, Users, RefreshCw, X, Terminal } from 'lucide-react';

interface MetricsData {
  instanceId: string;
  connectedClients: number;
  rps: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  botsBlocked: number;
  activeHolds: number;
  queueSize: number;
  admittedCount: number;
  totalSeats: number;
}

interface ObservabilityDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: MetricsData | null;
  onAdmitBatch: () => void;
  onFireStressTest: () => void;
  onSimulateBotAttack: () => void;
  onResetVenue: () => void;
}

export const ObservabilityDashboard: React.FC<ObservabilityDashboardProps> = ({
  isOpen,
  onClose,
  metrics,
  onAdmitBatch,
  onFireStressTest,
  onSimulateBotAttack,
  onResetVenue
}) => {
  if (!isOpen || !metrics) return null;
  const isLatencyHealthy = metrics.p95LatencyMs < 200;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Click outside to dismiss */}
      <div className="flex-1" onClick={onClose} />

      {/* Slide-over Drawer */}
      <div className="w-full max-w-md bg-[#0b0e19]/98 backdrop-blur-2xl border-l border-white/10 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-slideLeft text-xs text-slate-300 font-mono">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
              <div>
                <h3 className="font-extrabold text-white text-base">Yuktik '26 Defense HUD</h3>
                <p className="text-[10px] text-slate-400 font-mono">Distributed Redis Lua Engine Telemetry</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
              title="Close Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white/[0.03] p-3.5 rounded-2xl border border-white/5">
              <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-emerald-400" />
                <span>ROUTED BY NGINX</span>
              </div>
              <div className="text-emerald-400 font-extrabold text-sm mt-1">{metrics.instanceId}</div>
            </div>

            <div className="bg-white/[0.03] p-3.5 rounded-2xl border border-white/5">
              <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                <span>LATENCY (P50/P95)</span>
              </div>
              <div className="text-white font-extrabold text-sm mt-1 flex items-center gap-1">
                <span>{metrics.p50LatencyMs}ms</span>
                <span className="text-slate-600">/</span>
                <span className={isLatencyHealthy ? 'text-emerald-400' : 'text-rose-400'}>
                  {metrics.p95LatencyMs}ms {isLatencyHealthy ? '✓' : '⚠️'}
                </span>
              </div>
            </div>

            <div className="bg-white/[0.03] p-3.5 rounded-2xl border border-white/5">
              <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>ACTIVE HOLDS</span>
              </div>
              <div className="text-amber-400 font-extrabold text-sm mt-1">{metrics.activeHolds} seats</div>
            </div>

            <div className="bg-white/[0.03] p-3.5 rounded-2xl border border-white/5">
              <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>AI BOTS BLOCKED</span>
              </div>
              <div className="text-rose-400 font-extrabold text-sm mt-1">{metrics.botsBlocked} caught</div>
            </div>
          </div>

          {/* Queue & Throughput Bar */}
          <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5 mb-6 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>Virtual Waiting Room Queue:</span>
              </span>
              <span className="text-white font-bold">{metrics.queueSize} queued ({metrics.admittedCount} admitted)</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                <span>Throughput:</span>
              </span>
              <span className="text-emerald-400 font-bold">{metrics.rps} req/s</span>
            </div>
          </div>

          {/* Judge Defense Suite Buttons */}
          <div className="space-y-3">
            <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-rose-400" />
              <span>Interactive Judge Defense Suite</span>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={onFireStressTest}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-2xl text-xs font-black transition shadow-lg shadow-indigo-600/25 flex items-center justify-between cursor-pointer"
              >
                <span>🔥 Fire 100 Concurrent Clicks at Seat</span>
                <span className="text-[10px] opacity-75 font-mono">Zero Double Bookings</span>
              </button>

              <button
                onClick={onSimulateBotAttack}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-white rounded-2xl text-xs font-black transition shadow-lg shadow-amber-600/25 flex items-center justify-between cursor-pointer"
              >
                <span>🤖 Simulate AI Bot Scalper Attack</span>
                <span className="text-[10px] opacity-75 font-mono">FastAPI Screener</span>
              </button>

              <button
                onClick={onAdmitBatch}
                className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 text-slate-200 rounded-2xl text-xs font-bold transition border border-white/10 flex items-center justify-between cursor-pointer"
              >
                <span>👥 Admit 50 Users from Waiting Room</span>
                <span className="text-[10px] opacity-75 font-mono">Token Bucket</span>
              </button>

              <button
                onClick={onResetVenue}
                className="w-full py-2.5 px-4 bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 rounded-2xl text-xs font-bold transition border border-white/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Venue (5,000 Seats)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-6 border-t border-white/10 text-[10px] text-slate-500 text-center">
          PS07 Yuktik '26 Defense Engine • Zero Ready-Made Redis Libraries
        </div>
      </div>
    </div>
  );
};
