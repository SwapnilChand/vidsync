import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import { initDB } from './src/db/database';
import { startSyncEngine } from './src/services/syncEngine';

import { CameraScreen } from './src/features/camera/CameraScreen';
import { DashboardScreen } from './src/features/dashboard/DashboardScreen';
import { AuthScreen } from './src/features/auth/AuthScreen';

import { initStorage } from './src/services/storage';
import { authService } from './src/services/auth';

export default function App() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentTab, setCurrentTab] = useState<'CAMERA' | 'DASHBOARD'>('CAMERA');

  useEffect(() => {
    const setupApp = async () => {
      await initDB();
      await initStorage();
      const token = await authService.getToken();
      if (token) setIsAuthenticated(true)
      setIsDbReady(true);
      startSyncEngine();
    };
    
    setupApp();
  }, []);

  if (!isDbReady) {
    return <View style={styles.center}><Text>Initializing System...</Text></View>;
  }
  
  if (!isAuthenticated) return <AuthScreen onLoginSuccess={() => setIsAuthenticated(true)} />;


  return (
    <SafeAreaProvider>
    <SafeAreaView style={styles.container}>
      {/* Dynamic Screen Rendering */}
      <View style={styles.screenContainer}>
        {currentTab === 'CAMERA' ? <CameraScreen /> : <DashboardScreen/>}
      </View>

      {/* Simple Bottom Navigation */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navBtn} onPress={() => setCurrentTab('CAMERA')}>
          <Text style={[styles.navText, currentTab === 'CAMERA' && styles.activeText]}>🎥 Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => setCurrentTab('DASHBOARD')}>
          <Text style={[styles.navText, currentTab === 'DASHBOARD' && styles.activeText]}>📊 Dashboard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  screenContainer: { flex: 1 },
  navBar: { flexDirection: 'row', backgroundColor: '#222', paddingBottom: 20, paddingTop: 10 },
  navBtn: { flex: 1, alignItems: 'center' },
  navText: { color: 'gray', fontSize: 16 },
  activeText: { color: 'white', fontWeight: 'bold' }
});