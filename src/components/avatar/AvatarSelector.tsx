import React from 'react';
import {
  Image,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  FlatList,
} from 'react-native';
import { DriverId, DRIVER_LIST } from '@/constants/drivers';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';

interface AvatarSelectorProps {
  selected: DriverId;
  onSelect: (id: DriverId) => void;
}

const PORTRAIT_SIZE = 76;

// Portraits sit centred in their canvas with the head around ~35% down.
// Scaling up and shifting the crop keeps just the face/head in frame.
const FACE_ZOOM = 2.2;
const FACE_OFFSET_X = -0.6;
const FACE_OFFSET_Y = -0.27;

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
            <View style={[styles.portraitFrame, isSelected && styles.portraitFrameSelected]}>
              <Image
                source={item.assets.idle}
                style={styles.portraitImage}
                resizeMode="contain"
              />
            </View>
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
    overflow: 'hidden',
  },
  cardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceElevated,
  },
  portraitFrame: {
    width: PORTRAIT_SIZE,
    height: PORTRAIT_SIZE,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceElevated,
  },
  portraitFrameSelected: {
    backgroundColor: Colors.background,
  },
  // Fixed-pixel sizing + negative margins (normal flow), NOT percentage-based
  // absolute positioning — Android's overflow:hidden only reliably clips the
  // former, so the zoomed image stays inside the frame instead of spilling out.
  portraitImage: {
    width: PORTRAIT_SIZE * FACE_ZOOM,
    height: PORTRAIT_SIZE * FACE_ZOOM,
    marginLeft: PORTRAIT_SIZE * FACE_OFFSET_X,
    marginTop: PORTRAIT_SIZE * FACE_OFFSET_Y,
  },
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
