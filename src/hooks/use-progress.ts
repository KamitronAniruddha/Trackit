
'use client';

import { useContext } from 'react';
import { ProgressContext } from '@/contexts/progress-context';
export type { ChapterProgress, ProgressState } from '@/contexts/progress-context';


export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};
