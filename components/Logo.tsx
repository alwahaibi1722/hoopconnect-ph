// components/Logo.tsx
import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

interface LogoProps {
  size?: number;
  color?: string;
  accentColor?: string;
}

export default function Logo({
  size = 28,
  color = '#FF5722',
  accentColor = '#FFFFFF',
}: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {/* Outer Connection Ring */}
      <Circle
        cx="50"
        cy="50"
        r="44"
        stroke={color}
        strokeWidth="6"
        strokeDasharray="10 6"
        opacity="0.85"
      />

      {/* Main Basketball Base */}
      <Circle cx="50" cy="50" r="36" fill={color} />

      {/* Basketball Seams / Grid Pattern */}
      {/* Vertical Seam */}
      <Path
        d="M50 14V86"
        stroke={accentColor}
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Horizontal Seam */}
      <Path
        d="M14 50H86"
        stroke={accentColor}
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Left Curved Seam */}
      <Path
        d="M26 22C38 32 38 68 26 78"
        stroke={accentColor}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Right Curved Seam */}
      <Path
        d="M74 22C62 32 62 68 74 78"
        stroke={accentColor}
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Connection Nodes (Network Dots at 4 Corners) */}
      <Circle cx="50" cy="8" r="5" fill={color} />
      <Circle cx="92" cy="50" r="5" fill={color} />
      <Circle cx="50" cy="92" r="5" fill={color} />
      <Circle cx="8" cy="50" r="5" fill={color} />
    </Svg>
  );
}