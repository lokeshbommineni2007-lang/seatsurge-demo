import React from 'react';
import { SeatInfo } from './Theatre3D';
import { Check, Star, ZoomIn, ZoomOut, Sparkles } from 'lucide-react';
import { TheatreLayoutId, THEATRE_LAYOUTS } from '../utils/theatreLayouts';

interface SeatMatrix2DProps {
  seatsMap: Map<string, SeatInfo>;
  selectedSeats: string[];
  onToggleSeat: (seatId: string) => void;
  pricePerSeat: number;
  layoutId?: TheatreLayoutId;
  isConcert?: boolean;
}

export const SeatMatrix2D: React.FC<SeatMatrix2DProps> = ({
  seatsMap,
  selectedSeats,
  onToggleSeat,
  pricePerSeat,
  layoutId = 'PRASADS_PCX',
  isConcert = false
}) => {
  const currentLayout = THEATRE_LAYOUTS[layoutId] || THEATRE_LAYOUTS.PRASADS_PCX;

  // Helper to render an individual interactive seat button (Authentic BookMyShow design)
  const renderSeat = (
    seatId: string,
    num: number | string,
    tierName: string,
    tierPrice: number,
    customClass = ''
  ) => {
    const seat = seatsMap.get(seatId);
    const isSelected = selectedSeats.includes(seatId);
    const isHeld = seat?.status === 'HELD' && !isSelected;
    const isSold = seat?.status === 'SOLD';

    return (
      <button
        key={seatId}
        onClick={() => onToggleSeat(seatId)}
        disabled={isSold}
        title={`Seat ${seatId} • ${tierName} • ₹${tierPrice}`}
        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md text-[9px] font-mono font-bold transition-all duration-150 flex items-center justify-center cursor-pointer transform hover:scale-115 active:scale-95 shrink-0 ${customClass} ${
          isSelected
            ? 'bg-[#00f0ff] text-slate-950 font-black shadow-[0_0_14px_rgba(0,240,255,0.7)] scale-110 ring-2 ring-cyan-200 border-none'
            : isHeld
            ? 'bg-rose-500/90 text-white animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.5)] border border-rose-400'
            : isSold
            ? 'bg-[#131622] text-slate-600 border border-white/[0.04] cursor-not-allowed opacity-40'
            : 'bg-emerald-500/[0.04] hover:bg-emerald-500 hover:text-white text-slate-200 border border-emerald-500/40 hover:border-emerald-400 hover:shadow-[0_0_10px_rgba(16,185,129,0.5)]'
        }`}
      >
        {isSelected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : num}
      </button>
    );
  };

  // Reusable BookMyShow Screen Graphic with authentic glowing trapezoid
  const renderScreen = (screenText: string) => (
    <div className="w-full max-w-2xl mx-auto pt-8 pb-4 text-center">
      <div className="relative w-full flex items-center justify-center">
        <svg className="w-full max-w-md h-14 drop-shadow-[0_0_25px_rgba(56,189,248,0.45)]" viewBox="0 0 500 50" fill="none">
          <defs>
            <linearGradient id="screenBeam" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <polygon points="40,45 460,45 420,10 80,10" fill="url(#screenBeam)" stroke="#38bdf8" strokeWidth="2" strokeLinejoin="round" />
          <line x1="70" y1="10" x2="430" y2="10" stroke="#00f0ff" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-[11px] font-mono tracking-[0.25em] uppercase text-cyan-300 font-bold mt-1.5 drop-shadow">
        {screenText}
      </p>
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 select-none animate-fadeIn flex flex-col items-center relative">
      {/* ─── Top Floating Mini-Map Preview (Exact BookMyShow Style) ─── */}
      <div className="hidden lg:flex fixed top-24 right-8 z-30 flex-col items-end pointer-events-none">
        <div className="pointer-events-auto bg-[#0a0d16]/95 backdrop-blur-2xl border border-white/15 p-2 rounded-2xl shadow-2xl flex flex-col items-center">
          <div className="w-40 h-24 bg-black/60 rounded-xl border border-white/10 relative overflow-hidden flex items-center justify-center">
            {/* Schematic Mini Map of Active Hall */}
            <div className="w-32 h-16 border border-emerald-500/30 rounded-lg flex flex-col justify-between p-1 opacity-70">
              <div className="w-full h-1 bg-cyan-400/80 rounded-full" />
              <div className="grid grid-cols-6 gap-0.5 opacity-40">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className="h-1 bg-slate-400 rounded-sm" />
                ))}
              </div>
            </div>
            {/* Red Viewport Window */}
            <div className="absolute inset-2 border-2 border-rose-500/80 rounded-lg pointer-events-none animate-pulse" />
          </div>
          <div className="flex items-center justify-between w-full mt-2 px-1 text-[10px] text-slate-400 font-mono">
            <span className="text-[9px] text-slate-500">BookMyShow Map</span>
            <div className="flex items-center gap-1.5 pointer-events-auto">
              <button className="p-1 hover:text-white cursor-pointer"><ZoomIn className="w-3 h-3" /></button>
              <button className="p-1 hover:text-white cursor-pointer"><ZoomOut className="w-3 h-3" /></button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Layout 1: PRASADS PCX SCREEN (Curved Grand Amphitheater) ─── */}
      {layoutId === 'PRASADS_PCX' && (
        <div className="w-full space-y-6">
          {/* Header Tier */}
          <div className="text-center">
            <span className="text-xs font-mono font-black px-4 py-1.5 rounded-full border border-amber-500/40 text-amber-300 bg-amber-500/10">
              ₹400 GOLD + 3D Glass
            </span>
          </div>

          {/* Seat Grid: Rows A to N fanning outward */}
          <div className="bg-[#0b0e1a]/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 space-y-2 overflow-x-auto">
            {[
              { row: 'N', start: 9, end: 46 },
              { row: 'M', start: 9, end: 46 },
              { row: 'L', start: 9, end: 46 },
              { row: 'K', start: 9, end: 46 },
              { row: 'J', start: 9, end: 46 },
              { row: 'H', start: 4, end: 46 },
              { row: 'G', start: 4, end: 46 },
              { row: 'F', start: 4, end: 46 },
              { row: 'E', start: 1, end: 46 },
              { row: 'D', start: 1, end: 45 },
              { row: 'C', start: 1, end: 41 },
              { row: 'B', start: 1, end: 39 },
              { row: 'A', start: 1, end: 34 }
            ].map(({ row, start, end }) => {
              const count = end - start + 1;
              const leftSeats: number[] = [];
              const rightSeats: number[] = [];
              const mid = start + Math.floor(count / 2);

              for (let n = start; n <= end; n++) {
                if (n < mid) leftSeats.push(n);
                else rightSeats.push(n);
              }

              return (
                <div key={row} className="flex items-center justify-center gap-2 min-w-max">
                  {/* Row Letter Left */}
                  <span className="w-6 text-center text-xs font-mono font-bold text-rose-400 shrink-0 bg-white/5 py-0.5 rounded border border-white/5">
                    {row}
                  </span>

                  {/* Left Block */}
                  <div className="flex items-center gap-1">
                    {leftSeats.map((num) => renderSeat(`${row}-${num}`, num, 'Gold 3D', 400))}
                  </div>

                  {/* Central Aisle Walkway */}
                  <div className="w-5 sm:w-8 shrink-0 text-center text-[9px] font-mono text-slate-600">|</div>

                  {/* Right Block */}
                  <div className="flex items-center gap-1">
                    {rightSeats.map((num) => renderSeat(`${row}-${num}`, num, 'Gold 3D', 400))}
                  </div>

                  {/* Row Letter Right */}
                  <span className="w-6 text-center text-xs font-mono font-bold text-rose-400 shrink-0 bg-white/5 py-0.5 rounded border border-white/5">
                    {row}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Curved PCX Screen Indicator at Bottom */}
          {renderScreen('All eyes this way please: 100ft Curved PCX Giant Screen')}
        </div>
      )}

      {/* ─── Layout 2: PRASADS SCREEN 4 (4-Quadrant Block with Cross Walkway) ─── */}
      {layoutId === 'PRASADS_SCREEN4' && (
        <div className="w-full space-y-6">
          {/* Header Tier */}
          <div className="text-center">
            <span className="text-xs font-mono font-black px-4 py-1.5 rounded-full border border-cyan-500/40 text-cyan-300 bg-cyan-500/10">
              ₹325 EXECUTIVE + 3D Glass
            </span>
          </div>

          <div className="bg-[#0b0e1a]/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 space-y-4 overflow-x-auto">
            {/* UPPER BLOCK: Rows A to F */}
            <div className="space-y-2">
              {['A', 'B', 'C', 'D', 'E', 'F'].map((row) => (
                <div key={row} className="flex items-center justify-center gap-2 min-w-max">
                  <span className="w-6 text-center text-xs font-mono font-bold text-rose-400 shrink-0 bg-white/5 py-0.5 rounded border border-white/5">
                    {row}
                  </span>

                  {/* Left Block: 1 to 14 */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 14 }, (_, i) => i + 1).map((num) =>
                      renderSeat(`${row}-${num}`, num, 'Executive 3D', 325)
                    )}
                  </div>

                  {/* Center Aisle */}
                  <div className="w-8 sm:w-12 text-center text-[10px] font-mono text-slate-500">AISLE</div>

                  {/* Right Block: 15 to 28 */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 14 }, (_, i) => i + 15).map((num) =>
                      renderSeat(`${row}-${num}`, num, 'Executive 3D', 325)
                    )}
                  </div>

                  <span className="w-6 text-center text-xs font-mono font-bold text-rose-400 shrink-0 bg-white/5 py-0.5 rounded border border-white/5">
                    {row}
                  </span>
                </div>
              ))}
            </div>

            {/* HORIZONTAL CROSSOVER WALKWAY (Exact BookMyShow Layout) */}
            <div className="my-4 py-2 border-y border-white/10 bg-white/[0.02] rounded-xl flex items-center justify-center">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">
                ← CROSSOVER AISLE & EXIT WALKWAY →
              </span>
            </div>

            {/* LOWER BLOCK: Rows G to N */}
            <div className="space-y-2">
              {['G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'].map((row) => {
                const isN = row === 'N';
                const leftCount = isN ? 12 : 14;
                const rightCount = isN ? 12 : 14;

                return (
                  <div key={row} className="flex items-center justify-center gap-2 min-w-max">
                    <span className="w-6 text-center text-xs font-mono font-bold text-rose-400 shrink-0 bg-white/5 py-0.5 rounded border border-white/5">
                      {row}
                    </span>

                    {/* Left Block */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: leftCount }, (_, i) => i + 1).map((num) =>
                        renderSeat(`${row}-${num}`, num, 'Executive 3D', 325)
                      )}
                    </div>

                    {/* Center Aisle */}
                    <div className="w-8 sm:w-12 text-center text-[10px] font-mono text-slate-500">AISLE</div>

                    {/* Right Block */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: rightCount }, (_, i) => (isN ? i + 13 : i + 15)).map((num) =>
                        renderSeat(`${row}-${num}`, num, 'Executive 3D', 325)
                      )}
                    </div>

                    <span className="w-6 text-center text-xs font-mono font-bold text-rose-400 shrink-0 bg-white/5 py-0.5 rounded border border-white/5">
                      {row}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Flat Laser Screen Indicator */}
          {renderScreen('All eyes this way please: Barco 4K Laser Screen')}
        </div>
      )}

      {/* ─── Layout 3: ALLU CINEMAS KOKAPET (3-Column + Director's Choice) ─── */}
      {layoutId === 'ALLU_KOKAPET' && (
        <div className="w-full space-y-6">
          {/* Section 1: ₹395 3D GOLD (Rows B to I) */}
          <div className="bg-[#0b0e1a]/80 backdrop-blur-xl rounded-3xl p-6 border border-white/10 space-y-3 overflow-x-auto">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-mono font-black text-amber-300 px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/30">
                ₹395 3D GOLD
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Dolby Cinema Upper Tier</span>
            </div>

            <div className="space-y-2">
              {['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].map((row) => (
                <div key={row} className="flex items-center justify-center gap-2 min-w-max">
                  <span className="w-6 text-center text-xs font-mono font-bold text-rose-400 shrink-0 bg-white/5 py-0.5 rounded">
                    {row}
                  </span>

                  {/* Left Block (37 down to 26) */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 12 }, (_, i) => 37 - i).map((num) =>
                      renderSeat(`${row}-${num}`, num, '3D Gold', 395)
                    )}
                  </div>

                  <div className="w-6 sm:w-8" />

                  {/* Center Block (25 down to 12) */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 14 }, (_, i) => 25 - i).map((num) =>
                      renderSeat(`${row}-${num}`, num, '3D Gold', 395)
                    )}
                  </div>

                  <div className="w-6 sm:w-8" />

                  {/* Right Block (11 down to 01) */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 11 }, (_, i) => 11 - i).map((num) =>
                      renderSeat(`${row}-${num}`, num < 10 ? `0${num}` : num, '3D Gold', 395)
                    )}
                  </div>

                  <span className="w-6 text-center text-xs font-mono font-bold text-rose-400 shrink-0 bg-white/5 py-0.5 rounded">
                    {row}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: ⭐ VIP 3D DIRECTOR CHOICE (Row J Highlighted) */}
          <div className="bg-gradient-to-r from-rose-950/40 via-amber-950/40 to-rose-950/40 backdrop-blur-2xl rounded-3xl p-6 border-2 border-amber-500/40 shadow-xl shadow-amber-500/10 space-y-3 overflow-x-auto">
            <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-xs font-mono font-black text-amber-300 uppercase tracking-wider">
                  ₹450 3D DIRECTOR CHOICE
                </span>
              </div>
              <span className="text-[10px] text-amber-300 font-mono">Row J • Ultra-Plush VIP Recliners</span>
            </div>

            <div className="flex items-center justify-center gap-2 min-w-max py-2">
              <span className="w-6 text-center text-xs font-mono font-bold text-amber-400 shrink-0 bg-amber-500/20 py-0.5 rounded border border-amber-500/40">
                J
              </span>

              {/* Left VIP */}
              <div className="flex items-center gap-1">
                {Array.from({ length: 8 }, (_, i) => 29 - i).map((num) =>
                  renderSeat(`J-${num}`, num, 'Director Choice', 450, 'border-amber-400/50')
                )}
              </div>

              <div className="w-6 sm:w-8" />

              {/* Center VIP Prime */}
              <div className="flex items-center gap-1">
                {Array.from({ length: 12 }, (_, i) => 21 - i).map((num) =>
                  renderSeat(`J-${num}`, num, 'Director Choice', 450, 'border-amber-400/50')
                )}
              </div>

              <div className="w-6 sm:w-8" />

              {/* Right VIP */}
              <div className="flex items-center gap-1">
                {Array.from({ length: 8 }, (_, i) => 8 - i).map((num) =>
                  renderSeat(`J-${num}`, num < 10 ? `0${num}` : num, 'Director Choice', 450, 'border-amber-400/50')
                )}
              </div>

              <span className="w-6 text-center text-xs font-mono font-bold text-amber-400 shrink-0 bg-amber-500/20 py-0.5 rounded border border-amber-500/40">
                J
              </span>
            </div>
          </div>

          {/* Section 3: ₹395 3D GOLD. (Rows K to R) */}
          <div className="bg-[#0b0e1a]/80 backdrop-blur-xl rounded-3xl p-6 border border-white/10 space-y-3 overflow-x-auto">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-mono font-black text-amber-300 px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/30">
                ₹395 3D GOLD.
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Dolby Cinema Lower Tier</span>
            </div>

            <div className="space-y-2">
              {['K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R'].map((row) => (
                <div key={row} className="flex items-center justify-center gap-2 min-w-max">
                  <span className="w-6 text-center text-xs font-mono font-bold text-rose-400 shrink-0 bg-white/5 py-0.5 rounded">
                    {row}
                  </span>

                  {/* Left Block */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 8 }, (_, i) => 33 - i).map((num) =>
                      renderSeat(`${row}-${num}`, num, '3D Gold', 395)
                    )}
                  </div>

                  <div className="w-6 sm:w-8" />

                  {/* Center Block */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 14 }, (_, i) => 25 - i).map((num) =>
                      renderSeat(`${row}-${num}`, num, '3D Gold', 395)
                    )}
                  </div>

                  <div className="w-6 sm:w-8" />

                  {/* Right Block */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 11 }, (_, i) => 11 - i).map((num) =>
                      renderSeat(`${row}-${num}`, num < 10 ? `0${num}` : num, '3D Gold', 395)
                    )}
                  </div>

                  <span className="w-6 text-center text-xs font-mono font-bold text-rose-400 shrink-0 bg-white/5 py-0.5 rounded">
                    {row}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Dolby Cinema Screen Indicator */}
          {renderScreen('All eyes this way please: Dolby Cinema 3D • 4K Dual Laser')}
        </div>
      )}

      {/* ─── Layout 4: AAA CINEMAS AMEERPET (4-Column + Recliner + Loungers) ─── */}
      {layoutId === 'AAA_AMEERPET' && (
        <div className="w-full space-y-6">
          {/* Section 1: ₹350 RECLINER (Row A Luxury Recliners) */}
          <div className="bg-[#0e1122]/90 backdrop-blur-xl rounded-3xl p-6 border border-purple-500/30 space-y-3 overflow-x-auto shadow-lg shadow-purple-500/5">
            <div className="flex items-center justify-between pb-2 border-b border-purple-500/20">
              <span className="text-xs font-mono font-black text-purple-300 px-3 py-1 bg-purple-500/15 rounded-full border border-purple-500/30 flex items-center gap-1.5">
                <span>🛋️ ₹350 RECLINER</span>
              </span>
              <span className="text-[10px] text-purple-300 font-mono">Row A • Motorized Recliners</span>
            </div>

            <div className="flex items-center justify-center gap-3 min-w-max py-2">
              <span className="w-6 text-center text-xs font-mono font-bold text-purple-400 shrink-0 bg-purple-500/10 py-1 rounded">
                A
              </span>

              {/* Left Recliners (01 to 09) */}
              <div className="flex items-center gap-1.5">
                {Array.from({ length: 9 }, (_, i) => i + 1).map((num) =>
                  renderSeat(`A-${num}`, num < 10 ? `0${num}` : num, 'Recliner', 350, 'w-7 h-7 sm:w-8 sm:h-7 border-purple-400/40')
                )}
              </div>

              <div className="w-10 text-center text-[10px] font-mono text-purple-400">AISLE</div>

              {/* Right Recliners (10 to 20) */}
              <div className="flex items-center gap-1.5">
                {Array.from({ length: 11 }, (_, i) => i + 10).map((num) =>
                  renderSeat(`A-${num}`, num, 'Recliner', 350, 'w-7 h-7 sm:w-8 sm:h-7 border-purple-400/40')
                )}
              </div>

              <span className="w-6 text-center text-xs font-mono font-bold text-purple-400 shrink-0 bg-purple-500/10 py-1 rounded">
                A
              </span>
            </div>
          </div>

          {/* Section 2: ₹295 GOLD (Rows B to N in 4 Columns) */}
          <div className="bg-[#0b0e1a]/80 backdrop-blur-xl rounded-3xl p-6 border border-white/10 space-y-4 overflow-x-auto">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-mono font-black text-amber-300 px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/30">
                ₹295 GOLD
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Rows B to N (4 Columns)</span>
            </div>

            {/* Balcony: Rows B, C */}
            <div className="space-y-2 pb-2">
              {['B', 'C'].map((row) => (
                <div key={row} className="flex items-center justify-center gap-2 min-w-max">
                  <span className="w-6 text-center text-xs font-mono font-bold text-rose-400 shrink-0 bg-white/5 py-0.5 rounded">
                    {row}
                  </span>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 13 }, (_, i) => i + 1).map((num) =>
                      renderSeat(`${row}-${num}`, num < 10 ? `0${num}` : num, 'Gold', 295)
                    )}
                  </div>
                  <div className="w-10" />
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 13 }, (_, i) => i + 14).map((num) =>
                      renderSeat(`${row}-${num}`, num, 'Gold', 295)
                    )}
                  </div>
                  <span className="w-6 text-center text-xs font-mono font-bold text-rose-400 shrink-0 bg-white/5 py-0.5 rounded">
                    {row}
                  </span>
                </div>
              ))}
            </div>

            {/* Main 4-Column Gold: Rows D to K */}
            <div className="space-y-2">
              {['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'].map((row) => (
                <div key={row} className="flex items-center justify-center gap-2 min-w-max">
                  <span className="w-6 text-center text-xs font-mono font-bold text-rose-400 shrink-0 bg-white/5 py-0.5 rounded">
                    {row}
                  </span>

                  {/* Col 1: 01-04 */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 4 }, (_, i) => i + 1).map((num) =>
                      renderSeat(`${row}-${num}`, `0${num}`, 'Gold', 295)
                    )}
                  </div>
                  <div className="w-5" />

                  {/* Col 2: 05-17 */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 13 }, (_, i) => i + 5).map((num) =>
                      renderSeat(`${row}-${num}`, num < 10 ? `0${num}` : num, 'Gold', 295)
                    )}
                  </div>
                  <div className="w-6" />

                  {/* Col 3: 18-30 */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 13 }, (_, i) => i + 18).map((num) =>
                      renderSeat(`${row}-${num}`, num, 'Gold', 295)
                    )}
                  </div>
                  <div className="w-5" />

                  {/* Col 4: 31-34 */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 4 }, (_, i) => i + 31).map((num) =>
                      renderSeat(`${row}-${num}`, num, 'Gold', 295)
                    )}
                  </div>

                  <span className="w-6 text-center text-xs font-mono font-bold text-rose-400 shrink-0 bg-white/5 py-0.5 rounded">
                    {row}
                  </span>
                </div>
              ))}
            </div>

            {/* Walkway between K and L */}
            <div className="my-2 py-1 bg-white/[0.02] border-y border-white/5 text-center">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                WALKWAY
              </span>
            </div>

            {/* Lower Gold: Rows L to N */}
            <div className="space-y-2">
              {['L', 'M', 'N'].map((row) => (
                <div key={row} className="flex items-center justify-center gap-2 min-w-max">
                  <span className="w-6 text-center text-xs font-mono font-bold text-rose-400 shrink-0 bg-white/5 py-0.5 rounded">
                    {row}
                  </span>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: 4 }, (_, i) => i + 1).map((num) =>
                      renderSeat(`${row}-${num}`, `0${num}`, 'Gold', 295)
                    )}
                  </div>
                  <div className="w-5" />

                  <div className="flex items-center gap-1">
                    {Array.from({ length: 13 }, (_, i) => i + 5).map((num) =>
                      renderSeat(`${row}-${num}`, num < 10 ? `0${num}` : num, 'Gold', 295)
                    )}
                  </div>
                  <div className="w-6" />

                  <div className="flex items-center gap-1">
                    {Array.from({ length: 13 }, (_, i) => i + 18).map((num) =>
                      renderSeat(`${row}-${num}`, num, 'Gold', 295)
                    )}
                  </div>
                  <div className="w-5" />

                  <div className="flex items-center gap-1">
                    {Array.from({ length: 4 }, (_, i) => i + 31).map((num) =>
                      renderSeat(`${row}-${num}`, num, 'Gold', 295)
                    )}
                  </div>

                  <span className="w-6 text-center text-xs font-mono font-bold text-rose-400 shrink-0 bg-white/5 py-0.5 rounded">
                    {row}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: ✨ ₹295 LOUNGERS (Row P Front Row Loungers) */}
          <div className="bg-[#0e1622]/90 backdrop-blur-xl rounded-3xl p-6 border border-emerald-500/30 space-y-3 overflow-x-auto shadow-lg shadow-emerald-500/5">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
              <span className="text-xs font-mono font-black text-emerald-300 px-3 py-1 bg-emerald-500/15 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                <span>✨ ₹295 LOUNGERS</span>
              </span>
              <span className="text-[10px] text-emerald-300 font-mono">Row P • Front Row Ergonomic Loungers</span>
            </div>

            <div className="flex items-center justify-center gap-3 min-w-max py-2">
              <span className="w-6 text-center text-xs font-mono font-bold text-emerald-400 shrink-0 bg-emerald-500/10 py-1 rounded">
                P
              </span>

              {/* Block 1: 01-03 */}
              <div className="flex items-center gap-1">
                {Array.from({ length: 3 }, (_, i) => i + 1).map((num) =>
                  renderSeat(`P-${num}`, `0${num}`, 'Loungers', 295, 'border-emerald-400/40')
                )}
              </div>
              <div className="w-5" />

              {/* Block 2: 04-13 */}
              <div className="flex items-center gap-1">
                {Array.from({ length: 10 }, (_, i) => i + 4).map((num) =>
                  renderSeat(`P-${num}`, num < 10 ? `0${num}` : num, 'Loungers', 295, 'border-emerald-400/40')
                )}
              </div>
              <div className="w-6" />

              {/* Block 3: 14-23 */}
              <div className="flex items-center gap-1">
                {Array.from({ length: 10 }, (_, i) => i + 14).map((num) =>
                  renderSeat(`P-${num}`, num, 'Loungers', 295, 'border-emerald-400/40')
                )}
              </div>
              <div className="w-5" />

              {/* Block 4: 24-26 */}
              <div className="flex items-center gap-1">
                {Array.from({ length: 3 }, (_, i) => i + 24).map((num) =>
                  renderSeat(`P-${num}`, num, 'Loungers', 295, 'border-emerald-400/40')
                )}
              </div>

              <span className="w-6 text-center text-xs font-mono font-bold text-emerald-400 shrink-0 bg-emerald-500/10 py-1 rounded">
                P
              </span>
            </div>
          </div>

          {/* Laser Dolby Atmos Screen Indicator */}
          <div className="w-full max-w-xl mx-auto pt-6 text-center">
            <div className="h-3.5 w-full bg-gradient-to-r from-transparent via-[#10b981] to-transparent rounded-full shadow-[0_0_20px_#10b981]" />
            <p className="text-[11px] font-mono tracking-widest uppercase text-emerald-400 font-bold mt-2">
              AAA Cinemas: Laser Dolby Atmos Screen
            </p>
          </div>
        </div>
      )}

      {/* ─── Layout 5: CONCERT STADIUM (Rockstar Anirudh Arena) ─── */}
      {layoutId === 'CONCERT_STADIUM' && (
        <div className="w-full space-y-6">
          <div className="p-4 rounded-3xl bg-gradient-to-r from-rose-900/30 via-amber-900/30 to-cyan-900/30 border border-white/10 shadow-2xl backdrop-blur-xl flex flex-col items-center">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs font-mono font-extrabold uppercase tracking-widest text-rose-400">
                ⚡ 360° LIVE CONCERT CENTER STAGE ⚡
              </span>
            </div>
            <h3 className="text-lg font-black text-white">ROCKSTAR ANIRUDH • HUKUM TOUR</h3>
            <p className="text-[11px] font-mono text-cyan-300 mt-0.5">
              Concentric 360° Amphitheater Seating Around the Rockstar
            </p>
          </div>

          {/* Tiers */}
          {[
            { name: '⚡ GOLDEN FAN PIT', price: 4500, rows: ['A', 'B', 'C'], color: 'border-amber-500/40 text-amber-300' },
            { name: '💎 DIAMOND BOWL', price: 2500, rows: ['D', 'E', 'F', 'G', 'H', 'I'], color: 'border-emerald-500/40 text-emerald-300' },
            { name: '🏟️ STADIUM GRANDSTAND', price: 999, rows: ['J', 'K', 'L', 'M', 'N', 'O', 'P'], color: 'border-blue-500/40 text-blue-300' }
          ].map((tier) => (
            <div key={tier.name} className="bg-black/30 backdrop-blur-xl rounded-3xl p-6 border border-white/5 space-y-3 overflow-x-auto">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className={`text-xs font-mono font-black px-3 py-1 rounded-full border ${tier.color} bg-white/5`}>
                  {tier.name} (₹{tier.price})
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Row {tier.rows[0]} to {tier.rows[tier.rows.length - 1]}</span>
              </div>
              <div className="space-y-2">
                {tier.rows.map((row) => (
                  <div key={row} className="flex items-center justify-center gap-2 min-w-max">
                    <span className="w-6 text-center text-xs font-mono font-bold text-rose-400 shrink-0 bg-white/5 py-0.5 rounded">
                      {row}
                    </span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 32 }, (_, i) => i + 1).map((num) =>
                        renderSeat(`${row}-${num}`, num, tier.name, tier.price)
                      )}
                    </div>
                    <span className="w-6 text-center text-xs font-mono font-bold text-rose-400 shrink-0 bg-white/5 py-0.5 rounded">
                      {row}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Bottom Authentic BookMyShow Status Legend ─── */}
      <div className="w-full max-w-xl mx-auto pt-8 flex items-center justify-center gap-6 text-xs font-mono text-slate-300 border-t border-white/10 mt-6">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded border border-white/40 bg-white/5" />
          <span className="font-sans text-slate-300">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded bg-[#1b202e] border border-slate-700/60" />
          <span className="font-sans text-slate-500">Sold</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-[8px] text-amber-300 font-bold">
            ★
          </span>
          <span className="font-sans text-amber-300">Bestseller</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded bg-[#00f0ff] shadow-sm shadow-cyan-400/50" />
          <span className="font-sans text-cyan-300 font-bold">Selected</span>
        </div>
      </div>
    </div>
  );
};
