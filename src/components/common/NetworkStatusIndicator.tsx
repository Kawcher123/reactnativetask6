import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';
import networkService from '../../services/networkService';
import { NetworkState } from '../../types';

export const NetworkStatusIndicator: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: true,
    isInternetReachable: true,
  });
  const [slideAnim] = useState(new Animated.Value(-50));

  useEffect(() => {
    const unsubscribe = networkService.subscribe((state) => {
      setNetworkState(state);
      
      if (!state.isConnected || !state.isInternetReachable) {
        // Slide in when offline
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else {
        // Slide out when online
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    });

    return unsubscribe;
  }, [slideAnim]);

  // Don't show indicator when online
  if (networkState.isConnected && networkState.isInternetReachable) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: '#ff4444',
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text style={styles.text}>
        {!networkState.isConnected
          ? 'No internet connection'
          : 'Limited connectivity'}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  text: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'DM Sans',
  },
});
