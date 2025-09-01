import React, { memo, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    ViewStyle
} from 'react-native';
import { Colors } from '../../../../constants/Colors';
import { useColorScheme } from '../../../../hooks/useColorScheme';

interface MemoizedFilterChipProps {
  label: string;
  isSelected: boolean;
  onPress: (label: string) => void;
  style?: ViewStyle;
}

const MemoizedFilterChip: React.FC<MemoizedFilterChipProps> = ({
  label,
  isSelected,
  onPress,
  style,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handlePress = useCallback(() => {
    onPress(label);
  }, [label, onPress]);

  return (
    <TouchableOpacity
      style={[
        styles.filterChip,
        isSelected && { backgroundColor: colors.tint },
        style,
      ]}
      onPress={handlePress}
    >
      <Text style={[
        styles.filterChipText,
        { color: isSelected ? '#fff' : colors.text }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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
});

export default memo(MemoizedFilterChip);
