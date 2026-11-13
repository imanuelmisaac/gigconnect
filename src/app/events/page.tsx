"use client"

import { useMemo, useState } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where, doc, updateDoc, arrayUnion } from 'firebase/firestore';
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
  Ticket,
  CheckCircle2,
  Mail,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Navbar } from '@/components/navbar';
import { useToast } from '@/hooks/use-toast';
import { WhatsAppButton } from '@/components/whatsapp-button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

export default function PublicEventsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  // Interest Dialog States
  const [showInterestDialog, setShowInterestDialog] = useState(false);
  const [interestEmail, setInterestEmail] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [submittingInterest, setSubmittingInterest] = useState(false);
  const [interestSuccess, setInterestSubmitted] = useState(false);

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

  const handleOpenInterest = (event: any) => {
    setSelectedEvent(event);
    setInterestEmail(user?.email || '');
    setInterestSubmitted(false);
    setShowInterestDialog(true);
  };

  const handleConfirmInterest = async () => {
    if (!interestEmail || !selectedEvent) return;
    setSubmittingInterest(true);
    
    try {
      const eventId = selectedEvent.id || selectedEvent.eventId;
      const eventRef = doc(db, 'events', eventId);
      
      await updateDoc(eventRef, {
        interestedUsers: arrayUnion(interestEmail)
      });
      
      setInterestSubmitted(true);
      toast({ title: "Interest Logged", description: "You've been added to the event list!" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: "Failed to register interest." });
    } finally {
      setSubmittingInterest(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary/10">
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
              const isInterestedInCard = interestSuccess && selectedEvent?.id === event.id;

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
                        className={`px-3 ${isInterestedInCard ? 'text-red-500' : 'text-muted-foreground hover:text-primary'}`}
                        onClick={() => handleOpenInterest(event)}
                        aria-label="Express interest"
                      >
                        <Heart className={`h-4 w-4 ${isInterestedInCard ? 'fill-red-500' : ''}`} aria-hidden="true" />
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

      <Dialog open={showInterestDialog} onOpenChange={setShowInterestDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {interestSuccess ? <CheckCircle2 className="h-6 w-6 text-green-500" /> : <Heart className="h-6 w-6 text-primary" />}
              {interestSuccess ? "Interest Received!" : "Interested in this gig?"}
            </DialogTitle>
            <DialogDescription>
              {interestSuccess 
                ? "Confirmation has been sent to your email. You can now contact the organizer directly."
                : "No account needed. Enter your email to show interest and unlock the direct contact details for this event."}
            </DialogDescription>
          </DialogHeader>
          
          {!interestSuccess ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="event-interest-email">Email Address</Label>
                <Input 
                  id="event-interest-email" 
                  type="email" 
                  placeholder="you@example.com" 
                  value={interestEmail}
                  onChange={(e) => setInterestEmail(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>
          ) : (
            <div className="py-6 space-y-4">
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center text-white">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Organizer WhatsApp</p>
                  <p className="font-bold text-primary">{selectedEvent?.ticketWhatsApp || "Available in Chat"}</p>
                </div>
              </div>
              <WhatsAppButton 
                phoneNumber={selectedEvent?.ticketWhatsApp || ''} 
                message={`Hi, I'm interested in "${selectedEvent?.title}" saw it on GigConnect!`}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12"
              />
            </div>
          )}

          <DialogFooter className="gap-2">
            {!interestSuccess ? (
              <>
                <Button variant="ghost" onClick={() => setShowInterestDialog(false)}>Later</Button>
                <Button 
                  className="bg-primary hover:bg-primary/90 flex-1 font-bold" 
                  onClick={handleConfirmInterest}
                  disabled={!interestEmail || submittingInterest}
                >
                  {submittingInterest ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                  Register Interest
                </Button>
              </>
            ) : (
              <Button variant="outline" className="w-full" onClick={() => setShowInterestDialog(false)}>Done</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
