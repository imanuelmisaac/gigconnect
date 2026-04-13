
"use client"

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Loader2, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Briefcase, 
  ArrowLeft,
  Music,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export default function ArtistEventsPage() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const eventsQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'events'),
      where('status', '==', 'Open'),
      orderBy('date', 'asc')
    );
  }, [db]);

  const { data: events, loading: eventsLoading } = useCollection(eventsQuery);

  // We also need to know what the user has already applied for
  const userApplicationsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'applications'),
      where('artistId', '==', user.uid)
    );
  }, [db, user]);

  const { data: userApplications } = useCollection(userApplicationsQuery);

  const appliedEventIds = useMemo(() => {
    return new Set(userApplications?.map(app => (app as any).eventId) || []);
  }, [userApplications]);

  const handleApply = (eventId: string) => {
    if (!user || !db) return;

    const applicationId = `${user.uid}_${eventId}`;
    const appRef = doc(db, 'applications', applicationId);

    const applicationData = {
      applicationId,
      eventId,
      artistId: user.uid,
      status: 'Pending',
      createdAt: serverTimestamp(),
    };

    setDoc(appRef, applicationData)
      .then(() => {
        toast({
          title: "Application Sent!",
          description: "The gig maker will be notified of your interest.",
        });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: appRef.path,
          operation: 'create',
          requestResourceData: applicationData,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  if (userLoading || eventsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/10">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/10 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <Link href="/artist/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold text-primary font-headline">Available Gigs</h1>
            <p className="text-muted-foreground">Find and apply for musical events matching your style.</p>
          </div>
        </header>

        {events && events.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event: any) => {
              const isApplied = appliedEventIds.has(event.eventId);
              
              return (
                <Card key={event.id} className="border-none shadow-md hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
                  <div className="h-3 bg-primary" />
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="secondary" className="bg-accent/10 text-accent border-none font-bold">
                        {event.experienceLevel}
                      </Badge>
                      {isApplied && (
                        <Badge className="bg-green-500 text-white border-none gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Applied
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl font-headline line-clamp-1">{event.title}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-2">
                      {event.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="truncate">{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-bold text-foreground">
                          ${event.minPrice} - ${event.maxPrice}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Required Genres</p>
                      <div className="flex flex-wrap gap-1.5">
                        {event.genres?.map((genre: string) => (
                          <Badge key={genre} variant="outline" className="text-[10px] py-0 px-2">
                            {genre}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Deadline: {event.applicationDeadline}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/30 pt-4">
                    <Button 
                      className="w-full font-bold gap-2" 
                      variant={isApplied ? "secondary" : "default"}
                      disabled={isApplied}
                      onClick={() => handleApply(event.eventId)}
                    >
                      {isApplied ? (
                        <>Applied Successfully</>
                      ) : (
                        <>
                          Apply for Gig
                          <Briefcase className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed border-2 py-20 text-center">
            <CardContent className="space-y-4">
              <div className="bg-primary/5 p-4 rounded-full w-fit mx-auto">
                <Music className="h-12 w-12 text-primary/20" />
              </div>
              <div>
                <h2 className="text-xl font-bold">No active gigs found</h2>
                <p className="text-muted-foreground">Check back later for new opportunities.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
