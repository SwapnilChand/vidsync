import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { deleteVideoRecord, getAllVideosPaginated, updateVideoState } from '../../db/database';
import { VideoRecord } from '../../db/schema';
import { File } from 'expo-file-system';

const PAGE_SIZE = 10;

export const DashboardScreen = () => {
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchVideos = async (pageNum: number) => {
    setLoading(true);
    const offset = pageNum * PAGE_SIZE;
    const newVideos = await getAllVideosPaginated(PAGE_SIZE, offset);
    
    if (pageNum === 0) {
      setVideos(newVideos);
    } else {
      setVideos(prev => [...prev, ...newVideos]);
    }
    setLoading(false);
  };

  // Fetch initial data
  useEffect(() => {
    fetchVideos(0);
  }, []);

  // Triggered when user scrolls to the bottom
  const loadMore = () => {
    if (!loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchVideos(nextPage);
    }
  };


  const getStatusColor = (state: string) => {
    switch (state) {
      case 'PENDING': return '#f39c12';   
      case 'UPLOADING': return '#3498db';
      case 'UPLOADED': return '#5efa1b';
      case 'FAILED': return '#f10e0e';
      default: return 'gray';
    }
  };

  const handleRetry = async (video: VideoRecord) => {
    await updateVideoState(video.video_id, "PENDING", 0, null);
    
    //Refresh the UI
    Alert.alert("Retrying", "Video added back to queue.");
    setPage(0);
    fetchVideos(0);
  };

  const handleDelete = async (video: VideoRecord) => {
    try {
      const file = new File(video.local_path);
      await file.delete();
      await deleteVideoRecord(video.video_id);
      Alert.alert("Deleted", "Local file removed to save space.");
      setPage(0);
      fetchVideos(0);
    } catch (e) {
      console.error(e);
    }
  };

  const renderItem = ({ item }: { item: VideoRecord }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Vid: {item.video_id.split('-')[0]}</Text>
        <Text style={[styles.badge, { backgroundColor: getStatusColor(item.upload_state) }]}>
          {item.upload_state}
        </Text>
      </View>
      
      <Text style={styles.meta}>Duration: {(item.duration_ms / 1000).toFixed(1)}s | Size: {(item.file_size_bytes / 1024 / 1024).toFixed(2)} MB</Text>
      <Text style={styles.meta}>FPS Tier: {item.fps_tier} | Attempts: {item.attempt_count}</Text>
      {item.last_error && <Text style={styles.errorText}>Error: {item.last_error}</Text>}

      <View style={styles.actions}>
        {item.upload_state === 'FAILED' && (
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#3498db' }]} onPress={() => handleRetry(item)}>
            <Text style={styles.btnText}>Retry Upload</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.btn, { backgroundColor: '#e74c3c' }]} onPress={() => handleDelete(item)}>
          <Text style={styles.btnText}>Delete Local File</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Video Fleet Dashboard</Text>
      <FlatList 
        data={videos}
        keyExtractor={item => item.video_id}
        renderItem={renderItem}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5} // Load more when halfway to the bottom
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4', padding: 10 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, marginTop: 10 },
  card: { backgroundColor: 'white', padding: 15, borderRadius: 8, marginBottom: 10, elevation: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  title: { fontWeight: 'bold', fontSize: 16 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, color: 'white', fontSize: 12, fontWeight: 'bold', overflow: 'hidden' },
  meta: { color: '#555', fontSize: 14, marginTop: 2 },
  errorText: { color: 'red', fontSize: 12, marginTop: 5 },
  actions: { flexDirection: 'row', marginTop: 10, gap: 10 },
  btn: { padding: 8, borderRadius: 5, flex: 1, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold' }
});