import { TheatreLayoutId } from './theatreLayouts';

export interface TheatreItem {
  id: string;
  name: string;
  location: string;
  distance: string;
  layoutId: TheatreLayoutId;
  amenities: string[];
  timings: Array<{ time: string; format: string; state: string; label?: string }>;
}

export interface EventItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Concerts' | 'Movies';
  genre: string[];
  venue: string;
  location: string;
  city: string;
  date: string;
  duration: string;
  ageRating: string;
  rating: number;
  votes: string;
  languages: string[];
  formats: string[];
  priceStart: number;
  bannerImage: string;
  posterImage: string;
  isFlashSale: boolean;
  statusTag?: string;
  totalSeats: number;
}

// Crisp high-contrast SVG posters styled directly after BookMyShow reference artwork
export function getFallbackPoster(title: string, category: string, primaryColor = '#e11d48'): string {
  const isScene = title.toLowerCase().includes('scene');
  const isRamayana = title.toLowerCase().includes('ramayana');
  const isDnk = title.toLowerCase().includes('dnk') || title.toLowerCase().includes('donga');
  const isArjuna = title.toLowerCase().includes('arjuna');

  if (isScene) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
      <defs>
        <linearGradient id="scBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#140a0c"/>
          <stop offset="50%" stop-color="#2c1218"/>
          <stop offset="100%" stop-color="#0a0507"/>
        </linearGradient>
        <radialGradient id="scGlow" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#ef4444" stop-opacity="0.45"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="600" height="900" fill="url(#scBg)"/>
      <rect width="600" height="900" fill="url(#scGlow)"/>
      <circle cx="300" cy="270" r="140" fill="#dc2626" fill-opacity="0.15" stroke="#ef4444" stroke-width="3"/>
      <text x="300" y="295" fill="#fca5a5" font-size="90" text-anchor="middle">🚨</text>
      <text x="300" y="460" fill="#ef4444" font-size="76" font-weight="900" font-family="'Impact', 'Arial Black', sans-serif" letter-spacing="8" text-anchor="middle" stroke="#7f1d1d" stroke-width="3">SCENE</text>
      <text x="300" y="515" fill="#fca5a5" font-size="20" font-weight="900" font-family="system-ui, sans-serif" letter-spacing="4" text-anchor="middle">SURIYA AS INSP. INBARAJ</text>
      <text x="300" y="555" fill="#fecaca" font-size="16" font-weight="700" font-family="system-ui, sans-serif" text-anchor="middle">ACTION • COMEDY • DRAMA</text>
      <text x="300" y="595" fill="#fda4af" font-size="14" font-weight="800" font-family="monospace" text-anchor="middle">PRASADS SCREEN 4 • BARCO 4K</text>
      <rect x="60" y="800" width="480" height="64" rx="20" fill="#000000" fill-opacity="0.9" stroke="#ef4444" stroke-width="2.5"/>
      <text x="300" y="842" fill="#ffffff" font-size="24" font-weight="900" font-family="system-ui, sans-serif" text-anchor="middle">★ 9.0/10 (135K+ Votes)</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  if (isRamayana) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
      <defs>
        <linearGradient id="rmBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1f0e03"/>
          <stop offset="50%" stop-color="#3d1c07"/>
          <stop offset="100%" stop-color="#0f0601"/>
        </linearGradient>
        <radialGradient id="rmGlow" cx="50%" cy="32%" r="65%">
          <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="600" height="900" fill="url(#rmBg)"/>
      <rect width="600" height="900" fill="url(#rmGlow)"/>
      <circle cx="300" cy="270" r="140" fill="#f59e0b" fill-opacity="0.15" stroke="#fbbf24" stroke-width="3"/>
      <text x="300" y="295" fill="#fbbf24" font-size="90" text-anchor="middle">🏹</text>
      <text x="300" y="460" fill="#fef08a" font-size="64" font-weight="900" font-family="'Cinzel', 'Times New Roman', serif" letter-spacing="6" text-anchor="middle" stroke="#b45309" stroke-width="2">RAMAYANA</text>
      <text x="300" y="515" fill="#fde047" font-size="20" font-weight="800" font-family="system-ui, sans-serif" letter-spacing="5" text-anchor="middle">THE EPIC 3D SAGA</text>
      <text x="300" y="555" fill="#fef3c7" font-size="16" font-weight="700" font-family="system-ui, sans-serif" text-anchor="middle">NITESH TIWARI • TELUGU / HINDI</text>
      <text x="300" y="595" fill="#fde68a" font-size="14" font-weight="800" font-family="monospace" text-anchor="middle">PRASADS PCX GIANT SCREEN</text>
      <rect x="60" y="800" width="480" height="64" rx="20" fill="#000000" fill-opacity="0.9" stroke="#fbbf24" stroke-width="2.5"/>
      <text x="300" y="842" fill="#ffffff" font-size="24" font-weight="900" font-family="system-ui, sans-serif" text-anchor="middle">★ 9.3/10 (301K+ Votes)</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  if (isDnk) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
      <defs>
        <linearGradient id="dnkBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#07152d"/>
          <stop offset="50%" stop-color="#142850"/>
          <stop offset="100%" stop-color="#050e1f"/>
        </linearGradient>
        <radialGradient id="dnkGlow" cx="50%" cy="32%" r="65%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="600" height="900" fill="url(#dnkBg)"/>
      <rect width="600" height="900" fill="url(#dnkGlow)"/>
      <circle cx="300" cy="270" r="140" fill="#38bdf8" fill-opacity="0.15" stroke="#38bdf8" stroke-width="3"/>
      <text x="300" y="295" fill="#38bdf8" font-size="90" text-anchor="middle">🎭</text>
      <text x="300" y="460" fill="#facc15" font-size="74" font-weight="900" font-family="'Impact', 'Arial Black', sans-serif" letter-spacing="6" text-anchor="middle" stroke="#854d0e" stroke-width="3">DNK</text>
      <text x="300" y="515" fill="#fef08a" font-size="20" font-weight="900" font-family="system-ui, sans-serif" letter-spacing="3" text-anchor="middle">DONGA NAA KODUKU</text>
      <text x="300" y="555" fill="#bae6fd" font-size="16" font-weight="700" font-family="system-ui, sans-serif" text-anchor="middle">COMEDY • CRIME ENTERTAINER</text>
      <text x="300" y="595" fill="#7dd3fc" font-size="14" font-weight="800" font-family="monospace" text-anchor="middle">ALLU CINEMAS KOKAPET • DOLBY</text>
      <rect x="60" y="800" width="480" height="64" rx="20" fill="#000000" fill-opacity="0.9" stroke="#38bdf8" stroke-width="2.5"/>
      <text x="300" y="842" fill="#ffffff" font-size="24" font-weight="900" font-family="system-ui, sans-serif" text-anchor="middle">★ 9.2/10 (420+ Votes)</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  if (isArjuna) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
      <defs>
        <linearGradient id="arjBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1c0f08"/>
          <stop offset="50%" stop-color="#361a0c"/>
          <stop offset="100%" stop-color="#0c0603"/>
        </linearGradient>
        <radialGradient id="arjGlow" cx="50%" cy="32%" r="65%">
          <stop offset="0%" stop-color="#ea580c" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="600" height="900" fill="url(#arjBg)"/>
      <rect width="600" height="900" fill="url(#arjGlow)"/>
      <circle cx="300" cy="270" r="140" fill="#ea580c" fill-opacity="0.15" stroke="#f97316" stroke-width="3"/>
      <text x="300" y="295" fill="#f97316" font-size="90" text-anchor="middle">⚔️</text>
      <text x="300" y="460" fill="#ffedd5" font-size="58" font-weight="900" font-family="'Cinzel', 'Georgia', serif" letter-spacing="4" text-anchor="middle" stroke="#9a3412" stroke-width="2">ITLU ARJUNA</text>
      <text x="300" y="515" fill="#fdba74" font-size="20" font-weight="800" font-family="system-ui, sans-serif" letter-spacing="3" text-anchor="middle">ACTION • DRAMA • ROMANTIC</text>
      <text x="300" y="555" fill="#fed7aa" font-size="16" font-weight="700" font-family="system-ui, sans-serif" text-anchor="middle">SUKUMAR WRITINGS • TELUGU</text>
      <text x="300" y="595" fill="#fdba74" font-size="14" font-weight="800" font-family="monospace" text-anchor="middle">AAA CINEMAS AMEERPET • ATMOS</text>
      <rect x="60" y="800" width="480" height="64" rx="20" fill="#000000" fill-opacity="0.9" stroke="#ea580c" stroke-width="2.5"/>
      <text x="300" y="842" fill="#ffffff" font-size="24" font-weight="900" font-family="system-ui, sans-serif" text-anchor="middle">★ 9.4/10 (810+ Votes)</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  // Anirudh Rockstar Concert
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
    <defs>
      <linearGradient id="aniBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#190726"/>
        <stop offset="50%" stop-color="#341250"/>
        <stop offset="100%" stop-color="#0a0310"/>
      </linearGradient>
      <radialGradient id="aniGlow" cx="50%" cy="32%" r="70%">
        <stop offset="0%" stop-color="#a855f7" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="600" height="900" fill="url(#aniBg)"/>
    <rect width="600" height="900" fill="url(#aniGlow)"/>
    <circle cx="300" cy="270" r="140" fill="#a855f7" fill-opacity="0.2" stroke="#c084fc" stroke-width="3"/>
    <text x="300" y="295" fill="#f0abfc" font-size="100" text-anchor="middle">⚡</text>
    <text x="300" y="460" fill="#fae8ff" font-size="64" font-weight="900" font-family="'Arial Black', sans-serif" letter-spacing="4" text-anchor="middle" stroke="#7e22ce" stroke-width="3">ANIRUDH</text>
    <text x="300" y="515" fill="#e879f9" font-size="22" font-weight="900" font-family="system-ui, sans-serif" letter-spacing="5" text-anchor="middle">HUKUM WORLD TOUR</text>
    <text x="300" y="555" fill="#d8b4fe" font-size="16" font-weight="700" font-family="system-ui, sans-serif" text-anchor="middle">ROCKSTAR LIVE IN HYDERABAD</text>
    <text x="300" y="595" fill="#c084fc" font-size="14" font-weight="800" font-family="monospace" text-anchor="middle">GMR ARENA • 1,200 SEATS LIVE</text>
    <rect x="60" y="800" width="480" height="64" rx="20" fill="#000000" fill-opacity="0.9" stroke="#a855f7" stroke-width="2.5"/>
    <text x="300" y="842" fill="#ffffff" font-size="24" font-weight="900" font-family="system-ui, sans-serif" text-anchor="middle">★ 9.9/10 (520K+ Votes)</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// EXACTLY 4 MOVIES & ONE AND ONLY ANIRUDH CONCERT
export const HYDERABAD_EVENTS: EventItem[] = [
  {
    id: 'ramayana-3d',
    title: 'Ramayana (3D) (Telugu)',
    subtitle: 'Epic Mythological Blockbuster • Directed by Nitesh Tiwari',
    category: 'Movies',
    genre: ['Mythological', 'Action', 'Epic Drama'],
    venue: 'Prasads Multiplex: PCX Screen',
    location: 'Necklace Road, Central Hyderabad',
    city: 'Hyderabad',
    date: 'Fri, 13 Nov • 03:35 PM (PCX Screen)',
    duration: '3h 10m',
    ageRating: 'U',
    rating: 9.3,
    votes: '301K+',
    languages: ['Telugu', 'Hindi', 'Tamil'],
    formats: ['PCX Screen', 'Dolby Cinema 3D', 'Barco 4K Laser'],
    priceStart: 295,
    bannerImage: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=1920&q=80',
    posterImage: getFallbackPoster('Ramayana', 'Movies'),
    isFlashSale: true,
    statusTag: '🔥 HYDERABAD PCX GIANT SCREEN',
    totalSeats: 1200
  },
  {
    id: 'scene-2026',
    title: 'Scene',
    subtitle: 'Suriya as Inspector Inbaraj • Action, Comedy & Drama',
    category: 'Movies',
    genre: ['Action', 'Comedy', 'Drama'],
    venue: 'Prasads Multiplex: Screen 4',
    location: 'Necklace Road, Central Hyderabad',
    city: 'Hyderabad',
    date: 'Fri, 13 Nov • 07:20 PM (Screen 4)',
    duration: '2h 29m',
    ageRating: 'UA16+',
    rating: 9.0,
    votes: '135K+',
    languages: ['Tamil', 'Telugu'],
    formats: ['2D', 'EPIQ', 'HDR By Barco', 'DOLBY CINEMA 2D'],
    priceStart: 295,
    bannerImage: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1920&q=80',
    posterImage: getFallbackPoster('Scene', 'Movies'),
    isFlashSale: true,
    statusTag: '🔥 SURIYA ACTION BLOCKBUSTER',
    totalSeats: 500
  },
  {
    id: 'dnk-telugu',
    title: 'DNK (Donga Naa Koduku)',
    subtitle: 'Hilarious Crime Comedy • Telugu Blockbuster Family Entertainer',
    category: 'Movies',
    genre: ['Comedy', 'Crime'],
    venue: 'ALLU Cinemas: Kokapet',
    location: 'Kokapet, Hyderabad',
    city: 'Hyderabad',
    date: 'Fri, 13 Nov • 07:25 PM (Dolby Cinema)',
    duration: '2h 15m',
    ageRating: 'U/A',
    rating: 9.2,
    votes: '420+',
    languages: ['Telugu'],
    formats: ['Dolby Cinema 3D', '4K Dual Laser HDR'],
    priceStart: 395,
    bannerImage: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1920&q=80',
    posterImage: getFallbackPoster('DNK', 'Movies'),
    isFlashSale: true,
    statusTag: '⭐ ALLU KOKAPET DIRECTOR CHOICE',
    totalSeats: 600
  },
  {
    id: 'itlu-arjuna',
    title: 'Itlu Arjuna',
    subtitle: 'Intense Romantic Action Drama • Sukumar Writings',
    category: 'Movies',
    genre: ['Action', 'Drama', 'Romantic'],
    venue: 'AAA Cinemas: Ameerpet',
    location: 'Ameerpet Metro Interchange Hub, Hyderabad',
    city: 'Hyderabad',
    date: 'Fri, 13 Nov • 12:05 PM (Laser Atmos)',
    duration: '2h 35m',
    ageRating: 'U/A',
    rating: 9.4,
    votes: '810+',
    languages: ['Telugu'],
    formats: ['Screen 1 • Laser Dolby Atmos', 'Barco RGB Laser'],
    priceStart: 295,
    bannerImage: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1920&q=80',
    posterImage: getFallbackPoster('Itlu Arjuna', 'Movies'),
    isFlashSale: true,
    statusTag: '👑 AAA CINEMAS RECLINER PODS',
    totalSeats: 650
  },
  {
    id: 'anirudh-hukum',
    title: 'Anirudh: Hukum World Tour',
    subtitle: 'Rockstar Anirudh Ravichander Live in Hyderabad • 360° Stadium Arena',
    category: 'Concerts',
    genre: ['Rockstar', 'EDM', 'Tamil/Telugu Rock', 'Live Stadium'],
    venue: 'GMR Arena: 360° Rockstar Stadium',
    location: 'Airport Approach Road, Shamshabad, Hyderabad',
    city: 'Hyderabad',
    date: 'Sat, 28 Nov • 07:00 PM',
    duration: '3h 45m',
    ageRating: 'All Ages',
    rating: 9.9,
    votes: '520K+',
    languages: ['Tamil', 'Telugu', 'Hindi'],
    formats: ['360° Rockstar Stage', 'Fan Pit', 'Golden Circle', 'VIP Lounge'],
    priceStart: 1299,
    bannerImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1920&q=80',
    posterImage: getFallbackPoster('Anirudh: Hukum World Tour', 'Concerts'),
    isFlashSale: true,
    statusTag: '⚡ ROCKSTAR ANIRUDH LIVE • HYDERABAD',
    totalSeats: 1200
  }
];

// EXACTLY 4 AUDIS FOR THE 4 MOVIE SHOWS + 1 ROCKSTAR CONCERT STADIUM
export const HYDERABAD_THEATRES: TheatreItem[] = [
  {
    id: 'prasads-pcx',
    name: 'Prasads Multiplex: PCX Screen',
    location: 'Necklace Road, Central Hyderabad',
    distance: '3.2 km',
    layoutId: 'PRASADS_PCX',
    amenities: ['100ft Curved PCX Giant Screen', 'Barco 4K Laser', 'Dolby Atmos 7.1.4', 'Dual Glass Amphitheater'],
    timings: [
      { time: '12:00 PM', format: 'Barco 4K Laser', state: 'available' },
      { time: '03:35 PM', format: 'PCX Screen', state: 'flash_sale', label: '🔥 RAMAYANA PCX' },
      { time: '07:20 PM', format: 'Barco 4K Laser', state: 'flash_sale', label: '⚡ FLASH SALE' },
      { time: '11:00 PM', format: 'Barco 4K Laser', state: 'available' }
    ]
  },
  {
    id: 'prasads-screen4',
    name: 'Prasads Multiplex: Screen 4',
    location: 'Necklace Road, Central Hyderabad',
    distance: '3.2 km',
    layoutId: 'PRASADS_SCREEN4',
    amenities: ['Barco 4K Laser', 'Dolby Digital 7.1', 'Executive Quad-Block Seating'],
    timings: [
      { time: '11:00 AM', format: 'Barco 4K Laser', state: 'available' },
      { time: '02:30 PM', format: 'Barco 4K Laser', state: 'available' },
      { time: '07:20 PM', format: 'Barco 4K Laser', state: 'flash_sale', label: '⚡ SCENE SHOW' },
      { time: '10:45 PM', format: 'Barco 4K Laser', state: 'fast_filling' }
    ]
  },
  {
    id: 'allu-kokapet',
    name: 'ALLU Cinemas: Kokapet',
    location: 'Near Financial District, Kokapet, Hyderabad',
    distance: '11.5 km',
    layoutId: 'ALLU_KOKAPET',
    amenities: ['Dolby Cinema 3D', '4K Dual Laser HDR', 'Dolby Atmos 64-Channel', 'Director Choice VIP Recliners'],
    timings: [
      { time: '11:30 AM', format: 'Dolby Cinema', state: 'available' },
      { time: '03:15 PM', format: 'Dolby Cinema', state: 'available' },
      { time: '07:25 PM', format: 'Dolby Cinema 3D', state: 'flash_sale', label: '⭐ DNK DIRECTOR CHOICE' },
      { time: '11:25 PM', format: 'Dolby Cinema', state: 'available' }
    ]
  },
  {
    id: 'aaa-ameerpet',
    name: 'AAA Cinemas: Ameerpet',
    location: 'Ameerpet Metro Interchange Hub, Hyderabad',
    distance: '5.1 km',
    layoutId: 'AAA_AMEERPET',
    amenities: ['Laser Dolby Atmos', 'Barco RGB 4K Laser', 'Motorized Recliner Pods', 'Front Row Loungers'],
    timings: [
      { time: '10:00 AM', format: 'Laser Dolby 7.1', state: 'available' },
      { time: '12:05 PM', format: 'Laser Dolby Atmos', state: 'flash_sale', label: '⚡ ITLU ARJUNA SHOW' },
      { time: '04:25 PM', format: 'Laser Dolby 7.1', state: 'available' },
      { time: '06:45 PM', format: 'Laser Dolby Atmos', state: 'fast_filling' },
      { time: '10:10 PM', format: 'Laser Dolby 7.1', state: 'available' }
    ]
  },
  {
    id: 'gmr-arena',
    name: 'GMR Arena: 360° Rockstar Stadium',
    location: 'Airport Approach Road, Shamshabad, Hyderabad',
    distance: '14.2 km',
    layoutId: 'CONCERT_STADIUM',
    amenities: ['360° Rockstar Center Stage', '120kW L-Acoustics K1 Rig', 'Pyrotechnics & 40-Head Lasers'],
    timings: [
      { time: '07:00 PM', format: '360° Rockstar Stage', state: 'flash_sale', label: '⚡ ANIRUDH HUKUM' }
    ]
  }
];
