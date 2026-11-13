
'use client';

import { useMemo, useState } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { 
  Loader2, 
  Calendar, 
  MapPin, 
  Search, 
  Ticket, 
  Users, 
  Heart,
  TrendingUp,
  Music
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Navbar } from '@/components/navbar';
import { WhatsAppButton } from '@/components/whatsapp-button';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function BuyTicketsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const eventsQuery = useMemo(() => {
    if (!db) return null;
    // Simplified query for public ticketing
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
        const dateA = a.date || '';
        const dateB = b.date || '';
        return dateA.localeCompare(dateB);
      });
  }, [rawEvents, searchTerm]);

  const handleToggleInterest = async (event: any) => {
    if (!user) {
      toast({
        title: "Interested?",
        description: "Log in or register to follow events and save your interests.",
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
        description: isInterested ? "You are no longer following this event." : "You're now tracking this event!",
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not update interest.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-secondary/10">
      <Navbar />
      <main className="container mx-auto py-12 px-4 max-w-7xl">
        <header className="mb-12 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-wider">
                <TrendingUp className="h-3 w-3" /> Upcoming Events
              </div>
              <h1 className="text-4xl lg:text-5xl font-extrabold text-primary font-headline uppercase tracking-tighter text-balance">Ticket Hub</h1>
              <p className="text-muted-foreground text-lg max-w-xl">Find your next night out. Buy tickets directly from organizers via WhatsApp.</p>
            </div>
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search events or venues..." 
                className="pl-10 h-12 border-none shadow-sm bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse">Loading events...</p>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event: any) => {
              const interestCount = event.interestedUsers?.length || 0;
              const isInterested = user && event.interestedUsers?.includes(user.uid);

              return (
                <Card key={event.id} className="border-none shadow-md hover:shadow-xl transition-all overflow-hidden flex flex-col group slide-up">
                  <div className="h-2 bg-accent group-hover:bg-primary transition-colors" />
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest">{event.experienceLevel}</Badge>
                      <div className="flex items-center gap-1.5 text-accent font-bold">
                        <Users className="h-3.5 w-3.5" />
                        <span className="text-xs">{interestCount} Interested</span>
                      </div>
                    </div>
                    <CardTitle className="text-xl font-headline group-hover:text-primary transition-colors">{event.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-6">
                    <div className="grid gap-3 text-xs text-muted-foreground font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" /> {event.date}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" /> {event.location}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {event.genres?.map((g: string) => (
                        <Badge key={g} variant="outline" className="text-[9px] py-0 border-accent/20 text-accent">{g}</Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3 italic">
                      &quot;{event.description || 'Don\'t miss out on this event!'}&quot;
                    </p>
                  </CardContent>
                  <CardFooter className="bg-muted/30 pt-6 gap-2">
                    <Button 
                      variant="outline" 
                      className={`flex-1 font-bold gap-2 ${isInterested ? 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100' : 'text-muted-foreground'}`}
                      onClick={() => handleToggleInterest(event)}
                    >
                      <Heart className={`h-4 w-4 ${isInterested ? 'fill-red-500' : ''}`} />
                      {isInterested ? 'Interested' : 'Interest'}
                    </Button>
                    <WhatsAppButton 
                      phoneNumber={event.ticketWhatsApp || ''} 
                      message={`Hi, I'm interested in buying tickets for "${event.title}" on ${event.date}. Saw this on GigConnect.`}
                      className="flex-1 bg-accent hover:bg-accent/90 text-white font-bold gap-2"
                      disabled={!event.ticketWhatsApp}
                    >
                      <Ticket className="h-4 w-4" /> Buy Ticket
                    </WhatsAppButton>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed border-2 py-32 text-center bg-transparent max-w-2xl mx-auto">
             <CardContent className="space-y-4">
                <div className="bg-accent/5 p-6 rounded-full w-fit mx-auto">
                  <Music className="h-16 w-16 text-accent/20" />
                </div>
                <h3 className="text-2xl font-bold font-headline uppercase">No Events Scheduled</h3>
                <p className="text-muted-foreground">Check back later for upcoming shows and ticket sales.</p>
             </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
