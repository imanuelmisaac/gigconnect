
"use client"

import { useState, useMemo, useEffect } from 'react';
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
import { Slider } from '@/components/ui/slider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { WhatsAppButton } from '@/components/whatsapp-button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const GENRES = [
  "All Genres", "Pop", "Rock", "Hip Hop", "Jazz", "Classical", 
  "Electronic", "R&B", "Country", "Reggae", "Folk"
];

// Increased max price range to accommodate high-value bookings
const MAX_PRICE_LIMIT = 20000;

export default function BrowseArtistsPage() {
  const db = useFirestore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All Genres');
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE_LIMIT);

  const artistsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'artists'));
  }, [db]);

  const { data: artists, loading, error } = useCollection(artistsQuery);

  const filteredArtists = useMemo(() => {
    if (!artists) return [];
    
    return artists.filter((artist: any) => {
      // Basic profile requirement check - ensure we at least have a name
      if (!artist.artistName && !artist.fullName) return false;

      const artistName = (artist.artistName || artist.fullName || '').toLowerCase();
      const matchesSearch = artistName.includes(searchQuery.toLowerCase());
      
      const matchesGenre = selectedGenre === 'All Genres' || 
                          (artist.genres && Array.isArray(artist.genres) && artist.genres.includes(selectedGenre));
      
      // Handle numeric comparison safely
      const price = Number(artist.bookingPrice) || 0;
      const matchesPrice = price <= maxPrice;
      
      return matchesSearch && matchesGenre && matchesPrice;
    });
  }, [artists, searchQuery, selectedGenre, maxPrice]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/10">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Fetching talent pool...</p>
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
              <h1 className="text-4xl font-bold text-primary font-headline text-balance">Browse Artists</h1>
              <p className="text-muted-foreground">Find the perfect talent for your next event.</p>
            </div>
            <Badge variant="outline" className="px-4 py-1 text-sm bg-white font-bold border-primary/20">
              {filteredArtists.length} Artists Available
            </Badge>
          </div>
        </header>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load artists. Please check your internet connection and try again.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            <Card className="border-none shadow-md sticky top-24">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="h-4 w-4 text-accent" />
                  Filter Talent
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="search">Search Name</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="search" 
                      placeholder="Artist or stage name..." 
                      className="pl-10 h-11"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Genre</Label>
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

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Max Budget</Label>
                    <Badge variant="secondary" className="font-bold text-primary">${maxPrice.toLocaleString()}</Badge>
                  </div>
                  <Slider 
                    value={[maxPrice]} 
                    max={MAX_PRICE_LIMIT} 
                    min={0}
                    step={100}
                    onValueChange={(vals) => setMaxPrice(vals[0])}
                  />
                  <p className="text-[10px] text-muted-foreground text-center">Slide to adjust your booking budget</p>
                </div>
              </CardContent>
              <CardFooter className="pt-0 border-t mt-4">
                <Button 
                  variant="ghost" 
                  className="w-full text-xs text-muted-foreground mt-4"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedGenre('All Genres');
                    setMaxPrice(MAX_PRICE_LIMIT);
                  }}
                >
                  Clear All Filters
                </Button>
              </CardFooter>
            </Card>
          </aside>

          {/* Artist Grid */}
          <div className="lg:col-span-3">
            {filteredArtists.length > 0 ? (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredArtists.map((artist: any) => (
                  <Card key={artist.id} className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group slide-up">
                    <div className="h-20 bg-gradient-to-br from-primary/80 to-accent/80" />
                    <CardHeader className="relative pt-0 flex flex-col items-center">
                      <div className="flex justify-center -mt-10 mb-3">
                        <Avatar className="h-20 w-20 border-4 border-white shadow-md">
                          <AvatarImage src={artist.profilePictureUrl} />
                          <AvatarFallback className="bg-secondary text-primary font-bold text-xl">
                            {(artist.artistName || artist.fullName || 'AR').substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <CardTitle className="text-xl font-headline text-center group-hover:text-primary transition-colors line-clamp-1">
                        {artist.artistName || artist.fullName}
                      </CardTitle>
                      <div className="flex items-center text-xs text-muted-foreground gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {artist.location || 'Location unknown'}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4 text-center">
                      <div className="flex flex-wrap justify-center gap-1.5 min-h-[24px]">
                        {artist.genres && Array.isArray(artist.genres) && artist.genres.length > 0 ? (
                          artist.genres.map((genre: string) => (
                            <Badge key={genre} variant="secondary" className="text-[10px] py-0 px-2">
                              {genre}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">No genres listed</span>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-3 italic px-2 min-h-[60px]">
                        "{artist.bio || 'Professional artist ready for booking.'}"
                      </p>

                      <div className="flex items-center justify-center gap-4 pt-2 border-t">
                        <div className="text-center">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Booking</p>
                          <p className="font-bold text-green-600">${Number(artist.bookingPrice || 0).toLocaleString()}</p>
                        </div>
                        <div className="h-8 w-px bg-border" />
                        <div className="text-center">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Features</p>
                          <p className="font-bold text-primary">${artist.featurePrice ? Number(artist.featurePrice).toLocaleString() : 'N/A'}</p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-muted/30 pt-4 gap-2">
                      <WhatsAppButton 
                        phoneNumber={artist.whatsappNumber || ''}
                        message={`Hi ${artist.artistName || artist.fullName}, I saw your profile on GigConnect and I'm interested in booking you for an upcoming event.`}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white border-none font-bold"
                        disabled={!artist.whatsappNumber}
                      >
                        Contact
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
                    <h2 className="text-xl font-bold">No artists match your criteria</h2>
                    <p className="text-muted-foreground max-w-xs mx-auto">Try adjusting your filters or expanding your budget range.</p>
                  </div>
                  <Button variant="outline" className="mt-4" onClick={() => {
                    setSearchQuery('');
                    setSelectedGenre('All Genres');
                    setMaxPrice(MAX_PRICE_LIMIT);
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
