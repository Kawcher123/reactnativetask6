import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Colors } from '../../../constants/Colors';
import socialService from '../../services/socialService';
import { Note, User } from '../../types';
import hapticUtils from '../../utils/hapticUtils';
import PhotoGallery from '../media/PhotoGallery';

interface SocialFeedProps {
  currentUser: User;
  onNotePress?: (note: Note) => void;
  onUserPress?: (user: User) => void;
  showFilters?: boolean;
  showSearch?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export const SocialFeed: React.FC<SocialFeedProps> = ({
  currentUser,
  onNotePress,
  onUserPress,
  showFilters = true,
  showSearch = true,
}) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<'recent' | 'trending' | 'nearby'>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [likedNotes, setLikedNotes] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadNotes();
  }, [filter, searchQuery]);

  const loadNotes = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      let fetchedNotes: Note[] = [];

      if (searchQuery.trim()) {
        fetchedNotes = await socialService.searchPublicNotes(searchQuery);
      } else {
        switch (filter) {
          case 'trending':
            fetchedNotes = await socialService.getTrendingNotes(20);
            break;
          case 'nearby':
            // This would require current location - for now, get recent
            fetchedNotes = await socialService.getRecentPublicNotes(20);
            break;
          default:
            fetchedNotes = await socialService.getRecentPublicNotes(20);
            break;
        }
      }

      if (refresh) {
        setNotes(fetchedNotes);
      } else {
        setNotes(prev => [...prev, ...fetchedNotes]);
      }

      setHasMore(fetchedNotes.length === 20);
      
      // Update liked notes state
      const userLikedNotes = new Set<string>();
      fetchedNotes.forEach(note => {
        if (note.likedBy.includes(currentUser.id)) {
          userLikedNotes.add(note.id);
        }
      });
      setLikedNotes(userLikedNotes);

    } catch (error) {
      console.error('Load notes error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filter, searchQuery, currentUser.id]);

  const handleRefresh = useCallback(async () => {
    await hapticUtils.pullToRefresh();
    await loadNotes(true);
  }, [loadNotes]);

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    await loadNotes();
  }, [hasMore, isLoading, loadNotes]);

  const handleLike = useCallback(async (note: Note) => {
    try {
      const success = await socialService.likeNote(note.id, currentUser.id, note.title);
      
      if (success) {
        // Optimistic update
        setNotes(prev => prev.map(n => {
          if (n.id === note.id) {
            const isLiked = n.likedBy.includes(currentUser.id);
            if (isLiked) {
              // Unlike
              return {
                ...n,
                likes: Math.max(0, n.likes - 1),
                likedBy: n.likedBy.filter(id => id !== currentUser.id),
              };
            } else {
              // Like
              return {
                ...n,
                likes: n.likes + 1,
                likedBy: [...n.likedBy, currentUser.id],
              };
            }
          }
          return n;
        }));

        // Update liked notes state
        setLikedNotes(prev => {
          const newSet = new Set(prev);
          if (newSet.has(note.id)) {
            newSet.delete(note.id);
          } else {
            newSet.add(note.id);
          }
          return newSet;
        });

        await hapticUtils.like();
      }
    } catch (error) {
      console.error('Like note error:', error);
      await hapticUtils.error();
    }
  }, [currentUser.id]);

  const handleFilterChange = useCallback(async (newFilter: 'recent' | 'trending' | 'nearby') => {
    if (filter === newFilter) return;
    
    setFilter(newFilter);
    setNotes([]);
    setHasMore(true);
    await hapticUtils.navigation();
  }, [filter]);

  const renderFilterButton = useCallback((filterType: 'recent' | 'trending' | 'nearby', label: string, icon: string) => {
    const isActive = filter === filterType;
    
    return (
      <TouchableOpacity
        style={[
          styles.filterButton,
          isActive && styles.filterButtonActive,
        ]}
        onPress={() => handleFilterChange(filterType)}
      >
        <Ionicons
          name={icon as any}
          size={16}
          color={isActive ? '#fff' : '#666'}
        />
        <Text style={[
          styles.filterButtonText,
          isActive && styles.filterButtonTextActive,
        ]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  }, [filter, handleFilterChange]);

  const renderNote = useCallback(({ item: note, index }: { item: Note; index: number }) => {
    const isLiked = likedNotes.has(note.id);
    const isOwnNote = note.userId === currentUser.id;

    return (
      <TouchableOpacity
        style={styles.noteContainer}
        onPress={() => onNotePress?.(note)}
        activeOpacity={0.8}
      >
        <View style={styles.noteHeader}>
          <TouchableOpacity
            style={styles.userInfo}
            onPress={() => onUserPress?.({ id: note.userId, name: 'User', email: '', token: '' })}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {note.userId.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>
                {isOwnNote ? 'You' : `User ${note.userId.slice(-4)}`}
              </Text>
              <Text style={styles.noteDate}>
                {new Date(note.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </TouchableOpacity>
          
          <View style={styles.noteActions}>
            <TouchableOpacity
              style={styles.categoryTag}
              disabled={true}
            >
              <Text style={styles.categoryText}>{note.category}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.noteContent}>
          <Text style={styles.noteTitle} numberOfLines={2}>
            {note.title}
          </Text>
          <Text style={styles.noteText} numberOfLines={3}>
            {note.content}
          </Text>
        </View>

        {note.images && note.images.length > 0 && (
          <View style={styles.imagesContainer}>
            <PhotoGallery
              images={note.images}
              showAddButton={false}
              editable={false}
              imageSize={80}
              columns={3}
            />
          </View>
        )}

        {note.location && (
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={16} color="#666" />
            <Text style={styles.locationText} numberOfLines={1}>
              {note.location.address || `${note.location.latitude.toFixed(4)}, ${note.location.longitude.toFixed(4)}`}
            </Text>
          </View>
        )}

        <View style={styles.noteFooter}>
          <TouchableOpacity
            style={styles.likeButton}
            onPress={() => handleLike(note)}
            disabled={isOwnNote}
          >
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={20}
              color={isLiked ? '#FF3B30' : '#666'}
            />
            <Text style={[
              styles.likeCount,
              isLiked && styles.likeCountActive,
            ]}>
              {note.likes}
            </Text>
          </TouchableOpacity>

          <View style={styles.noteStats}>
            {note.tags && note.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {note.tags.slice(0, 3).map((tag, tagIndex) => (
                  <View key={tagIndex} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
                {note.tags.length > 3 && (
                  <Text style={styles.moreTagsText}>+{note.tags.length - 3}</Text>
                )}
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [likedNotes, currentUser.id, onNotePress, onUserPress, handleLike]);

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color="#CCC" />
      <Text style={styles.emptyTitle}>No Public Notes Yet</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery ? 'No notes match your search' : 'Be the first to share a public note!'}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={Colors.light.tint} />
        <Text style={styles.loadingText}>Loading more notes...</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {showFilters && (
        <View style={styles.filtersContainer}>
          {renderFilterButton('recent', 'Recent', 'time-outline')}
          {renderFilterButton('trending', 'Trending', 'trending-up-outline')}
          {renderFilterButton('nearby', 'Nearby', 'location-outline')}
        </View>
      )}

      <FlatList
        data={notes}
        renderItem={renderNote}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[Colors.light.tint]}
            tintColor={Colors.light.tint}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: Colors.light.tint,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingBottom: 20,
  },
  noteContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  noteDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  noteActions: {
    alignItems: 'flex-end',
  },
  categoryTag: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  noteContent: {
    marginBottom: 12,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    lineHeight: 24,
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  imagesContainer: {
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    gap: 6,
  },
  likeCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  likeCountActive: {
    color: '#FF3B30',
  },
  noteStats: {
    flex: 1,
    alignItems: 'flex-end',
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tag: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 10,
    color: '#666',
  },
  moreTagsText: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
});

export default SocialFeed;
