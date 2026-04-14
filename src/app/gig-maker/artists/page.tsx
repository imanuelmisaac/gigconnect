
"use client"

import { useState, useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { 
  Loader2, 
  Search, 
  MapPin, 
  Music, 
  ArrowLeft,
  Filter,
  Users,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { WhatsAppButton } from '@/components/whatsapp-button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const GENRES = [
  "All Genres", "Kwaito", "Kwasa", "Amapiano", "Afrobeats", "Afropop", "Pop", "Rock", "Hip Hop", "Jazz", "Classical", 
  "Electronic", "R&B", "Country", "Reggae", "Folk", "Other"
];

const PRICE_RANGES = [
  { label: "Any Price", value: 10000000 },
  { label: "Under P600", value: 600 },
  { label: "Under P800", value: 800 },
  { label: "Under P1,000", value: 1000 },
  { label: "Under P2,500", value: 2500 },
  { label: "Under P5,000", value: 5000 },
  { label: "Under P8,000", value: 8000 },
  { label: "Under P10,000", value: 10000 },
  { label: "Under P15,000", value: 15000 },
  { label: "Under P20,000", value: 20000 },
  { label: "Under P25,000", value: 25000 },
  { label: "Under P30,000", value: 30000 },
  { label: "Under P40,000", value: 40000 }
];

export default function BrowseArtistsPage() {
  const db = useFirestore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All Genres');
  const [maxPrice, setMaxPrice] = useState(10000000);

  const talentQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'artists'));
  }, [db]);

  const { data: talent, loading, error } = useCollection(talentQuery);

  const filteredTalent = useMemo(() => {
    if (!talent) return [];
    
    return talent.filter((person: any) => {
      if (!person.artistName && !person.fullName) return false;

      const name = (person.artistName || person.fullName || '').toLowerCase();
      const matchesSearch = name.includes(searchQuery.toLowerCase());
      
      const matchesGenre = selectedGenre === 'All Genres' || 
                          (person.genres && Array.isArray(person.genres) && person.genres.includes(selectedGenre));
      
      const price = Number(person.bookingPrice) || 0;
      const matchesPrice = price <= maxPrice;
      
      return matchesSearch && matchesGenre && matchesPrice;
    });
  }, [talent, searchQuery, selectedGenre, maxPrice]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/10">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Fetching professional talent...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/10 py-12 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="space-y-4">
          <Link href="/gig-maker/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-primary font-headline text-balance">Talent Marketplace</h1>
              <p className="text-muted-foreground">Find Artists and DJs for your next event.</p>
            </div>
            <Badge variant="outline" className="px-4 py-1 text-sm bg-white font-bold border-primary/20">
              {filteredTalent.length} Results Found
            </Badge>
          </div>
        </header>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load talent pool. Please try again.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1 space-y-6">
            <Card className="border-none shadow-md sticky top-24">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="h-4 w-4 text-accent" />
                  Search Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="search">Name / Stage Name</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="search" 
                      placeholder="e.g. DJ Maphorisa" 
                      className="pl-10 h-11"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Preferred Genre</Label>
                  <Select onValueChange={setSelectedGenre} defaultValue={selectedGenre}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENRES.map(genre => (
                        <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Maximum Budget (P)</Label>
                  <Select onValueChange={(val) => setMaxPrice(Number(val))} defaultValue={maxPrice.toString()}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select max price" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRICE_RANGES.map(range => (
                        <SelectItem key={range.value} value={range.value.toString()}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground mt-1">Filtering by specified price points</p>
                </div>
              </CardContent>
              <CardFooter className="pt-0 border-t mt-4">
                <Button 
                  variant="ghost" 
                  className="w-full text-xs text-muted-foreground mt-4"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedGenre('All Genres');
                    setMaxPrice(10000000);
                  }}
                >
                  Clear All Filters
                </Button>
              </CardFooter>
            </Card>
          </aside>

          <div className="lg:col-span-3">
            {filteredTalent.length > 0 ? (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredTalent.map((person: any) => (
                  <Card key={person.id} className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group slide-up">
                    <div className="h-20 bg-gradient-to-br from-primary/80 to-accent/80" />
                    <CardHeader className="relative pt-0 flex flex-col items-center">
                      <div className="flex justify-center -mt-10 mb-3">
                        <Avatar className="h-20 w-20 border-4 border-white shadow-md">
                          <AvatarImage src={person.profilePictureUrl} />
                          <AvatarFallback className="bg-secondary text-primary font-bold text-xl">
                            {(person.artistName || person.fullName || 'AR').substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <CardTitle className="text-xl font-headline text-center group-hover:text-primary transition-colors line-clamp-1">
                        {person.artistName || person.fullName}
                      </CardTitle>
                      <div className="flex items-center text-xs text-muted-foreground gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {person.location || 'Location unknown'}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4 text-center">
                      <div className="flex flex-wrap justify-center gap-1.5 min-h-[24px]">
                        {person.genres && Array.isArray(person.genres) && person.genres.length > 0 ? (
                          person.genres.map((genre: string) => (
                            <Badge key={genre} variant="secondary" className="text-[10px] py-0 px-2">
                              {genre}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">No genres listed</span>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-3 italic px-2 min-h-[60px]">
                        "{person.bio || 'Professional talent ready for booking.'}"
                      </p>

                      <div className="flex items-center justify-center gap-4 pt-2 border-t">
                        <div className="text-center">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Booking</p>
                          <p className="font-bold text-green-600">P{Number(person.bookingPrice || 0).toLocaleString()}</p>
                        </div>
                        <div className="h-8 w-px bg-border" />
                        <div className="text-center">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Features</p>
                          <p className="font-bold text-primary">{person.featurePrice ? `P${Number(person.featurePrice).toLocaleString()}` : 'N/A'}</p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-muted/30 pt-4 gap-2">
                      <WhatsAppButton 
                        phoneNumber={person.whatsappNumber || ''}
                        message={`Hi ${person.artistName || person.fullName}, I saw your profile on GigConnect and I'm interested in booking you.`}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white border-none font-bold"
                        disabled={!person.whatsappNumber}
                      >
                        Contact Talent
                      </WhatsAppButton>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-2 py-32 text-center bg-transparent">
                <CardContent className="space-y-4">
                  <div className="bg-primary/5 p-4 rounded-full w-fit mx-auto">
                    <Users className="h-12 w-12 text-primary/20" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">No talent matches your criteria</h2>
                    <p className="text-muted-foreground max-w-xs mx-auto">Try adjusting your filters or genre selection.</p>
                  </div>
                  <Button variant="outline" className="mt-4" onClick={() => {
                    setSearchQuery('');
                    setSelectedGenre('All Genres');
                    setMaxPrice(10000000);
                  }}>
                    Clear all filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
