import type { PanelDetails } from '../types';

export const initialPanelDetails: PanelDetails = {
  manufacturer: '',
  model: '',
  type: 'main',
  phases: 1,
  voltage: 240,
  busRating: 200,
  interruptingRating: 10000,
  availableSpaces: 40,
  usedSpaces: 0
};
