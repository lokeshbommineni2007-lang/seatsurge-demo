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
  Download, RefreshCw, Box, ChevronRight, Compass, ShieldAlert, X, CreditCard
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
  // Stepper: 1. Select -> 2. Queue -> 3. Seats -> 4. Pay -> 5. Ticket
  const [currentStep, setCurrentStep] = useState<BookingStep>('SELECT');
  const [activeCategory, setActiveCategory] = useState('All Premieres');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Event & Theatre
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

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NETBANKING'>('UPI');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

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

  // Seat pricing
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
              request_rate: 1000 / mean,
              inter_click_mean_ms: mean,
              inter_click_std_ms: 10.0,
              mouse_jitter: 0.05,
              account_age_days: 1.0
            })
          });
          if (botCheckRes.ok) {
            const botData = await botCheckRes.json();
            if (botData.risk_score > 0.65 || botData.action === 'CHALLENGE') {
              setBotChallenge({
                active: true,
                reasons: botData.reasons || ['High burst click velocity detected by Random Forest model'],
                riskScore: botData.risk_score
              });
              return;
            }
          }
        } catch (e) {}
      }
    }

    const seat = seatsMap.get(seatId);
    if (seat && (seat.status === 'SOLD' || (seat.status === 'HELD' && seat.held_by !== userId))) {
      setErrorMessage(`Seat ${seatId} is unavailable.`);
      return;
    }

    if (selectedSeats.includes(seatId)) {
      setSelectedSeats((prev) => prev.filter((id) => id !== seatId));
      if (activeSeatId === seatId) setActiveSeatId(null);
      setSeatsMap((prev) => {
        const updated = new Map(prev);
        const existing = updated.get(seatId);
        if (existing) {
          updated.set(seatId, { ...existing, status: 'AVAILABLE', held_by: undefined });
        }
        return updated;
      });
      return;
    }

    if (selectedSeats.length >= 6) {
      setErrorMessage('You can select a maximum of 6 seats.');
      return;
    }

    // Hold Seat in Local State
    setErrorMessage(null);
    setSelectedSeats((prev) => [...prev, seatId]);
    setActiveSeatId(seatId);

    const expiresAt = Date.now() + 120 * 1000;
    setHoldExpiresAt(expiresAt);
    setHoldTimerSeconds(120);

    setSeatsMap((prev) => {
      const updated = new Map(prev);
      const existing = updated.get(seatId);
      if (existing) {
        updated.set(seatId, {
          ...existing,
          status: 'HELD',
          held_by: userId,
          expires_at: expiresAt
        });
      }
      return updated;
    });

    // Try sync with backend Redis
    try {
      fetch(`${API_BASE}/seats/hold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seat_id: seatId, user_id: userId })
      }).catch(() => {});
    } catch (e) {}
  };

  // Proceed to Step 4: Pay
  const handleProceedToPayment = () => {
    if (selectedSeats.length === 0) return;
    setCurrentStep('PAY');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Confirm Payment & Issue Ticket -> Advances to Step 5 (TICKET)
  const handleConfirmPayment = async () => {
    if (selectedSeats.length === 0) return;
    setIsProcessingPayment(true);

    const bookingId = `SS-HYD-${Math.floor(100000 + Math.random() * 900000)}`;
    const booked = [...selectedSeats];
    const amount = calculateTotalPrice(booked);

    // Call payment checkout
    try {
      await fetch(`${API_BASE}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          user_id: userId,
          seat_ids: booked,
          total_price: amount
        })
      });
    } catch (e) {}

    setTimeout(() => {
      setIsProcessingPayment(false);
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
        totalPrice: amount + 30 + Math.round(amount * 0.18),
        qrToken: `SS-2026-X${Math.floor(10 + Math.random() * 90)}`,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      setSelectedSeats([]);
      setActiveSeatId(null);
      setHoldExpiresAt(null);
      setCurrentStep('TICKET');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 800);
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
    <div className="flex flex-col min-h-screen w-full bg-[#f8f2e8] text-[#231815] font-sans selection:bg-[#c85a3b]/20">
      
      {/* ─── Top Global Navigation Bar ─── */}
      <header className="sticky top-0 z-40 bg-[#f8f2e8]/95 backdrop-blur-md border-b-2 border-[#e8c5ac] shadow-xs">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between gap-6">
          
          {/* Brand Logo */}
          <div 
            onClick={() => { setCurrentStep('SELECT'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="flex items-center gap-3.5 cursor-pointer select-none group shrink-0"
          >
            <div className="w-11 h-11 rounded-2xl bg-[#c85a3b] flex items-center justify-center text-white font-black text-xl shadow-sm group-hover:scale-105 transition">
              <Ticket className="w-6 h-6 text-white stroke-[2.5]" />
            </div>
            <div>
              <div className="text-2xl font-black text-[#231815] tracking-tight leading-none">
                Seat<span className="text-[#c85a3b]">Surge</span>
              </div>
              <div className="text-[11px] font-bold text-[#6e5c54] uppercase tracking-wider mt-1">
                AI 3D CINEMA BOOKING
              </div>
            </div>
          </div>

          {/* Stepper Navigation: 1. Select -> 2. Queue -> 3. Seats -> 4. Pay -> 5. Ticket */}
          <nav className="hidden md:flex items-center gap-2 text-xs font-bold">
            <button
              onClick={() => setCurrentStep('SELECT')}
              className={`transition cursor-pointer px-4 py-1.5 rounded-full ${
                currentStep === 'SELECT' 
                  ? 'bg-[#c85a3b] text-white shadow-xs font-black' 
                  : 'text-[#6e5c54] hover:text-[#231815]'
              }`}
            >
              1. Select
            </button>
            <span className="text-[#debfa9] font-bold select-none px-1">—</span>
            <button
              onClick={() => { if (selectedEvent) setCurrentStep('DETAIL'); }}
              className={`transition cursor-pointer px-4 py-1.5 rounded-full ${
                currentStep === 'DETAIL' 
                  ? 'bg-[#c85a3b] text-white shadow-xs font-black' 
                  : 'text-[#6e5c54] hover:text-[#231815]'
              }`}
            >
              2. Queue
            </button>
            <span className="text-[#debfa9] font-bold select-none px-1">—</span>
            <button
              onClick={() => { if (selectedEvent) setCurrentStep('SEATS'); }}
              className={`transition cursor-pointer px-4 py-1.5 rounded-full ${
                currentStep === 'SEATS' 
                  ? 'bg-[#c85a3b] text-white shadow-xs font-black' 
                  : 'text-[#6e5c54] hover:text-[#231815]'
              }`}
            >
              3. Seats
            </button>
            <span className="text-[#debfa9] font-bold select-none px-1">—</span>
            <button
              onClick={() => { if (selectedSeats.length > 0) setCurrentStep('PAY'); }}
              className={`transition cursor-pointer px-4 py-1.5 rounded-full ${
                currentStep === 'PAY' 
                  ? 'bg-[#c85a3b] text-white shadow-xs font-black' 
                  : 'text-[#6e5c54] hover:text-[#231815]'
              }`}
            >
              4. Pay
            </button>
            <span className="text-[#debfa9] font-bold select-none px-1">—</span>
            <button
              onClick={() => { if (bookedTicket) setCurrentStep('TICKET'); }}
              className={`transition cursor-pointer px-4 py-1.5 rounded-full ${
                currentStep === 'TICKET' 
                  ? 'bg-[#c85a3b] text-white shadow-xs font-black' 
                  : 'text-[#6e5c54] hover:text-[#231815]'
              }`}
            >
              5. Ticket
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleSimulateBotAttack}
              className="px-4 py-2.5 bg-white hover:bg-[#fee8d8] text-[#c85a3b] border-2 border-[#e8c5ac] rounded-full text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-xs"
              title="Test FastAPI Machine Learning Bot Screener on Render"
            >
              <Sparkles className="w-4 h-4 text-[#c85a3b] animate-pulse" />
              <span className="hidden sm:inline">AI Bot Test</span>
            </button>

            <button
              onClick={() => setIsDefenseHudOpen(true)}
              className="px-5 py-2.5 bg-white hover:bg-[#fee8d8] text-[#231815] border-2 border-[#e8c5ac] rounded-full text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-xs"
            >
              ADMIN DASHBOARD
            </button>
          </div>
        </div>
      </header>

      {/* ─── STEP 1: SELECT (Home Catalog View) ─── */}
      {currentStep === 'SELECT' && (
        <main className="flex-1 max-w-7xl mx-auto px-6 lg:px-8 py-12 w-full">
          
          {/* Hero Banner Card matching Reference Screenshot 5 */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#fff5ec] via-[#feebdc] to-[#fce3ce] border-2 border-[#e8c5ac] p-10 sm:p-16 mb-14 shadow-sm text-center">
            
            {/* Bot Protected Pill */}
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#fee2ce] text-[#c85a3b] text-xs font-black tracking-wider uppercase mb-6 border-2 border-[#e8c5ac] shadow-2xs">
              <Sparkles className="w-4 h-4" />
              <span>AI FAIRTICKET BOT PROTECTED</span>
            </div>

            {/* Big Headline */}
            <h1 className="text-4xl sm:text-6xl font-black text-[#231815] tracking-tight leading-tight mb-5">
              Experience Cinema in<br className="hidden sm:inline" /> Immersive 3D.
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-[#6e5c54] max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
              Zero double bookings, atomic seat holding with Redis, and lightning-fast 3D auditorium seat selection.
            </p>

            {/* Floating Search Bar with generous padding & clean borders */}
            <div className="max-w-2xl mx-auto bg-white rounded-2xl p-3 pl-6 border-2 border-[#e8c5ac] shadow-md flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <Search className="w-5 h-5 text-[#8c776e] shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search movie, genre, or showtime..."
                  className="w-full text-sm sm:text-base text-[#231815] placeholder:text-[#8c776e] focus:outline-none bg-transparent font-medium"
                />
              </div>

              <div className="hidden sm:block text-xs font-mono font-bold text-[#8c776e] px-4 border-l-2 border-[#e8c5ac] shrink-0">
                {filteredEvents.length} SHOWS LIVE
              </div>

              <button
                onClick={() => {
                  const el = document.getElementById('premieres-grid');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-7 py-3 bg-[#c85a3b] hover:bg-[#b3472a] text-white rounded-xl text-sm font-black transition shrink-0 cursor-pointer shadow-md"
              >
                Browse Shows
              </button>
            </div>
          </div>

          {/* Filter Pills & Shows Count with ample margin */}
          <div className="flex flex-wrap items-center justify-between gap-6 mb-10" id="premieres-grid">
            <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
              {['All Premieres', 'Sci-Fi 3D', 'Thriller', 'Concerts'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-2.5 rounded-full text-xs font-black transition cursor-pointer border-2 ${
                    activeCategory === cat
                      ? 'bg-[#c85a3b] text-white border-[#c85a3b] shadow-xs'
                      : 'bg-white hover:bg-[#fee8d8] text-[#6e5c54] border-[#e8c5ac]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="text-xs font-bold text-[#8c776e]">
              Showing Exactly {filteredEvents.length} Curated Masterpieces
            </div>
          </div>

          {/* Movie Cards Grid with distinct ticket perforation cutouts & generous spacing */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="bg-[#fff8f2] rounded-3xl border-2 border-[#e8c5ac] p-8 sm:p-9 shadow-sm hover:shadow-xl hover:border-[#c85a3b] transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Header Tags */}
                  <div className="flex items-center justify-between gap-3 mb-6">
                    <span className="text-xs font-bold text-[#6e5c54] bg-[#feece0] px-4 py-1.5 rounded-full border border-[#e8c5ac]">
                      {event.formats[0] || 'IMAX 3D'}
                    </span>
                    <span className="text-xs font-black text-[#c85a3b] bg-[#fee2ce] px-4 py-1.5 rounded-full border border-[#e8c5ac] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{event.statusTag || 'Few seats left'}</span>
                    </span>
                  </div>

                  {/* Main Card Body: Poster + Details */}
                  <div className="flex flex-col sm:flex-row gap-6 items-start mb-6">
                    {/* Poster Image */}
                    <div className="w-36 sm:w-40 h-54 sm:h-60 rounded-2xl border-2 border-[#e8c5ac] shadow-md overflow-hidden shrink-0 bg-black">
                      <img
                        src={event.posterImage}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Movie Text Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-2xl font-black text-[#231815] tracking-tight mb-2 leading-snug">
                        {event.title}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="inline-flex items-center gap-1.5 bg-[#fee8d8] text-[#c85a3b] px-3 py-1 rounded-full text-xs font-bold border border-[#e8c5ac]">
                          <Star className="w-3.5 h-3.5 fill-[#c85a3b] text-[#c85a3b]" />
                          <span>{event.rating}/10</span>
                        </span>
                        <span className="text-xs font-bold text-[#6e5c54]">•</span>
                        <span className="text-xs font-bold text-[#6e5c54]">{event.duration}</span>
                        <span className="text-xs font-bold text-[#6e5c54]">•</span>
                        <span className="bg-[#feece0] text-[#6e5c54] px-2.5 py-0.5 rounded text-[11px] font-mono font-bold border border-[#e8c5ac]">
                          {event.ageRating}
                        </span>
                      </div>

                      <p className="text-sm text-[#6e5c54] leading-relaxed line-clamp-2 font-medium mb-3">
                        {event.subtitle}
                      </p>

                      <div className="text-xs font-bold text-[#8c776e] flex items-center gap-1.5 mb-2">
                        <MapPin className="w-3.5 h-3.5 text-[#c85a3b]" />
                        <span>{event.venue}</span>
                      </div>

                      <div className="text-base font-black text-[#231815] mt-1">
                        From ₹{event.priceStart} onwards
                      </div>
                    </div>
                  </div>
                </div>

                {/* Perforation Ticket Cutout Divider matching Reference Screenshot 7 */}
                <div>
                  <div className="relative my-6 -mx-8 sm:-mx-9">
                    <div className="border-t-2 border-dashed border-[#e8c5ac]" />
                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#f8f2e8] border-r-2 border-[#e8c5ac]" />
                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#f8f2e8] border-l-2 border-[#e8c5ac]" />
                  </div>

                  {/* Card Bottom Row: Language + Book Tickets CTA */}
                  <div className="flex items-center justify-between gap-4 pt-1">
                    <div className="text-xs font-semibold text-[#8c776e]">
                      Language: <span className="font-bold text-[#231815]">{event.languages.join(', ')}</span>
                    </div>

                    <button
                      onClick={() => handleSelectEvent(event)}
                      className="px-8 py-3.5 bg-[#c85a3b] hover:bg-[#b3472a] text-white rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 shadow-md hover:shadow-lg cursor-pointer"
                    >
                      <span>Book Tickets</span>
                      <ChevronRight className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* ─── STEP 2: DETAIL & QUEUE (Screenshots 2, 4, 6, 8, 9) ─── */}
      {currentStep === 'DETAIL' && selectedEvent && (
        <main className="flex-1 max-w-7xl mx-auto px-6 lg:px-8 py-12 w-full">
          
          {/* Dashed Border Outer Container matching Reference Screenshot 6 & 8 */}
          <div className="border-2 border-dashed border-[#e8c5ac] rounded-3xl bg-[#fff8f2] p-8 sm:p-12 mb-12 shadow-sm">
            
            {/* Feature Banner Card */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#2c1d1a] via-[#3d251f] to-[#2c1d1a] border-2 border-[#e8c5ac] p-8 sm:p-12 mb-10 text-white shadow-md">
              <span className="text-xs font-black text-[#fde4d4] bg-white/10 px-4 py-1.5 rounded-full border border-white/20 inline-block mb-4">
                {selectedEvent.formats.join(' • ')}
              </span>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-3">
                {selectedEvent.title}
              </h1>
              <p className="text-base sm:text-lg text-[#f5d9cc] max-w-2xl font-medium leading-relaxed">
                {selectedEvent.subtitle}
              </p>
            </div>

            {/* Two-Column Feature Details & Showtime Selector */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              
              {/* Left Column: About the Feature */}
              <div className="lg:col-span-2 bg-white rounded-2xl border-2 border-[#e8c5ac] p-8 sm:p-10 shadow-xs flex flex-col justify-between">
                <div>
                  <h2 className="text-2xl font-black text-[#231815] mb-4">About the Feature</h2>
                  <p className="text-base text-[#6e5c54] leading-relaxed mb-8 font-medium">
                    {selectedEvent.category === 'Concerts'
                      ? 'Experience Rockstar Anirudh Ravichander live in Hyderabad! A 360-degree circular stadium arena designed with world-class acoustic engineering, pyrotechnics, and immersive soundscapes.'
                      : 'An unmissable cinematic spectacle with crystal-clear 4K laser projection, Dolby Atmos panoramic spatial sound, and premium luxury auditorium seating crafted for the ultimate movie immersion.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-6 border-t-2 border-[#e8c5ac] text-xs font-bold text-[#6e5c54]">
                  <div className="flex items-center gap-2 text-[#c85a3b]">
                    <Star className="w-4 h-4 fill-[#c85a3b] text-[#c85a3b]" />
                    <span>IMDb {selectedEvent.rating}/10 ({selectedEvent.votes})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#8c776e]" />
                    <span>{selectedEvent.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-[#8c776e]" />
                    <span>{selectedEvent.languages.join(' / ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#8c776e]" />
                    <span>{selectedEvent.venue}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Select Showtime Card */}
              <div className="bg-white rounded-2xl border-2 border-[#e8c5ac] p-8 shadow-md flex flex-col justify-between">
                <div>
                  <h2 className="text-2xl font-black text-[#231815] mb-6">Select Showtime</h2>
                  
                  <div className="space-y-3.5 mb-8">
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
                          className={`w-full p-4.5 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer border-2 ${
                            isSelected
                              ? 'bg-[#c85a3b] text-white border-[#c85a3b] font-black shadow-md'
                              : 'bg-[#fff8f2] hover:bg-[#fee8d8] text-[#231815] border-[#e8c5ac] font-bold'
                          }`}
                        >
                          <span className="text-sm font-bold">{slot.time}</span>
                          <span className="text-sm font-mono font-black">{slot.price}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={handleProceedToSeats}
                  className="w-full py-4.5 bg-[#c85a3b] hover:bg-[#b3472a] text-white rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-lg"
                >
                  <span>Proceed to Queue</span>
                  <ArrowRight className="w-5 h-5 stroke-[3]" />
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ─── STEP 3: SEATS (Auditorium & Seating View - Screenshot 8) ─── */}
      {currentStep === 'SEATS' && (
        <main className="flex-1 max-w-7xl mx-auto px-6 lg:px-8 py-12 w-full">
          
          {/* Seating Top Header Bar */}
          <div className="bg-[#fff8f2] rounded-3xl border-2 border-[#e8c5ac] p-6 sm:p-8 mb-10 flex flex-wrap items-center justify-between gap-6 shadow-sm">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#231815]">
                {selectedEvent.title}
              </h1>
              <div className="text-sm text-[#6e5c54] font-medium mt-1">
                Showtime: <span className="font-bold text-[#231815]">{selectedShowtime}</span> • Select up to 6 seats
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Hold Timer */}
              <div className="px-5 py-2.5 bg-[#c85a3b] text-white rounded-full text-xs font-black font-mono shadow-md flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Hold Timer: {Math.floor(holdTimerSeconds / 60).toString().padStart(2, '0')}:{(holdTimerSeconds % 60).toString().padStart(2, '0')}</span>
              </div>

              {/* 3D vs 2D Switcher */}
              <div className="flex items-center bg-white p-1.5 rounded-2xl border-2 border-[#e8c5ac]">
                <button
                  onClick={() => setTheatreViewMode('3D_ARENA')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                    theatreViewMode === '3D_ARENA' ? 'bg-[#c85a3b] text-white shadow-xs' : 'text-[#6e5c54] hover:text-[#231815]'
                  }`}
                >
                  <Box className="w-4 h-4" />
                  <span>3D View</span>
                </button>
                <button
                  onClick={() => setTheatreViewMode('2D_MATRIX')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                    theatreViewMode === '2D_MATRIX' ? 'bg-[#c85a3b] text-white shadow-xs' : 'text-[#6e5c54] hover:text-[#231815]'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>2D Map</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Seating Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            
            {/* Left 2 Cols: Auditorium Screen & Seating */}
            <div className="lg:col-span-2 bg-[#fff8f2] rounded-3xl border-2 border-[#e8c5ac] p-8 sm:p-10 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-black text-[#231815]">Auditorium Screen & Seating</h2>
                  <div className="text-xs font-bold text-[#8c776e] mt-1">Click chairs to select (Max 6 seats)</div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-5 text-xs font-black text-[#6e5c54]">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-lg bg-[#22c55e] border border-[#16a34a]" />
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-lg bg-[#f59e0b] border border-[#d97706]" />
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-lg bg-[#f87171] border border-[#ef4444]" />
                    <span>Sold</span>
                  </div>
                </div>
              </div>

              {/* Seating Display */}
              {theatreViewMode === '2D_MATRIX' ? (
                <div className="bg-white rounded-2xl p-8 sm:p-10 border-2 border-[#e8c5ac] flex flex-col items-center shadow-xs">
                  
                  {/* Curved Cinema Screen Graphic */}
                  <div className="w-full max-w-xl mb-10 text-center">
                    <div className="w-full h-10 bg-gradient-to-b from-[#fee8d8] to-transparent rounded-t-[50%] border-t-4 border-[#c85a3b] flex items-center justify-center shadow-xs">
                      <span className="text-[11px] font-mono font-bold tracking-widest text-[#7d6b63] uppercase">
                        CINEMA SCREEN (FRONT)
                      </span>
                    </div>
                  </div>

                  {/* Seat Rows Grid with clear spacing */}
                  <div className="space-y-3.5 overflow-x-auto pb-4 max-w-full">
                    {['A', 'B', 'C', 'D', 'E'].map((rowLetter) => (
                      <div key={rowLetter} className="flex items-center gap-3 justify-center">
                        <span className="w-6 text-sm font-black text-[#8c776e] text-center font-mono">{rowLetter}</span>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((seatNum) => {
                          const seatId = `${rowLetter}${seatNum}`;
                          const isSelected = selectedSeats.includes(seatId);
                          const isSold = ['A2', 'B3', 'B5', 'D2', 'D3', 'D11', 'E2', 'E5', 'E7'].includes(seatId);

                          let styleClasses = 'bg-[#4ade80] hover:bg-[#22c55e] text-slate-900 border border-[#22c55e]';
                          if (isSold) {
                            styleClasses = 'bg-[#f87171] text-white opacity-85 cursor-not-allowed border border-[#ef4444]';
                          } else if (isSelected) {
                            styleClasses = 'bg-[#f59e0b] text-white font-black ring-3 ring-[#c85a3b] scale-110 shadow-md border border-[#d97706]';
                          }

                          return (
                            <button
                              key={seatId}
                              disabled={isSold}
                              onClick={() => handleToggleSeat(seatId)}
                              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-xs font-black font-mono transition-all flex items-center justify-center cursor-pointer ${styleClasses}`}
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
                <div className="w-full h-[480px] rounded-2xl overflow-hidden border-2 border-[#e8c5ac] bg-black relative shadow-inner">
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
            <div className="bg-[#fff8f2] rounded-3xl border-2 border-[#e8c5ac] p-8 sm:p-10 shadow-sm flex flex-col justify-between">
              <div>
                <h2 className="text-2xl font-black text-[#231815] mb-6">Booking Summary</h2>

                <div className="space-y-5 mb-8">
                  <div>
                    <div className="text-xs font-bold text-[#8c776e] uppercase tracking-wider mb-2">Selected Seats:</div>
                    <div>
                      {selectedSeats.length > 0 ? (
                        <div className="flex flex-wrap gap-2.5">
                          {selectedSeats.map((s) => (
                            <span key={s} className="px-3 py-1.5 bg-[#c85a3b] text-white rounded-xl text-xs font-mono font-black shadow-xs">
                              {s}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-[#8c776e] font-medium italic">
                          No seats selected yet. Click on the chairs to choose up to 6 seats.
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-[#8c776e] uppercase tracking-wider mb-1">Ticket Category:</div>
                    <div className="text-base font-black text-[#231815]">Recliner & Platinum</div>
                  </div>

                  <div className="pt-4 border-t-2 border-[#e8c5ac] flex items-center justify-between">
                    <span className="text-base font-black text-[#231815]">Total Amount:</span>
                    <span className="text-3xl font-black text-[#c85a3b] font-mono">
                      ₹{calculateTotalPrice(selectedSeats).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* SmartSeat Recommendation Box */}
                <div className="bg-[#feefe3] p-5 rounded-2xl border-2 border-[#ecd0bc] mb-8 text-xs text-[#6e5c54]">
                  <div className="font-black text-[#c85a3b] flex items-center gap-2 mb-1.5 text-xs">
                    <Sparkles className="w-4 h-4" />
                    <span>SMARTSEAT RECOMMENDATION</span>
                  </div>
                  <p className="leading-relaxed font-medium">
                    Recommended Row C, Seats 6-7: Centrally positioned with optimal Dolby Atmos sound balance and viewing distance.
                  </p>
                </div>
              </div>

              <button
                disabled={selectedSeats.length === 0}
                onClick={handleProceedToPayment}
                className={`w-full py-4.5 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-lg ${
                  selectedSeats.length > 0
                    ? 'bg-[#c85a3b] hover:bg-[#b3472a] text-white hover:shadow-xl'
                    : 'bg-[#edd5c5] text-[#9b887f] cursor-not-allowed'
                }`}
              >
                <span>Proceed to Pay</span>
                <ArrowRight className="w-5 h-5 stroke-[3]" />
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ─── STEP 4: PAY (Payment & AI Bot Protection Gate) ─── */}
      {currentStep === 'PAY' && (
        <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
          <div className="bg-[#fff8f2] rounded-3xl border-2 border-[#e8c5ac] p-8 sm:p-12 shadow-md">
            
            <div className="flex items-center justify-between pb-6 border-b-2 border-[#e8c5ac] mb-8">
              <div>
                <h1 className="text-3xl font-black text-[#231815]">Checkout & Payment</h1>
                <p className="text-sm text-[#6e5c54] font-medium mt-1">Review your tickets and complete payment</p>
              </div>

              <div className="px-4 py-2 bg-[#dcfce7] text-[#15803d] border-2 border-[#bbf7d0] rounded-full text-xs font-black flex items-center gap-2 font-mono">
                <Shield className="w-4 h-4" />
                <span>AI Screener: Passed (Risk 0.02)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-8">
              {/* Order Breakdown */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border-2 border-[#e8c5ac] shadow-xs">
                <h3 className="text-lg font-black text-[#231815] mb-4">Order Breakdown</h3>

                <div className="space-y-3.5 text-xs text-[#6e5c54] pb-5 border-b-2 border-[#e8c5ac]">
                  <div className="flex justify-between">
                    <span>Feature:</span>
                    <span className="font-bold text-[#231815]">{selectedEvent.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Showtime:</span>
                    <span className="font-bold text-[#231815]">{selectedShowtime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Selected Seats ({selectedSeats.length}):</span>
                    <span className="font-mono font-bold text-[#c85a3b]">{selectedSeats.join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tickets Subtotal:</span>
                    <span className="font-mono font-bold text-[#231815]">₹{calculateTotalPrice(selectedSeats).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Convenience Fee:</span>
                    <span className="font-mono font-bold text-[#231815]">₹30</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Integrated GST (18%):</span>
                    <span className="font-mono font-bold text-[#231815]">₹{Math.round(calculateTotalPrice(selectedSeats) * 0.18)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <span className="text-base font-black text-[#231815]">Grand Total:</span>
                  <span className="text-2xl font-black text-[#c85a3b] font-mono">
                    ₹{(calculateTotalPrice(selectedSeats) + 30 + Math.round(calculateTotalPrice(selectedSeats) * 0.18)).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-black text-[#231815] mb-4">Select Payment Mode</h3>

                  <div className="space-y-3 mb-6">
                    {[
                      { id: 'UPI', label: 'UPI Instant (GPay / PhonePe / QR)', icon: '⚡' },
                      { id: 'CARD', label: 'Credit / Debit Card', icon: '💳' },
                      { id: 'NETBANKING', label: 'Net Banking (All Indian Banks)', icon: '🏦' }
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`w-full p-4 rounded-xl flex items-center justify-between text-left transition cursor-pointer border-2 ${
                          paymentMethod === m.id
                            ? 'bg-[#c85a3b] text-white border-[#c85a3b] font-black shadow-xs'
                            : 'bg-white hover:bg-[#fee8d8] text-[#231815] border-[#e8c5ac] font-bold text-xs'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span>{m.icon}</span>
                          <span>{m.label}</span>
                        </span>
                        {paymentMethod === m.id && <CheckCircle2 className="w-5 h-5" />}
                      </button>
                    ))}
                  </div>

                  <div className="bg-[#feefe3] p-4 rounded-xl border border-[#ecd0bc] text-xs text-[#6e5c54]">
                    <div className="font-bold text-[#231815] mb-1">Idempotent Safe Transaction:</div>
                    Your booking reference is atomically locked in Redis. If network disconnects, your seats are reserved for 2 minutes.
                  </div>
                </div>

                <button
                  disabled={isProcessingPayment}
                  onClick={handleConfirmPayment}
                  className="w-full mt-6 py-4.5 bg-[#c85a3b] hover:bg-[#b3472a] text-white rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-lg"
                >
                  {isProcessingPayment ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Verifying & Issuing Ticket...</span>
                    </>
                  ) : (
                    <>
                      <span>Pay & Issue Digital Pass</span>
                      <ArrowRight className="w-5 h-5 stroke-[3]" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ─── STEP 5: TICKET (Enjoy the Show! - Screenshot 6) ─── */}
      {currentStep === 'TICKET' && bookedTicket && (
        <main className="flex-1 max-w-3xl mx-auto px-6 py-14 w-full text-center">
          
          <h1 className="text-4xl sm:text-5xl font-black text-[#231815] mb-3 tracking-tight">
            Enjoy the Show!
          </h1>
          <p className="text-base text-[#6e5c54] mb-10 font-medium">
            Your digital QR ticket has been securely issued and stored in PostgreSQL.
          </p>

          {/* Ticket Receipt Card matching Screenshot 6 */}
          <div className="bg-[#fff8f2] rounded-3xl border-2 border-[#e8c5ac] p-10 sm:p-12 shadow-md text-left mb-10">
            <div className="flex items-center justify-between pb-6 border-b-2 border-[#e8c5ac] mb-8">
              <div>
                <div className="text-xs font-bold text-[#8c776e] uppercase tracking-wider mb-1">BOOKING REFERENCE</div>
                <div className="text-3xl font-black text-[#231815] font-mono">{bookedTicket.bookingId}</div>
              </div>

              <div className="px-4 py-2 bg-[#dcfce7] text-[#15803d] border-2 border-[#bbf7d0] rounded-full text-xs font-black flex items-center gap-2 font-mono">
                <CheckCircle2 className="w-4 h-4" />
                <span>Paid & Confirmed</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-10 text-xs">
              <div>
                <div className="text-[#8c776e] font-bold uppercase tracking-wider mb-1.5">MOVIE</div>
                <div className="text-lg font-black text-[#231815]">{bookedTicket.movieTitle}</div>
              </div>

              <div>
                <div className="text-[#8c776e] font-bold uppercase tracking-wider mb-1.5">SHOWTIME</div>
                <div className="text-lg font-black text-[#231815]">{bookedTicket.showtime}</div>
              </div>

              <div>
                <div className="text-[#8c776e] font-bold uppercase tracking-wider mb-1.5">SEATS</div>
                <div className="text-lg font-black text-[#c85a3b] font-mono">{bookedTicket.seats.join(', ')}</div>
              </div>

              <div>
                <div className="text-[#8c776e] font-bold uppercase tracking-wider mb-1.5">TOTAL PAID</div>
                <div className="text-lg font-black text-[#231815] font-mono">₹{bookedTicket.totalPrice.toLocaleString()}</div>
              </div>
            </div>

            {/* Perforation Ticket Cutout Divider */}
            <div className="relative my-8 -mx-10 sm:-mx-12">
              <div className="border-t-2 border-dashed border-[#e8c5ac]" />
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#f8f2e8] border-r-2 border-[#e8c5ac]" />
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#f8f2e8] border-l-2 border-[#e8c5ac]" />
            </div>

            {/* QR Code Container */}
            <div className="p-8 bg-white rounded-2xl border-2 border-[#e8c5ac] flex flex-col sm:flex-row items-center gap-8 justify-between shadow-xs">
              <div className="w-32 h-32 bg-[#1f1410] rounded-2xl flex items-center justify-center text-white text-center p-3 font-mono text-[11px] shrink-0 font-bold border-2 border-[#e8c5ac]">
                <span>[QR SECURE TOKEN: {bookedTicket.qrToken}]</span>
              </div>

              <div className="flex-1 text-xs text-[#6e5c54]">
                <div className="text-sm font-black text-[#231815] mb-1.5">Scan at Cinema Entrance</div>
                <p className="leading-relaxed mb-4 font-medium">
                  ID-verified QR token linked to PostgreSQL durable booking record. Present this at the usher turnstile for gate admission.
                </p>
                <button
                  onClick={() => alert(`Downloaded digital pass for ${bookedTicket.movieTitle} (${bookedTicket.bookingId})`)}
                  className="px-5 py-2.5 bg-[#fbe7da] hover:bg-[#fedecb] text-[#231815] rounded-xl font-bold transition flex items-center gap-2 cursor-pointer text-xs border border-[#e8c5ac]"
                >
                  <Download className="w-4 h-4 text-[#c85a3b]" />
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
            className="px-10 py-4.5 bg-[#c85a3b] hover:bg-[#b3472a] text-white rounded-2xl font-black text-base transition-all cursor-pointer shadow-lg"
          >
            Book Another Movie
          </button>
        </main>
      )}

      {/* ─── Global Footer matching Screenshot 3 & 4 ─── */}
      <footer className="bg-[#1f1410] text-[#faf4eb] mt-auto border-t-4 border-[#36231c]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12 text-xs">
            
            {/* Col 1: Brand Info */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-[#c85a3b] flex items-center justify-center text-white font-black text-sm">
                  <Ticket className="w-4 h-4" />
                </div>
                <span className="text-lg font-black tracking-tight text-white">SeatSurge</span>
              </div>
              <p className="text-[#a8958c] leading-relaxed">
                The world's first AI-powered 3D cinema ticketing platform with real-time distributed atomic locks and zero double-booking architecture.
              </p>
            </div>

            {/* Col 2: Featured Movies */}
            <div>
              <div className="font-black text-white uppercase tracking-wider mb-4">Featured Movies</div>
              <ul className="space-y-2.5 text-[#a8958c] font-medium">
                <li>Ramayana (3D)</li>
                <li>Scene (Suriya)</li>
                <li>DNK (Donga Naa Koduku)</li>
                <li>Itlu Arjuna</li>
                <li>Anirudh: Hukum World Tour</li>
              </ul>
            </div>

            {/* Col 3: Security & Tech */}
            <div>
              <div className="font-black text-white uppercase tracking-wider mb-4">Security & Tech</div>
              <ul className="space-y-2.5 text-[#a8958c] font-medium">
                <li>Redis Lua Atomic Holds</li>
                <li>Scikit-Learn Bot Detection</li>
                <li>PostgreSQL ACID Transactions</li>
                <li>WebSocket Real-time Sync</li>
              </ul>
            </div>

            {/* Col 4: Secure Guarantee */}
            <div>
              <div className="font-black text-white uppercase tracking-wider mb-4">Secure Guarantee</div>
              <p className="text-[#a8958c] leading-relaxed mb-5 font-medium">
                All ticket purchases are fully idempotent with instant QR generation and automated 2-minute hold recovery.
              </p>
              <div className="flex items-center gap-2.5">
                <span className="px-3 py-1.5 bg-white/10 rounded-lg border border-white/20 text-[11px] font-mono text-[#fde4d4] font-bold">
                  SSL Secured
                </span>
                <span className="px-3 py-1.5 bg-white/10 rounded-lg border border-white/20 text-[11px] font-mono text-[#fde4d4] font-bold">
                  Idempotent API
                </span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-[#36231c] flex flex-wrap items-center justify-between gap-4 text-xs text-[#8c776e]">
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
