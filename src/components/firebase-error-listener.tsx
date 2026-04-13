'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = errorEmitter.on('permission-error', (error) => {
      // In a real development environment, this would ideally trigger the Next.js error overlay.
      // For now, we surface it clearly to the user.
      toast({
        variant: 'destructive',
        title: 'Security Rules Error',
        description: error.message || 'You do not have permission to perform this action.',
      });
      
      // Log to console for better debugging of the contextual JSON
      console.error(error);
    });

    return () => unsubscribe();
  }, [toast]);

  return null;
}
