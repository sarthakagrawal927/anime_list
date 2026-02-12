import { getDb } from "./client";

export interface DbUser {
  id: string;
  google_id: string;
  email: string;
  name: string;
  picture?: string;
  created_at: string;
}

export async function initUsersTable(): Promise<void> {
  const db = getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      google_id TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      picture TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

export async function findOrCreateUser(profile: {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
}): Promise<DbUser> {
  const db = getDb();

  const existing = await db.execute({
    sql: "SELECT id, google_id, email, name, picture, created_at FROM users WHERE google_id = ?",
    args: [profile.googleId],
  });

  if (existing.rows.length > 0) {
    const row = existing.rows[0];
    // Update name/picture in case they changed
    await db.execute({
      sql: "UPDATE users SET name = ?, picture = ? WHERE google_id = ?",
      args: [profile.name, profile.picture ?? null, profile.googleId],
    });
    return {
      id: row.id as string,
      google_id: row.google_id as string,
      email: row.email as string,
      name: profile.name,
      picture: profile.picture,
      created_at: row.created_at as string,
    };
  }

  // Check if a placeholder user exists for this email (from seed script)
  const byEmail = await db.execute({
    sql: "SELECT id, google_id FROM users WHERE email = ?",
    args: [profile.email],
  });
  if (byEmail.rows.length > 0 && (byEmail.rows[0].google_id as string).startsWith("pending_")) {
    // Link the placeholder to the real Google account
    await db.execute({
      sql: "UPDATE users SET google_id = ?, name = ?, picture = ? WHERE id = ?",
      args: [profile.googleId, profile.name, profile.picture ?? null, byEmail.rows[0].id as string],
    });
    return {
      id: byEmail.rows[0].id as string,
      google_id: profile.googleId,
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      created_at: new Date().toISOString(),
    };
  }

  const id = crypto.randomUUID();
  await db.execute({
    sql: "INSERT INTO users (id, google_id, email, name, picture) VALUES (?, ?, ?, ?, ?)",
    args: [id, profile.googleId, profile.email, profile.name, profile.picture ?? null],
  });

  return {
    id,
    google_id: profile.googleId,
    email: profile.email,
    name: profile.name,
    picture: profile.picture,
    created_at: new Date().toISOString(),
  };
}
