import { File } from "expo-file-system";
import { getPendingUploads, updateVideoState } from "../db/database";
import { VideoRecord } from "../db/schema";
import { apiClient } from "./api";

const uploadVideoToAWS = async (video: VideoRecord): Promise<void> => {
  const { upload_url } = await apiClient.post<{ upload_url: string }>(
    "/generate-upload-url",
    {
      worker_id: video.worker_id,
      video_id: video.video_id,
    },
  );
  const fileToUpload = new File(video.local_path);
  // mock upload to AWS
  // Wait 2 seconds to simulate a 50MB upload
  await new Promise((resolve) => setTimeout(resolve, 2000));
  console.log(`[Upload] Success! Mock uploaded to AWS.`);

  /*
  const uploadResult = await fetch(upload_url, {
    method: "PUT",
    headers: {
      "Content-Type": "video/mp4",
    },
    body: fileToUpload,
  });

  if (uploadResult.status !== 200) {
    const errorText = await uploadResult.text();
    console.log(errorText);
    throw new Error(`S3 Upload failed with status ${uploadResult.status}`);
  }*/
};

const canRetry = (video: VideoRecord): boolean => {
  if (!video.last_attempted_at) return true;

  const delayInSeconds = Math.min(2 ** video.attempt_count, 64);
  const lastAttemptTime = new Date(video.last_attempted_at).getTime();
  const currentTime = new Date().getTime();
  if (currentTime > lastAttemptTime + delayInSeconds * 1000) {
    return true;
  } else {
    return false;
  }
};

export const processQueue = async () => {
  console.log("Checking for pending uploads...");
  const pendingVideos = await getPendingUploads();

  for (const video of pendingVideos) {
    if (!canRetry(video)) {
      console.log(`Skipping video ${video.video_id}, backing off...`);
      continue;
    }

    try {
      console.log(`Starting upload for ${video.video_id}...`);

      await updateVideoState(
        video.video_id,
        "UPLOADING",
        video.attempt_count,
        null,
      );

      await uploadVideoToAWS(video);

      await updateVideoState(
        video.video_id,
        "UPLOADED",
        video.attempt_count,
        null,
      );

      console.log(`Successfully uploaded ${video.video_id}!`);
    } catch (error: any) {
      console.error(`Upload failed for ${video.video_id}: ${error.message}`);

      await updateVideoState(
        video.video_id,
        "FAILED",
        video.attempt_count + 1,
        error.message,
      );
    }
  }
};

export const startSyncEngine = () => {
  setInterval(processQueue, 5000);
};
