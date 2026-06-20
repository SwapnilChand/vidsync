import * as SQLite from "expo-sqlite";
import {
  CREATE_VIDEOS_TABLE,
  CREATE_INDEX_UPLOAD_STATE,
  CREATE_INDEX_STARTED_AT,
  VideoRecord,
} from "./schema";

const db = SQLite.openDatabaseSync("sync_engine.db");

export const initDB = async () => {
  try {
    await db.execAsync(CREATE_VIDEOS_TABLE);
    await db.execAsync(CREATE_INDEX_UPLOAD_STATE);
    await db.execAsync(CREATE_INDEX_STARTED_AT);
    console.log("Database initialized successfully!");
  } catch (error) {
    console.error("Failed to initialize database:", error);
  }
};

export const insertVideoRecord = async (video: VideoRecord) => {
  await db.runAsync(
    `
    INSERT INTO videos (
      video_id,
      worker_id,
      started_at,
      ended_at,
      duration_ms,
      file_size_bytes,
      local_path,
      fps,
      fps_tier,
      device_model,
      os_version,
      resolution,
      metadata_json,
      upload_state,
      attempt_count,
      last_error,
      last_attempted_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      video.video_id,
      video.worker_id,
      video.started_at,
      video.ended_at,
      video.duration_ms,
      video.file_size_bytes,
      video.local_path,
      video.fps,
      video.fps_tier,
      video.device_model,
      video.os_version,
      video.resolution,
      video.metadata_json,
      video.upload_state,
      video.attempt_count,
      video.last_error,
      video.last_attempted_at,
    ],
  );
};

export const getPendingUploads = async (): Promise<VideoRecord[]> => {
  return db.getAllAsync<VideoRecord>(
    `SELECT * FROM videos
    WHERE upload_state IN (?, ?)
    ORDER BY started_at ASC`,
    ["PENDING", "FAILED"],
  );
};

export const updateVideoState = async (
  video_id: string,
  upload_state: "PENDING" | "UPLOADING" | "UPLOADED" | "FAILED",
  attempt_count: number,
  last_error: string | null,
) => {
  const last_attempted_at = new Date().toISOString();
  await db.runAsync(
    "UPDATE videos SET upload_state = ?, attempt_count = ?, last_error = ?, last_attempted_at = ? WHERE video_id = ?",
    [upload_state, attempt_count, last_error, last_attempted_at, video_id],
  );
};

export const getAllVideosPaginated = async (
  limit: number,
  offset: number,
): Promise<VideoRecord[]> => {
  return db.getAllAsync<VideoRecord>(
    `SELECT * FROM videos
    ORDER BY started_at DESC
    LIMIT ?
    OFFSET ?`,
    [limit, offset],
  );
};

export const deleteVideoRecord = async (video_id: string) => {
  await db.runAsync("DELETE FROM videos WHERE video_id = ?", [video_id]);
};
