import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../db/seatsurge.db');

export const db = new sqlite3.Database(dbPath);

export function initDb() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 1. Confirmed bookings table with strict UNIQUE constraint on idempotency_key
      db.run(`
        CREATE TABLE IF NOT EXISTS bookings (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          seats TEXT NOT NULL,
          amount INTEGER NOT NULL,
          idempotency_key TEXT UNIQUE NOT NULL,
          status TEXT NOT NULL,
          created_at INTEGER NOT NULL
        )
      `);

      // 2. Audit logs table for post-sale compliance & design defence
      db.run(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          event_type TEXT NOT NULL,
          seat_id TEXT,
          user_id TEXT,
          instance_id TEXT,
          details TEXT,
          created_at INTEGER NOT NULL
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

export function saveBooking(booking) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO bookings (id, user_id, seats, amount, idempotency_key, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run([
      booking.booking_id,
      booking.user_id,
      JSON.stringify(booking.seats),
      booking.total_amount,
      booking.idempotency_key,
      'CONFIRMED',
      booking.confirmed_at
    ], function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
}

export function logAudit(eventType, seatId, userId, instanceId, details) {
  const stmt = db.prepare(`
    INSERT INTO audit_logs (event_type, seat_id, user_id, instance_id, details, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run([eventType, seatId, userId, instanceId, JSON.stringify(details || {}), Date.now()]);
}
