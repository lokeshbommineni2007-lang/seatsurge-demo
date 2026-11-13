import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Cpu, RefreshCw, CheckCircle2, AlertTriangle, Sparkles, BrainCircuit } from 'lucide-react';

interface BotChallengeModalProps {
  reasons: string[];
  riskScore: number;
  onSolve: () => void;
}

type Challenge =
  | {
      type: 'math';
      question: string;
      answer: number;
      options: number[];
      hint: string;
    }
  | {
      type: 'pattern';
      sequence: number[];
      displaySequence: string[];
      missingIndex: number;
      answer: number;
      options: number[];
      ruleDescription: string;
    };

function generateChallenge(): Challenge {
  const isMath = Math.random() > 0.5;

  if (isMath) {
    const operations = ['+', '-', '*'] as const;
    const op = operations[Math.floor(Math.random() * operations.length)];
    let q = '';
    let ans = 0;

    if (op === '+') {
      const a = Math.floor(Math.random() * 45) + 12;
      const b = Math.floor(Math.random() * 45) + 11;
      ans = a + b;
      q = `${a} + ${b} = ?`;
    } else if (op === '-') {
      const a = Math.floor(Math.random() * 50) + 30;
      const b = Math.floor(Math.random() * 25) + 5;
      ans = a - b;
      q = `${a} − ${b} = ?`;
    } else {
      const a = Math.floor(Math.random() * 9) + 4;
      const b = Math.floor(Math.random() * 8) + 3;
      ans = a * b;
      q = `${a} × ${b} = ?`;
    }

    const optionsSet = new Set<number>([ans]);
    while (optionsSet.size < 4) {
      const offset = (Math.floor(Math.random() * 8) + 1) * (Math.random() > 0.5 ? 1 : -1);
      const fake = ans + offset;
      if (fake > 0) optionsSet.add(fake);
    }
    const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);

    return {
      type: 'math',
      question: q,
      answer: ans,
      options,
      hint: 'Solve the quick arithmetic equation to verify human cognition'
    };
  } else {
    const patternType = Math.floor(Math.random() * 3);
    let seq: number[] = [];
    let rule = '';

    if (patternType === 0) {
      const step = Math.floor(Math.random() * 6) + 3;
      const start = Math.floor(Math.random() * 12) + 2;
      seq = [start, start + step, start + step * 2, start + step * 3, start + step * 4];
      rule = `Add ${step} per step`;
    } else if (patternType === 1) {
      const start = Math.floor(Math.random() * 4) + 2;
      seq = [start, start * 2, start * 4, start * 8, start * 16];
      rule = 'Doubling progression';
    } else {
      const start = Math.floor(Math.random() * 5) + 1;
      let curr = start;
      seq = [curr];
      for (let i = 1; i < 5; i++) {
        curr += (i * 2);
        seq.push(curr);
      }
      rule = 'Incremental delta progression';
    }

    const missingIdx = Math.floor(Math.random() * 3) + 1;
    const ans = seq[missingIdx];
    const displaySequence = seq.map((val, idx) => (idx === missingIdx ? '?' : String(val)));

    const optionsSet = new Set<number>([ans]);
    while (optionsSet.size < 4) {
      const offset = (Math.floor(Math.random() * 7) + 1) * (Math.random() > 0.5 ? 1 : -1);
      const fake = ans + offset;
      if (fake > 0) optionsSet.add(fake);
    }
    const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);

    return {
      type: 'pattern',
      sequence: seq,
      displaySequence,
      missingIndex: missingIdx,
      answer: ans,
      options,
      ruleDescription: rule
    };
  }
}

export const BotChallengeModal: React.FC<BotChallengeModalProps> = ({
  reasons,
  riskScore,
  onSolve
}) => {
  const [challenge, setChallenge] = useState<Challenge>(() => generateChallenge());
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(45);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refreshChallenge = useCallback(() => {
    setChallenge(generateChallenge());
    setSelectedOption(null);
    setErrorMessage(null);
    setTimeLeft(45);
    setIsSubmitting(false);
  }, []);

  // 45-second countdown with automatic retry on timeout & proper timer cleanup
  useEffect(() => {
    if (isSuccess) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setErrorMessage('Time expired. New challenge generated.');
          setTimeout(() => {
            refreshChallenge();
          }, 800);
          return 45;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSuccess, refreshChallenge]);

  const handleSelectOption = (opt: number) => {
    if (isSuccess || isSubmitting) return;
    setIsSubmitting(true);
    setSelectedOption(opt);

    if (opt === challenge.answer) {
      setIsSuccess(true);
      setErrorMessage(null);
      setTimeout(() => {
        onSolve();
      }, 700);
    } else {
      setErrorMessage('Incorrect answer. Generating a new challenge...');
      setTimeout(() => {
        refreshChallenge();
      }, 900);
    }
  };

  const riskPercent = Math.min(100, Math.max(0, Math.round(riskScore * 100)));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bot-challenge-title"
      className="fixed inset-0 bg-black/85 backdrop-blur-xl flex items-center justify-center z-50 p-4"
    >
      <div className="w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-3xl p-6 md:p-8 shadow-2xl text-center relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl inline-flex border border-amber-500/30 shadow-inner">
            <Cpu className="w-7 h-7" />
          </div>
          <div className="flex items-center gap-2">
            <span
              aria-live="polite"
              className={`text-xs font-mono px-3 py-1 rounded-full border transition-colors ${
                timeLeft <= 10
                  ? 'text-rose-400 bg-rose-500/10 border-rose-500/30 animate-pulse'
                  : 'text-slate-300 bg-slate-800/80 border-slate-700/60'
              }`}
            >
              ⏱ {timeLeft}s
            </span>
            <button
              onClick={refreshChallenge}
              disabled={isSuccess || isSubmitting}
              className="p-2 text-slate-400 hover:text-amber-400 bg-slate-800/70 hover:bg-slate-800 disabled:opacity-50 rounded-xl transition border border-slate-700/50 cursor-pointer"
              title="Generate new challenge"
              aria-label="Generate new challenge"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <h3 id="bot-challenge-title" className="text-xl font-bold text-white mb-1 tracking-tight flex items-center justify-center gap-2">
          Human Verification Check
          <Sparkles className="w-4 h-4 text-amber-400" />
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          SeatSurge AI Bot Screener flagged elevated interaction cadence. Complete the interactive pattern or math verification to continue.
        </p>

        {/* Explainability Callout (PS07 Section 3.D) */}
        <div className="bg-slate-800/80 rounded-2xl p-4 text-left mb-5 border border-slate-700/60 font-mono text-xs shadow-inner">
          <div className="flex justify-between items-center text-amber-400 font-bold mb-2">
            <span>Risk Score: {riskPercent}%</span>
            <span className="text-[10px] text-slate-400 font-sans uppercase tracking-wider">ML Bot Classifier</span>
          </div>
          <div className="text-[11px] text-slate-300 space-y-1">
            {reasons && reasons.length > 0 ? (
              reasons.map((r, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>{r}</span>
                </div>
              ))
            ) : (
              <div className="text-slate-400 italic">Elevated interaction cadence flagged</div>
            )}
          </div>
        </div>

        {/* Interactive Challenge Section */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 mb-5 text-left relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
              <BrainCircuit className="w-4 h-4" />
              <span>
                {challenge.type === 'math' ? 'Fast Math Challenge' : 'Pattern Recognition Challenge'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Pick the correct value
            </span>
          </div>

          {challenge.type === 'math' ? (
            <div className="text-center py-2">
              <div className="text-3xl font-mono font-extrabold text-white tracking-widest mb-1 drop-shadow-sm">
                {challenge.question}
              </div>
              <p className="text-[11px] text-slate-400">{challenge.hint}</p>
            </div>
          ) : (
            <div className="text-center py-2">
              <div className="flex items-center justify-center gap-2 font-mono text-xl md:text-2xl font-bold mb-2">
                {challenge.displaySequence.map((item, idx) => (
                  <span
                    key={idx}
                    className={`px-3 py-1.5 rounded-xl border ${
                      item === '?'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 animate-pulse font-extrabold'
                        : 'bg-slate-800 text-slate-200 border-slate-700'
                    }`}
                  >
                    {item}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 font-mono">Identify the missing item in the sequence</p>
            </div>
          )}

          {/* 4 Interactive Options Grid with full keyboard accessibility */}
          <div className="grid grid-cols-2 gap-2.5 mt-4">
            {challenge.options.map((opt, i) => {
              const isSelected = selectedOption === opt;
              return (
                <button
                  key={i}
                  disabled={isSuccess || isSubmitting}
                  onClick={() => handleSelectOption(opt)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectOption(opt);
                    }
                  }}
                  className={`py-3 px-4 rounded-xl text-sm font-mono font-bold transition-all duration-150 border cursor-pointer active:scale-95 disabled:cursor-not-allowed ${
                    isSelected && isSuccess
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-lg shadow-emerald-500/20'
                      : isSelected && errorMessage
                      ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                      : 'bg-slate-800/80 hover:bg-slate-800 hover:border-cyan-500/50 text-white border-slate-700/80'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Feedback states */}
          {isSuccess && (
            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Verification passed! Admitting to session...</span>
            </div>
          )}

          {errorMessage && (
            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-rose-400">
              <AlertTriangle className="w-4 h-4" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Verification Model Trust Footer */}
        <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>F1 Score ≥ 0.80 verified by LightGBM Classifier & Zero-Latency Bot Defense</span>
        </div>
      </div>
    </div>
  );
};
