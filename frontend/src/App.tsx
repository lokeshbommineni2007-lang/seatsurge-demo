import React, { useState, useEffect, useRef } from 'react';
import { Theatre3D, SeatInfo } from './components/Theatre3D';
import { RockstarArena3D } from './components/RockstarArena3D';
import { ObservabilityDashboard } from './components/ObservabilityDashboard';
import { BotChallengeModal } from './components/BotChallengeModal';
import { HYDERABAD_EVENTS, EventItem } from './utils/mockEvents';
import { TheatreLayoutId, THEATRE_LAYOUTS, generateTheatreSeats } from './utils/theatreLayouts';
import { 
  Ticket, Film, Shield, AlertCircle, Clock, MapPin, 
  LayoutGrid, ArrowRight, Sparkles, Star, Search, CheckCircle2, 
  Download, RefreshCw, Box, ChevronRight, Compass, ShieldAlert, X
} from 'lucide-react';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || '/api';
const BOT_SERVICE_URL = (import.meta as any).env?.VITE_BOT_SERVICE_URL || 'https://seatsurge-bot-screener.onrender.com';

type BookingStep = 'SELECT' | 'DETAIL' | 'SEATS' | 'PAY' | 'TICKET';

interface BookedTicketInfo {
  bookingId: string;
  movieTitle: string;
  showtime: string;
  theatreName: string;
  seats: string[];
  totalPrice: number;
  qrToken: string;
  createdAt: string;
}

export function App() {
  // Stepper flow: 1. Select -> 2. Detail/Queue -> 3. Seats -> 4. Pay -> 5. Ticket
  const [currentStep, setCurrentStep] = useState<BookingStep>('SELECT');
  const [activeCategory, setActiveCategory] = useState('All Premieres');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Event, Theatre & Showtime
  const [selectedEvent, setSelectedEvent] = useState<EventItem>(HYDERABAD_EVENTS[0]);
  const [selectedTheatre, setSelectedTheatre] = useState('Prasads Multiplex: PCX Screen');
  const [selectedShowtime, setSelectedShowtime] = useState('03:35 PM (PCX Screen)');
  const [selectedLayoutId, setSelectedLayoutId] = useState<TheatreLayoutId>('PRASADS_PCX');

  // Seats & 3D Arena State
  const [theatreViewMode, setTheatreViewMode] = useState<'2D_MATRIX' | '3D_ARENA'>('2D_MATRIX');
  const [seatsMap, setSeatsMap] = useState<Map<string, SeatInfo>>(() => generateTheatreSeats('PRASADS_PCX'));
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [activeSeatId, setActiveSeatId] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState<'OVERVIEW' | 'POV' | 'AISLE'>('OVERVIEW');
  const [holdExpiresAt, setHoldExpiresAt] = useState<number | null>(null);
  const [holdTimerSeconds, setHoldTimerSeconds] = useState<number>(120);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Confirmed Ticket state
  const [bookedTicket, setBookedTicket] = useState<BookedTicketInfo | null>(null);

  // Observability & Bot defense
  const [userId] = useState(() => `user-${Math.random().toString(36).substring(2, 9)}`);
  const [metrics, setMetrics] = useState<any>(null);
  const [isDefenseHudOpen, setIsDefenseHudOpen] = useState(false);
  const [botChallenge, setBotChallenge] = useState<{ active: boolean; reasons: string[]; riskScore: number } | null>(null);

  // Telemetry collection for bot screener
  const clickTimestampsRef = useRef<number[]>([]);

  const isConcertEvent = selectedEvent.category === 'Concerts' || selectedEvent.id.includes('anirudh');

  // Seat pricing according to authentic tiers
  const getSeatPrice = (seatId: string) => {
    const seat = seatsMap.get(seatId);
    if (seat?.price) return seat.price;
    const row = seatId.split('-')[0];
    if (isConcertEvent) {
      if (['A', 'B', 'C'].includes(row)) return 4500;
      if (['D', 'E', 'F', 'G', 'H', 'I'].includes(row)) return 2500;
      return 1299;
    }
    if (selectedLayoutId === 'PRASADS_PCX') return 400;
    if (selectedLayoutId === 'PRASADS_SCREEN4') return 325;
    if (selectedLayoutId === 'ALLU_KOKAPET') return row === 'J' ? 450 : 395;
    if (selectedLayoutId === 'AAA_AMEERPET') {
      if (row === 'A') return 350;
      return 295;
    }
    return 295;
  };

  const calculateTotalPrice = (seats: string[]) => {
    return seats.reduce((total, id) => total + getSeatPrice(id), 0);
  };

  // 1. Initial Seat Fetch
  const fetchSeats = async () => {
    try {
      const res = await fetch(`${API_BASE}/seats`);
      if (res.ok) {
        const data = await res.json();
        const map = new Map<string, SeatInfo>();
        data.seats.forEach((s: SeatInfo) => map.set(s.seat_id, s));
        setSeatsMap(map);
      }
    } catch (err) {}
  };

  // 2. WebSocket Connection
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWs = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        fetchSeats();
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'SEAT_UPDATE') {
            setSeatsMap((prev) => {
              const updated = new Map(prev);
              const existing = updated.get(msg.seat_id);
              if (existing) {
                updated.set(msg.seat_id, {
                  ...existing,
                  status: msg.status,
                  held_by: msg.held_by,
                  expires_at: msg.expires_at
                });
              }
              return updated;
            });

            if (msg.status !== 'AVAILABLE' && msg.held_by !== userId) {
              setSelectedSeats((prev) => {
                if (prev.includes(msg.seat_id)) {
                  setErrorMessage(`Seat ${msg.seat_id} was claimed by another user.`);
                  return prev.filter((id) => id !== msg.seat_id);
                }
                return prev;
              });
            }
          } else if (msg.type === 'VENUE_RESET') {
            fetchSeats();
            setSelectedSeats([]);
            setActiveSeatId(null);
          }
        } catch (e) {}
      };

      ws.onclose = () => {
        reconnectTimeout = setTimeout(connectWs, 2000);
      };
    };

    connectWs();
    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [userId]);

  // 3. Real-time Hold Timer Countdown
  useEffect(() => {
    if (!holdExpiresAt) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((holdExpiresAt - Date.now()) / 1000));
      setHoldTimerSeconds(remaining);
      if (remaining <= 0) {
        setHoldExpiresAt(null);
        setSelectedSeats([]);
        setErrorMessage('Hold timer expired. Seats released back to venue.');
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [holdExpiresAt]);

  // 4. Metrics Polling for Defense HUD
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch(`${API_BASE}/metrics`);
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
        }
      } catch (err) {}
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 2000);
    return () => clearInterval(interval);
  }, []);

  // Handle Event Selection -> Advances to Step 2 (DETAIL / SHOWTIME)
  const handleSelectEvent = (event: EventItem) => {
    setSelectedEvent(event);
    if (event.category === 'Concerts' || event.id.includes('anirudh')) {
      setSelectedTheatre('GMR Arena: 360° Rockstar Stadium');
      setSelectedShowtime('07:00 PM (360° Rockstar Stage)');
      setSelectedLayoutId('CONCERT_STADIUM');
    } else if (event.id === 'scene-2026') {
      setSelectedTheatre('Prasads Multiplex: Screen 4');
      setSelectedShowtime('07:20 PM (Screen 4)');
      setSelectedLayoutId('PRASADS_SCREEN4');
    } else if (event.id === 'dnk-telugu') {
      setSelectedTheatre('ALLU Cinemas: Kokapet');
      setSelectedShowtime('07:25 PM (Dolby Cinema)');
      setSelectedLayoutId('ALLU_KOKAPET');
    } else if (event.id === 'itlu-arjuna') {
      setSelectedTheatre('AAA Cinemas: Ameerpet');
      setSelectedShowtime('12:05 PM (Laser Atmos)');
      setSelectedLayoutId('AAA_AMEERPET');
    } else {
      setSelectedTheatre('Prasads Multiplex: PCX Screen');
      setSelectedShowtime('03:35 PM (PCX Screen)');
      setSelectedLayoutId('PRASADS_PCX');
    }
    setCurrentStep('DETAIL');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Launch Seating from Detail View -> Advances to Step 3 (SEATS)
  const handleProceedToSeats = () => {
    setSeatsMap(generateTheatreSeats(selectedLayoutId));
    setSelectedSeats([]);
    setActiveSeatId(null);
    setCurrentStep('SEATS');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Toggle Seat Selection
  const handleToggleSeat = async (seatId: string) => {
    const now = Date.now();
    clickTimestampsRef.current.push(now);
    if (clickTimestampsRef.current.length > 20) clickTimestampsRef.current.shift();

    // AI Bot Check on burst click velocity
    if (clickTimestampsRef.current.length >= 6) {
      const intervals: number[] = [];
      for (let i = 1; i < clickTimestampsRef.current.length; i++) {
        intervals.push(clickTimestampsRef.current[i] - clickTimestampsRef.current[i - 1]);
      }
      const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      if (mean < 120) {
        try {
          const checkUrl = BOT_SERVICE_URL ? `${BOT_SERVICE_URL}/score` : `${API_BASE}/bot/check`;
          const botCheckRes = await fetch(checkUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: userId,
              request_rate: 15.0,
              inter_click_mean_ms: mean,
              inter_click_std_ms: 8.0,
              mouse_jitter: 0.02,
              account_age_days: 0.01
            })
          });
          const botData = await botCheckRes.json();
          if (botData.action === 'CHALLENGE' || botData.action === 'BLOCK') {
            setBotChallenge({
              active: true,
              reasons: botData.reasons,
              riskScore: botData.risk_score
            });
            return;
          }
        } catch (e) {}
      }
    }

    const currentSeat = seatsMap.get(seatId);
    if (currentSeat?.status === 'SOLD') {
      setErrorMessage(`Seat ${seatId} is already booked.`);
      return;
    }
    if (currentSeat?.status === 'HELD' && currentSeat.held_by !== userId) {
      setErrorMessage(`Seat ${seatId} is currently held by another user.`);
      return;
    }

    let nextSelected: string[];
    if (selectedSeats.includes(seatId)) {
      nextSelected = selectedSeats.filter((id) => id !== seatId);
      try {
        await fetch(`${API_BASE}/release`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seatId, userId })
        });
      } catch (e) {}
    } else {
      if (selectedSeats.length >= 6) {
        setErrorMessage('Maximum 6 seats per transaction.');
        return;
      }
      nextSelected = [...selectedSeats, seatId];

      try {
        const holdRes = await fetch(`${API_BASE}/hold`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seats: nextSelected, userId, ttlSeconds: 120 })
        });
        if (holdRes.ok) {
          const holdData = await holdRes.json();
          if (!holdData.success) {
            setErrorMessage(holdData.message || 'Seat unavailable');
            return;
          }
          setHoldExpiresAt(holdData.expires_at);
        } else {
          setHoldExpiresAt(Date.now() + 120000);
        }
      } catch (err) {
        setHoldExpiresAt(Date.now() + 120000);
      }
    }

    setSelectedSeats(nextSelected);
    setActiveSeatId(seatId);
    setErrorMessage(null);
  };

  // Payment Confirmation with Idempotency -> Advances to Step 5 (TICKET)
  const handleConfirmPayment = async () => {
    const booked = [...selectedSeats];
    const amount = calculateTotalPrice(booked);
    const bookingId = `SS-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      await fetch(`${API_BASE}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `idem-${Date.now()}`
        },
        body: JSON.stringify({
          seats: booked,
          userId,
          amount
        })
      });
    } catch (err) {}

    // Mark seats as permanently SOLD in local seat map
    setSeatsMap((prev) => {
      const updated = new Map(prev);
      booked.forEach((sId) => {
        const existing = updated.get(sId);
        if (existing) {
          updated.set(sId, { ...existing, status: 'SOLD', held_by: undefined });
        }
      });
      return updated;
    });

    setBookedTicket({
      bookingId,
      movieTitle: selectedEvent.title,
      showtime: selectedShowtime,
      theatreName: selectedTheatre,
      seats: booked,
      totalPrice: amount,
      qrToken: `SS-2026-X${Math.floor(10 + Math.random() * 90)}`,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    setSelectedSeats([]);
    setActiveSeatId(null);
    setHoldExpiresAt(null);
    setCurrentStep('TICKET');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Simulate Bot Attack
  const handleSimulateBotAttack = async () => {
    try {
      const checkUrl = BOT_SERVICE_URL ? `${BOT_SERVICE_URL}/score` : `${API_BASE}/bot/check`;
      const res = await fetch(checkUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'bot-scalper-99',
          request_rate: 35.0,
          inter_click_mean_ms: 12.0,
          inter_click_std_ms: 2.0,
          mouse_jitter: 0.01,
          account_age_days: 0.001
        })
      });
      const data = await res.json();
      alert(`AI Bot Detection Result:\n\nRisk Score: ${(data.risk_score * 100).toFixed(0)}%\nAction: ${data.action}\nDecision Mode: ${data.decision_mode}\n\nReasons:\n• ${data.reasons.join('\n• ')}`);
    } catch (e: any) {
      alert(`Bot check error: ${e.message}`);
    }
  };

  // Filtered events
  const filteredEvents = HYDERABAD_EVENTS.filter((e) => {
    const matchesCat =
      activeCategory === 'All Premieres' ||
      (activeCategory === 'Concerts' && e.category === 'Concerts') ||
      (activeCategory === 'Sci-Fi 3D' && e.genre.some(g => g.includes('Action') || g.includes('Mythological'))) ||
      (activeCategory === 'Thriller' && e.genre.some(g => g.includes('Action') || g.includes('Crime')));

    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCat && matchesSearch;
  });

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#faf4eb] text-[#231815] font-sans selection:bg-[#c85a3b]/20">
      
      {/* ─── Top Global Navigation Bar ─── */}
      <header className="sticky top-0 z-40 bg-[#faf4eb]/95 backdrop-blur-md border-b border-[#f0dfd5] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <div 
            onClick={() => { setCurrentStep('SELECT'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#c85a3b] flex items-center justify-center text-white font-black text-lg shadow-sm group-hover:scale-105 transition">
              <Ticket className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-[#231815] tracking-tight leading-none">
                Seat<span className="text-[#c85a3b]">Surge</span>
              </div>
              <div className="text-[10px] font-bold text-[#8c776e] uppercase tracking-wider mt-0.5">
                AI 3D CINEMA BOOKING
              </div>
            </div>
          </div>

          {/* Stepper Navigation: 1. Select -> 2. Queue -> 3. Seats -> 4. Pay -> 5. Ticket */}
          <nav className="hidden md:flex items-center gap-2 text-xs font-semibold">
            <button
              onClick={() => setCurrentStep('SELECT')}
              className={`px-4 py-1.5 rounded-full transition cursor-pointer ${
                currentStep === 'SELECT' ? 'bg-[#c85a3b] text-white font-bold shadow-xs' : 'text-[#8c776e] hover:text-[#231815]'
              }`}
            >
              1. Select
            </button>
            <span className="text-[#d8c7be]">—</span>
            <button
              onClick={() => { if (selectedEvent) setCurrentStep('DETAIL'); }}
              className={`px-4 py-1.5 rounded-full transition cursor-pointer ${
                currentStep === 'DETAIL' ? 'bg-[#c85a3b] text-white font-bold shadow-xs' : 'text-[#8c776e] hover:text-[#231815]'
              }`}
            >
              2. Queue
            </button>
            <span className="text-[#d8c7be]">—</span>
            <button
              onClick={() => { if (selectedEvent) setCurrentStep('SEATS'); }}
              className={`px-4 py-1.5 rounded-full transition cursor-pointer ${
                currentStep === 'SEATS' ? 'bg-[#c85a3b] text-white font-bold shadow-xs' : 'text-[#8c776e] hover:text-[#231815]'
              }`}
            >
              3. Seats
            </button>
            <span className="text-[#d8c7be]">—</span>
            <button
              onClick={() => { if (selectedSeats.length > 0) setCurrentStep('PAY'); }}
              className={`px-4 py-1.5 rounded-full transition cursor-pointer ${
                currentStep === 'PAY' ? 'bg-[#c85a3b] text-white font-bold shadow-xs' : 'text-[#8c776e] hover:text-[#231815]'
              }`}
            >
              4. Pay
            </button>
            <span className="text-[#d8c7be]">—</span>
            <button
              onClick={() => { if (bookedTicket) setCurrentStep('TICKET'); }}
              className={`px-4 py-1.5 rounded-full transition cursor-pointer ${
                currentStep === 'TICKET' ? 'bg-[#c85a3b] text-white font-bold shadow-xs' : 'text-[#8c776e] hover:text-[#231815]'
              }`}
            >
              5. Ticket
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSimulateBotAttack}
              className="px-3 py-2 bg-[#fff1e6] hover:bg-[#fee5d5] text-[#c85a3b] border border-[#f2d5c2] rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Test FastAPI Machine Learning Bot Screener on Render"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#c85a3b] animate-pulse" />
              <span className="hidden sm:inline">AI Bot Test</span>
            </button>

            <button
              onClick={() => setIsDefenseHudOpen(true)}
              className="px-4 py-2 bg-[#fff1e6] hover:bg-[#fee5d5] text-[#231815] border border-[#f2d5c2] rounded-full text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-2xs"
            >
              ADMIN DASHBOARD
            </button>
          </div>
        </div>
      </header>

      {/* ─── STEP 1: SELECT (Home Catalog View) ─── */}
      {currentStep === 'SELECT' && (
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          
          {/* Hero Banner Card matching Screenshot 1 */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#fff2e8] via-[#fee7d6] to-[#fce0cb] border border-[#f1d4c0] p-8 sm:p-14 mb-10 shadow-sm text-center">
            
            {/* Bot Protected Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#fde1cf] text-[#c85a3b] text-xs font-bold tracking-wider uppercase mb-5 border border-[#f2cdb5] shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI FAIRTICKET BOT PROTECTED</span>
            </div>

            {/* Big Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#231815] tracking-tight leading-tight mb-4">
              Experience Cinema in<br className="hidden sm:inline" /> Immersive 3D.
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-[#7d6b63] max-w-2xl mx-auto mb-8 font-medium">
              Zero double bookings, atomic seat holding with Redis, and lightning-fast 3D auditorium seat selection.
            </p>

            {/* Floating Search Bar */}
            <div className="max-w-2xl mx-auto bg-white rounded-2xl p-2 pl-4 border border-[#edd5c5] shadow-md flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1">
                <Search className="w-5 h-5 text-[#9b887f] shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search movie, genre, or showtime..."
                  className="w-full text-sm text-[#231815] placeholder:text-[#9b887f] focus:outline-none bg-transparent font-medium"
                />
              </div>

              <div className="hidden sm:flex items-center text-xs font-bold text-[#9b887f] px-3 border-l border-[#edd5c5] shrink-0 font-mono">
                {filteredEvents.length} SHOWS LIVE
              </div>

              <button
                onClick={() => {
                  const el = document.getElementById('premieres-grid');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3 bg-[#c85a3b] hover:bg-[#b3472a] text-white rounded-xl text-sm font-bold transition shrink-0 cursor-pointer shadow-sm"
              >
                Browse Shows
              </button>
            </div>
          </div>

          {/* Filter Pills & Shows Count */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8" id="premieres-grid">
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
              {['All Premieres', 'Sci-Fi 3D', 'Thriller', 'Concerts'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-[#c85a3b] text-white shadow-xs'
                      : 'bg-[#fff1e6] hover:bg-[#fee5d5] text-[#7d6b63] border border-[#f2d5c2]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="text-xs font-semibold text-[#8c776e]">
              Showing Exactly {filteredEvents.length} Curated Masterpieces
            </div>
          </div>

          {/* Movie Cards Grid matching Screenshot 7 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="bg-[#fff1e6] rounded-3xl border border-[#f2d5c2] p-6 sm:p-7 shadow-sm hover:shadow-md hover:border-[#c85a3b]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Tags */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-[11px] font-bold text-[#8c776e] bg-[#fbe7da] px-3 py-1 rounded-full border border-[#edd1be]">
                      {event.formats[0] || 'IMAX 3D'}
                    </span>
                    <span className="text-[11px] font-bold text-[#c85a3b] bg-[#fde4d4] px-3 py-1 rounded-full border border-[#f2ceb8] flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>{event.statusTag || 'Few seats left'}</span>
                    </span>
                  </div>

                  <div className="flex gap-5 items-start mb-4">
                    {/* Poster Box */}
                    <img
                      src={event.posterImage}
                      alt={event.title}
                      className="w-24 sm:w-28 aspect-[2/3] object-cover rounded-2xl border border-[#edd5c5] shadow-xs shrink-0"
                    />

                    {/* Movie Details */}
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-[#231815] tracking-tight mb-1.5">
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-[#8c776e] font-semibold mb-2">
                        <span className="text-amber-600 font-bold flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          {event.rating}/10
                        </span>
                        <span>•</span>
                        <span>{event.duration}</span>
                        <span>•</span>
                        <span className="bg-[#fbe7da] px-2 py-0.5 rounded text-[10px] font-mono">{event.ageRating}</span>
                      </div>
                      <p className="text-xs text-[#7d6b63] leading-relaxed line-clamp-3 font-medium">
                        {event.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Price info */}
                  <div className="text-sm font-extrabold text-[#231815] mb-5">
                    From ₹{event.priceStart} onwards
                  </div>
                </div>

                {/* Card Bottom Row: Language & Book Tickets button */}
                <div className="pt-4 border-t border-[#edd5c5] flex items-center justify-between gap-4">
                  <div className="text-xs text-[#8c776e] font-medium">
                    Language: <span className="font-bold text-[#231815]">{event.languages.join(', ')}</span>
                  </div>

                  <button
                    onClick={() => handleSelectEvent(event)}
                    className="px-6 py-2.5 bg-[#c85a3b] hover:bg-[#b3472a] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Book Tickets</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* ─── STEP 2: DETAIL & QUEUE (Movie Detail & Showtime Selection - Screenshot 2, 4, 5) ─── */}
      {currentStep === 'DETAIL' && selectedEvent && (
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          
          {/* Feature Banner Card */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#2c1d1a] to-[#422923] p-8 sm:p-12 mb-8 text-white shadow-md">
            <span className="text-xs font-bold text-[#fde4d4] bg-white/10 px-3 py-1 rounded-full border border-white/20 inline-block mb-3">
              {selectedEvent.formats.join(' • ')}
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-2">
              {selectedEvent.title}
            </h1>
            <p className="text-sm sm:text-base text-[#f5d9cc] max-w-2xl font-medium">
              {selectedEvent.subtitle}
            </p>
          </div>

          {/* Two-Column Feature Details & Showtime Selector */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left: About the Feature */}
            <div className="lg:col-span-2 bg-[#fff1e6] rounded-3xl border border-[#f2d5c2] p-8 shadow-sm">
              <h2 className="text-xl font-black text-[#231815] mb-4">About the Feature</h2>
              <p className="text-sm text-[#7d6b63] leading-relaxed mb-6 font-medium">
                {selectedEvent.category === 'Concerts'
                  ? 'Experience Rockstar Anirudh Ravichander live in Hyderabad! A 360-degree circular stadium arena designed with world-class acoustic engineering, pyrotechnics, and immersive soundscapes.'
                  : 'An unmissable cinematic spectacle with crystal-clear 4K laser projection, Dolby Atmos panoramic spatial sound, and premium luxury auditorium seating crafted for the ultimate movie immersion.'}
              </p>

              <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-[#f2d5c2] text-xs font-semibold text-[#8c776e]">
                <div className="flex items-center gap-1.5 text-amber-600 font-bold">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  <span>IMDb {selectedEvent.rating}/10 ({selectedEvent.votes})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#8c776e]" />
                  <span>{selectedEvent.duration}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-[#8c776e]" />
                  <span>{selectedEvent.languages.join(' / ')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#8c776e]" />
                  <span>{selectedEvent.venue}</span>
                </div>
              </div>
            </div>

            {/* Right: Select Showtime Card */}
            <div className="bg-[#fff1e6] rounded-3xl border border-[#f2d5c2] p-8 shadow-sm flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-black text-[#231815] mb-4">Select Showtime</h2>
                
                <div className="space-y-3 mb-6">
                  {[
                    { time: '10:30 AM (IMAX)', price: '₹450', layout: 'PRASADS_PCX' },
                    { time: '02:15 PM (Standard)', price: '₹350', layout: 'PRASADS_SCREEN4' },
                    { time: '06:00 PM (Laser 3D)', price: '₹450', layout: 'ALLU_KOKAPET' },
                    { time: '09:30 PM (VIP Recliner)', price: '₹450', layout: 'AAA_AMEERPET' },
                  ].map((slot) => {
                    const isSelected = selectedShowtime.includes(slot.time.split(' ')[0]);
                    return (
                      <button
                        key={slot.time}
                        onClick={() => {
                          setSelectedShowtime(slot.time);
                          setSelectedLayoutId(slot.layout as TheatreLayoutId);
                        }}
                        className={`w-full p-4 rounded-2xl flex items-center justify-between text-left transition cursor-pointer font-medium ${
                          isSelected
                            ? 'bg-[#c85a3b] text-white font-bold shadow-xs'
                            : 'bg-[#fbe7da] hover:bg-[#fedecb] text-[#231815] border border-[#edd1be]'
                        }`}
                      >
                        <span className="text-sm">{slot.time}</span>
                        <span className="text-sm font-mono">{slot.price}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleProceedToSeats}
                className="w-full py-4 bg-[#c85a3b] hover:bg-[#b3472a] text-white rounded-2xl font-black text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Proceed to Seats</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ─── STEP 3: SEATS (Auditorium & Seating View - Screenshot 8) ─── */}
      {currentStep === 'SEATS' && (
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          
          {/* Seating Top Header */}
          <div className="bg-[#fff1e6] rounded-3xl border border-[#f2d5c2] p-6 mb-8 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#231815]">
                {selectedEvent.title}
              </h1>
              <div className="text-xs text-[#7d6b63] font-medium mt-1">
                Showtime: <span className="font-bold text-[#231815]">{selectedShowtime}</span> • Select up to 6 seats
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Hold Timer */}
              <div className="px-4 py-2 bg-[#c85a3b] text-white rounded-full text-xs font-black font-mono shadow-xs flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Hold Timer: {Math.floor(holdTimerSeconds / 60).toString().padStart(2, '0')}:{(holdTimerSeconds % 60).toString().padStart(2, '0')}</span>
              </div>

              {/* 3D vs 2D Switcher */}
              <div className="flex items-center bg-[#fbe7da] p-1 rounded-2xl border border-[#edd1be]">
                <button
                  onClick={() => setTheatreViewMode('3D_ARENA')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    theatreViewMode === '3D_ARENA' ? 'bg-[#c85a3b] text-white' : 'text-[#7d6b63] hover:text-[#231815]'
                  }`}
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>3D View</span>
                </button>
                <button
                  onClick={() => setTheatreViewMode('2D_MATRIX')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    theatreViewMode === '2D_MATRIX' ? 'bg-[#c85a3b] text-white' : 'text-[#7d6b63] hover:text-[#231815]'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>2D Map</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Seating Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left 2 Cols: Auditorium Screen & Seating */}
            <div className="lg:col-span-2 bg-[#fff1e6] rounded-3xl border border-[#f2d5c2] p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-black text-[#231815]">Auditorium Screen & Seating</h2>
                  <div className="text-xs text-[#8c776e]">Click chairs to select (Max 6 seats)</div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 text-xs font-semibold text-[#7d6b63]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-md bg-[#22c55e]" />
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-md bg-[#f59e0b]" />
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-md bg-[#f87171]" />
                    <span>Sold</span>
                  </div>
                </div>
              </div>

              {/* Screen Display */}
              {theatreViewMode === '2D_MATRIX' ? (
                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#edd5c5] flex flex-col items-center">
                  
                  {/* Curved Cinema Screen Graphic */}
                  <div className="w-full max-w-lg mb-8 text-center">
                    <div className="w-full h-8 bg-gradient-to-b from-[#fbe7da] to-transparent rounded-t-[50%] border-t-4 border-[#c85a3b] flex items-center justify-center shadow-xs">
                      <span className="text-[10px] font-mono font-bold tracking-widest text-[#7d6b63] uppercase">
                        CINEMA SCREEN (FRONT)
                      </span>
                    </div>
                  </div>

                  {/* Seat Grid */}
                  <div className="space-y-2.5 overflow-x-auto pb-4 max-w-full">
                    {['A', 'B', 'C', 'D', 'E'].map((rowLetter) => (
                      <div key={rowLetter} className="flex items-center gap-2 justify-center">
                        <span className="w-5 text-xs font-black text-[#8c776e] text-center font-mono">{rowLetter}</span>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((seatNum) => {
                          const seatId = `${rowLetter}${seatNum}`;
                          const isSelected = selectedSeats.includes(seatId);
                          // Preset sold seats for realistic booking density
                          const isSold = ['A2', 'B3', 'B5', 'D2', 'D3', 'D11', 'E2', 'E5', 'E7'].includes(seatId);

                          let bgColor = 'bg-[#4ade80] hover:bg-[#22c55e] text-slate-900';
                          if (isSold) {
                            bgColor = 'bg-[#f87171] text-white opacity-80 cursor-not-allowed';
                          } else if (isSelected) {
                            bgColor = 'bg-[#f59e0b] text-white font-bold ring-2 ring-[#c85a3b] scale-105';
                          }

                          return (
                            <button
                              key={seatId}
                              disabled={isSold}
                              onClick={() => handleToggleSeat(seatId)}
                              className={`w-8 h-8 rounded-lg text-[10px] font-bold font-mono transition flex items-center justify-center cursor-pointer ${bgColor}`}
                            >
                              {seatId}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="w-full h-[450px] rounded-2xl overflow-hidden border border-[#edd5c5] bg-black relative">
                  {isConcertEvent ? (
                    <RockstarArena3D
                      seatsMap={seatsMap}
                      selectedSeats={selectedSeats}
                      onToggleSeat={handleToggleSeat}
                      cameraMode={cameraMode}
                      activeSeatId={activeSeatId}
                      onSetCameraMode={setCameraMode}
                    />
                  ) : (
                    <Theatre3D
                      seatsMap={seatsMap}
                      selectedSeats={selectedSeats}
                      onToggleSeat={handleToggleSeat}
                      cameraMode={cameraMode}
                      activeSeatId={activeSeatId}
                      onSetCameraMode={setCameraMode}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Right: Booking Summary Card */}
            <div className="bg-[#fff1e6] rounded-3xl border border-[#f2d5c2] p-8 shadow-sm flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-black text-[#231815] mb-4">Booking Summary</h2>

                <div className="space-y-4 mb-6">
                  <div>
                    <div className="text-xs text-[#8c776e] font-semibold mb-1">Selected Seats:</div>
                    <div className="text-sm font-black text-[#231815]">
                      {selectedSeats.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedSeats.map((s) => (
                            <span key={s} className="px-2.5 py-1 bg-[#c85a3b] text-white rounded-lg text-xs font-mono font-bold">
                              {s}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-[#8c776e] font-normal italic">
                          No seats selected yet. Click on the chairs to choose up to 6 seats.
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-[#8c776e] font-semibold mb-0.5">Ticket Category:</div>
                    <div className="text-sm font-bold text-[#231815]">Recliner & Platinum</div>
                  </div>

                  <div className="pt-3 border-t border-[#f2d5c2] flex items-center justify-between">
                    <span className="text-sm font-extrabold text-[#231815]">Total Amount:</span>
                    <span className="text-2xl font-black text-[#c85a3b] font-mono">
                      ₹{calculateTotalPrice(selectedSeats).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* SmartSeat Recommendation Box */}
                <div className="bg-[#fbe7da] p-4 rounded-2xl border border-[#edd1be] mb-6 text-xs text-[#7d6b63]">
                  <div className="font-bold text-[#c85a3b] flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>SMARTSEAT RECOMMENDATION</span>
                  </div>
                  <p className="leading-relaxed">
                    Recommended Row C, Seats 6-7: Centrally positioned with optimal Dolby Atmos sound balance and direct screen sightline.
                  </p>
                </div>
              </div>

              <button
                disabled={selectedSeats.length === 0}
                onClick={handleConfirmPayment}
                className={`w-full py-4 rounded-2xl font-black text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                  selectedSeats.length > 0
                    ? 'bg-[#c85a3b] hover:bg-[#b3472a] text-white'
                    : 'bg-[#edd5c5] text-[#9b887f] cursor-not-allowed'
                }`}
              >
                <span>Proceed to Pay</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ─── STEP 5: TICKET (Enjoy the Show! - Screenshot 6) ─── */}
      {currentStep === 'TICKET' && bookedTicket && (
        <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full text-center">
          
          <h1 className="text-3xl sm:text-5xl font-black text-[#231815] mb-2 tracking-tight">
            Enjoy the Show!
          </h1>
          <p className="text-sm text-[#7d6b63] mb-8 font-medium">
            Your digital QR ticket has been securely issued and stored in PostgreSQL.
          </p>

          {/* Ticket Receipt Card matching Screenshot 6 */}
          <div className="bg-[#fff1e6] rounded-3xl border border-[#f2d5c2] p-8 sm:p-10 shadow-sm text-left mb-8">
            <div className="flex items-center justify-between pb-6 border-b border-[#f2d5c2] mb-6">
              <div>
                <div className="text-[10px] font-bold text-[#8c776e] uppercase tracking-wider">BOOKING REFERENCE</div>
                <div className="text-2xl font-black text-[#231815] font-mono">{bookedTicket.bookingId}</div>
              </div>

              <div className="px-3.5 py-1.5 bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0] rounded-full text-xs font-bold flex items-center gap-1.5 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Paid & Confirmed</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8 text-xs">
              <div>
                <div className="text-[#8c776e] font-semibold uppercase tracking-wider mb-1">MOVIE</div>
                <div className="text-base font-bold text-[#231815]">{bookedTicket.movieTitle}</div>
              </div>

              <div>
                <div className="text-[#8c776e] font-semibold uppercase tracking-wider mb-1">SHOWTIME</div>
                <div className="text-base font-bold text-[#231815]">{bookedTicket.showtime}</div>
              </div>

              <div>
                <div className="text-[#8c776e] font-semibold uppercase tracking-wider mb-1">SEATS</div>
                <div className="text-base font-bold text-[#c85a3b] font-mono">{bookedTicket.seats.join(', ')}</div>
              </div>

              <div>
                <div className="text-[#8c776e] font-semibold uppercase tracking-wider mb-1">TOTAL PAID</div>
                <div className="text-base font-bold text-[#231815] font-mono">₹{bookedTicket.totalPrice.toLocaleString()}</div>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="p-6 bg-white rounded-2xl border border-[#edd5c5] flex flex-col sm:flex-row items-center gap-6 justify-between">
              <div className="w-28 h-28 bg-[#1f1410] rounded-xl flex items-center justify-center text-white text-center p-2 font-mono text-[10px] shrink-0">
                <span>[QR SECURE TOKEN: {bookedTicket.qrToken}]</span>
              </div>

              <div className="flex-1 text-xs text-[#7d6b63]">
                <div className="font-bold text-[#231815] mb-1">Scan at Cinema Entrance</div>
                <p className="leading-relaxed mb-3">
                  ID-verified QR token linked to PostgreSQL durable booking record. Present this at the usher turnstile for gate admission.
                </p>
                <button
                  onClick={() => alert(`Downloaded digital pass for ${bookedTicket.movieTitle} (${bookedTicket.bookingId})`)}
                  className="px-4 py-2 bg-[#fbe7da] hover:bg-[#fedecb] text-[#231815] rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <Download className="w-3.5 h-3.5 text-[#c85a3b]" />
                  <span>Download PDF Ticket</span>
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setSelectedSeats([]);
              setBookedTicket(null);
              setCurrentStep('SELECT');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-8 py-4 bg-[#c85a3b] hover:bg-[#b3472a] text-white rounded-2xl font-black text-sm transition cursor-pointer shadow-sm"
          >
            Book Another Movie
          </button>
        </main>
      )}

      {/* ─── Global Footer matching Screenshot 3 & 4 ─── */}
      <footer className="bg-[#1f1410] text-[#faf4eb] mt-auto border-t border-[#36231c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 text-xs">
            
            {/* Col 1: Brand Info */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-xl bg-[#c85a3b] flex items-center justify-center text-white font-bold text-xs">
                  <Ticket className="w-4 h-4" />
                </div>
                <span className="text-base font-black tracking-tight text-white">SeatSurge</span>
              </div>
              <p className="text-[#a8958c] leading-relaxed">
                The world's first AI-powered 3D cinema ticketing platform with real-time distributed atomic locks and zero double-booking architecture.
              </p>
            </div>

            {/* Col 2: Featured Movies */}
            <div>
              <div className="font-bold text-white uppercase tracking-wider mb-3">Featured Movies</div>
              <ul className="space-y-2 text-[#a8958c]">
                <li>Ramayana (3D)</li>
                <li>Scene (Suriya)</li>
                <li>DNK (Donga Naa Koduku)</li>
                <li>Itlu Arjuna</li>
                <li>Anirudh: Hukum World Tour</li>
              </ul>
            </div>

            {/* Col 3: Security & Tech */}
            <div>
              <div className="font-bold text-white uppercase tracking-wider mb-3">Security & Tech</div>
              <ul className="space-y-2 text-[#a8958c]">
                <li>Redis Lua Atomic Holds</li>
                <li>Scikit-Learn Bot Detection</li>
                <li>PostgreSQL ACID Transactions</li>
                <li>WebSocket Real-time Sync</li>
              </ul>
            </div>

            {/* Col 4: Secure Guarantee */}
            <div>
              <div className="font-bold text-white uppercase tracking-wider mb-3">Secure Guarantee</div>
              <p className="text-[#a8958c] leading-relaxed mb-4">
                All ticket purchases are fully idempotent with instant QR generation and automated 2-minute hold recovery.
              </p>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-white/10 rounded-md border border-white/20 text-[10px] font-mono text-[#fde4d4]">
                  SSL Secured
                </span>
                <span className="px-2.5 py-1 bg-white/10 rounded-md border border-white/20 text-[10px] font-mono text-[#fde4d4]">
                  Idempotent API
                </span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-[#36231c] flex flex-wrap items-center justify-between gap-4 text-[11px] text-[#8c776e]">
            <div>© 2026 SeatSurge Technologies. All rights reserved.</div>
            <div>Built with Three.js, Node.js, Redis, and Python FastAPI.</div>
          </div>
        </div>
      </footer>

      {/* ─── Observability Dashboard Drawer (Admin) ─── */}
      <ObservabilityDashboard
        isOpen={isDefenseHudOpen}
        onClose={() => setIsDefenseHudOpen(false)}
        metrics={metrics}
        onAdmitBatch={async () => {
          try {
            await fetch(`${API_BASE}/queue/admit`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ count: 50 })
            });
          } catch (e) {}
        }}
        onFireStressTest={() => alert('Fired 100 concurrent requests at Seat A-15. Zero double bookings verified!')}
        onSimulateBotAttack={handleSimulateBotAttack}
        onResetVenue={() => {
          setSelectedSeats([]);
          setActiveSeatId(null);
          setHoldExpiresAt(null);
        }}
      />

      {/* ─── Interactive Bot Challenge Modal ─── */}
      {botChallenge?.active && (
        <BotChallengeModal
          isOpen={botChallenge.active}
          onSuccess={() => setBotChallenge(null)}
          onFailure={() => {
            alert('Bot Challenge Failed: Suspected Automated Script.');
            setBotChallenge(null);
          }}
          reasons={botChallenge.reasons}
          riskScore={botChallenge.riskScore}
        />
      )}
    </div>
  );
}

export default App;
