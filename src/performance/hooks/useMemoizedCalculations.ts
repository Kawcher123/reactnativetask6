import { useCallback, useMemo } from 'react';
import { Note } from '../../types';

export const useMemoizedCalculations = (notes: Note[]) => {
  // Memoized filtering and sorting operations
  const filteredAndSortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [notes]);

  const notesByCategory = useMemo(() => {
    const categories: { [key: string]: Note[] } = {};
    notes.forEach(note => {
      if (!categories[note.category]) {
        categories[note.category] = [];
      }
      categories[note.category].push(note);
    });
    return categories;
  }, [notes]);

  const favoriteNotes = useMemo(() => {
    return notes.filter(note => note.isFavorite);
  }, [notes]);

  const notesStats = useMemo(() => {
    return {
      total: notes.length,
      favorites: favoriteNotes.length,
      categories: Object.keys(notesByCategory).length,
      lastUpdated: notes.length > 0 ? new Date(notes[0].updatedAt) : null,
    };
  }, [notes, favoriteNotes, notesByCategory]);

  // Memoized search function
  const searchNotes = useCallback((query: string) => {
    if (!query.trim()) return notes;
    
    const lowerQuery = query.toLowerCase();
    return notes.filter(note =>
      note.title.toLowerCase().includes(lowerQuery) ||
      note.content.toLowerCase().includes(lowerQuery) ||
      note.category.toLowerCase().includes(lowerQuery)
    );
  }, [notes]);

  // Memoized category filter
  const filterByCategory = useCallback((category: string) => {
    if (!category || category === 'All') return notes;
    return notes.filter(note => note.category === category);
  }, [notes]);

  // Memoized favorites filter
  const filterFavorites = useCallback(() => {
    return notes.filter(note => note.isFavorite);
  }, [notes]);

  return {
    filteredAndSortedNotes,
    notesByCategory,
    favoriteNotes,
    notesStats,
    searchNotes,
    filterByCategory,
    filterFavorites,
  };
};
