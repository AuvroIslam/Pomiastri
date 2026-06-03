import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { DriverId, DRIVER_LIST } from '@/constants/drivers';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';

interface AvatarSelectorProps {
  selected: DriverId;
  onSelect: (id: DriverId) => void;
}

export function AvatarSelector({ selected, onSelect }: AvatarSelectorProps) {
  return (
    <FlatList
      data={DRIVER_LIST}
      keyExtractor={(item) => item.id}
      numColumns={4}
      scrollEnabled={false}
      contentContainerStyle={styles.grid}
      renderItem={({ item }) => {
        const isSelected = item.id === selected;
        return (
          <TouchableOpacity
            onPress={() => onSelect(item.id)}
            style={[styles.card, isSelected && styles.cardSelected]}
            activeOpacity={0.7}
          >
            <Image source={item.assets.idle} style={styles.image} resizeMode="contain" />
            <Text style={[styles.name, isSelected && styles.nameSelected]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  grid: { gap: Spacing.sm },
  card: {
    flex: 1,
    margin: 4,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  cardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceElevated,
  },
  image: { width: 56, height: 56 },
  name: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: FontWeight.medium,
  },
  nameSelected: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
});
