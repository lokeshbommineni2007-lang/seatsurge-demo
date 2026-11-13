import { SeatInfo } from '../components/Theatre3D';

export type TheatreLayoutId =
  | 'PRASADS_PCX'
  | 'PRASADS_SCREEN4'
  | 'ALLU_KOKAPET'
  | 'AAA_AMEERPET'
  | 'CONCERT_STADIUM';

export interface TheatreLayoutDef {
  id: TheatreLayoutId;
  name: string;
  screenBadge: string;
  screenSub: string;
  screenType: 'PCX_CURVED' | 'STANDARD_LASER' | 'DOLBY_CINEMA' | 'AAA_ATMOS' | 'ROCKSTAR_STAGE';
  tiers: Array<{
    name: string;
    price: number;
    color: string;
    description?: string;
  }>;
}

export const THEATRE_LAYOUTS: Record<TheatreLayoutId, TheatreLayoutDef> = {
  PRASADS_PCX: {
    id: 'PRASADS_PCX',
    name: 'Prasads Multiplex: PCX Screen',
    screenBadge: 'PCX LARGE SCREEN • BARCO 4K LASER',
    screenSub: 'All eyes this way: 100ft Curved PCX Giant Screen',
    screenType: 'PCX_CURVED',
    tiers: [
      { name: '₹400 GOLD + 3D Glass', price: 400, color: 'text-amber-400 border-amber-500/40' }
    ]
  },
  PRASADS_SCREEN4: {
    id: 'PRASADS_SCREEN4',
    name: 'Prasads Multiplex: Screen 4',
    screenBadge: 'SCREEN 4 • BARCO 4K LASER',
    screenSub: 'All eyes this way please: Barco 4K Laser Projection',
    screenType: 'STANDARD_LASER',
    tiers: [
      { name: '₹325 EXECUTIVE + 3D Glass', price: 325, color: 'text-cyan-400 border-cyan-500/40' }
    ]
  },
  ALLU_KOKAPET: {
    id: 'ALLU_KOKAPET',
    name: 'ALLU Cinemas: Kokapet',
    screenBadge: 'DOLBY CINEMA 3D • 4K DUAL LASER',
    screenSub: 'Dolby Vision + Dolby Atmos 64-Channel Soundstage',
    screenType: 'DOLBY_CINEMA',
    tiers: [
      { name: '₹395 3D GOLD (UPPER)', price: 395, color: 'text-amber-300 border-amber-500/40' },
      { name: '₹450 3D DIRECTOR CHOICE', price: 450, color: 'text-rose-400 border-rose-500/40', description: 'Plush Leather VIP Recliners with Direct Sightline' },
      { name: '₹395 3D GOLD (LOWER)', price: 395, color: 'text-amber-300 border-amber-500/40' }
    ]
  },
  AAA_AMEERPET: {
    id: 'AAA_AMEERPET',
    name: 'AAA Cinemas: Ameerpet',
    screenBadge: 'SCREEN 1 • LASER DOLBY ATMOS',
    screenSub: 'Allu Arjun AAA Cinemas: Barco RGB Laser + Lounger Pods',
    screenType: 'AAA_ATMOS',
    tiers: [
      { name: '₹350 RECLINER', price: 350, color: 'text-purple-300 border-purple-500/40', description: 'Motorized Luxury Leather Recliners' },
      { name: '₹295 GOLD', price: 295, color: 'text-amber-400 border-amber-500/40' },
      { name: '₹295 LOUNGERS', price: 295, color: 'text-emerald-400 border-emerald-500/40', description: 'Front Row Ergonomic Loungers' }
    ]
  },
  CONCERT_STADIUM: {
    id: 'CONCERT_STADIUM',
    name: 'GMR Arena: 360° Rockstar Stadium',
    screenBadge: '360° ROCKSTAR CENTER STAGE',
    screenSub: '⚡ HUKUM TOUR: 360° Stadium Amphitheater around Rockstar Anirudh',
    screenType: 'ROCKSTAR_STAGE',
    tiers: [
      { name: '⚡ GOLDEN FAN PIT', price: 4500, color: 'text-amber-400 border-amber-500/40' },
      { name: '💎 DIAMOND BOWL', price: 2500, color: 'text-cyan-400 border-cyan-500/40' },
      { name: '🏟️ STADIUM GRANDSTAND', price: 999, color: 'text-blue-400 border-blue-500/40' }
    ]
  }
};

// Generate realistic pre-booked and held seats for each authentic Hyderabad theatre
export function generateTheatreSeats(layoutId: TheatreLayoutId): Map<string, SeatInfo> {
  const map = new Map<string, SeatInfo>();
  const now = Date.now();

  const addSeat = (
    seatId: string,
    row: string,
    number: number,
    tier: 'VIP' | 'PREMIUM' | 'STANDARD',
    price: number,
    seedHash: number
  ) => {
    let status: 'AVAILABLE' | 'HELD' | 'SOLD' = 'AVAILABLE';
    let held_by: string | undefined = undefined;
    let expires_at: number | undefined = undefined;

    // Realistic booking density: ~30% sold, ~6% held
    if (seedHash % 100 < 28) {
      status = 'SOLD';
    } else if (seedHash % 100 >= 89 && seedHash % 100 <= 94) {
      status = 'HELD';
      held_by = `fan-${seedHash}`;
      expires_at = now + 90000;
    }

    map.set(seatId, {
      seat_id: seatId,
      row,
      number,
      tier,
      price,
      status,
      ...(held_by && { held_by, expires_at })
    });
  };

  switch (layoutId) {
    // ─── 1. PRASADS PCX SCREEN (Curved Grand Amphitheater, Rows A to N) ───────────
    case 'PRASADS_PCX': {
      const rows = [
        { row: 'A', start: 1, end: 34 },
        { row: 'B', start: 1, end: 39 },
        { row: 'C', start: 1, end: 41 },
        { row: 'D', start: 1, end: 45 },
        { row: 'E', start: 1, end: 46 },
        { row: 'F', start: 4, end: 46 },
        { row: 'G', start: 4, end: 46 },
        { row: 'H', start: 4, end: 46 },
        { row: 'J', start: 9, end: 46 },
        { row: 'K', start: 9, end: 46 },
        { row: 'L', start: 9, end: 46 },
        { row: 'M', start: 9, end: 46 },
        { row: 'N', start: 9, end: 46 }
      ];

      rows.forEach(({ row, start, end }, rIdx) => {
        for (let num = start; num <= end; num++) {
          const seatId = `${row}-${num}`;
          const seed = (rIdx * 47 + num * 23 + 11) % 1000;
          addSeat(seatId, row, num, 'VIP', 400, seed);
        }
      });
      break;
    }

    // ─── 2. PRASADS SCREEN 4 (4-Quadrant Block Layout, Rows A to N) ───────────────
    case 'PRASADS_SCREEN4': {
      const rows = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N'];
      rows.forEach((row, rIdx) => {
        const isUpper = rIdx <= 5; // A to F
        const maxSeat = (row === 'N') ? 24 : 28;
        for (let num = 1; num <= maxSeat; num++) {
          const seatId = `${row}-${num}`;
          const seed = (rIdx * 59 + num * 31 + 17) % 1000;
          addSeat(seatId, row, num, isUpper ? 'PREMIUM' : 'STANDARD', 325, seed);
        }
      });
      break;
    }

    // ─── 3. ALLU CINEMAS KOKAPET (3-Column + Director's Choice, Rows B to R) ──────
    case 'ALLU_KOKAPET': {
      const rows = ['B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R'];
      rows.forEach((row, rIdx) => {
        const isDirectorChoice = row === 'J';
        const isLower = rIdx >= 9; // K to R
        const maxSeat = isLower ? 33 : 37;

        for (let num = 1; num <= maxSeat; num++) {
          const seatId = `${row}-${num}`;
          const price = isDirectorChoice ? 450 : 395;
          const tier = isDirectorChoice ? 'VIP' : 'PREMIUM';
          const seed = (rIdx * 67 + num * 19 + 29) % 1000;
          addSeat(seatId, row, num, tier, price, seed);
        }
      });
      break;
    }

    // ─── 4. AAA CINEMAS AMEERPET (4-Column + Recliners + Loungers) ─────────────────
    case 'AAA_AMEERPET': {
      // Row A: Recliners (1-20)
      for (let num = 1; num <= 20; num++) {
        const seatId = `A-${num}`;
        const seed = (num * 37 + 7) % 1000;
        addSeat(seatId, 'A', num, 'VIP', 350, seed);
      }

      // Rows B & C: Balcony Gold (1-26)
      ['B', 'C'].forEach((row, rIdx) => {
        for (let num = 1; num <= 26; num++) {
          const seatId = `${row}-${num}`;
          const seed = ((rIdx + 1) * 73 + num * 23 + 19) % 1000;
          addSeat(seatId, row, num, 'PREMIUM', 295, seed);
        }
      });

      // Rows D to N: 4-Column Gold (1-34)
      const mainRows = ['D','E','F','G','H','I','J','K','L','M','N'];
      mainRows.forEach((row, rIdx) => {
        for (let num = 1; num <= 34; num++) {
          const seatId = `${row}-${num}`;
          const seed = (rIdx * 41 + num * 29 + 13) % 1000;
          addSeat(seatId, row, num, 'STANDARD', 295, seed);
        }
      });

      // Row P: Front Loungers (1-26)
      for (let num = 1; num <= 26; num++) {
        const seatId = `P-${num}`;
        const seed = (num * 43 + 31) % 1000;
        addSeat(seatId, 'P', num, 'PREMIUM', 295, seed);
      }
      break;
    }

    // ─── 5. GMR CONCERT ARENA (360° Circular Stadium) ─────────────────────────────
    case 'CONCERT_STADIUM':
    default: {
      const rows = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y'];
      rows.forEach((row, rIdx) => {
        for (let num = 1; num <= 48; num++) {
          const seatId = `${row}-${num}`;
          const tier = rIdx <= 2 ? 'VIP' : (rIdx <= 8 ? 'PREMIUM' : 'STANDARD');
          const price = tier === 'VIP' ? 4500 : (tier === 'PREMIUM' ? 2500 : 999);
          const seed = (rIdx * 73 + num * 31 + 17) % 1000;
          addSeat(seatId, row, num, tier, price, seed);
        }
      });
      break;
    }
  }

  return map;
}
