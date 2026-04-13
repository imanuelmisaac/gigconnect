
"use client"

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useCollection } from '@/firebase';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import { 
  Loader2, 
  LayoutDashboard, 
  Plus, 
  Calendar, 
  Settings, 
  LogOut, 
  Building2, 
  Users, 
  ClipboardList,
  CheckCircle,
  Clock,
  ArrowRight,
  MapPin,
  MessageCircle,
  ChevronRight,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function GigMakerDashboardPage() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  const gigMakerDocRef = useMemo(() => {
    if (!db || !user) return null;
    return doc(db, 'gig-makers', user.uid);
  }, [db, user]);

  const { data: profile, loading: profileLoading } = useDoc(gigMakerDocRef);

  const eventsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'events'),
      where('gigMakerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [db, user]);

  const { data: events, loading: eventsLoading } = useCollection(eventsQuery);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

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

  return (
    <div className="min-h-screen bg-secondary/10 flex">
      <aside className="w-64 bg-primary text-white hidden md:flex flex-col shrink-0">
        <div className="p-6 border-b border-white/10 flex items-center gap-2">
          <Building2 className="h-6 w-6 text-accent" />
          <span className="text-xl font-bold font-headline">GigConnect</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10 bg-white/5">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          <Link href="/gig-maker/artists" className="block">
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
              <Users className="mr-2 h-4 w-4" />
              Browse Artists
            </Button>
          </Link>
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
            <Calendar className="mr-2 h-4 w-4" />
            My Events
          </Button>
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" onClick={() => router.push('/gig-maker/setup')}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </nav>
        <div className="p-4 border-t border-white/10">
           <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" onClick={() => router.push('/login')}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold font-headline text-primary">Business Console</h1>
            <p className="text-muted-foreground">{profile?.businessName || 'Your Business'}</p>
          </div>
          
          <div className="flex gap-2">
            <Link href="/gig-maker/artists">
              <Button variant="outline" className="font-bold gap-2">
                <Search className="h-4 w-4" />
                Find Talent
              </Button>
            </Link>
            <Link href="/gig-maker/create-event">
              <Button className="bg-accent hover:bg-accent/90 text-white font-bold gap-2">
                <Plus className="h-5 w-5" />
                Create Event
              </Button>
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-none shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{events?.length || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg text-orange-600">
                <ClipboardList className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Applications</p>
                <p className="text-2xl font-bold">Active</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg text-green-600">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Confirmed</p>
                <p className="text-2xl font-bold">4</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg text-purple-600">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hours of Music</p>
                <p className="text-2xl font-bold">28h</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold font-headline">Manage My Events</h3>
          </div>
          
          <div className="grid gap-4">
            {eventsLoading ? (
              <div className="h-40 flex items-center justify-center bg-white rounded-xl border border-dashed">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : events && events.length > 0 ? (
              events.map((event: any) => (
                <Card key={event.id} className="border-none shadow-sm hover:shadow-md transition-shadow group">
                  <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">{event.title}</h4>
                        <div className="flex items-center text-[10px] text-muted-foreground gap-2">
                          <span className="flex items-center gap-0.5"><MapPin className="h-2 w-2" /> {event.location}</span>
                          <span className="flex items-center gap-0.5"><Clock className="h-2 w-2" /> {event.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 self-end md:self-center">
                      <div className="text-right">
                        <Badge variant="outline" className="mb-1">{event.status}</Badge>
                      </div>
                      <Link href={`/gig-maker/events/${event.eventId}/applications`}>
                        <Button size="sm" className="bg-primary hover:bg-primary/90 gap-1">
                          View Applications
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-dashed border-2 bg-transparent">
                <CardContent className="p-12 text-center space-y-4">
                  <div className="bg-primary/5 p-4 rounded-full w-fit mx-auto">
                    <Calendar className="h-12 w-12 text-primary/20" />
                  </div>
                  <div>
                    <h4 className="font-bold">No events created yet</h4>
                    <p className="text-sm text-muted-foreground">Start by creating your first musical event.</p>
                  </div>
                  <Link href="/gig-maker/create-event">
                    <Button variant="outline" className="gap-2">
                      <Plus className="h-4 w-4" /> Create Event
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
