import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Zap, ChevronRight, ChevronLeft, Star, Clock, Ticket, Sparkles } from 'lucide-react';
import { EventItem, getFallbackPoster } from '../utils/mockEvents';

interface HeroBannerProps {
  events: EventItem[];
  onSelectEvent: (event: EventItem) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ events, onSelectEvent }) => {
  const featured = events.filter((e) => e.isFlashSale);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featured.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [featured.length]);

  if (!featured.length) return null;
  const current = featured[currentIndex];

  return (
    <div className="relative w-full py-6 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#0b0e18] via-[#101424] to-[#17122b] border border-white/10 shadow-[0_20px_70px_rgba(0,0,0,0.6)] min-h-[420px] lg:min-h-[460px] flex items-center">
          
          {/* Background Blurred Atmosphere Image */}
          <div
            className="absolute inset-0 bg-cover bg-right lg:bg-center opacity-35 scale-105 transition-all duration-1000 ease-out filter saturate-150"
            style={{ backgroundImage: `url(${current.bannerImage})` }}
          />
          {/* Multi-layered cinematic gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#070912] via-[#070912]/90 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070912] via-transparent to-transparent opacity-80" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-rose-500/10 via-transparent to-transparent pointer-events-none" />

          {/* Left Hero Details */}
          <div className="relative z-10 p-8 sm:p-12 lg:p-16 max-w-2xl">
            
            {/* Flash Sale Capsule */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-mono font-bold mb-4 shadow-lg shadow-rose-500/20 backdrop-blur-md animate-softPulse">
              <Zap className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
              <span>{current.statusTag || '⚡ FLASH SALE LIVE • HYDERABAD MULTIPLEX'}</span>
            </div>

            {/* Event Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-2 drop-shadow-md">
              {current.title}
            </h1>
            <p className="text-sm sm:text-base font-semibold text-rose-200/90 mb-5 max-w-lg leading-relaxed">
              {current.subtitle}
            </p>

            {/* Metadata Tags */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-300 font-medium mb-6">
              <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-amber-400 font-bold shadow-md">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{current.rating}/10</span>
                <span className="text-slate-400 font-normal">({current.votes})</span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-slate-200">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>{current.duration}</span>
              </div>
              <span className="px-2.5 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-mono text-slate-300">
                {current.ageRating}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300 font-medium">{current.genre.join(', ')}</span>
            </div>

            {/* Venue & Location */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 mb-8 font-medium">
              <div className="flex items-center gap-1.5 bg-white/[0.04] px-3 py-1.5 rounded-xl border border-white/5">
                <MapPin className="w-3.5 h-3.5 text-[#f84464] shrink-0" />
                <span>{current.venue}, {current.location}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/[0.04] px-3 py-1.5 rounded-xl border border-white/5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>{current.date}</span>
              </div>
            </div>

            {/* Action CTAs */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => onSelectEvent(current)}
                className="px-8 py-4 bg-gradient-to-r from-[#f84464] via-rose-500 to-rose-600 hover:from-rose-500 hover:to-rose-400 text-white font-extrabold rounded-2xl text-sm transition-all duration-300 shadow-xl shadow-rose-600/35 hover:shadow-rose-600/55 flex items-center gap-2.5 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Ticket className="w-4 h-4" />
                <span>Select Seats in 3D Arena</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>

              <div className="text-xs font-mono text-slate-400 pl-2 flex items-center gap-2">
                <span>Tickets from</span>
                <span className="text-white font-extrabold text-lg font-sans">₹{current.priceStart.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Right Floating Poster Card */}
          <div className="hidden lg:block absolute right-16 z-10 w-72 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/20 transition-all duration-500 ease-out hover:scale-[1.03] group">
            <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-900">
              <img
                src={current.posterImage}
                alt={current.title}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = getFallbackPoster(current.title, current.category);
                }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e111d] via-transparent to-transparent opacity-60" />
            </div>

            <div className="p-4 bg-[#0e111d]/95 backdrop-blur-xl border-t border-white/10 text-center">
              <div className="text-xs font-bold text-amber-400 flex items-center justify-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{current.rating}/10 ({current.votes} Votes)</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-mono font-medium flex items-center justify-center gap-2">
                <span className="text-cyan-400 font-bold">{current.formats[0]}</span>
                <span>•</span>
                <span>{current.languages[0]}</span>
              </div>
            </div>
          </div>

          {/* Top-Right Carousel Navigation Controls */}
          <div className="absolute top-6 right-8 z-30 flex items-center gap-2">
            <button
              onClick={() => setCurrentIndex((prev) => (prev - 1 + featured.length) % featured.length)}
              className="p-2.5 rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/90 transition backdrop-blur-md border border-white/10 cursor-pointer shadow-lg hover:scale-105"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % featured.length)}
              className="p-2.5 rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/90 transition backdrop-blur-md border border-white/10 cursor-pointer shadow-lg hover:scale-105"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom Carousel Indicator Bars */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {featured.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  currentIndex === idx
                    ? 'w-8 bg-[#f84464] shadow-sm shadow-rose-500'
                    : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};
