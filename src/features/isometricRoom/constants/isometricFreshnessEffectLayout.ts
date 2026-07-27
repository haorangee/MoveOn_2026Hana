import type { IsometricFreshnessEffectItem } from '../types/isometricRoom';

export const isometricFreshnessEffectItems: IsometricFreshnessEffectItem[] = [
  {
    id: 'fresh-sparkle-head-left',
    type: 'sparkle',
    x: 24,
    y: 18,
    size: 13,
    opacity: 0.84,
    rotation: '8deg',
  },
  {
    id: 'fresh-sparkle-head-right',
    type: 'sparkle',
    x: 92,
    y: 30,
    size: 11,
    opacity: 0.76,
    rotation: '-12deg',
  },
  {
    id: 'fresh-sparkle-shoulder',
    type: 'sparkle',
    x: 18,
    y: 78,
    size: 10,
    opacity: 0.68,
    rotation: '-4deg',
  },
  {
    id: 'fresh-dot-soft',
    type: 'dot',
    x: 104,
    y: 72,
    size: 8,
    opacity: 0.5,
  },
  {
    id: 'fresh-droplet-side',
    type: 'droplet',
    x: 82,
    y: 92,
    size: 9,
    opacity: 0.58,
    rotation: '18deg',
  },
];
