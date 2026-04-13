
"use client"

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { 
  Loader2, 
  LayoutDashboard, 
  Music, 
  Calendar, 
  Settings, 
  LogOut, 
  UserCheck, 
  AlertCircle,
  ExternalLink,
  MessageCircle,
  MapPin,
  Briefcase,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function ArtistDashboardPage() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

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
        // We let them stay if they want to view the partial dashboard, 
        // but typically setup should be finished. 
        // For this requirement, we'll just show the status.
      }
    }
  }, [user, userLoading, artistProfile, profileLoading, router]);

  if (userLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/10">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const isComplete = artistProfile?.profileComplete || false;

  return (
    <div className="min-h-screen bg-secondary/10 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-primary text-white hidden md:flex flex-col shrink-0">
        <div className="p-6 border-b border-white/10 flex items-center gap-2">
          <Music className="h-6 w-6 text-accent" />
          <span className="text-xl font-bold font-headline">GigConnect</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10 bg-white/5">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
            <Calendar className="mr-2 h-4 w-4" />
            My Gigs
          </Button>
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" onClick={() => router.push('/artist/setup')}>
            <Settings className="mr-2 h-4 w-4" />
            Profile Settings
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
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold font-headline text-primary">Dashboard</h1>
            <p className="text-muted-foreground">Manage your professional artist career</p>
          </div>
          
          <div className="flex items-center gap-3">
            {isComplete ? (
              <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-200 px-3 py-1 gap-1">
                <UserCheck className="h-3 w-3" />
                Profile Complete
              </Badge>
            ) : (
              <Badge variant="destructive" className="px-3 py-1 gap-1">
                <AlertCircle className="h-3 w-3" />
                Profile Incomplete
              </Badge>
            )}
            
            {artistProfile?.whatsappNumber && (
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border shadow-sm text-sm font-medium">
                <MessageCircle className="h-4 w-4 text-green-500" />
                {artistProfile.whatsappNumber}
              </div>
            )}
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Summary */}
          <Card className="lg:col-span-1 border-none shadow-md overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-primary to-accent" />
            <CardContent className="relative pt-0">
              <div className="flex justify-center -mt-12 mb-4">
                <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                  <AvatarImage src={artistProfile?.profilePictureUrl} />
                  <AvatarFallback className="text-2xl bg-secondary text-primary">
                    {artistProfile?.artistName?.substring(0, 2).toUpperCase() || 'AR'}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="text-center space-y-1 mb-6">
                <h2 className="text-xl font-bold">{artistProfile?.artistName || 'Artist Name'}</h2>
                <div className="flex items-center justify-center text-muted-foreground text-sm gap-1">
                  <MapPin className="h-3 w-3" />
                  {artistProfile?.location || 'Location not set'}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-muted-foreground uppercase">Bio</p>
                  <p className="text-sm line-clamp-3 italic text-muted-foreground">
                    {artistProfile?.bio || "No bio added yet. Tell people about your music!"}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-muted-foreground uppercase">Genres</p>
                  <div className="flex flex-wrap gap-1.5">
                    {artistProfile?.genres?.map((genre: string) => (
                      <Badge key={genre} variant="secondary" className="text-[10px] font-bold">
                        {genre}
                      </Badge>
                    )) || <span className="text-xs text-muted-foreground">None selected</span>}
                  </div>
                </div>

                <div className="pt-4 border-t flex justify-between items-center">
                  <div className="text-center px-2">
                    <p className="text-xs text-muted-foreground">Booking</p>
                    <p className="font-bold text-primary">${artistProfile?.bookingPrice || 0}</p>
                  </div>
                  <div className="text-center px-2 border-l border-r">
                    <p className="text-xs text-muted-foreground">Features</p>
                    <p className="font-bold text-primary">${artistProfile?.featurePrice || 'N/A'}</p>
                  </div>
                  <div className="text-center px-2">
                    <p className="text-xs text-muted-foreground">Rating</p>
                    <p className="font-bold text-accent">5.0</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 pt-4">
              <Button variant="outline" size="sm" className="w-full" onClick={() => router.push('/artist/setup')}>
                Edit Profile
              </Button>
            </CardFooter>
          </Card>

          {/* Main Dashboard Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Call to Action */}
            <Card className="bg-primary text-white border-none shadow-lg overflow-hidden relative">
              <div className="absolute right-0 top-0 h-full w-1/3 opacity-10">
                <Briefcase className="h-full w-full rotate-12" />
              </div>
              <CardHeader>
                <CardTitle className="text-2xl font-headline">Find Your Next Gig</CardTitle>
                <CardDescription className="text-white/80">
                  Browse through hundreds of events looking for artists like you.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-white font-bold gap-2">
                  <Search className="h-5 w-5" />
                  Browse Events
                </Button>
              </CardContent>
            </Card>

            {/* My Applications */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold font-headline flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-accent" />
                  My Applications
                </h3>
                <Button variant="link" className="text-accent font-bold">View all</Button>
              </div>
              
              <div className="grid gap-4">
                {/* Mock Applications List */}
                {[
                  { id: 1, event: 'Summer Jazz Festival', status: 'Pending', date: 'Aug 15' },
                  { id: 2, event: 'Tech Conference Afterparty', status: 'Under Review', date: 'Sep 2' },
                ].map((app) => (
                  <Card key={app.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center">
                          <Music className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm">{app.event}</h4>
                          <p className="text-xs text-muted-foreground">{app.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-1">{app.status}</Badge>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                          Details <ExternalLink className="h-2 w-2" />
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {/* Empty State if needed */}
                <Card className="border-dashed border-2 bg-transparent">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <p>No other active applications.</p>
                  </CardContent>
                </Card>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
