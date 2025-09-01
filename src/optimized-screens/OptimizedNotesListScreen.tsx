import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { CustomButton } from '../components/common/CustomButton';
import { CustomInput } from '../components/common/CustomInput';
import { NetworkStatusIndicator } from '../components/common/NetworkStatusIndicator';
import { useAuth } from '../contexts/AuthContext';
import { FadeInAnimation } from '../performance/animations/GestureAnimations';
import SwipeableNoteItem from '../performance/animations/ListAnimations';
import MemoizedFilterChip from '../performance/components/MemoizedComponents/MemoizedFilterChip';
import MemoizedNoteItem from '../performance/components/MemoizedComponents/MemoizedNoteItem';
import OptimizedFlatList from '../performance/components/OptimizedFlatList';
import OptimizedSectionList from '../performance/components/OptimizedSectionList';
import { useDebouncedSearch } from '../performance/hooks/useDebounced';
import { useMemoizedCalculations } from '../performance/hooks/useMemoizedCalculations';
import { usePerformanceMonitoring } from '../performance/hooks/usePerformanceMonitoring';
import networkService from '../services/networkService';
import notesService from '../services/notesService';
import { CATEGORIES, Note } from '../types';

export const OptimizedNotesListScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, logout } = useAuth();
  const { trackRenderTime, trackMemoryUsage } = usePerformanceMonitoring();

  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'section'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Debounced search
  const [searchValue, debouncedSearchValue, setSearchValue] = useDebouncedSearch(300);

  // Memoized calculations
  const {
    filteredAndSortedNotes,
    notesByCategory,
    favoriteNotes,
    notesStats,
    searchNotes,
    filterByCategory,
    filterFavorites,
  } = useMemoizedCalculations(notes);

  // Memoized filtered notes based on search and filters
  const filteredNotes = useMemo(() => {
    console.log('Filtering notes. Total notes:', filteredAndSortedNotes.length);
    console.log('Selected category:', selectedCategory);
    console.log('Search value:', debouncedSearchValue);
    
    let result = filteredAndSortedNotes;

    // Apply category filter
    if (selectedCategory) {
      result = filterByCategory(selectedCategory);
      console.log('After category filter:', result.length);
    }

    // Apply search filter
    if (debouncedSearchValue.trim()) {
      result = searchNotes(debouncedSearchValue);
      console.log('After search filter:', result.length);
    }

    console.log('Final filtered notes count:', result.length);
    return result;
  }, [filteredAndSortedNotes, selectedCategory, debouncedSearchValue, searchNotes, filterByCategory]);

  // Memoized sections for section list
  const sections = useMemo(() => {
    if (viewMode === 'section') {
      return Object.entries(notesByCategory).map(([category, categoryNotes]) => ({
        title: category,
        data: categoryNotes,
      }));
    }
    return [];
  }, [viewMode, notesByCategory]);

  useEffect(() => {
    const startTime = performance.now();
    loadNotes();
    setupNetworkListener();
    const endTime = performance.now();
    trackRenderTime('NotesListScreen_Mount', endTime - startTime);
  }, []);

  useEffect(() => {
    trackMemoryUsage('NotesListScreen_Memory', notes.length);
  }, [notes.length, trackMemoryUsage]);

  // Debug effect to log notes changes
  useEffect(() => {
    console.log('Notes state changed. Count:', notes.length);
    console.log('Notes categories:', [...new Set(notes.map(n => n.category))]);
    console.log('Notes:', notes.map(n => ({ id: n.id, title: n.title, category: n.category })));
  }, [notes]);

  // Reload notes when screen comes into focus (e.g., after creating a new note)
  useFocusEffect(
    useCallback(() => {
      console.log('Screen focused, reloading notes...');
      // Use getNotes instead of getNotesPaginated to get all notes including newly created ones
      const reloadNotes = async () => {
        try {
          setIsLoading(true);
          
          // Debug storage first
          await notesService.debugStorage();
          
          const allNotes = await notesService.getNotes();
          console.log('Reloaded notes count:', allNotes.length);
          console.log('All notes:', allNotes.map(n => ({ id: n.id, title: n.title, category: n.category })));
          setNotes(allNotes);
          setHasMore(allNotes.length > 20); // Assume pagination of 20
          setCurrentPage(1);
        } catch (error) {
          console.error('Error reloading notes:', error);
        } finally {
          setIsLoading(false);
        }
      };
      reloadNotes();
    }, [])
  );

  const setupNetworkListener = useCallback(() => {
    const unsubscribe = networkService.subscribe((state: any) => {
      setIsOffline(!state.isConnected || !state.isInternetReachable);
      
      if (state.isConnected && state.isInternetReachable) {
        // Don't call syncOfflineOperations here to avoid circular dependency
        // Instead, just reload notes
        loadNotes();
      }
    });

    return unsubscribe;
  }, [loadNotes]);

  const loadNotes = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Loading notes...');
      const result = await notesService.getNotesPaginated(1, 20);
      console.log('Loaded notes count:', result.notes.length);
      setNotes(result.notes);
      setHasMore(result.hasMore);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error loading notes:', error);
      Alert.alert('Error', 'Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMoreNotes = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;
    
    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;
      const result = await notesService.getNotesPaginated(nextPage, 20);
      setNotes(prev => [...prev, ...result.notes]);
      setHasMore(result.hasMore);
      setCurrentPage(nextPage);
    } catch (error) {
      console.error('Error loading more notes:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentPage, hasMore, isLoadingMore]);

  const refreshNotes = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await loadNotes();
      await syncOfflineOperations();
    } catch (error) {
      console.error('Error refreshing notes:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadNotes]);

  const syncOfflineOperations = useCallback(async () => {
    try {
      await notesService.syncOfflineOperations();
      await loadNotes();
    } catch (error) {
      console.error('Error syncing offline operations:', error);
    }
  }, [loadNotes]);

  // Optimized callbacks - using regular useCallback instead of createOptimizedCallback
  const handleNotePress = useCallback((note: Note) => {
    router.push(`/notes/${note.id}`);
  }, []);

  const handleAddNote = useCallback(() => {
    router.push('/notes/add');
  }, []);

  const handleTestNote = useCallback(async () => {
    try {
      console.log('Creating test note...');
      await notesService.createTestNote();
      console.log('Test note created, reloading notes...');
      // Reload notes after creating test note
      const allNotes = await notesService.getNotes();
      setNotes(allNotes);
    } catch (error) {
      console.error('Error creating test note:', error);
      Alert.alert('Error', 'Failed to create test note');
    }
  }, []);

  const handleDeleteNote = useCallback(async (noteId: string) => {
    try {
      await notesService.deleteNote(noteId);
      setNotes(prev => prev.filter(note => note.id !== noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
      Alert.alert('Error', 'Failed to delete note');
    }
  }, []);

  const handleToggleFavorite = useCallback(async (noteId: string) => {
    try {
      const note = notes.find(n => n.id === noteId);
      if (note) {
        await notesService.updateNote(noteId, { isFavorite: !note.isFavorite });
        setNotes(prev => prev.map(n => 
          n.id === noteId ? { ...n, isFavorite: !n.isFavorite } : n
        ));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }, [notes]);

  const handleLogout = useCallback(async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  }, [logout]);

  const handleCategoryPress = useCallback((category: string) => {
    // Handle "All" category
    if (category === 'all') {
      setSelectedCategory(null);
      return;
    }
    
    // Toggle category selection
    if (selectedCategory === category) {
      setSelectedCategory(null); // Deselect if already selected
    } else {
      setSelectedCategory(category); // Select new category
    }
  }, [selectedCategory]);

  const handleViewModeToggle = useCallback(() => {
    setViewMode(prev => prev === 'list' ? 'section' : 'list');
  }, []);

  // Memoized render functions
  const renderNoteItem = useCallback(({ item }: { item: Note }) => (
    <FadeInAnimation delay={Math.random() * 100}>
      <SwipeableNoteItem
        onDelete={() => handleDeleteNote(item.id)}
        onToggleFavorite={() => handleToggleFavorite(item.id)}
        isFavorite={item.isFavorite}
      >
        <MemoizedNoteItem
          note={item}
          onPress={handleNotePress}
          onToggleFavorite={handleToggleFavorite}
        />
      </SwipeableNoteItem>
    </FadeInAnimation>
  ), [handleNotePress, handleDeleteNote, handleToggleFavorite]);

  const renderSectionHeader = useCallback(({ section }: { section: { title: string; data: Note[] } }) => (
    <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {section.title} ({section.data.length})
      </Text>
    </View>
  ), [colors]);

  const renderLoadingFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={colors.tint} />
        <Text style={[styles.loadingFooterText, { color: colors.text }]}>
          Loading more notes...
        </Text>
      </View>
    );
  }, [isLoadingMore, colors]);

    const handleEndReached = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      loadMoreNotes();
    }
  }, [hasMore, isLoadingMore, loadMoreNotes]);

  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyState}>
      <Ionicons name="document-outline" size={64} color={colors.icon} />
      <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
        No notes yet
      </Text>
      <Text style={[styles.emptyStateSubtitle, { color: colors.icon }]}>
        {debouncedSearchValue
          ? 'No notes match your search'
          : 'Create your first note to get started'}
      </Text>
      {!debouncedSearchValue && (
        <CustomButton
          title="Create Note"
          onPress={handleAddNote}
          style={styles.createNoteButton}
        />
      )}
    </View>
  ), [colors, debouncedSearchValue, handleAddNote]);

  const renderHeader = useCallback(() => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.icon} />
        </TouchableOpacity>
        
        <View>
          <Text style={[styles.welcomeText, { color: colors.text }]}>
            Welcome back,
          </Text>
          <Text style={[styles.userName, { color: colors.text }]}>
            {user?.name}
          </Text>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleTestNote} style={styles.testButton}>
            <Ionicons name="bug" size={24} color={colors.icon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleViewModeToggle} style={styles.viewModeButton}>
            <Ionicons 
              name={viewMode === 'list' ? 'grid' : 'list'} 
              size={24} 
              color={colors.icon} 
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color={colors.icon} />
          </TouchableOpacity>
        </View>
      </View>

      <CustomInput
        placeholder="Search notes..."
        value={searchValue}
        onChangeText={setSearchValue}
        containerStyle={styles.searchInput}
      />

      <View style={styles.filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {selectedCategory && (
            <MemoizedFilterChip
              key="all"
              label="All"
              isSelected={false}
              onPress={() => handleCategoryPress('all')}
            />
          )}
          {CATEGORIES.map((category: string) => (
            <MemoizedFilterChip
              key={category}
              label={category}
              isSelected={selectedCategory === category}
              onPress={() => handleCategoryPress(category)}
            />
          ))}
        </ScrollView>
      </View>

      {isOffline && (
        <View style={styles.offlineIndicator}>
          <Ionicons name="cloud-offline" size={16} color="#ff4444" />
          <Text style={styles.offlineText}>Offline Mode</Text>
        </View>
      )}

      <View style={styles.stats}>
        <Text style={[styles.statsText, { color: colors.icon }]}>
          {notesStats.total} notes • {notesStats.favorites} favorites
        </Text>
      </View>
    </View>
  ), [
    colors, user, viewMode, searchValue, isOffline, notesStats, selectedCategory,
    handleViewModeToggle, handleLogout, handleCategoryPress, setSearchValue
  ]);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading notes...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <NetworkStatusIndicator />
      
      {viewMode === 'list' ? (
        <OptimizedFlatList
          data={filteredNotes}
          renderItem={renderNoteItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderLoadingFooter}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.1}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refreshNotes}
              colors={[colors.tint]}
              tintColor={colors.tint}
            />
          }
          contentContainerStyle={styles.listContent}
          getItemLayout={(data, index) => ({
            length: 120, // Approximate height of note item
            offset: 120 * index,
            index,
          })}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={21}
          removeClippedSubviews={true}
          updateCellsBatchingPeriod={50}
        />
      ) : (
        <OptimizedSectionList
          sections={sections}
          renderItem={renderNoteItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderLoadingFooter}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.1}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refreshNotes}
              colors={[colors.tint]}
              tintColor={colors.tint}
            />
          }
          contentContainerStyle={styles.listContent}
          getItemLayout={(data, index) => ({
            length: 120,
            offset: 120 * index,
            index,
          })}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={21}
          removeClippedSubviews={true}
          updateCellsBatchingPeriod={50}
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.tint }]}
        onPress={handleAddNote}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'DM Sans',
  },
  listContent: {
    paddingBottom: 100,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingFooterText: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'DM Sans',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testButton: {
    padding: 8,
    marginRight: 8,
  },
  welcomeText: {
    fontSize: 16,
    fontFamily: 'DM Sans',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'DM Sans',
  },
  viewModeButton: {
    padding: 8,
    marginRight: 8,
  },
  logoutButton: {
    padding: 8,
  },
  searchInput: {
    marginBottom: 16,
  },
  filters: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
    marginBottom: 16,
  },
  offlineText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#856404',
    fontFamily: 'DM Sans',
  },
  stats: {
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    fontFamily: 'DM Sans',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'DM Sans',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'DM Sans',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'DM Sans',
  },
  createNoteButton: {
    minWidth: 120,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default OptimizedNotesListScreen;
