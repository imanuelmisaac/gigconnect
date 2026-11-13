"use client"

import { useMemo, useState } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { 
  Loader2, 
  Calendar, 
  MapPin, 
  Search, 
  Music, 
  ArrowRight,
  TrendingUp,
  Users,
  Heart,
  Ticket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Navbar } from '@/components/navbar';
import { useToast } from '@/hooks/use-toast';
import { WhatsAppButton } from '@/components/whatsapp-button';
import Link from 'next/link';

export default function PublicEventsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const eventsQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'events'),
      where('status', '==', 'Open')
    );
  }, [db]);

  const { data: rawEvents, loading } = useCollection(eventsQuery);

  const filteredEvents = useMemo(() => {
    if (!rawEvents) return [];
    return rawEvents
      .filter((e: any) => e.paymentStatus === 'Complete')
      .filter((e: any) => 
        e.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.location?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a: any, b: any) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });
  }, [rawEvents, searchTerm]);

  const handleToggleInterest = async (event: any) => {
    if (!user) {
      toast({ 
        title: "Interested?", 
        description: "Please register or log in to show your interest and follow this event." 
      });
      return;
    }
    const eventId = event.id || event.eventId;
    const isInterested = event.interestedUsers?.includes(user.uid);
    const eventRef = doc(db, 'events', eventId);
    try {
      await updateDoc(eventRef, {
        interestedUsers: isInterested ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
      toast({
        title: isInterested ? "Interest Removed" : "Marked as Interested",
        description: isInterested ? "You are no longer following this event." : "We'll count you in!",
      });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Could not update interest." });
    }
  };

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Gig Marketplace',
    description: 'A curated list of musical gigs and talent opportunities in Botswana.',
    url: 'https://gigconnect.bw/events',
  };

  return (
    <div className="min-h-screen bg-secondary/10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <Navbar />
      <main className="container mx-auto py-12 px-4 max-w-7xl">
        <header className="mb-12 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                <TrendingUp className="h-3 w-3" aria-hidden="true" /> Live Gigs
              </div>
              <h1 className="text-4xl lg:text-5xl font-extrabold text-primary font-headline uppercase tracking-tighter text-balance text-slate-900">Gig Marketplace</h1>
              <p className="text-muted-foreground text-lg max-w-xl">Browse verified musical performances and talent opportunities across Botswana.</p>
            </div>
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <Input 
                placeholder="Search by venue or gig name..." 
                className="pl-10 h-12 border-none shadow-sm bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search musical gigs"
              />
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4" aria-live="polite">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse">Syncing marketplace data...</p>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event: any) => {
              const interestCount = event.interestedUsers?.length || 0;
              const isInterested = user && event.interestedUsers?.includes(user.uid);
              return (
                <Card key={event.id} className="border-none shadow-md hover:shadow-xl transition-all overflow-hidden flex flex-col slide-up group">
                  <div className="h-2 bg-primary group-hover:bg-accent transition-colors" />
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-col gap-1">
                        <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest w-fit">{event.experienceLevel}</Badge>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Users className="h-3 w-3" aria-hidden="true" /> {interestCount} Interested
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase">Budget Up To</p>
                        <p className="text-sm font-black text-green-600">P{event.maxPrice}</p>
                      </div>
                    </div>
                    <CardTitle className="text-xl font-headline group-hover:text-primary transition-colors">{event.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-6">
                    <div className="grid gap-3 text-xs text-muted-foreground font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" aria-hidden="true" /> {event.date}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" aria-hidden="true" /> {event.location}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {event.genres?.map((g: string) => (
                        <Badge key={g} variant="outline" className="text-[9px] py-0 border-primary/20 text-primary">{g}</Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3 italic">
                      &quot;{event.description || 'Join us for a professional performance set.'}&quot;
                    </p>
                  </CardContent>
                  <CardFooter className="bg-muted/30 pt-6 flex flex-col gap-3">
                    <div className="flex w-full gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`px-3 ${isInterested ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-primary'}`}
                        onClick={() => handleToggleInterest(event)}
                        aria-label={isInterested ? "Remove interest from this event" : "Mark as interested in this event"}
                      >
                        <Heart className={`h-4 w-4 ${isInterested ? 'fill-red-500' : ''}`} aria-hidden="true" />
                      </Button>
                      <Link href={user ? "/artist/events" : "/register"} className="flex-1">
                        <Button className="w-full font-bold uppercase tracking-widest gap-2 bg-primary h-9 text-[10px]">
                          {user ? "Apply as Talent" : "Register to Apply"} <ArrowRight className="h-3 w-3" aria-hidden="true" />
                        </Button>
                      </Link>
                    </div>
                    {event.ticketWhatsApp && (
                      <WhatsAppButton 
                        phoneNumber={event.ticketWhatsApp} 
                        message={`Hi, I'm interested in tickets for "${event.title}" on ${event.date}. Saw this on GigConnect.`}
                        className="w-full bg-accent hover:bg-accent/90 text-white font-bold h-9 text-[10px] uppercase tracking-widest gap-2"
                      >
                        <Ticket className="h-4 w-4" aria-hidden="true" /> Buy Ticket (WhatsApp)
                      </WhatsAppButton>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed border-2 py-32 text-center bg-transparent max-w-2xl mx-auto">
             <CardContent className="space-y-4">
                <div className="bg-primary/5 p-6 rounded-full w-fit mx-auto">
                  <Music className="h-16 w-16 text-primary/20" aria-hidden="true" />
                </div>
                <h3 className="text-2xl font-bold font-headline uppercase">No Active Gigs Found</h3>
                <p className="text-muted-foreground">The marketplace is currently waiting for new verified listings. Check back shortly!</p>
             </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
