
"use client"

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useCollection } from '@/firebase';
import { doc, collection, query, where, deleteDoc, writeBatch, getDocs } from 'firebase/firestore';
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
  MapPin,
  ChevronRight,
  Search,
  AlertCircle,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';

export default function GigMakerDashboardPage() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const gigMakerDocRef = useMemo(() => {
    if (!db || !user) return null;
    return doc(db, 'gig-makers', user.uid);
  }, [db, user]);

  const { data: profile, loading: profileLoading } = useDoc(gigMakerDocRef);

  const eventsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'events'),
      where('gigMakerId', '==', user.uid)
    );
  }, [db, user]);

  const { data: rawEvents, loading: eventsLoading, error: eventsError } = useCollection(eventsQuery);

  const events = useMemo(() => {
    if (!rawEvents) return [];
    return [...rawEvents].sort((a: any, b: any) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
  }, [rawEvents]);

  // Cleanup logic
  useEffect(() => {
    if (!events || events.length === 0) return;

    const cleanupOldEvents = async () => {
      const now = new Date();
      const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
      let deletedCount = 0;

      for (const event of events) {
        if (!event.date) continue;
        const eventDate = new Date(event.date);
        if (now.getTime() - eventDate.getTime() > twoDaysInMs) {
          try {
            // Delete event applications first
            const appsRef = collection(db, 'events', event.eventId, 'applications');
            const appsSnap = await getDocs(appsRef);
            const batch = writeBatch(db);
            appsSnap.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            
            // Delete the event
            await deleteDoc(doc(db, 'events', event.eventId));
            deletedCount++;
          } catch (e) {
            console.error("Failed to cleanup event:", event.eventId);
          }
        }
      }

      if (deletedCount > 0) {
        toast({
          title: "Cleanup Complete",
          description: `Removed ${deletedCount} concluded events and their applications.`,
        });
      }
    };

    cleanupOldEvents();
  }, [events, db, toast]);

  const handleDeleteEvent = async (eventId: string) => {
    try {
      // Cleanup applications
      const appsRef = collection(db, 'events', eventId, 'applications');
      const appsSnap = await getDocs(appsRef);
      const batch = writeBatch(db);
      appsSnap.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();

      // Delete event
      await deleteDoc(doc(db, 'events', eventId));
      toast({ title: "Event Deleted", description: "The event and its applications have been removed." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

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
          <span className="text-xl font-bold font-headline text-white">GigConnect</span>
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
              <Button variant="outline" className="font-bold gap-2 border-primary/20 text-primary">
                <Search className="h-4 w-4" />
                Find Talent
              </Button>
            </Link>
            <Link href="/gig-maker/create-event">
              <Button className="bg-accent hover:bg-accent/90 text-white font-bold gap-2 shadow-sm">
                <Plus className="h-5 w-5" />
                Create Event
              </Button>
            </Link>
          </div>
        </header>

        {eventsError && (
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Database Error</AlertTitle>
            <AlertDescription>
              Could not load your events. This might be due to missing database permissions.
            </AlertDescription>
          </Alert>
        )}

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
                <p className="text-sm text-muted-foreground">Cleanup Policy</p>
                <p className="text-xs font-bold text-orange-600">2 Day Auto-Delete</p>
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
                <p className="text-2xl font-bold">Live</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg text-purple-600">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">System Status</p>
                <p className="text-2xl font-bold text-green-500">Active</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <section className="space-y-4">
          <h3 className="text-xl font-bold font-headline text-primary">Manage My Events</h3>
          <div className="grid gap-4">
            {eventsLoading ? (
              <div className="h-40 flex items-center justify-center bg-white rounded-xl border border-dashed">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : events && events.length > 0 ? (
              events.map((event: any) => (
                <Card key={event.id} className="border-none shadow-sm hover:shadow-md transition-shadow group overflow-hidden">
                  <CardContent className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">{event.title}</h4>
                        <div className="flex items-center text-[10px] text-muted-foreground gap-3">
                          <span className="flex items-center gap-0.5"><MapPin className="h-2 w-2" /> {event.location}</span>
                          <span className="flex items-center gap-0.5"><Clock className="h-2 w-2" /> {event.date}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{event.status}</Badge>
                      <div className="h-8 w-px bg-border mx-2 hidden lg:block" />
                      
                      <Link href={`/gig-maker/events/${event.eventId}/applications`}>
                        <Button size="sm" className="bg-primary hover:bg-primary/90 gap-1 text-white">
                          <Users className="h-4 w-4" />
                          Applicants
                        </Button>
                      </Link>

                      <Link href={`/gig-maker/events/${event.eventId}/edit`}>
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                      </Link>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive gap-1">
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the event "{event.title}" and all submitted applications.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteEvent(event.eventId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              !eventsLoading && (
                <Card className="border-dashed border-2 bg-transparent">
                  <CardContent className="p-12 text-center space-y-4">
                    <div className="bg-primary/5 p-4 rounded-full w-fit mx-auto">
                      <Calendar className="h-12 w-12 text-primary/20" />
                    </div>
                    <div>
                      <h4 className="font-bold">No active events</h4>
                      <p className="text-sm text-muted-foreground">Expired events are cleaned up after 2 days.</p>
                    </div>
                    <Link href="/gig-maker/create-event">
                      <Button variant="outline" className="gap-2 border-primary text-primary">
                        <Plus className="h-4 w-4" /> Create Event
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
