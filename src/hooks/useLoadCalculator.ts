import { useContext } from 'react';
import { LoadCalculatorContext } from '../context/LoadCalculatorContext';
import type { LoadCalculatorContextType } from '../context/LoadCalculatorContext';

export const useLoadCalculator = (): LoadCalculatorContextType => {
  const context = useContext(LoadCalculatorContext);
  if (context === undefined) {
    throw new Error('useLoadCalculator must be used within a LoadCalculatorProvider');
  }
  return context;
};