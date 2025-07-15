/**
 * Wire Sizing Chart Wrapper
 * 
 * Robust wrapper for the WireSizingChart component to handle lazy loading issues
 */

import React, { Suspense } from 'react';
import { WireSizingChart } from './WireSizingChart';
import { LazyLoadingSpinner } from '../UI/LazyLoadingSpinner';

export const WireSizingChartWrapper: React.FC = () => {
  return (
    <Suspense fallback={<LazyLoadingSpinner componentName="Wire Sizing Chart" />}>
      <WireSizingChart />
    </Suspense>
  );
};

export default WireSizingChartWrapper;