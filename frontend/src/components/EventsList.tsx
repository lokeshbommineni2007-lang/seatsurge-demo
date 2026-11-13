import React from 'react';
import { Star, MapPin, Zap, Ticket, Sparkles, ChevronRight } from 'lucide-react';
import { EventItem, getFallbackPoster } from '../utils/mockEvents';

interface EventsListProps {
  events: EventItem[];
  selectedCategory: string;
  searchQuery: string;
  onSelectEvent: (event: EventItem) => void;
}

export const EventsList: React.FC<EventsListProps> = ({
  events,
  selectedCategory,
  searchQuery,
  onSelectEvent
}) => {
  const filtered = events.filter((e) => {
    const matchesCategory =
      selectedCategory === 'All Events' ||
      e.category.toLowerCase() === selectedCategory.toLowerCase();

    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 select-none">
      
      {/* Section Header */}
      <div className="flex items-end justify-between mb-8 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="text-xs uppercase tracking-wider font-extrabold text-[#f84464] mb-1 font-mono flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>NOW SHOWING IN HYDERABAD</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            Trending Movies & Arenas
            <span className="text-xs px-3 py-1 rounded-full bg-white/[0.05] text-slate-300 font-mono font-medium border border-white/10">
              {filtered.length} Events
            </span>
          </h2>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-400">
          <span className="text-slate-200">Sort by:</span>
          <span className="text-rose-400 font-bold cursor-pointer hover:underline">Popularity</span>
        </div>
      </div>

      {/* Events Grid (Clean 4-column responsive layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-7">
        {filtered.map((event) => (
          <div
            key={event.id}
            onClick={() => onSelectEvent(event)}
            className="group bg-[#0d101a] rounded-3xl overflow-hidden border border-white/[0.08] hover:border-rose-500/50 transition-all duration-300 hover:shadow-[0_15px_45px_rgba(248,68,100,0.18)] flex flex-col cursor-pointer transform hover:-translate-y-1.5"
          >
            {/* Standard 2:3 Movie Poster Ratio Container */}
            <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-900">
              <img
                src={event.posterImage}
                alt={event.title}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = getFallbackPoster(event.title, event.category);
                }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />

              {/* Status / Flash Sale Badge */}
              {event.isFlashSale && (
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-[#f84464] text-white text-[10px] font-black font-mono shadow-lg shadow-rose-600/40 flex items-center gap-1 backdrop-blur-md">
                  <Zap className="w-3 h-3 fill-white" />
                  <span>FLASH SALE</span>
                </div>
              )}

              {/* Category Pill (Top Right) */}
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-slate-200 uppercase tracking-wider">
                {event.category}
              </div>

              {/* Bottom Gradient Overlay & Rating Pill */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#0d101a] via-[#0d101a]/85 to-transparent p-4 pt-12 flex items-center justify-between">
                <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10 text-xs font-bold text-amber-400 shadow-lg">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{event.rating}/10</span>
                  <span className="text-[10px] text-slate-400 font-normal">({event.votes})</span>
                </div>

                <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-500/10 backdrop-blur-md px-2 py-0.5 rounded-lg border border-cyan-500/20">
                  {event.formats[0]}
                </span>
              </div>
            </div>

            {/* Event Information Card Body */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-black text-white text-base leading-snug line-clamp-1 group-hover:text-rose-400 transition">
                  {event.title}
                </h3>
                <div className="text-xs text-slate-400 font-medium mt-1 truncate">
                  {event.languages.join(', ')} • {event.genre.slice(0, 2).join('/')}
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-2.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="truncate font-medium">{event.venue}</span>
                </div>
              </div>

              {/* Price & Book CTA Button */}
              <div className="mt-5 pt-3.5 border-t border-white/[0.06] flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Starting at</div>
                  <div className="text-sm sm:text-base font-black text-white font-mono">₹{event.priceStart.toLocaleString()}</div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectEvent(event);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-[#f84464] to-rose-600 hover:from-rose-500 hover:to-rose-400 text-white text-xs font-black rounded-xl transition shadow-md shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer transform active:scale-95 group-hover:shadow-rose-600/50"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Book in 3D</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 bg-white/[0.02] rounded-3xl border border-white/5">
          <p className="text-slate-400 text-sm font-medium">No events found matching your search.</p>
        </div>
      )}
    </section>
  );
};
