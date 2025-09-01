import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { CustomButton } from '../../components/common/CustomButton';
import { CustomInput } from '../../components/common/CustomInput';
import { NetworkStatusIndicator } from '../../components/common/NetworkStatusIndicator';
import { useAuth } from '../../contexts/AuthContext';
import networkService from '../../services/networkService';
import notesService from '../../services/notesService';
import { CATEGORIES, Note } from '../../types';

export const NotesListScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, logout } = useAuth();

  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    loadNotes();
    setupNetworkListener();
  }, []);

  useEffect(() => {
    filterNotes();
  }, [notes, searchQuery, selectedCategory, showFavoritesOnly]);

  const setupNetworkListener = () => {
    const unsubscribe = networkService.subscribe((state) => {
      setIsOffline(!state.isConnected || !state.isInternetReachable);
      
      // Auto-sync when back online
      if (state.isConnected && state.isInternetReachable) {
        syncOfflineOperations();
      }
    });

    return unsubscribe;
  };

  const loadNotes = async () => {
    try {
      setIsLoading(true);
      const fetchedNotes = await notesService.getNotes();
      setNotes(fetchedNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
      Alert.alert('Error', 'Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshNotes = async () => {
    try {
      setIsRefreshing(true);
      await loadNotes();
      await syncOfflineOperations();
    } catch (error) {
      console.error('Error refreshing notes:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const syncOfflineOperations = async () => {
    try {
      await notesService.syncOfflineOperations();
      // Reload notes after sync
      await loadNotes();
    } catch (error) {
      console.error('Error syncing offline operations:', error);
    }
  };

  const filterNotes = () => {
    let filtered = [...notes];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(note => note.category === selectedCategory);
    }

    // Apply favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter(note => note.isFavorite);
    }

    setFilteredNotes(filtered);
  };

  const handleNotePress = (note: Note) => {
    router.push(`/notes/${note.id}`);
  };

  const handleAddNote = () => {
    router.push('/notes/add');
  };

  const handleLogout = async () => {
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
  };

  const renderNoteItem = ({ item }: { item: Note }) => (
    <TouchableOpacity
      style={[styles.noteItem, { borderColor: colors.border }]}
      onPress={() => handleNotePress(item)}
    >
      <View style={styles.noteHeader}>
        <Text style={[styles.noteTitle, { color: colors.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        {item.isFavorite && (
          <Ionicons name="star" size={16} color="#FFD700" />
        )}
      </View>
      
      <Text style={[styles.noteContent, { color: colors.icon }]} numberOfLines={2}>
        {item.content}
      </Text>
      
      <View style={styles.noteFooter}>
        <Text style={[styles.noteCategory, { color: colors.tint }]}>
          {item.category}
        </Text>
        <Text style={[styles.noteDate, { color: colors.icon }]}>
          {new Date(item.updatedAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-outline" size={64} color={colors.icon} />
      <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
        No notes yet
      </Text>
      <Text style={[styles.emptyStateSubtitle, { color: colors.icon }]}>
        {searchQuery || selectedCategory !== 'All' || showFavoritesOnly
          ? 'No notes match your current filters'
          : 'Create your first note to get started'}
      </Text>
      {!searchQuery && selectedCategory === 'All' && !showFavoritesOnly && (
        <CustomButton
          title="Create Note"
          onPress={handleAddNote}
          style={styles.createNoteButton}
        />
      )}
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View>
          <Text style={[styles.welcomeText, { color: colors.text }]}>
            Welcome back,
          </Text>
          <Text style={[styles.userName, { color: colors.text }]}>
            {user?.name}
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color={colors.icon} />
        </TouchableOpacity>
      </View>

      <CustomInput
        placeholder="Search notes..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        containerStyle={styles.searchInput}
      />

      <View style={styles.filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedCategory === 'All' && { backgroundColor: colors.tint }
            ]}
            onPress={() => setSelectedCategory('All')}
          >
            <Text style={[
              styles.filterChipText,
              { color: selectedCategory === 'All' ? '#fff' : colors.text }
            ]}>
              All
            </Text>
          </TouchableOpacity>
          
          {CATEGORIES.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterChip,
                selectedCategory === category && { backgroundColor: colors.tint }
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.filterChipText,
                { color: selectedCategory === category ? '#fff' : colors.text }
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={[
            styles.favoritesButton,
            showFavoritesOnly && { backgroundColor: colors.tint }
          ]}
          onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
        >
          <Ionicons
            name={showFavoritesOnly ? "star" : "star-outline"}
            size={20}
            color={showFavoritesOnly ? "#fff" : colors.icon}
          />
        </TouchableOpacity>
      </View>

      {isOffline && (
        <View style={styles.offlineIndicator}>
          <Ionicons name="cloud-offline" size={16} color="#ff4444" />
          <Text style={styles.offlineText}>Offline Mode</Text>
        </View>
      )}
    </View>
  );

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
      
      <FlatList
        data={filteredNotes}
        renderItem={renderNoteItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshNotes}
            colors={[colors.tint]}
            tintColor={colors.tint}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

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
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
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
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E1E5E9',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'DM Sans',
  },
  favoritesButton: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    marginLeft: 'auto',
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
