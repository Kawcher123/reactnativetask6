import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { useAuth } from '../../src/contexts/AuthContext';
import PerformanceMonitor from '../../src/performance/monitoring/PerformanceMonitor';
import { startupOptimization } from '../../src/utils/bundleOptimization';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);

  React.useEffect(() => {
    // Optimize startup performance
    startupOptimization.optimizeStartup();
  }, []);

  const handleGoToNotes = () => {
    router.push('/notes');
  };

  const handleShowPerformanceMonitor = () => {
    setShowPerformanceMonitor(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="document-text" size={80} color={colors.tint} />
        </View>
        
        <Text style={[styles.title, { color: colors.text }]}>
          Welcome to Optimized Notes App
        </Text>
        
        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: colors.tint }]}
          onPress={handleGoToNotes}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.ctaButtonText}>Create Your First Note</Text>
        </TouchableOpacity>

        {/* Performance Monitor Button */}
        <TouchableOpacity
          style={[styles.performanceButton, { borderColor: colors.tint }]}
          onPress={handleShowPerformanceMonitor}
        >
          <Ionicons name="analytics" size={20} color={colors.tint} />
          <Text style={[styles.performanceButtonText, { color: colors.tint }]}>
            Performance Monitor
          </Text>
        </TouchableOpacity>
      </View>

      {/* Performance Monitor */}
      <PerformanceMonitor
        visible={showPerformanceMonitor}
        onClose={() => setShowPerformanceMonitor(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'DM Sans',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    fontFamily: 'DM Sans',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 48,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
    fontFamily: 'DM Sans',
  },
  performanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 24,
  },
  performanceButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    fontFamily: 'DM Sans',
  },
});
