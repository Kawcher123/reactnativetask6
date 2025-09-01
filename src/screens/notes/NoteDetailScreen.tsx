import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { CustomButton } from '../../components/common/CustomButton';
import { NetworkStatusIndicator } from '../../components/common/NetworkStatusIndicator';
import networkService from '../../services/networkService';
import notesService from '../../services/notesService';
import { Note } from '../../types';

export const NoteDetailScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const params = useLocalSearchParams();
  const noteId = params.id as string;

  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    loadNote();
    setupNetworkListener();
  }, [noteId]);

  const setupNetworkListener = () => {
    const unsubscribe = networkService.subscribe((state) => {
      setIsOffline(!state.isConnected || !state.isInternetReachable);
    });

    return unsubscribe;
  };

  const loadNote = async () => {
    try {
      setIsLoading(true);
      const notes = await notesService.getNotes();
      const foundNote = notes.find(n => n.id === noteId);
      
      if (foundNote) {
        setNote(foundNote);
      } else {
        Alert.alert('Error', 'Note not found');
        router.back();
      }
    } catch (error) {
      console.error('Error loading note:', error);
      Alert.alert('Error', 'Failed to load note');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/notes/edit/${noteId}`);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await notesService.deleteNote(noteId);
              router.back();
            } catch (error) {
              console.error('Error deleting note:', error);
              Alert.alert('Error', 'Failed to delete note');
            }
          },
        },
      ]
    );
  };

  const handleToggleFavorite = async () => {
    if (!note) return;

    try {
      const updatedNote = await notesService.updateNote(noteId, {
        isFavorite: !note.isFavorite,
      });
      setNote(updatedNote);
    } catch (error) {
      console.error('Error updating favorite status:', error);
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContent}>
          <Ionicons name="document-outline" size={48} color={colors.icon} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading note...
          </Text>
        </View>
      </View>
    );
  }

  if (!note) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={64} color="#ff4444" />
        <Text style={[styles.errorText, { color: colors.text }]}>
          Note not found
        </Text>
        <CustomButton
          title="Go Back"
          onPress={() => router.back()}
          style={styles.goBackButton}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <NetworkStatusIndicator />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.icon} />
            </TouchableOpacity>
            
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={handleToggleFavorite}
                style={styles.favoriteButton}
              >
                <Ionicons
                  name={note.isFavorite ? "star" : "star-outline"}
                  size={24}
                  color={note.isFavorite ? "#FFD700" : colors.icon}
                />
              </TouchableOpacity>
              
              <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
                <Ionicons name="create-outline" size={24} color={colors.icon} />
              </TouchableOpacity>
              
              <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={24} color="#ff4444" />
              </TouchableOpacity>
            </View>
          </View>

          {isOffline && (
            <View style={styles.offlineIndicator}>
              <Ionicons name="cloud-offline" size={16} color="#ff4444" />
              <Text style={styles.offlineText}>Offline Mode</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: colors.text }]}>
              {note.title}
            </Text>
            <View style={styles.metaInfo}>
              <View style={[styles.categoryChip, { backgroundColor: colors.tint }]}>
                <Text style={styles.categoryText}>{note.category}</Text>
              </View>
              <Text style={[styles.dateText, { color: colors.icon }]}>
                {formatDate(note.updatedAt)}
              </Text>
            </View>
          </View>

          <View style={styles.contentSection}>
            <Text style={[styles.contentLabel, { color: colors.text }]}>
              Content
            </Text>
            <Text style={[styles.contentText, { color: colors.text }]}>
              {note.content}
            </Text>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.icon }]}>
                Created:
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {formatDate(note.createdAt)}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.icon }]}>
                Last Modified:
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {formatDate(note.updatedAt)}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.icon }]}>
                Status:
              </Text>
              <View style={styles.statusContainer}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: note.isFavorite ? "#FFD700" : colors.icon }
                ]} />
                <Text style={[styles.statusText, { color: colors.text }]}>
                  {note.isFavorite ? 'Favorite' : 'Regular'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomActions}>
        <CustomButton
          title="Edit Note"
          onPress={handleEdit}
          variant="outline"
          fullWidth
          style={styles.editNoteButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'DM Sans',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
    fontFamily: 'DM Sans',
  },
  goBackButton: {
    minWidth: 120,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  favoriteButton: {
    padding: 8,
  },
  editButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  offlineText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#856404',
    fontFamily: 'DM Sans',
  },
  content: {
    paddingHorizontal: 16,
  },
  titleSection: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    lineHeight: 36,
    fontFamily: 'DM Sans',
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'DM Sans',
  },
  dateText: {
    fontSize: 14,
    fontFamily: 'DM Sans',
  },
  contentSection: {
    marginBottom: 32,
  },
  contentLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: 'DM Sans',
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'DM Sans',
  },
  infoSection: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'DM Sans',
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'DM Sans',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'DM Sans',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  editNoteButton: {
    marginBottom: 8,
  },
});
