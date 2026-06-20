import { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as Device from 'expo-device';
import { File } from "expo-file-system";
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { insertVideoRecord } from '../../db/database';
import { VideoRecord } from '../../db/schema';
import { saveVideoToPermanentStorage } from '../../services/storage';
import { authService } from '../../services/auth';
import { Ionicons } from "@expo/vector-icons";

export const CameraScreen = () => {
  const [camStatus, requestCamPermission] = useCameraPermissions();
  const [micStatus, requestMicPermission] = useMicrophonePermissions();
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [facing, setFacing] = useState<"front" | "back">("back");

  const MAX_DURATION_SECONDS = 60;
  const cameraRef = useRef<CameraView>(null);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  if (!camStatus || !micStatus) return <View />; // Loading states
  
  if (!camStatus.granted || !micStatus.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>We need camera and mic permissions.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => { requestCamPermission(); requestMicPermission(); }}>
          <Text style={styles.btnText}>Grant Permissions</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const startRecording = async () => {
    if (!cameraRef.current) return;
    
    setIsRecording(true);
    startTimeRef.current = Date.now();
    setRecordingDuration(0);

    timerRef.current = setInterval(() => {
      setRecordingDuration(
        Math.floor((Date.now() - startTimeRef.current) / 1000)
      );
    }, 1000);
    console.log("Recording started...");

    try {
      const video = await cameraRef.current.recordAsync();
      if (video) {
        await handleVideoSaved(video.uri, Date.now());
      }
    } catch (e) {
      console.error("Failed to record", e);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      console.log("Stopping record...");
      cameraRef.current.stopRecording();
      setIsRecording(false);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleVideoSaved = async (uri: string, endTime: number) => {
    const duration_ms = endTime - startTimeRef.current;
    const file = new File(uri);
    const file_size_bytes = file.exists ? file.size : 0;
    const newVideoId = uuidv4();
    const safePath = await saveVideoToPermanentStorage(uri, newVideoId);
    const workerId = await authService.getWorkerId() || "unknown_worker";

    const newVideo: VideoRecord = {
      video_id: newVideoId,
      worker_id: workerId,
      started_at: new Date(startTimeRef.current).toISOString(),
      ended_at: new Date(endTime).toISOString(),
      duration_ms: duration_ms,
      file_size_bytes: file_size_bytes,
      local_path: safePath,
      fps: 30,
      fps_tier: "standard", 
      device_model: Device.modelName || "Unknown",
      os_version: Device.osVersion || "Unknown",
      resolution: "1920x1080",      
      metadata_json: null,
      upload_state: "PENDING",
      attempt_count: 0,
      last_error: null,
      last_attempted_at: null
    };

    await insertVideoRecord(newVideo)
    Alert.alert("Saved!", `Video added to sync queue. (${(file_size_bytes / 1024 / 1024).toFixed(2)} MB)`);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        mode="video"
        facing={facing}
      />

      <View style={styles.topControls}>
  <TouchableOpacity
    style={styles.flipButton}
    onPress={() =>
      setFacing(current =>
        current === "back" ? "front" : "back"
      )
    }
  >
    <Ionicons
      name="camera-reverse"
      size={34}
      color="white"
    />
  </TouchableOpacity>
      </View>

      {isRecording && (
        <View style={styles.timerContainer}>
          <Text style={styles.timer}>
            {formatTime(recordingDuration)} / {formatTime(MAX_DURATION_SECONDS)}
          </Text>
        </View>
      )}

      <View style={styles.bottomControls}>
        <TouchableOpacity
          onPress={isRecording ? stopRecording : startRecording}
          style={styles.recordOuter}
        >
          {isRecording ? (
            <View style={styles.stopSquare} />
          ) : (
            <View style={styles.recordInner} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black', justifyContent: 'center' },
  camera: { flex: 1 },
  text: { color: 'white', textAlign: 'center', marginBottom: 20 },
  controls: { position: 'absolute', bottom: 50, width: '100%', alignItems: 'center' },
  recordBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "red",
    borderWidth: 4,
    borderColor: "white",
  },
  recordingBtn: { backgroundColor: 'red' },
  btn: { backgroundColor: 'white', padding: 10, borderRadius: 10, alignSelf: 'center' },
  btnText: { fontWeight: 'bold' },
  topControls: {
  position: "absolute",
  top: 60,
  right: 20,
  },

  flipButton: {
    padding: 8,
  },

  timerContainer: {
    position: "absolute",
    top: 60,
    alignSelf: "center",
  },

  timer: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },

  bottomControls: {
    position: "absolute",
    bottom: 50,
    width: "100%",
    alignItems: "center",
  },

  recordOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 5,
    borderColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },

  recordInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "red",
  },

  stopSquare: {
    width: 35,
    height: 35,
    borderRadius: 6,
    backgroundColor: "red",
  },
});