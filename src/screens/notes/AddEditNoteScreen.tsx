import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { CustomButton } from '../../components/common/CustomButton';
import { CustomInput } from '../../components/common/CustomInput';
import { NetworkStatusIndicator } from '../../components/common/NetworkStatusIndicator';
import networkService from '../../services/networkService';
import notesService from '../../services/notesService';
import { CATEGORIES, Note } from '../../types';

export const AddEditNoteScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const params = useLocalSearchParams();
  const noteId = params.id as string;
  const isEditing = !!noteId;

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'Personal',
    isFavorite: false,
  });

  const [validationErrors, setValidationErrors] = useState({
    title: '',
    content: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [originalNote, setOriginalNote] = useState<Note | null>(null);

  useEffect(() => {
    if (isEditing) {
      loadNote();
    }
    setupNetworkListener();
  }, [isEditing, noteId]);

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
      const note = notes.find(n => n.id === noteId);
      
      if (note) {
        setOriginalNote(note);
        setFormData({
          title: note.title,
          content: note.content,
          category: note.category,
          isFavorite: note.isFavorite,
        });
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

  const validateForm = () => {
    const errors = {
      title: '',
      content: '',
    };

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    if (!formData.content.trim()) {
      errors.content = 'Content is required';
    }

    setValidationErrors(errors);
    return !errors.title && !errors.content;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors in the form');
      return;
    }

    try {
      setIsSaving(true);

      if (isEditing) {
        await notesService.updateNote(noteId, {
          title: formData.title.trim(),
          content: formData.content.trim(),
          category: formData.category,
          isFavorite: formData.isFavorite,
        });
      } else {
        await notesService.createNote({
          title: formData.title.trim(),
          content: formData.content.trim(),
          category: formData.category,
          isFavorite: formData.isFavorite,
          isPublic: false,
          likes: 0,
          likedBy: [],
        });
      }

      router.back();
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('Error', 'Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!isEditing) return;

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
              setIsSaving(true);
              await notesService.deleteNote(noteId);
              router.back();
            } catch (error) {
              console.error('Error deleting note:', error);
              Alert.alert('Error', 'Failed to delete note');
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    if (hasChanges()) {
      Alert.alert(
        'Discard Changes',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  const hasChanges = () => {
    if (!isEditing) return formData.title.trim() || formData.content.trim();
    
    if (!originalNote) return false;
    
    return (
      formData.title !== originalNote.title ||
      formData.content !== originalNote.content ||
      formData.category !== originalNote.category ||
      formData.isFavorite !== originalNote.isFavorite
    );
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <NetworkStatusIndicator />
      
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={colors.icon} />
              </TouchableOpacity>
              
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {isEditing ? 'Edit Note' : 'New Note'}
              </Text>
              
              <View style={styles.headerActions}>
                {isEditing && (
                  <TouchableOpacity
                    onPress={handleDelete}
                    style={styles.deleteButton}
                    disabled={isSaving}
                  >
                    <Ionicons name="trash-outline" size={20} color="#ff4444" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {isOffline && (
              <View style={styles.offlineIndicator}>
                <Ionicons name="cloud-offline" size={16} color="#ff4444" />
                <Text style={styles.offlineText}>Offline Mode - Changes will sync when online</Text>
              </View>
            )}
          </View>

          <View style={styles.form}>
            <CustomInput
              label="Title"
              placeholder="Enter note title"
              value={formData.title}
              onChangeText={(value) => setFormData(prev => ({ ...prev, title: value }))}
              error={validationErrors.title}
              required
              returnKeyType="next"
            />

            <View style={styles.categoryContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Category</Text>
              <View style={styles.categoryPicker}>
                {CATEGORIES.map(category => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryChip,
                      formData.category === category && { backgroundColor: colors.tint }
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, category }))}
                  >
                    <Text style={[
                      styles.categoryChipText,
                      { color: formData.category === category ? '#fff' : colors.text }
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.favoriteContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Favorite</Text>
              <Switch
                value={formData.isFavorite}
                onValueChange={(value) => setFormData(prev => ({ ...prev, isFavorite: value }))}
                trackColor={{ false: colors.border, true: colors.tint }}
                thumbColor={formData.isFavorite ? '#fff' : colors.icon}
              />
            </View>

            <View style={styles.contentContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Content</Text>
              <TextInput
                style={[
                  styles.contentInput,
                  {
                    borderColor: validationErrors.content ? '#ff4444' : colors.border,
                    backgroundColor: colors.background,
                    color: colors.text,
                  }
                ]}
                placeholder="Write your note content here..."
                placeholderTextColor={colors.icon}
                value={formData.content}
                onChangeText={(value) => setFormData(prev => ({ ...prev, content: value }))}
                multiline
                textAlignVertical="top"
                returnKeyType="default"
              />
              {validationErrors.content && (
                <Text style={styles.error}>{validationErrors.content}</Text>
              )}
            </View>

            <CustomButton
              title={isEditing ? 'Update Note' : 'Create Note'}
              onPress={handleSave}
              loading={isSaving}
              disabled={isSaving || !hasChanges()}
              fullWidth
              style={styles.saveButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'DM Sans',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
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
  form: {
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'DM Sans',
  },
  categoryContainer: {
    marginBottom: 24,
  },
  categoryPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E1E5E9',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'DM Sans',
  },
  favoriteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  contentContainer: {
    marginBottom: 32,
  },
  contentInput: {
    height: 200,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'DM Sans',
  },
  error: {
    fontSize: 14,
    color: '#ff4444',
    marginTop: 4,
    fontFamily: 'DM Sans',
  },
  saveButton: {
    marginTop: 16,
  },
});
