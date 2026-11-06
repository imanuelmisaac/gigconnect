
"use client"

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, query, where, doc, setDoc, serverTimestamp, collectionGroup, Timestamp } from 'firebase/firestore';
import { 
  Loader2, 
  Calendar, 
  MapPin, 
  Briefcase, 
  ArrowLeft,
  Music,
  CheckCircle2,
  Clock,
  Video,
  Send,
  AlertTriangle,
  AlertCircle,
  Crown,
  Lock,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const SUBSCRIPTION_LIMITS = {
  free: { apps: 2, label: "Free Tier" },
  package2: { apps: 15, label: "Essential Pro" },
  package3: { apps: 40, label: "Standard Pro" },
  package4: { apps: 9999, label: "Ultimate Pro" }
};

export default function ArtistEventsPage() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [proposedPrice, setProposedPrice] = useState('');
  const [message, setMessage] = useState('');

  // Protect route
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  const artistProfileRef = useMemo(() => {
    if (!db || !user) return null;
    return doc(db, 'artists', user.uid);
  }, [db, user]);

  const { data: artistProfile } = useDoc(artistProfileRef);

  // Month tracking
  const startOfMonth = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return Timestamp.fromDate(d);
  }, []);

  const applicationsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collectionGroup(db, 'applications'),
      where('artistId', '==', user.uid)
    );
  }, [db, user]);

  const { data: rawApps } = useCollection(applicationsQuery);

  const monthlyAppCount = useMemo(() => {
    if (!rawApps) return 0;
    return rawApps.filter((app: any) => 
      app.createdAt && (app.createdAt.seconds >= startOfMonth.seconds)
    ).length;
  }, [rawApps, startOfMonth]);

  const tierKey = (artistProfile?.subscriptionTier as keyof typeof SUBSCRIPTION_LIMITS) || 'free';
  const limits = SUBSCRIPTION_LIMITS[tierKey];
  const isLimitReached = monthlyAppCount >= (limits?.apps || 0);

  const eventsQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'events'),
      where('status', '==', 'Open'),
      where('paymentStatus', '==', 'Complete')
    );
  }, [db]);

  const { data: rawEvents, loading: eventsLoading } = useCollection(eventsQuery);

  const events = useMemo(() => {
    if (!rawEvents || !rawApps) return rawEvents || [];
    return [...rawEvents].map(event => {
      const eventId = event.id || event.eventId;
      return {
        ...event,
        hasApplied: rawApps.some((app: any) => app.eventId === eventId)
      };
    }).sort((a: any, b: any) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      return dateA.localeCompare(dateB);
    });
  }, [rawEvents, rawApps]);

  useEffect(() => {
    if (selectedEvent && artistProfile) {
      setProposedPrice(artistProfile.bookingPrice?.toString() || '');
    }
  }, [selectedEvent, artistProfile]);

  const handleOpenApply = (event: any) => {
    if (event.hasApplied) {
      toast({
        title: "Already Applied",
        description: "You have already submitted an application for this gig.",
      });
      return;
    }
    if (isLimitReached) {
      toast({
        variant: "destructive",
        title: "Monthly Limit Reached",
        description: `Your ${limits.label} allows only ${limits.apps} applications per month. Upgrade to apply for more.`,
      });
      router.push('/artist/subscription');
      return;
    }
    setSelectedEvent(event);
    setIsApplyDialogOpen(true);
  };

  const handleApplySubmit = async () => {
    if (!user || !db || !selectedEvent || !artistProfile) return;
    
    // Ensure we have a valid event ID for the path
    const eventId = selectedEvent.id || selectedEvent.eventId;
    if (!eventId) {
      toast({ variant: "destructive", title: "Error", description: "Invalid event data." });
      return;
    }

    setSubmitting(true);

    const appRef = doc(db, 'events', eventId, 'applications', user.uid);
    const applicationData = {
      applicationId: user.uid,
      eventId: eventId,
      artistId: user.uid,
      artistName: artistProfile.artistName || 'Unknown Artist',
      artistGenres: artistProfile.genres || [],
      artistWhatsapp: artistProfile.whatsappNumber || '',
      price: Number(proposedPrice),
      message: message,
      songLinks: artistProfile.songLinks || [],
      videoLink: artistProfile.videoLink || '',
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    setDoc(appRef, applicationData)
      .then(() => {
        toast({ title: "Application Sent!", description: `Success! You've applied for ${selectedEvent.title}.` });
        setIsApplyDialogOpen(false);
        setSelectedEvent(null);
      })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: appRef.path,
          operation: 'create',
          requestResourceData: applicationData,
        } satisfies SecurityRuleContext));
      })
      .finally(() => setSubmitting(false));
  };

  if (userLoading || eventsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/10">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-secondary/10 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <Link href="/artist/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
            <h1 className="text-4xl font-bold text-primary font-headline uppercase">Browse Gigs</h1>
            <p className="text-muted-foreground">Find events in Botswana matching your style.</p>
          </div>
          <Card className="bg-white p-4 border-none shadow-sm flex items-center gap-4">
            <div className="text-right">
               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Monthly Quota</p>
               <p className="text-xl font-black text-primary">{monthlyAppCount} / {limits?.apps > 1000 ? '∞' : (limits?.apps || 0)}</p>
            </div>
            {isLimitReached && (
              <Link href="/artist/subscription">
                <Button size="sm" className="bg-accent hover:bg-accent/90 gap-1 text-[10px] font-bold">
                  <Crown className="h-3 w-3" /> UPGRADE
                </Button>
              </Link>
            )}
          </Card>
        </header>

        {isLimitReached && (
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="font-bold">Monthly Limit Reached</AlertTitle>
            <AlertDescription>
              You have used all {limits.apps} applications for this month. Upgrade to one of our Pro plans to apply for more gigs.
            </AlertDescription>
          </Alert>
        )}

        {events.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event: any) => (
              <Card key={event.id} className={`border-none shadow-md hover:shadow-lg transition-all overflow-hidden flex flex-col ${event.hasApplied ? 'opacity-75' : ''}`}>
                <div className={`h-2 ${event.hasApplied ? 'bg-muted-foreground' : 'bg-primary'}`} />
                <CardHeader>
                  <div className="flex justify-between mb-2">
                    <Badge variant="secondary" className="text-[10px] font-bold uppercase">{event.experienceLevel}</Badge>
                    <Badge variant="outline" className="text-[10px] font-bold border-green-500 text-green-600">P{event.maxPrice}</Badge>
                  </div>
                  <CardTitle className="text-lg font-headline line-clamp-1">{event.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="grid gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2"><Calendar className="h-3 w-3" /> {event.date}</div>
                    <div className="flex items-center gap-2"><MapPin className="h-3 w-3" /> {event.location}</div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {event.genres?.map((g: string) => <Badge key={g} variant="outline" className="text-[9px] py-0">{g}</Badge>)}
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/30 pt-4">
                  <Button 
                    className="w-full font-bold gap-2" 
                    variant={event.hasApplied ? "secondary" : "default"}
                    disabled={isLimitReached || event.hasApplied}
                    onClick={() => handleOpenApply(event)}
                  >
                    {event.hasApplied ? (
                      <><Check className="h-4 w-4" /> Already Applied</>
                    ) : isLimitReached ? (
                      <><Lock className="h-4 w-4" /> Limit Reached</>
                    ) : (
                      <>Apply for Gig <Briefcase className="h-4 w-4" /></>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2 py-20 text-center bg-transparent">
             <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
             <h3 className="font-bold">No gigs available right now</h3>
             <p className="text-sm text-muted-foreground">Check back later for new opportunities.</p>
          </Card>
        )}
      </div>

      <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for {selectedEvent?.title}</DialogTitle>
            <DialogDescription>Your monthly usage will be {monthlyAppCount + 1} / {limits?.apps > 1000 ? '∞' : (limits?.apps || 0)}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Proposed Price (P)</Label>
              <Input type="number" value={proposedPrice} onChange={(e) => setProposedPrice(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Why should we pick you?</Label>
              <Textarea placeholder="Tell them about your experience..." value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApplyDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleApplySubmit} disabled={submitting || !proposedPrice}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
