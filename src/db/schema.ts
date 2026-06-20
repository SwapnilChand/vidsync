export interface VideoRecord {
  video_id: string;
  worker_id: string;
  started_at: string;
  ended_at: string;
  duration_ms: number;
  file_size_bytes: number;
  local_path: string;
  fps: number;
  fps_tier: "low" | "standard" | "high";
  device_model: string;
  os_version: string;
  resolution: string;
  metadata_json: string | null; // Extensible field
  upload_state: "PENDING" | "UPLOADING" | "UPLOADED" | "FAILED";
  attempt_count: number;
  last_error: string | null;
  last_attempted_at: string | null;
}

export const CREATE_VIDEOS_TABLE = `
  CREATE TABLE IF NOT EXISTS videos (
    video_id TEXT PRIMARY KEY,
    worker_id TEXT NOT NULL,
    started_at TEXT NOT NULL,
    ended_at TEXT NOT NULL,
    duration_ms INTEGER NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    local_path TEXT NOT NULL,
    fps REAL NOT NULL,
    fps_tier TEXT NOT NULL,
    device_model TEXT NOT NULL,
    os_version TEXT NOT NULL,
    resolution TEXT NOT NULL,
    metadata_json TEXT,
    upload_state TEXT DEFAULT 'PENDING',
    attempt_count INTEGER DEFAULT 0,
    last_error TEXT,
    last_attempted_at TEXT
  );
`;

export const CREATE_INDEX_UPLOAD_STATE = `
  CREATE INDEX IF NOT EXISTS idx_upload_state ON videos(upload_state);
`;

export const CREATE_INDEX_STARTED_AT = `
  CREATE INDEX IF NOT EXISTS idx_started_at ON videos(started_at DESC);
`;
