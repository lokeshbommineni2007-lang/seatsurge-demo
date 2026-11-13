import React, { useState } from 'react';
import { X, Star, Clock, Zap, MapPin, Sparkles } from 'lucide-react';
import { EventItem, HYDERABAD_THEATRES, getFallbackPoster } from '../utils/mockEvents';
import { TheatreLayoutId } from '../utils/theatreLayouts';

interface ShowtimePickerProps {
  event: EventItem;
  onClose: () => void;
  onSelectShowtime: (
    theatreName: string,
    time: string,
    format: string,
    theatreId?: string,
    layoutId?: TheatreLayoutId
  ) => void;
}

export const ShowtimePicker: React.FC<ShowtimePickerProps> = ({
  event,
  onClose,
  onSelectShowtime
}) => {
  const dates = [
    { day: 'TODAY', date: '13 Nov', full: 'Thursday' },
    { day: 'FRI', date: '14 Nov', full: 'Friday' },
    { day: 'SAT', date: '15 Nov', full: 'Saturday' },
    { day: 'SUN', date: '16 Nov', full: 'Sunday' }
  ];
  const [selectedDate, setSelectedDate] = useState('TODAY');

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-2xl flex items-center justify-center z-50 p-4 select-none animate-fadeIn">
      <div className="w-full max-w-3xl bg-[#0e111a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]">
        {/* Modal Header with Movie Banner Artwork */}
        <div className="p-6 sm:p-7 bg-gradient-to-r from-[#131624] to-[#181528] border-b border-white/[0.08] flex items-start justify-between relative">
          <div className="flex gap-5">
            <img
              src={event.posterImage}
              alt={event.title}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = getFallbackPoster(event.title, event.category);
              }}
              className="w-20 h-28 object-cover rounded-2xl border border-white/15 shadow-xl shrink-0"
            />
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-md bg-rose-500/20 text-rose-400 font-extrabold text-[10px] font-mono tracking-wider">
                  {event.category.toUpperCase()}
                </span>
                <span className="text-xs text-amber-400 font-extrabold flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {event.rating}/10 ({event.votes} votes)
                </span>
                <span className="text-slate-500 text-xs">•</span>
                <span className="text-xs text-slate-400 font-mono">{event.duration}</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">{event.title}</h2>
              <p className="text-xs text-slate-400 font-medium mt-1">{event.subtitle}</p>

              <div className="flex flex-wrap gap-2 mt-2.5">
                {event.formats.map((fmt, i) => (
                  <span key={i} className="text-[10px] font-semibold text-slate-300 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                    {fmt}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date Selector Tabs */}
        <div className="px-6 py-3.5 bg-[#0a0d15] border-b border-white/[0.06] flex items-center gap-3 overflow-x-auto no-scrollbar">
          {dates.map((d) => (
            <button
              key={d.day}
              onClick={() => setSelectedDate(d.day)}
              className={`px-5 py-2.5 rounded-2xl text-center transition shrink-0 cursor-pointer ${
                selectedDate === d.day
                  ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white font-extrabold shadow-lg shadow-rose-600/30'
                  : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] border border-white/5'
              }`}
            >
              <div className="text-[10px] font-mono tracking-wider opacity-75">{d.day}</div>
              <div className="text-sm font-black">{d.date}</div>
            </button>
          ))}
        </div>

        {/* Theatres & Showtimes List */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {HYDERABAD_THEATRES.map((theatre) => (
            <div key={theatre.id} className="bg-[#121522] rounded-2xl p-5 border border-white/[0.07] hover:border-white/15 transition">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                    <span>{theatre.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({theatre.distance})</span>
                  </h3>
                  <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    <span>{theatre.location}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {theatre.amenities.slice(0, 2).map((amenity, aIdx) => (
                    <span key={aIdx} className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>

              {/* Showtimes Pills */}
              <div className="flex flex-wrap gap-3.5 mt-4">
                {theatre.timings.map((slot, sIdx) => {
                  const isFlash = slot.state === 'flash_sale';
                  return (
                    <button
                      key={sIdx}
                      onClick={() => onSelectShowtime(theatre.name, slot.time, slot.format, theatre.id, theatre.layoutId)}
                      className={`group px-5 py-3.5 min-w-[135px] rounded-2xl border transition text-left cursor-pointer relative overflow-hidden transform hover:-translate-y-0.5 ${
                        isFlash
                          ? 'border-rose-500/40 bg-rose-500/[0.08] hover:bg-rose-500/[0.18] shadow-lg shadow-rose-500/10'
                          : 'border-white/10 bg-white/[0.03] hover:border-cyan-400/50 hover:bg-cyan-500/10'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-black text-sm text-white group-hover:text-cyan-300 font-mono">
                        <Clock className={`w-3.5 h-3.5 ${isFlash ? 'text-rose-400' : 'text-slate-400'}`} />
                        <span>{slot.time}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 font-medium">{slot.format}</div>

                      {slot.label && (
                        <div className="mt-2 text-[9px] font-mono font-extrabold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded-full inline-block border border-rose-500/30">
                          {slot.label}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Prompt */}
        <div className="p-4 bg-[#0a0d15] border-t border-white/[0.06] text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Clicking any showtime immediately opens the 5,000-seat 3D amphitheatre with live hold reservation.</span>
        </div>
      </div>
    </div>
  );
};
