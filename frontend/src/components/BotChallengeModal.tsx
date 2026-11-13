import React, { useState } from 'react';
import { ShieldCheck, Cpu } from 'lucide-react';

interface BotChallengeModalProps {
  reasons: string[];
  riskScore: number;
  onSolve: () => void;
}

export const BotChallengeModal: React.FC<BotChallengeModalProps> = ({
  reasons,
  riskScore,
  onSolve
}) => {
  const [sliderVal, setSliderVal] = useState(0);

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setSliderVal(val);
    if (val >= 98) {
      setTimeout(() => onSolve(), 300);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-xl flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl text-center">
        <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl inline-flex mb-3 border border-amber-500/30">
          <Cpu className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-bold text-white mb-1">Human Verification Check</h3>
        <p className="text-xs text-slate-400 mb-4">
          SeatSurge AI Bot Screener flagged your session for elevated interaction rate.
        </p>

        {/* Explainability Callout (Required by PS07 Section 3.D) */}
        <div className="bg-slate-800/80 rounded-2xl p-4 text-left mb-6 border border-slate-700/60 font-mono text-xs">
          <div className="flex justify-between items-center text-amber-400 font-bold mb-2">
            <span>Risk Score: {(riskScore * 100).toFixed(0)}%</span>
            <span className="text-[10px] text-slate-400">ML Model Decision</span>
          </div>
          <div className="text-[11px] text-slate-300 space-y-1">
            {reasons.map((r, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span className="text-amber-500">•</span>
                <span>{r}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs text-slate-300 block mb-2 font-medium">Slide to complete human verification</label>
          <input
            type="range"
            min="0"
            max="100"
            value={sliderVal}
            onChange={handleSlider}
            className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="text-[10px] text-slate-500 mt-1 font-mono">{sliderVal}% completed</div>
        </div>

        <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>F1 Score ≥ 0.80 verified by LightGBM Classifier</span>
        </div>
      </div>
    </div>
  );
};
