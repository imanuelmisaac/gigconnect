
"use client"

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, query, doc, setDoc, serverTimestamp, where } from 'firebase/firestore';
import { 
  Loader2, 
  Search, 
  MapPin, 
  Music, 
  ArrowLeft,
  Filter,
  Sparkles,
  Users,
  Send,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const GENRES = [
  "All Genres", "Amapiano", "Afrobeats", "Afropop", "Pop", "Rock", "Hip Hop", "Jazz", "Electronic", "R&B", "Reggae"
];

export default function FindFeaturesPage() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All Genres');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [targetArtist, setTargetArtist] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: myProfile } = useDoc(user ? doc(db, 'artists', user.uid) : null);

  const talentQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'artists'));
  }, [db]);

  const { data: talent, loading } = useCollection(talentQuery);

  const filteredTalent = useMemo(() => {
    if (!talent || !user) return [];
    
    return talent.filter((person: any) => {
      // Don't show myself
      if (person.userId === user.uid) return false;
      if (!person.artistName && !person.fullName) return false;

      const name = (person.artistName || person.fullName || '').toLowerCase();
      const matchesSearch = name.includes(searchQuery.toLowerCase());
      
      const matchesGenre = selectedGenre === 'All Genres' || 
                          (person.genres && person.genres.includes(selectedGenre));
      
      return matchesSearch && matchesGenre;
    });
  }, [talent, searchQuery, selectedGenre, user]);

  const handleApplyFeature = async () => {
    if (!user || !db || !targetArtist || !myProfile) return;
    setSubmitting(true);

    const featureRef = doc(db, 'artists', targetArtist.userId, 'features', user.uid);
    const featureData = {
      requestId: user.uid,
      senderId: user.uid,
      senderName: myProfile.artistName || 'Unknown Artist',
      senderGenres: myProfile.genres || [],
      senderWhatsapp: myProfile.whatsappNumber || '',
      message: message,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    setDoc(featureRef, featureData)
      .then(() => {
        toast({
          title: "Request Sent!",
          description: `Feature request sent to ${targetArtist.artistName}.`,
        });
        setIsDialogOpen(false);
        setMessage('');
        setTargetArtist(null);
      })
      .catch((err) => {
        const error = new FirestorePermissionError({
          path: featureRef.path,
          operation: 'create',
          requestResourceData: featureData
        });
        errorEmitter.emit('permission-error', error);
      })
      .finally(() => setSubmitting(false));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/10">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/10 py-12 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="space-y-4">
          <Link href="/artist/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-primary font-headline">Find Collaborations</h1>
              <p className="text-muted-foreground">Discover other artists for features and sets.</p>
            </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-4 gap-8">
          <Card className="lg:col-span-1 border-none shadow-md h-fit sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-4 w-4" /> Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Search Artist</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by name..." 
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Genre</Label>
                <Select onValueChange={setSelectedGenre} defaultValue={selectedGenre}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select genre" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENRES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-3">
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTalent.map((person: any) => (person.featurePrice !== null && (
                <Card key={person.id} className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group">
                  <div className="h-20 bg-gradient-to-br from-primary to-accent opacity-80" />
                  <CardHeader className="relative pt-0 flex flex-col items-center">
                    <Avatar className="h-16 w-16 border-4 border-white shadow-md -mt-8 mb-2">
                      <AvatarImage src={person.profilePictureUrl} />
                      <AvatarFallback className="bg-secondary text-primary font-bold">
                        {person.artistName?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-lg font-headline text-center">{person.artistName}</CardTitle>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {person.location}
                    </p>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-3 text-center">
                    <div className="flex flex-wrap justify-center gap-1">
                      {person.genres?.slice(0, 3).map((g: string) => (
                        <Badge key={g} variant="secondary" className="text-[9px] py-0">{g}</Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 italic px-2">
                      "{person.bio || 'Available for collaboration.'}"
                    </p>
                    <div className="pt-2 border-t flex justify-center">
                      <p className="text-sm font-bold text-accent">Feature Price: P{person.featurePrice}</p>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/30 pt-4">
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 text-white font-bold gap-2"
                      onClick={() => {
                        setTargetArtist(person);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Sparkles className="h-4 w-4" />
                      Request Feature
                    </Button>
                  </CardFooter>
                </Card>
              )))}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              Collaboration Request
            </DialogTitle>
            <DialogDescription>
              Request a feature from <span className="font-bold text-primary">{targetArtist?.artistName}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Pitch your idea</Label>
              <Textarea 
                placeholder="What kind of collaboration are you looking for?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
            <div className="bg-secondary/20 p-4 rounded-lg text-xs text-muted-foreground">
              Note: This will send your profile and contact details to the artist.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button 
              className="bg-accent text-white font-bold gap-2" 
              onClick={handleApplyFeature}
              disabled={submitting || !message}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Send Request</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
