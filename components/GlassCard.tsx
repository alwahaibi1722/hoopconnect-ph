// components/GlassCard.tsx
import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

export default function GlassCard({ children, style, ...props }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1953', // Flat Midnight Navy
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
  },
});