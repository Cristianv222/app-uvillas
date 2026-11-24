/** Migraciones SQLite. Cada entrada sube `PRAGMA user_version` en uno. Nunca edites una ya publicada: agrega otra. */
export const MIGRATIONS: string[] = [
  `
  CREATE TABLE meta (key TEXT PRIMARY KEY NOT NULL, value TEXT);

  CREATE TABLE farms (
    id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL,
    name TEXT NOT NULL, location TEXT DEFAULT '', latitude REAL, longitude REAL,
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
    is_deleted INTEGER NOT NULL DEFAULT 0, dirty INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE plots (
    id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, farm_id TEXT NOT NULL,
    name TEXT NOT NULL, area_hectares REAL,
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
    is_deleted INTEGER NOT NULL DEFAULT 0, dirty INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE scans (
    id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL,
    farm_id TEXT, plot_id TEXT,
    part TEXT NOT NULL, label_code TEXT NOT NULL, label_name TEXT NOT NULL,
    confidence REAL NOT NULL, is_healthy INTEGER NOT NULL DEFAULT 0, top_k TEXT NOT NULL DEFAULT '[]',
    image_uri TEXT, image_synced INTEGER NOT NULL DEFAULT 0,
    latitude REAL, longitude REAL, captured_at TEXT NOT NULL, source TEXT NOT NULL DEFAULT 'local', notes TEXT DEFAULT '',
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
    is_deleted INTEGER NOT NULL DEFAULT 0, dirty INTEGER NOT NULL DEFAULT 1
  );
  CREATE INDEX idx_scans_user_captured ON scans (user_id, captured_at DESC);
  CREATE INDEX idx_plots_farm ON plots (farm_id);
  `,
];
