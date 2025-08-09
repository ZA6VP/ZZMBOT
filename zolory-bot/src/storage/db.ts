import Database from 'better-sqlite3';
import { logger } from '../utils/logger.js';

export type UserProfile = {
  userId: string;
  displayName: string | null;
  language: string | null;
  respectLevel: number; // higher = kinder tone
  lastSeenAt: number | null;
};

export type Warning = {
  id?: number;
  guildId: string;
  userId: string;
  moderatorId: string;
  reason: string;
  createdAt: number;
};

export type GameSession = {
  id?: number;
  guildId: string | null;
  channelId: string;
  userId: string; // opponent human
  state: string; // serialized JSON
  type: 'tictactoe';
  createdAt: number;
  updatedAt: number;
};

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database('zolory.db');
    db.pragma('journal_mode = WAL');
    migrate(db);
    logger.info('SQLite initialized');
  }
  return db;
}

function migrate(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      user_id TEXT PRIMARY KEY,
      display_name TEXT,
      language TEXT,
      respect_level INTEGER DEFAULT 0,
      last_seen_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS warnings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      moderator_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS game_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT,
      channel_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      state TEXT NOT NULL,
      type TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS processed_messages (
      message_id TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL
    );
  `);
}

export const UserProfiles = {
  upsert(profile: UserProfile) {
    const stmt = getDb().prepare(`
      INSERT INTO user_profiles (user_id, display_name, language, respect_level, last_seen_at)
      VALUES (@userId, @displayName, @language, @respectLevel, @lastSeenAt)
      ON CONFLICT(user_id) DO UPDATE SET
        display_name=excluded.display_name,
        language=excluded.language,
        respect_level=excluded.respect_level,
        last_seen_at=excluded.last_seen_at
    `);
    stmt.run({
      userId: profile.userId,
      displayName: profile.displayName,
      language: profile.language,
      respectLevel: profile.respectLevel,
      lastSeenAt: profile.lastSeenAt,
    });
  },
  get(userId: string): UserProfile | null {
    const row = getDb().prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(userId) as any;
    if (!row) return null;
    return {
      userId: row.user_id,
      displayName: row.display_name,
      language: row.language,
      respectLevel: row.respect_level,
      lastSeenAt: row.last_seen_at,
    };
  },
};

export const Warnings = {
  add(w: Warning) {
    const stmt = getDb().prepare(`
      INSERT INTO warnings (guild_id, user_id, moderator_id, reason, created_at)
      VALUES (@guildId, @userId, @moderatorId, @reason, @createdAt)
    `);
    stmt.run({
      guildId: w.guildId,
      userId: w.userId,
      moderatorId: w.moderatorId,
      reason: w.reason,
      createdAt: w.createdAt,
    });
  },
  list(guildId: string, userId: string): Warning[] {
    const rows = getDb().prepare('SELECT * FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC').all(guildId, userId) as any[];
    return rows.map(r => ({
      id: r.id,
      guildId: r.guild_id,
      userId: r.user_id,
      moderatorId: r.moderator_id,
      reason: r.reason,
      createdAt: r.created_at,
    }));
  },
};

export const GameSessions = {
  upsert(session: GameSession) {
    if (session.id) {
      const stmt = getDb().prepare(`
        UPDATE game_sessions SET guild_id=@guildId, channel_id=@channelId, user_id=@userId, state=@state, type=@type, updated_at=@updatedAt
        WHERE id=@id
      `);
      stmt.run({
        id: session.id,
        guildId: session.guildId,
        channelId: session.channelId,
        userId: session.userId,
        state: session.state,
        type: session.type,
        updatedAt: session.updatedAt,
      });
      return session.id;
    }
    const stmt = getDb().prepare(`
      INSERT INTO game_sessions (guild_id, channel_id, user_id, state, type, created_at, updated_at)
      VALUES (@guildId, @channelId, @userId, @state, @type, @createdAt, @updatedAt)
    `);
    const info = stmt.run({
      guildId: session.guildId,
      channelId: session.channelId,
      userId: session.userId,
      state: session.state,
      type: session.type,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    });
    return Number(info.lastInsertRowid);
  },
  findByChannelUser(type: GameSession['type'], channelId: string, userId: string) {
    const row = getDb().prepare('SELECT * FROM game_sessions WHERE type=? AND channel_id=? AND user_id=? ORDER BY updated_at DESC LIMIT 1').get(type, channelId, userId) as any;
    if (!row) return null;
    return {
      id: row.id,
      guildId: row.guild_id,
      channelId: row.channel_id,
      userId: row.user_id,
      state: row.state,
      type: row.type,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    } as GameSession;
  },
};

export const ProcessedMessages = {
  claim(messageId: string): boolean {
    try {
      const stmt = getDb().prepare('INSERT INTO processed_messages (message_id, created_at) VALUES (?, ?)');
      stmt.run(messageId, Date.now());
      return true;
    } catch {
      return false; // duplicate
    }
  },
};