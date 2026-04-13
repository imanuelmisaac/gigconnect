'use client';

import { initializeFirebase } from '@/firebase';

const { auth, db } = initializeFirebase();

export { auth, db };
