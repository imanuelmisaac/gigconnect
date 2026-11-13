"use client"

import { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useCollection, useAuth } from '@/firebase';
import { doc, collection, query, where, deleteDoc, writeBatch, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { 
  Loader2, 
  LayoutDashboard, 
  Plus, 
  Calendar, 
  Settings, 
  LogOut, 
  Building2, 
  Users, 
  CheckCircle,
  Clock,
  MapPin,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  Star,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { WhatsAppButton } from '@/components/whatsapp-button';

export default function GigMakerDashboardPage() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [eventToDelete, setEventToDelete] = useState<{ id: string, title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const cleanupPerformed = useRef(false);
  const processingCleanup = useRef<Set<string>>(new Set());

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

  const { data: rawEvents, loading: eventsLoading } = useCollection(eventsQuery);

  const proArtistsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'artists'), where('subscriptionTier', '==', 'package4'));
  }, [db]);

  const { data: proArtists } = useCollection(proArtistsQuery);

  const events = useMemo(() => {
    if (!rawEvents) return [];
    return [...rawEvents].sort((a: any, b: any) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
  }, [rawEvents]);

  useEffect(() => {
    if (!userLoading) {
      if (!user) {
        router.push('/login');
        return;
      }

      if (!user.emailVerified) {
        signOut(auth).then(() => {
          toast({
            variant: "destructive",
            title: "Verification Required",
            description: "Please verify your email address to access your console.",
          });
          router.push('/login');
        });
        return;
      }
    }
  }, [user, userLoading, router, auth, toast]);

  useEffect(() => {
    if (!user || !events || events.length === 0 || !db || cleanupPerformed.current) return;

    const cleanupOldEvents = async () => {
      const now = new Date();
      let deletedCount = 0;

      for (const event of events) {
        const docId = event.id || event.eventId;
        if (!docId || processingCleanup.current.has(docId)) continue;

        let shouldDelete = false;
        if (event.date) {
          const [year, month, day] = event.date.split('-').map(Number);
          const eventExpiry = new Date(year, month - 1, day, 23, 59, 59);
          if (now > eventExpiry) shouldDelete = true;
        }
        if (event.listingExpiresAt) {
          const listingExpiry = new Date(event.listingExpiresAt);
          if (now > listingExpiry) shouldDelete = true;
        }

        if (shouldDelete) {
          processingCleanup.current.add(docId);
          try {
            const appsRef = collection(db, 'events', docId, 'applications');
            const appsSnap = await getDocs(appsRef);
            if (!appsSnap.empty) {
              const batch = writeBatch(db);
              appsSnap.docs.forEach(d => batch.delete(d.ref));
              await batch.commit();
            }
            const eventRef = doc(db, 'events', docId);
            await deleteDoc(eventRef);
            deletedCount++;
          } catch (e: any) {
            processingCleanup.current.delete(docId);
          }
        }
      }

      if (deletedCount > 0) {
        toast({ title: "Auto-Cleanup Successful", description: `Removed ${deletedCount} concluded or expired gig listings.` });
      }
      cleanupPerformed.current = true;
    };

    cleanupOldEvents();
  }, [user, events, db, toast]);

  const handleDeleteEvent = async () => {
    if (!eventToDelete || !db) return;
    setIsDeleting(true);
    const eventId = eventToDelete.id;
    try {
      const appsRef = collection(db, 'events', eventId, 'applications');
      const appsSnap = await getDocs(appsRef);
      if (!appsSnap.empty) {
        const batch = writeBatch(db);
        appsSnap.docs.forEach(docSnap => batch.delete(docSnap.ref));
        await batch.commit();
      }
      const eventRef = doc(db, 'events', eventId);
      await deleteDoc(eventRef);
      toast({ title: "Event Deleted", description: `"${eventToDelete.title}" has been removed.` });
      setEventToDelete(null);
    } catch (e: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `/events/${eventId}`,
        operation: 'delete',
      }));
    } finally {
      setIsDeleting(false);
    }
  };

  if (userLoading || profileLoading || eventsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/10">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/10 flex">
      <aside className="w-64 bg-primary text-white hidden md:flex flex-col shrink-0">
        <div className="p-6 border-b border-white/10 flex items-center gap-2">
          <Building2 className="h-6 w-6 text-accent" />
          <span className="text-xl font-bold font-headline text-white uppercase tracking-tighter">GigConnect</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10 bg-white/5">
            <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
          </Button>
          <Link href="/gig-maker/artists" className="block">
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
              <Users className="mr-2 h-4 w-4" /> Browse Talent
            </Button>
          </Link>
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" onClick={() => router.push('/gig-maker/setup')}>
            <Settings className="mr-2 h-4 w-4" /> Settings
          </Button>
        </nav>
        <div className="p-4 border-t border-white/10">
           <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" onClick={() => auth.signOut()}>
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold font-headline text-primary uppercase">Business Console</h1>
            <p className="text-muted-foreground">{profile?.businessName || 'Your Business'}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/gig-maker/artists">
              <Button variant="outline" className="font-bold gap-2 border-primary/20 text-primary">
                <Search className="h-4 w-4" /> Find Talent
              </Button>
            </Link>
            <Link href="/gig-maker/create-event">
              <Button className="bg-accent hover:bg-accent/90 text-white font-bold gap-2 shadow-sm">
                <Plus className="h-5 w-5" /> Create Event
              </Button>
            </Link>
          </div>
        </header>

        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-none shadow-sm">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg text-blue-600"><Calendar className="h-6 w-6" /></div>
                  <div><p className="text-xs text-muted-foreground uppercase font-bold">Active Events</p><p className="text-2xl font-black">{events?.length || 0}</p></div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-orange-100 rounded-lg text-orange-600"><Clock className="h-6 w-6" /></div>
                  <div><p className="text-xs text-muted-foreground uppercase font-bold">Expiry Rule</p><p className="text-sm font-bold text-orange-600">3 Days / Post-Date</p></div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg text-green-600"><CheckCircle className="h-6 w-6" /></div>
                  <div><p className="text-xs text-muted-foreground uppercase font-bold">Listing Fee</p><p className="text-sm font-bold text-green-600">P25 Fixed</p></div>
                </CardContent>
              </Card>
            </div>

            <section className="space-y-4">
              <h3 className="text-xl font-bold font-headline text-primary uppercase">Event Management</h3>
              <div className="grid gap-4">
                {events && events.length > 0 ? events.map((event: any) => (
                    <Card key={event.id} className="border-none shadow-sm group overflow-hidden">
                      <CardContent className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center relative">
                            <Calendar className="h-6 w-6 text-primary" />
                            {event.paymentStatus === 'Incomplete' && <div className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5"><AlertTriangle className="h-3 w-3" /></div>}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm">{event.title}</h4>
                              <Badge variant={event.paymentStatus === 'Complete' ? 'secondary' : 'destructive'} className="text-[9px] py-0">{event.paymentStatus}</Badge>
                            </div>
                            <div className="flex items-center text-[10px] text-muted-foreground gap-3">
                              <span className="flex items-center gap-0.5"><MapPin className="h-2 w-2" /> {event.location}</span>
                              <span className="flex items-center gap-0.5"><Clock className="h-2 w-2" /> {event.date}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/gig-maker/events/${event.id}/applications`}>
                            <Button size="sm" className="bg-primary hover:bg-primary/90 gap-1 text-white h-8"><Users className="h-3 w-3" /> Applicants</Button>
                          </Link>
                          <Link href={`/gig-maker/events/${event.id}/edit`}>
                            <Button variant="ghost" size="sm" className="gap-1 h-8"><Edit className="h-3 w-3" /> Edit</Button>
                          </Link>
                          <Button variant="ghost" size="sm" className="text-destructive h-8" onClick={() => setEventToDelete({ id: event.id, title: event.title })} aria-label="Delete Event"><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </CardContent>
                    </Card>
                  )) : (
                    <Card className="border-dashed border-2 py-12 text-center">
                      <CardContent className="space-y-4">
                        <Calendar className="h-10 w-10 text-muted-foreground/20 mx-auto" />
                        <p className="text-sm text-muted-foreground">No active events.</p>
                        <Link href="/gig-maker/create-event"><Button variant="outline" size="sm">Create Event</Button></Link>
                      </CardContent>
                    </Card>
                  )
                }
              </div>
            </section>
          </div>

          <aside className="lg:col-span-1 space-y-6">
            <Card className="border-none shadow-md bg-accent/5 ring-1 ring-accent/20 overflow-hidden">
              <CardHeader className="bg-accent/10 border-b pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-accent">
                  <Star className="h-4 w-4 fill-accent" /> Featured Talent
                </CardTitle>
                <CardDescription className="text-[10px]">Top Ultimate Pro Artists</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {proArtists?.length ? proArtists.slice(0, 5).map((artist: any) => (
                  <div key={artist.id} className="flex items-center justify-between gap-2 border-b border-accent/10 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8 border border-accent">
                        <AvatarImage src={artist.profilePictureUrl} />
                        <AvatarFallback className="text-[10px]">{artist.artistName?.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold line-clamp-1">{artist.artistName}</p>
                        <p className="text-[9px] text-muted-foreground uppercase">{artist.location}</p>
                      </div>
                    </div>
                    <WhatsAppButton 
                      phoneNumber={artist.whatsappNumber || ''} 
                      message={`Hi ${artist.artistName}, I saw your profile on GigConnect and I'd like to talk about a gig.`}
                      iconOnly 
                      size="sm" 
                      className="h-7 w-7 bg-accent text-white hover:bg-accent/90 border-none" 
                    />
                  </div>
                )) : (
                  <p className="text-[10px] text-center text-muted-foreground py-4">Seeking featured talent...</p>
                )}
                <Link href="/gig-maker/artists">
                  <Button variant="ghost" className="w-full text-[10px] font-bold text-accent mt-2">View All Talent</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md bg-primary text-white overflow-hidden relative group">
              <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 group-hover:scale-110 transition-transform"><Sparkles className="h-full w-full rotate-12" /></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Support Hub</CardTitle>
                <CardDescription className="text-white/70 text-[10px]">Direct Admin Messaging</CardDescription>
              </CardHeader>
              <CardContent>
                <WhatsAppButton phoneNumber="+26774266208" message="Hi Admin, I need assistance with my GigConnect business console." size="sm" className="w-full bg-white text-primary border-none font-bold text-[10px]">Message Support</WhatsAppButton>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>

      <AlertDialog open={!!eventToDelete} onOpenChange={(open) => !open && setEventToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event?</AlertDialogTitle>
            <AlertDialogDescription>Permanently remove "{eventToDelete?.title}".</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEvent} className="bg-destructive text-white">{isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
