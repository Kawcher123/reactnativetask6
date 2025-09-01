import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import SocialFeed from '../../src/components/social/SocialFeed';
import { useAuth } from '../../src/contexts/AuthContext';
import { User } from '../../src/types';

export default function SocialScreen() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    if (user) {
      setCurrentUser(user);
    }
  }, [user]);

  if (!currentUser) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          {/* Loading state or redirect to login */}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <SocialFeed
        currentUser={currentUser}
        onNotePress={(note) => {
          // Navigate to note detail
          console.log('Navigate to note:', note.id);
        }}
        onUserPress={(user) => {
          // Navigate to user profile
          console.log('Navigate to user:', user.id);
        }}
        showFilters={true}
        showSearch={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
