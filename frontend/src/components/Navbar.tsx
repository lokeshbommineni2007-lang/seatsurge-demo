import React, { useState } from 'react';
import { Search, MapPin, ChevronDown, User, Shield, Box, Sparkles, Film, Music, Trophy, Laugh, Compass } from 'lucide-react';

interface NavbarProps {
  currentCity: string;
  onSelectCity: (city: string) => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenWaitingRoom: () => void;
  onOpen3DArena: () => void;
  is3DArenaActive: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSimulateBotAttack?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentCity,
  onSelectCity,
  activeTab,
  onSelectTab,
  onOpenWaitingRoom,
  onOpen3DArena,
  is3DArenaActive,
  searchQuery,
  onSearchChange,
  onSimulateBotAttack
}) => {
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cities = ['Hyderabad', 'Bengaluru', 'Mumbai', 'Delhi-NCR', 'Chennai'];
  
  const categories = [
    { name: 'All Events', icon: Compass },
    { name: 'Movies', icon: Film },
    { name: 'Concerts', icon: Music },
  ];

  return (
    <header className="sticky top-0 z-40 select-none transition-all">
      {/* Top Main Navigation Bar */}
      <div className="bg-[#070912]/90 backdrop-blur-2xl border-b border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <div
            onClick={() => onSelectTab('All Events')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#f84464] via-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-600/30 group-hover:scale-105 group-hover:shadow-rose-600/50 transition-all duration-300">
                <Film className="w-5 h-5 text-white stroke-[2.5]" />
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full border-2 border-[#070912] animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white group-hover:text-rose-400 transition">
                  Seat<span className="text-[#f84464]">Surge</span>
                </span>
                <span className="text-[10px] font-extrabold font-mono tracking-wider px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                  PRO
                </span>
              </div>
              <div className="text-[10px] font-medium text-slate-400 -mt-0.5 tracking-wide">
                Hyderabad Cinema & Concert Arenas
              </div>
            </div>
          </div>

          {/* Global Search Bar (BookMyShow Style with ⌘K) */}
          <div className="flex-1 max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg relative hidden md:block">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search movies, multiplexes, concerts..."
              className="w-full bg-white/[0.04] hover:bg-white/[0.07] focus:bg-white/[0.08] text-xs lg:text-sm text-slate-100 pl-11 pr-14 py-2.5 rounded-2xl border border-white/10 focus:border-rose-500/70 focus:outline-none transition-all placeholder:text-slate-500 font-medium shadow-inner"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 pointer-events-none">
              ⌘K
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* City Selector */}
            <div className="relative">
              <button
                onClick={() => setShowCityDropdown(!showCityDropdown)}
                className="flex items-center gap-2 text-xs font-bold text-slate-200 hover:text-white px-3.5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition cursor-pointer shadow-sm"
              >
                <MapPin className="w-3.5 h-3.5 text-[#f84464]" />
                <span>{currentCity}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showCityDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showCityDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-[#0e111d]/95 border border-white/10 rounded-2xl shadow-2xl py-1.5 z-50 backdrop-blur-2xl animate-in fade-in zoom-in-95">
                  <div className="px-4 py-1.5 text-[10px] uppercase font-mono font-bold text-slate-500 tracking-wider">
                    Select Location
                  </div>
                  {cities.map((city) => (
                    <button
                      key={city}
                      onClick={() => {
                        onSelectCity(city);
                        setShowCityDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-white/5 transition flex items-center justify-between cursor-pointer ${
                        city === currentCity ? 'text-rose-400 bg-rose-500/10' : 'text-slate-300'
                      }`}
                    >
                      <span>{city}</span>
                      {city === currentCity && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3D Arena CTA */}
            <button
              onClick={onOpen3DArena}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 ${
                is3DArenaActive
                  ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 shadow-cyan-500/30 ring-2 ring-cyan-400/50'
                  : 'bg-gradient-to-r from-[#f84464] to-rose-600 hover:from-rose-500 hover:to-rose-400 text-white shadow-rose-600/30 hover:shadow-rose-600/50'
              }`}
            >
              <Box className="w-4 h-4" />
              <span className="hidden sm:inline">{is3DArenaActive ? 'Viewing 3D Arena' : '3D Seat Arena'}</span>
              <span className="sm:hidden">3D</span>
            </button>

            {/* Virtual Waiting Room Demo */}
            <button
              onClick={onOpenWaitingRoom}
              className="p-2.5 sm:px-3 sm:py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/10 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
              title="Open Redis Lua Virtual Waiting Room"
            >
              <Shield className="w-4 h-4 text-indigo-400" />
              <span className="hidden lg:inline">Queue Demo</span>
            </button>

            {/* AI Bot Screener Test Button */}
            {onSimulateBotAttack && (
              <button
                onClick={onSimulateBotAttack}
                className="px-3 py-2.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/35 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm shadow-rose-500/20"
                title="Test FastAPI Machine Learning Bot Screener on Render"
              >
                <Sparkles className="w-4 h-4 text-rose-400 animate-pulse" />
                <span className="hidden sm:inline">Test AI Bot Screener</span>
                <span className="sm:hidden">Bot Test</span>
              </button>
            )}

            {/* User Profile Avatar */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer hover:border-white/20">
              <User className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Sub Navigation Bar: Category Pills & Engine Status */}
      <div className="bg-[#05070c]/85 backdrop-blur-xl border-b border-white/[0.04] px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-12 text-xs font-semibold overflow-x-auto no-scrollbar">
          
          {/* Categories */}
          <div className="flex items-center gap-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeTab === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => onSelectTab(cat.name)}
                  className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/40 font-bold shadow-sm shadow-rose-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-rose-400' : 'text-slate-500'}`} />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* BookMyShow Quick Links & Live Status */}
          <div className="hidden lg:flex items-center gap-5 text-xs text-slate-400 font-medium">
            <span className="hover:text-white cursor-pointer transition">ListYourShow</span>
            <span className="hover:text-white cursor-pointer transition">Corporates</span>
            <span className="hover:text-white cursor-pointer transition">Offers</span>
            <span className="hover:text-white cursor-pointer transition">Gift Cards</span>
            <span className="h-3 w-px bg-white/10" />
            <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Redis Lua Lock Engine Online</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
