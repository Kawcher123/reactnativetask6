import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';
import { Colors } from '../../../../constants/Colors';
import { useColorScheme } from '../../../../hooks/useColorScheme';
import { Note } from '../../../types';

interface MemoizedNoteItemProps {
  note: Note;
  onPress: (note: Note) => void;
  onToggleFavorite?: (noteId: string) => void;
  style?: ViewStyle;
}

const MemoizedNoteItem: React.FC<MemoizedNoteItemProps> = ({
  note,
  onPress,
  onToggleFavorite,
  style,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handlePress = useCallback(() => {
    onPress(note);
  }, [note, onPress]);

  const handleToggleFavorite = useCallback(() => {
    onToggleFavorite?.(note.id);
  }, [note.id, onToggleFavorite]);

  return (
    <TouchableOpacity
      style={[styles.noteItem, { borderColor: colors.border }, style]}
      onPress={handlePress}
    >
      <View style={styles.noteHeader}>
        <Text style={[styles.noteTitle, { color: colors.text }]} numberOfLines={1}>
          {note.title}
        </Text>
        {onToggleFavorite && (
          <TouchableOpacity onPress={handleToggleFavorite} style={styles.favoriteButton}>
            <Ionicons 
              name={note.isFavorite ? "star" : "star-outline"} 
              size={16} 
              color={note.isFavorite ? "#FFD700" : colors.icon} 
            />
          </TouchableOpacity>
        )}
      </View>
      
      <Text style={[styles.noteContent, { color: colors.icon }]} numberOfLines={2}>
        {note.content}
      </Text>
      
      <View style={styles.noteFooter}>
        <Text style={[styles.noteCategory, { color: colors.tint }]}>
          {note.category}
        </Text>
        <Text style={[styles.noteDate, { color: colors.icon }]}>
          {new Date(note.updatedAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  noteItem: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
    fontFamily: 'DM Sans',
  },
  favoriteButton: {
    padding: 4,
  },
  noteContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    fontFamily: 'DM Sans',
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteCategory: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'DM Sans',
  },
  noteDate: {
    fontSize: 12,
    fontFamily: 'DM Sans',
  },
});

export default memo(MemoizedNoteItem);
