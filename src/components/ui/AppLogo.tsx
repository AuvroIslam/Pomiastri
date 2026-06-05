import React from 'react';
import { Image, StyleSheet, View, ViewStyle } from 'react-native';
import { F1Assets } from '@/constants/drivers';

interface AppLogoProps {
  size?: number;
  style?: ViewStyle;
}

/**
 * Square Pomiastri logo with rounded corners.
 * The source image is square (yellow bg + book), so resizeMode="cover"
 * fills the rounded square cleanly — no letterboxing.
 */
export function AppLogo({ size = 40, style }: AppLogoProps) {
  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: size * 0.24 },
        style,
      ]}
    >
      <Image source={F1Assets.logo} style={styles.img} resizeMode="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden' },
  img: { width: '100%', height: '100%' },
});
