import { redis, redisSub } from './redisClient.js';

class WebSocketManager {
  constructor() {
    this.clients = new Set();
    this.instanceId = process.env.INSTANCE_ID || `app-${Math.random().toString(36).substring(7)}`;
    this.latencies = [];
    this.requestCount = 0;
    this.lastRpsCheck = Date.now();
    this.currentRps = 0;
    this.botsBlocked = 0;
  }

  init() {
    // Subscribe to Redis Pub/Sub for cross-instance real-time fanout
    redisSub.subscribe('seat_updates', (err) => {
      if (err) console.error(`[${this.instanceId}] RedisSub error:`, err);
      else console.log(`[${this.instanceId}] Subscribed to Redis channel: seat_updates`);
    });

    redisSub.on('message', (channel, message) => {
      if (channel === 'seat_updates') {
        this.broadcast(message);
      }
    });

    // RPS calculation loop every 1s
    setInterval(() => {
      const now = Date.now();
      const deltaSec = (now - this.lastRpsCheck) / 1000;
      this.currentRps = Math.round(this.requestCount / (deltaSec || 1));
      this.requestCount = 0;
      this.lastRpsCheck = now;
    }, 1000);
  }

  addClient(ws) {
    this.clients.add(ws);
    // Send welcome payload with instance ID and initial sync info
    ws.send(JSON.stringify({
      type: 'CONNECTED',
      instanceId: this.instanceId,
      timestamp: Date.now()
    }));

    ws.on('close', () => {
      this.clients.delete(ws);
    });

    ws.on('message', async (rawMsg) => {
      try {
        const msg = JSON.parse(rawMsg.toString());
        // Loophole 1 Fix: Client-side Reconnection with State Reconciliation
        if (msg.type === 'SYNC_REQUEST') {
          const lastSeq = msg.lastEventId || '0-0';
          // Read newer events from Redis Stream
          const streamData = await redis.xread('STREAMS', 'seat_events', lastSeq);
          if (streamData && streamData.length > 0) {
            const events = streamData[0][1];
            ws.send(JSON.stringify({
              type: 'SYNC_RESPONSE',
              events: events.map(([id, fields]) => ({ id, fields }))
            }));
          }
        }
      } catch (err) {
        console.error('Error parsing client WS message:', err);
      }
    });
  }

  broadcast(payload) {
    const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
    for (const client of this.clients) {
      if (client.readyState === 1) { // OPEN
        client.send(data);
      }
    }
  }

  recordLatency(ms) {
    this.requestCount++;
    this.latencies.push(ms);
    if (this.latencies.length > 2000) {
      this.latencies.shift();
    }
  }

  recordBotBlocked() {
    this.botsBlocked++;
  }

  getMetrics() {
    const sorted = [...this.latencies].sort((a, b) => a - b);
    const p50 = sorted.length ? sorted[Math.floor(sorted.length * 0.50)] : 0;
    const p95 = sorted.length ? sorted[Math.floor(sorted.length * 0.95)] : 0;

    return {
      instanceId: this.instanceId,
      connectedClients: this.clients.size,
      rps: this.currentRps,
      p50LatencyMs: Math.round(p50 * 10) / 10,
      p95LatencyMs: Math.round(p95 * 10) / 10,
      botsBlocked: this.botsBlocked
    };
  }
}

export const wsManager = new WebSocketManager();
