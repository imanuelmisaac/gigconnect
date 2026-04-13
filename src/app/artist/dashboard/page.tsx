
"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2, LayoutDashboard, Music, Calendar, Settings, LogOut, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useMemoFirebase } from '@/firebase/use-memo-firebase'; // Assuming it exists based on guidelines or standard pattern

export default function ArtistDashboardPage() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  // Guard: Redirect if profile is incomplete
  const artistDocRef = useMemo(() => {
    if (!db || !user) return null;
    return doc(db, 'artists', user.uid);
  }, [db, user]);

  const { data: artistProfile, loading: profileLoading } = useDoc(artistDocRef);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
      return;
    }

    if (!profileLoading && artistProfile) {
      if (artistProfile.profileComplete === false) {
        router.push('/artist/setup');
      }
    } else if (!profileLoading && !artistProfile && user) {
        // If profile document doesn't even exist
        router.push('/artist/setup');
    }
  }, [user, userLoading, artistProfile, profileLoading, router]);

  if (userLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/10">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground animate-pulse">Verifying profile status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/10 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-primary text-white hidden md:flex flex-col">
        <div className="p-6 border-b border-white/10 flex items-center gap-2">
          <Music className="h-6 w-6" />
          <span className="text-xl font-bold font-headline">GigConnect</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10 bg-white/5">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
            <Calendar className="mr-2 h-4 w-4" />
            Gigs
          </Button>
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" onClick={() => router.push('/artist/setup')}>
            <Settings className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        </nav>
        <div className="p-4 border-t border-white/10">
           <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold font-headline text-primary">Artist Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {artistProfile?.artistName || 'Artist'}</p>
          </div>
          <div className="bg-green-500/10 text-green-600 px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold border border-green-200">
            <UserCheck className="h-4 w-4" />
            Verified Profile
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-none shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Gigs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">3</div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">$0.00</div>
            </CardContent>
          </Card>
        </div>

        <section className="mt-12">
            <h2 className="text-xl font-bold mb-4">Upcoming Schedule</h2>
            <Card className="border-none shadow-sm">
                <CardContent className="p-12 text-center text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No upcoming gigs scheduled yet.</p>
                    <Button variant="outline" className="mt-4">Find Opportunities</Button>
                </CardContent>
            </Card>
        </section>
      </main>
    </div>
  );
}

// Simple useMemo polyfill for doc reference if standard hook doesn't exist
function useMemo(factory: () => any, deps: any[]) {
    return React.useMemo(factory, deps);
}
import React from 'react';
