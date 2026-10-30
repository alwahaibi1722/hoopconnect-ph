// components/ScreenContainer.tsx
import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

export default function ScreenContainer({ children, style, ...props }: ViewProps) {
  return (
    <View style={[styles.container, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080616',
  },
});