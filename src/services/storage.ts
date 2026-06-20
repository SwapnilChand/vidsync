import { Directory, File, Paths } from "expo-file-system";

const VIDEO_DIR = new Directory(Paths.document, "vidsync");

export const initStorage = async () => {
  if (!VIDEO_DIR.exists) {
    VIDEO_DIR.create();
    console.log("Created permanent video storage directory.");
  }
};

export const saveVideoToPermanentStorage = async (
  tempUri: string,
  videoId: string,
): Promise<string> => {
  const tempFile = new File(tempUri);
  const permanentFile = new File(VIDEO_DIR, `${videoId}.mp4`);
  console.log("Target uri:", permanentFile.uri);
  await tempFile.move(permanentFile);
  return permanentFile.uri;
};
