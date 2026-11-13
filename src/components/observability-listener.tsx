'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { logger } from '@/lib/logger';
import { useUser } from '@/firebase';

/**
 * @fileOverview Client-side listener for capturing application health and error events.
 */
export function ObservabilityListener() {
  const { user } = useUser();

  useEffect(() => {
    // 1. Listen for Firestore Permission Errors
    const unsubscribePermissions = errorEmitter.on('permission-error', (error) => {
      logger.error('Firestore Security Denial', {
        userId: user?.uid,
        path: error.context?.path,
        operation: error.context?.operation,
        payload: error.context?.requestResourceData
      });
    });

    // 2. Global Error Handling
    const handleGlobalError = (event: ErrorEvent) => {
      logger.error('Global Application Error', {
        userId: user?.uid,
        message: event.message,
        filename: event.filename,
        lineno: event.lineno
      });
    };

    // 3. Unhandled Promise Rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      logger.warn('Unhandled Promise Rejection', {
        userId: user?.uid,
        reason: event.reason?.message || event.reason
      });
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      unsubscribePermissions();
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [user]);

  return null;
}
