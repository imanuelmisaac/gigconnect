
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
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

  // Mock applications for visual representation in MVP
  const recentApplications = [
    { id: '1', artistName: 'Luna Ray', eventTitle: 'Jazz Night', status: 'Pending', time: '2h ago' },
    { id: '2', artistName: 'The Beatniks', eventTitle: 'Rock Fest', status: 'Reviewed', time: '5h ago' },
    { id: '3', artistName: 'DJ Spark', eventTitle: 'Friday Club Mix', status: 'Pending', time: '1d ago' },
  ];

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
      {/* Sidebar */}
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
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
            <Calendar className="mr-2 h-4 w-4" />
            My Events
          </Button>
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
            <Users className="mr-2 h-4 w-4" />
            Applications
          </Button>
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" onClick={() => router.push('/gig-maker/setup')}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
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
            <h1 className="text-3xl font-bold font-headline text-primary">Business Console</h1>
            <p className="text-muted-foreground">{profile?.businessName || 'Your Business'}</p>
          </div>
          
          <Link href="/gig-maker/create-event">
            <Button className="bg-accent hover:bg-accent/90 text-white font-bold gap-2">
              <Plus className="h-5 w-5" />
              Create Event
            </Button>
          </Link>
        </header>

        {/* Stats Grid */}
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
                <p className="text-sm text-muted-foreground">New Applications</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg text-green-600">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Confirmed Gigs</p>
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

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Events */}
          <section className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold font-headline">My Events</h3>
              <Button variant="link" className="text-accent font-bold">Manage all</Button>
            </div>
            
            <div className="grid gap-4">
              {eventsLoading ? (
                <div className="h-40 flex items-center justify-center bg-white rounded-xl border border-dashed">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : events && events.length > 0 ? (
                events.map((event: any) => (
                  <Card key={event.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
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
                      <div className="text-right">
                        <Badge variant="outline" className="mb-1">{event.status}</Badge>
                        <p className="text-[10px] text-muted-foreground">8 Applications</p>
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

          {/* Applications Overview */}
          <section className="space-y-4">
            <h3 className="text-xl font-bold font-headline">Recent Applications</h3>
            <Card className="border-none shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Latest Submissions</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {recentApplications.map((app) => (
                    <div key={app.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-[10px] bg-secondary text-primary">{app.artistName.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-bold">{app.artistName}</p>
                          <p className="text-[10px] text-muted-foreground">for {app.eventTitle}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="text-[9px] px-1.5 h-4 bg-primary/10 text-primary border-none hover:bg-primary/20">
                          {app.status}
                        </Badge>
                        <p className="text-[9px] text-muted-foreground mt-0.5">{app.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <div className="p-4 border-t text-center">
                <Button variant="ghost" size="sm" className="text-accent text-xs font-bold gap-1">
                  View All Applications <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </Card>

            {/* Business Contact Quick Card */}
            <Card className="bg-primary text-white border-none shadow-lg overflow-hidden relative mt-8">
              <div className="absolute right-0 top-0 h-full w-1/3 opacity-10">
                <MessageCircle className="h-full w-full rotate-12" />
              </div>
              <CardHeader>
                <CardTitle className="text-lg">Contact Support</CardTitle>
                <CardDescription className="text-white/80">
                  Need help with your events?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="sm" className="bg-accent hover:bg-accent/90 text-white font-bold w-full">
                  Chat with Us
                </Button>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}
