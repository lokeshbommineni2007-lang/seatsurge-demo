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
  category: 'Concerts' | 'Movies' | 'Sports' | 'Comedy';
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

// Fallback high-contrast SVG posters if external images fail or are offline
export function getFallbackPoster(title: string, category: string, primaryColor = '#e11d48'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#111827"/>
        <stop offset="50%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#030712"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="30%" r="50%">
        <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="600" height="900" fill="url(#bg)"/>
    <rect width="600" height="900" fill="url(#glow)"/>
    <circle cx="300" cy="360" r="140" fill="${primaryColor}" fill-opacity="0.15" stroke="${primaryColor}" stroke-width="2"/>
    <text x="300" y="375" fill="#f8fafc" font-size="56" font-weight="900" font-family="system-ui, sans-serif" text-anchor="middle">🎬</text>
    <text x="300" y="540" fill="#f8fafc" font-size="34" font-weight="900" font-family="system-ui, sans-serif" text-anchor="middle">${title.length > 22 ? title.slice(0, 20) + '...' : title}</text>
    <text x="300" y="590" fill="#94a3b8" font-size="18" font-weight="700" font-family="monospace" text-anchor="middle" letter-spacing="4">${category.toUpperCase()} • 3D ARENA</text>
    <rect x="200" y="640" width="200" height="40" rx="20" fill="${primaryColor}" fill-opacity="0.2" stroke="${primaryColor}" stroke-width="1.5"/>
    <text x="300" y="666" fill="#fecdd3" font-size="14" font-weight="800" font-family="monospace" text-anchor="middle">5,000 SEATS LIVE</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const HYDERABAD_EVENTS: EventItem[] = [
  {
    id: 'anirudh-hukum',
    title: 'Anirudh: Hukum World Tour',
    subtitle: 'Rockstar Anirudh Ravichander Live in Hyderabad • 360° Stadium Arena',
    category: 'Concerts',
    genre: ['Rockstar', 'EDM', 'Tamil/Telugu Rock', 'Live Stadium'],
    venue: 'GMR Arena: 360° Rockstar Stadium',
    location: 'Shamshabad, Hyderabad',
    city: 'Hyderabad',
    date: 'Sat, 14 Dec • 7:00 PM',
    duration: '3h 45m',
    ageRating: 'All Ages',
    rating: 9.9,
    votes: '520K',
    languages: ['Tamil', 'Telugu', 'Hindi'],
    formats: ['360° Rockstar Stage', 'Golden Fan Pit', 'Laser & Pyro Arena'],
    priceStart: 999,
    bannerImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1920&q=80',
    posterImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
    isFlashSale: true,
    statusTag: '⚡ ROCKSTAR ANIRUDH LIVE',
    totalSeats: 1200
  },
  {
    id: 'ramayana-3d',
    title: 'Ramayana (3D) (Telugu)',
    subtitle: 'Epic Mythological Blockbuster • Directed by Nitesh Tiwari',
    category: 'Movies',
    genre: ['Mythological', 'Action', 'Epic Drama'],
    venue: 'Prasads Multiplex: PCX Screen',
    location: 'Necklace Road, Hyderabad',
    city: 'Hyderabad',
    date: 'Fri, 13 Nov • Multiple Shows',
    duration: '3h 10m',
    ageRating: 'U',
    rating: 9.9,
    votes: '640K',
    languages: ['Telugu', 'Hindi', 'Tamil'],
    formats: ['PCX Screen', 'Dolby Cinema 3D', 'Laser Dolby Atmos', 'Barco 4K Laser'],
    priceStart: 295,
    bannerImage: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=1920&q=80',
    posterImage: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=800&q=80',
    isFlashSale: true,
    statusTag: '🔥 HYDERABAD BLOCKBUSTER',
    totalSeats: 1200
  },
  {
    id: 'coldplay-hyd',
    title: 'Coldplay: Music of the Spheres',
    subtitle: 'World Tour 2026 • Live in Hyderabad',
    category: 'Concerts',
    genre: ['Alternative Rock', 'Pop', 'Arena'],
    venue: 'Gachibowli Outdoor Stadium',
    location: 'Gachibowli, Hyderabad',
    city: 'Hyderabad',
    date: 'Sun, 24 Nov • 7:00 PM',
    duration: '3h 15m',
    ageRating: 'All Ages',
    rating: 9.8,
    votes: '320K',
    languages: ['English'],
    formats: ['Live Concert', 'Stadium Tour', 'Laser Show'],
    priceStart: 2500,
    bannerImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1920&q=80',
    posterImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
    isFlashSale: true,
    statusTag: 'FLASH SALE • 5,000 SEATS',
    totalSeats: 5000
  },
  {
    id: 'pushpa-2',
    title: 'Pushpa 2: The Rule',
    subtitle: 'Allu Arjun • Sukumar • Devi Sri Prasad',
    category: 'Movies',
    genre: ['Action', 'Thriller', 'Drama'],
    venue: 'Prasads Multiplex: Large Screen',
    location: 'Necklace Road, Hyderabad',
    city: 'Hyderabad',
    date: 'Daily • Multiple Shows',
    duration: '3h 20m',
    ageRating: 'U/A 16+',
    rating: 9.5,
    votes: '480K',
    languages: ['Telugu', 'Hindi', 'Tamil'],
    formats: ['IMAX 3D Laser', 'Dolby Atmos 7.1.4'],
    priceStart: 350,
    bannerImage: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1920&q=80',
    posterImage: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
    isFlashSale: true,
    statusTag: 'FAST FILLING',
    totalSeats: 5000
  },
  {
    id: 'srh-vs-csk',
    title: 'Sunrisers Hyderabad vs CSK',
    subtitle: 'IPL 2026 • Rajiv Gandhi Stadium, Uppal',
    category: 'Sports',
    genre: ['Cricket', 'T20', 'Tournament'],
    venue: 'Rajiv Gandhi Int. Cricket Stadium',
    location: 'Uppal, Hyderabad',
    city: 'Hyderabad',
    date: 'Fri, 29 Nov • 7:30 PM',
    duration: '3h 45m',
    ageRating: 'All Ages',
    rating: 9.7,
    votes: '210K',
    languages: ['Telugu', 'English', 'Hindi'],
    formats: ['Stands', 'Corporate Box', 'Pavilion Terrace'],
    priceStart: 950,
    bannerImage: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1920&q=80',
    posterImage: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80',
    isFlashSale: false,
    statusTag: 'SELLING OUT',
    totalSeats: 5000
  },
  {
    id: 'arijit-singh',
    title: 'Arijit Singh: Symphony Tour',
    subtitle: 'Live with 60-Piece Global Symphony Orchestra',
    category: 'Concerts',
    genre: ['Bollywood', 'Classical', 'Soul'],
    venue: 'GMR Arena, Shamshabad',
    location: 'Airport Approach Road, Hyderabad',
    city: 'Hyderabad',
    date: 'Sat, 7 Dec • 6:30 PM',
    duration: '3h 30m',
    ageRating: 'All Ages',
    rating: 9.6,
    votes: '145K',
    languages: ['Hindi', 'Bengali', 'Telugu'],
    formats: ['Open Air Amphitheatre', 'VIP Lounge'],
    priceStart: 1800,
    bannerImage: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1920&q=80',
    posterImage: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80',
    isFlashSale: false,
    totalSeats: 5000
  },
  {
    id: 'zakir-khan',
    title: 'Zakir Khan: Live Special',
    subtitle: 'Tathastu & Beyond • Exclusive Hyderabad Standup',
    category: 'Comedy',
    genre: ['Stand-Up', 'Storytelling', 'Hindi Comedy'],
    venue: 'Shilpakala Vedika',
    location: 'Hitec City, Hyderabad',
    city: 'Hyderabad',
    date: 'Sat, 30 Nov • 8:00 PM',
    duration: '2h 00m',
    ageRating: '16+',
    rating: 9.4,
    votes: '62K',
    languages: ['Hindi'],
    formats: ['Live Auditorium', 'Balcony & Stalls'],
    priceStart: 799,
    bannerImage: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=1920&q=80',
    posterImage: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=800&q=80',
    isFlashSale: false,
    totalSeats: 5000
  },
  {
    id: 'devara',
    title: 'Devara: Part 1 (IMAX Laser)',
    subtitle: 'Jr NTR • Saif Ali Khan • Janhvi Kapoor',
    category: 'Movies',
    genre: ['Action', 'Epic', 'Drama'],
    venue: 'AMB Cinemas: Screen 1 VIP',
    location: 'Gachibowli, Hyderabad',
    city: 'Hyderabad',
    date: 'Daily • 5 Shows',
    duration: '2h 58m',
    ageRating: 'U/A 16+',
    rating: 9.2,
    votes: '390K',
    languages: ['Telugu', 'Hindi'],
    formats: ['Dolby Cinema 4K Laser', 'VIP Recliner'],
    priceStart: 295,
    bannerImage: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1920&q=80',
    posterImage: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80',
    isFlashSale: false,
    totalSeats: 5000
  }
];

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
      { time: '03:35 PM', format: 'PCX Screen', state: 'flash_sale', label: '🔥 PCX SCREEN' },
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
      { time: '07:20 PM', format: 'Barco 4K Laser', state: 'flash_sale', label: '⚡ FLASH SALE' },
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
      { time: '07:25 PM', format: 'Dolby Cinema 3D', state: 'flash_sale', label: '⭐ DIRECTOR CHOICE' },
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
      { time: '12:05 PM', format: 'Laser Dolby Atmos', state: 'flash_sale', label: '⚡ ATMOS FLASH SALE' },
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
    amenities: ['360° Rockstar Stage', '120kW L-Acoustics K1 Rig', 'Pyrotechnics & 40-Head Lasers'],
    timings: [
      { time: '07:00 PM', format: '360° Rockstar Stage', state: 'flash_sale', label: '⚡ FLASH SALE' },
      { time: '09:30 PM', format: 'Golden Pit Experience', state: 'flash_sale', label: '⚡ FAST FILLING' }
    ]
  },
  {
    id: 'amb',
    name: 'AMB Cinemas: Screen 1 VIP',
    location: 'Sarath City Capital Mall, Gachibowli',
    distance: '8.4 km',
    layoutId: 'ALLU_KOKAPET',
    amenities: ['RGB Pure Laser', 'Dolby Atmos', 'M-Lounge Access'],
    timings: [
      { time: '11:15 AM', format: 'Dolby Atmos 4K', state: 'available' },
      { time: '03:45 PM', format: 'Dolby Atmos 4K', state: 'available' },
      { time: '07:30 PM', format: 'VIP Laser Lounge', state: 'flash_sale', label: 'HIGH DEMAND' },
      { time: '10:50 PM', format: 'Dolby Atmos 4K', state: 'fast_filling' }
    ]
  }
];
