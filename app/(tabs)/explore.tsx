import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import locationService from '../../src/services/locationService';
import socialService from '../../src/services/socialService';
import { Note } from '../../src/types';
import hapticUtils from '../../src/utils/hapticUtils';

export default function ExploreScreen() {
  const colorScheme = useColorScheme();
  const [notesNearby, setNotesNearby] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any>(null);

  useEffect(() => {
    loadNotesNearby();
  }, []);

  const loadNotesNearby = async () => {
    try {
      setIsLoading(true);
      
      // Get current location
      const location = await locationService.getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
        
        // Get notes near current location
        const nearbyNotes = await socialService.getNotesNearLocation(
          location.latitude,
          location.longitude,
          10 // 10km radius
        );
        
        setNotesNearby(nearbyNotes);
      }
    } catch (error) {
      console.error('Load notes nearby error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    await hapticUtils.pullToRefresh();
    await loadNotesNearby();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.subtitle}>Discover notes from around you</Text>
      </View>

      <View style={styles.content}>
        {currentLocation ? (
          <View style={styles.locationInfo}>
            <Ionicons name="location" size={20} color={Colors.light.tint} />
            <Text style={styles.locationText}>
              {currentLocation.address || `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.locationButton}
            onPress={loadNotesNearby}
            disabled={isLoading}
          >
            <Ionicons name="location-outline" size={20} color="#666" />
            <Text style={styles.locationButtonText}>Enable Location</Text>
          </TouchableOpacity>
        )}

        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Notes Near You</Text>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text>Loading nearby notes...</Text>
            </View>
          ) : notesNearby.length > 0 ? (
            <View style={styles.notesList}>
              {notesNearby.map((note) => (
                <TouchableOpacity
                  key={note.id}
                  style={styles.noteItem}
                  onPress={() => {
                    // Navigate to note detail
                    console.log('Navigate to note:', note.id);
                  }}
                >
                  <Text style={styles.noteTitle}>{note.title}</Text>
                  <Text style={styles.noteContent} numberOfLines={2}>
                    {note.content}
                  </Text>
                  <View style={styles.noteMeta}>
                    <Text style={styles.noteCategory}>{note.category}</Text>
                    <Text style={styles.noteDistance}>
                      {note.location ? 'Nearby' : 'Unknown location'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="map-outline" size={48} color="#CCC" />
              <Text style={styles.emptyTitle}>No Notes Nearby</Text>
              <Text style={styles.emptySubtitle}>
                Be the first to create a note in this area!
              </Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 20,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  locationButtonText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  notesSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notesList: {
    gap: 12,
  },
  noteItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  noteContent: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  noteMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteCategory: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.tint,
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  noteDistance: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
