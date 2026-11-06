
"use client"

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, query, doc, setDoc, serverTimestamp, collectionGroup, where, Timestamp } from 'firebase/firestore';
import { 
  Loader2, 
  Search, 
  MapPin, 
  Music, 
  ArrowLeft,
  Filter,
  Sparkles,
  Send,
  Crown,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import Link from 'next/link';

const GENRES = ["All Genres", "Motswako", "Amapiano", "Kwaito", "Kwasa Kwasa", "Afrobeats", "Afro-house", "Gqom", "Hip Hop", "Jazz", "Gospel", "RnB", "Reggae", "Dancehall", "Pop", "Rock", "Traditional", "Other"];

const SUBSCRIPTION_LIMITS = {
  free: { features: 3, label: "Free Tier" },
  package2: { features: 10, label: "Essential Pro" },
  package3: { features: 999, label: "Standard Pro" },
  package4: { features: 9999, label: "Ultimate Pro" }
};

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

  const artistProfileRef = useMemo(() => user ? doc(db, 'artists', user.uid) : null, [db, user]);
  const { data: artistProfile } = useDoc(artistProfileRef);

  const startOfMonth = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return Timestamp.fromDate(d);
  }, []);

  const sentFeaturesQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collectionGroup(db, 'features'),
      where('senderId', '==', user.uid)
    );
  }, [db, user]);

  const { data: rawSentFeatures } = useCollection(sentFeaturesQuery);

  const monthlyFeatureCount = useMemo(() => {
    if (!rawSentFeatures) return 0;
    return rawSentFeatures.filter((feat: any) => 
      feat.createdAt && (feat.createdAt.seconds >= startOfMonth.seconds)
    ).length;
  }, [rawSentFeatures, startOfMonth]);

  const tierKey = (artistProfile?.subscriptionTier as keyof typeof SUBSCRIPTION_LIMITS) || 'free';
  const limits = SUBSCRIPTION_LIMITS[tierKey];
  const isLimitReached = monthlyFeatureCount >= limits.features;

  const talentQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'artists'));
  }, [db]);

  const { data: talent, loading } = useCollection(talentQuery);

  const filteredTalent = useMemo(() => {
    if (!talent || !user) return [];
    return talent.filter((person: any) => {
      if (person.userId === user.uid) return false;
      const name = (person.artistName || person.fullName || '').toLowerCase();
      const matchesSearch = name.includes(searchQuery.toLowerCase());
      const matchesGenre = selectedGenre === 'All Genres' || (person.genres && person.genres.includes(selectedGenre));
      return matchesSearch && matchesGenre;
    });
  }, [talent, searchQuery, selectedGenre, user]);

  const handleApplyFeature = async () => {
    if (!user || !db || !targetArtist || !artistProfile) return;
    if (isLimitReached) return;
    
    setSubmitting(true);
    const featureRef = doc(db, 'artists', targetArtist.userId, 'features', user.uid);
    const featureData = {
      requestId: user.uid,
      senderId: user.uid,
      senderName: artistProfile.artistName || 'Unknown',
      senderGenres: artistProfile.genres || [],
      senderWhatsapp: artistProfile.whatsappNumber || '',
      targetId: targetArtist.userId,
      targetName: targetArtist.artistName || 'Unknown',
      message: message,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    setDoc(featureRef, featureData)
      .then(() => {
        toast({ title: "Request Sent!", description: `Success! Request sent to ${targetArtist.artistName}.` });
        setIsDialogOpen(false);
        setMessage('');
      })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: featureRef.path,
          operation: 'create',
          requestResourceData: featureData
        } satisfies SecurityRuleContext));
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
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <Link href="/artist/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
            <h1 className="text-4xl font-bold text-primary font-headline uppercase">Find Features</h1>
            <p className="text-muted-foreground">Collaborate with local Batswana artists.</p>
          </div>
          <Card className="bg-white p-4 border-none shadow-sm flex items-center gap-4">
             <div className="text-right">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Feature Quota</p>
                <p className="text-xl font-black text-primary">{monthlyFeatureCount} / {limits.features > 1000 ? '∞' : limits.features}</p>
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

        <div className="grid lg:grid-cols-4 gap-8">
          <Card className="lg:col-span-1 border-none shadow-md h-fit sticky top-6">
            <CardHeader><CardTitle className="text-lg">Filters</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Search Artist</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Genre</Label>
                <Select onValueChange={setSelectedGenre} defaultValue={selectedGenre}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{GENRES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-3">
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTalent.map((person: any) => (
                <Card key={person.userId} className="border-none shadow-sm hover:shadow-md transition-all flex flex-col group">
                  <div className="h-16 bg-gradient-to-br from-primary/80 to-accent/80" />
                  <CardHeader className="pt-0 flex flex-col items-center">
                    <Avatar className="h-16 w-16 border-4 border-white -mt-8 mb-2">
                      <AvatarImage src={person.profilePictureUrl} />
                      <AvatarFallback className="bg-secondary text-primary font-bold">{person.artistName?.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-lg font-headline">{person.artistName}</CardTitle>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">{person.location}</p>
                  </CardHeader>
                  <CardContent className="flex-1 text-center space-y-2">
                    <div className="flex flex-wrap justify-center gap-1">
                      {person.genres?.slice(0, 2).map((g: string) => <Badge key={g} variant="secondary" className="text-[8px] py-0">{g}</Badge>)}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 italic px-2">"{person.bio || 'Available for collabs.'}"</p>
                    <p className="text-sm font-bold text-accent pt-2">P{person.featurePrice || 0} / Feature</p>
                  </CardContent>
                  <CardFooter className="bg-muted/30 pt-4">
                    <Button 
                      className="w-full font-bold gap-2" 
                      disabled={isLimitReached}
                      onClick={() => {
                        setTargetArtist(person);
                        setIsDialogOpen(true);
                      }}
                    >
                      {isLimitReached ? <><Lock className="h-4 w-4" /> Limit Reached</> : <><Sparkles className="h-4 w-4" /> Request</>}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Feature from {targetArtist?.artistName}</DialogTitle>
            <DialogDescription>Monthly features used: {monthlyFeatureCount + 1} / {limits.features}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Message / Pitch</Label>
              <Textarea placeholder="What's the project idea?" value={message} onChange={(e) => setMessage(e.target.value)} className="min-h-[120px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button className="bg-accent text-white" onClick={handleApplyFeature} disabled={submitting || !message}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
