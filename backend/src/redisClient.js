import { Redis } from 'ioredis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);

export const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    return Math.min(times * 100, 2000);
  }
});

// Dedicated subscriber connection must have enableReadyCheck: false
export const redisSub = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  enableReadyCheck: false,
  maxRetriesPerRequest: null
});

redisSub.on('error', (err) => {
  console.warn('[RedisSub] Connection warning:', err.message);
});

redis.on('error', (err) => {
  console.error('[RedisPrimary] Error:', err.message);
});

// Load custom Lua scripts from the redis directory
const redisDir = path.resolve(__dirname, '../../redis');

export const luaScripts = {
  atomicLock: fs.readFileSync(path.join(redisDir, 'atomic_seat_lock.lua'), 'utf-8'),
  atomicRelease: fs.readFileSync(path.join(redisDir, 'atomic_seat_release.lua'), 'utf-8'),
  tokenBucket: fs.readFileSync(path.join(redisDir, 'token_bucket_limiter.lua'), 'utf-8'),
  waitingRoom: fs.readFileSync(path.join(redisDir, 'waiting_room.lua'), 'utf-8'),
  expiryScanner: fs.readFileSync(path.join(redisDir, 'hold_expiry_scanner.lua'), 'utf-8'),
  idempotentCheckout: fs.readFileSync(path.join(redisDir, 'idempotent_checkout.lua'), 'utf-8')
};

// Seed seats with realistic booked/sold clusters and active holds
export async function seedVenueSeats(totalSeats = 1200, force = false) {
  const count = await redis.hlen('venue:seats');
  if (!force && count >= 1000) {
    console.log(`[Redis] Venue already seeded with ${count} seats.`);
    return;
  }

  console.log(`[Redis] Seeding ${totalSeats} auditorium seats into venue:seats with realistic sold/held clusters...`);
  const rows = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y'];
  const seatsPerRow = Math.ceil(totalSeats / rows.length); // 48 per row
  
  const pipeline = redis.pipeline();
  pipeline.del('venue:seats');
  pipeline.del('holds_by_expiry');
  
  let created = 0;
  let soldCount = 0;
  let heldCount = 0;
  const now = Date.now();

  for (let rIdx = 0; rIdx < rows.length; rIdx++) {
    const row = rows[rIdx];
    for (let s = 1; s <= seatsPerRow; s++) {
      if (created >= totalSeats) break;
      const seatId = `${row}-${s}`;
      const tier = row <= 'C' ? 'VIP' : (row <= 'I' ? 'PREMIUM' : 'STANDARD');
      const price = tier === 'VIP' ? 1200 : (tier === 'PREMIUM' ? 450 : 250);

      // Realistic pseudo-random distribution based on row and seat index:
      // Middle seats in popular rows are more likely to be SOLD or HELD
      const centerDist = Math.abs(s - (seatsPerRow / 2));
      const isPopularArea = (rIdx >= 2 && rIdx <= 14) && centerDist < 16;
      const seedHash = ((rIdx * 73) + (s * 31) + 17) % 100;

      let status = 'AVAILABLE';
      let held_by = undefined;
      let expires_at = undefined;
      let booked_by = undefined;

      if (isPopularArea && seedHash < 42) {
        status = 'SOLD';
        booked_by = `user-book-${seedHash}`;
        soldCount++;
      } else if (!isPopularArea && seedHash < 22) {
        status = 'SOLD';
        booked_by = `user-book-${seedHash}`;
        soldCount++;
      } else if (seedHash >= 88 && seedHash <= 94) {
        status = 'HELD';
        held_by = `fan-user-${seedHash}`;
        expires_at = now + 90000; // 90 seconds remaining
        heldCount++;
        pipeline.zadd('holds_by_expiry', expires_at, seatId);
      }

      const seatObj = {
        seat_id: seatId,
        row,
        number: s,
        tier,
        price,
        status,
        ...(booked_by && { booked_by }),
        ...(held_by && { held_by, expires_at })
      };

      pipeline.hset('venue:seats', seatId, JSON.stringify(seatObj));
      created++;
    }
  }

  await pipeline.exec();
  console.log(`[Redis] Successfully seeded ${created} seats! (Sold: ${soldCount}, Held: ${heldCount}, Available: ${created - soldCount - heldCount})`);
}
