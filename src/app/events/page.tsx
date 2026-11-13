"use client"

import { useMemo, useState } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { 
  Loader2, 
  Calendar, 
  MapPin, 
  Search, 
  Filter,
  Music,
  ArrowRight,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Navbar } from '@/components/navbar';
import Link from 'next/link';

export default function PublicEventsPage() {
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');

  const eventsQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'events'),
      where('status', '==', 'Open'),
      where('paymentStatus', '==', 'Complete'),
      orderBy('createdAt', 'desc')
    );
  }, [db]);

  const { data: events, loading } = useCollection(eventsQuery);

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    return events.filter((e: any) => 
      e.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [events, searchTerm]);

  return (
    <div className="min-h-screen bg-secondary/10">
      <Navbar />
      <main className="container mx-auto py-12 px-4 max-w-7xl">
        <header className="mb-12 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                <TrendingUp className="h-3 w-3" /> Live Gigs
              </div>
              <h1 className="text-4xl lg:text-5xl font-extrabold text-primary font-headline uppercase tracking-tighter">Event Marketplace</h1>
              <p className="text-muted-foreground text-lg max-w-xl">Verified performances and opportunities for Batswana talent.</p>
            </div>
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search by venue or gig name..." 
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
            <p className="text-muted-foreground animate-pulse">Syncing marketplace data...</p>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event: any) => (
              <Card key={event.id} className="border-none shadow-md hover:shadow-xl transition-all overflow-hidden flex flex-col slide-up group">
                <div className="h-2 bg-primary group-hover:bg-accent transition-colors" />
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest">{event.experienceLevel}</Badge>
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
                      <Calendar className="h-4 w-4 text-primary" /> {event.date}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" /> {event.location}
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
                <CardFooter className="bg-muted/30 pt-6">
                  <Link href="/login" className="w-full">
                    <Button className="w-full font-bold uppercase tracking-widest gap-2 bg-primary">
                      Apply to Perform <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2 py-32 text-center bg-transparent max-w-2xl mx-auto">
             <CardContent className="space-y-4">
                <div className="bg-primary/5 p-6 rounded-full w-fit mx-auto">
                  <Music className="h-16 w-16 text-primary/20" />
                </div>
                <h3 className="text-2xl font-bold font-headline uppercase">No Active Gigs Found</h3>
                <p className="text-muted-foreground">The marketplace is currently waiting for new verified listings. Check back shortly!</p>
                <Link href="/gig-maker/create-event">
                  <Button variant="outline" className="font-bold gap-2 mt-4">
                    Host an Event <CreditCard className="h-4 w-4" />
                  </Button>
                </Link>
             </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
