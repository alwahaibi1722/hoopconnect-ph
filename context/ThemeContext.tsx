// context/ThemeContext.tsx
import React, { createContext, useContext, useState } from 'react';

export const palette = {
  primary: '#2F2FE4',        // Vibrant Electric Blue (CTA Buttons, Highlights)
  secondary: '#162E93',      // Royal Navy (Secondary Buttons, Borders)
  card: '#1A1953',           // Midnight Navy (Flat Solid Container Backgrounds)
  background: '#080616',     // Darkest Navy (Root App Background)
  text: '#FFFFFF',           // Primary Text
  subText: '#94A3B8',        // Secondary Muted Text
  border: 'rgba(255, 255, 255, 0.1)', // Clean Subdued Separators
  inputBg: '#131133',        // Solid Darker Input Fill
};

interface ThemeContextType {
  colors: typeof palette;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [colors] = useState(palette);

  return (
    <ThemeContext.Provider value={{ colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};