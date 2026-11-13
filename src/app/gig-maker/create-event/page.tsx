'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarIcon, MapPin, Users, Loader2, ArrowLeft, CreditCard, MessageSquare, CheckCircle2, Star, Sparkles, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { WhatsAppButton } from '@/components/whatsapp-button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const GENRES = [
  "Motswako", "Amapiano", "Kwaito", "Kwasa Kwasa", "Afrobeats", "Afro-house", "Gqom", 
  "Hip Hop", "Jazz", "Gospel", "RnB", "Reggae", "Dancehall", "Pop", "Rock", "Traditional", "Other"
];

export default function CreateEventPage() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [hasSentScreenshot, setHasSentScreenshot] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    date: '',
    applicationDeadline: '',
    maxApplicants: '',
    minPrice: '',
    maxPrice: '',
    experienceLevel: 'Upcoming',
    genres: [] as string[],
  });

  const { data: systemConfig } = useDoc(doc(db, 'system', 'config'));
  const currentFee = useMemo(() => {
    const base = systemConfig?.eventFee || 25;
    const discount = (systemConfig?.specialActive && systemConfig?.specialDiscount) ? systemConfig.specialDiscount : 0;
    return Math.floor(base * (1 - discount / 100));
  }, [systemConfig]);

  const proArtistsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'artists'), where('subscriptionTier', '==', 'package4'));
  }, [db]);

  const { data: proArtists } = useCollection(proArtistsQuery);

  const matchedArtists = useMemo(() => {
    if (!proArtists || formData.genres.length === 0) return [];
    return proArtists.filter((artist: any) => 
      artist.genres?.some((g: string) => formData.genres.includes(g))
    ).slice(0, 3);
  }, [proArtists, formData.genres]);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleGenreChange = (genre: string) => {
    setFormData((prev) => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter((g) => g !== genre)
        : [...prev.genres, genre],
    }));
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.genres.length === 0) {
      toast({ variant: "destructive", title: "Missing Genres", description: "Please select at least one genre for your event." });
      return;
    }
    setShowPaymentModal(true);
  };

  const handleFinalPublish = async () => {
    if (!user || !db) return;
    setLoading(true);
    try {
      const eventRef = doc(collection(db, 'events'));
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const eventData = {
        eventId: eventRef.id,
        gigMakerId: user.uid,
        title: formData.title,
        description: formData.description,
        location: formData.location,
        date: formData.date,
        applicationDeadline: formData.applicationDeadline,
        maxApplicants: Number(formData.maxApplicants),
        minPrice: Number(formData.minPrice),
        maxPrice: Number(formData.maxPrice),
        experienceLevel: formData.experienceLevel,
        genres: formData.genres,
        status: 'Open',
        paymentStatus: 'Complete', 
        listingExpiresAt: expiresAt.toISOString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(eventRef, eventData);
      toast({ title: "Event Published!", description: "Your gig is now visible to all verified talent." });
      setShowPaymentModal(false);
      setShowSuggestions(true);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Publication Failed", description: error.message });
      setLoading(false);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/10">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/10 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link href="/gig-maker/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Link>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-primary font-headline">Create New Event</h1>
          <p className="text-muted-foreground">Fill in the details to find the perfect talent for your gig.</p>
        </div>
        <form onSubmit={handlePreSubmit}>
          <div className="grid gap-6">
            <Card className="border-none shadow-md">
              <CardHeader><CardTitle className="text-xl">General Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Name</Label>
                  <Input id="title" required value={formData.title} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" className="min-h-[120px]" required value={formData.description} onChange={handleInputChange} />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <div className="relative"><MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input id="location" className="pl-10" required value={formData.location} onChange={handleInputChange} /></div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Event Date</Label>
                    <div className="relative"><CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input id="date" type="date" className="pl-10" required value={formData.date} onChange={handleInputChange} /></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardHeader><CardTitle className="text-xl">Requirements & Budget</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="applicationDeadline">Application Deadline</Label>
                    <Input id="applicationDeadline" type="date" required value={formData.applicationDeadline} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxApplicants">Max Applicants</Label>
                    <div className="relative"><Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input id="maxApplicants" type="number" className="pl-10" required value={formData.maxApplicants} onChange={handleInputChange} /></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Required Genres</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {GENRES.map(genre => (
                      <div key={genre} className="flex items-center space-x-2 bg-background p-2 rounded-md border border-input">
                        <Checkbox id={`genre-${genre}`} checked={formData.genres.includes(genre)} onCheckedChange={() => handleGenreChange(genre)} />
                        <Label htmlFor={`genre-${genre}`} className="cursor-pointer font-medium text-xs">{genre}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minPrice">Minimum Budget (P)</Label>
                    <div className="relative"><span className="absolute left-3 top-2.5 text-muted-foreground font-bold">P</span><Input id="minPrice" type="number" className="pl-8" required value={formData.minPrice} onChange={handleInputChange} /></div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxPrice">Maximum Budget (P)</Label>
                    <div className="relative"><span className="absolute left-3 top-2.5 text-muted-foreground font-bold">P</span><Input id="maxPrice" type="number" className="pl-8" required value={formData.maxPrice} onChange={handleInputChange} /></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4 pb-12">
              <Button type="submit" className="px-8 bg-primary">Proceed to Payment</Button>
            </div>
          </div>
        </form>
      </div>

      <Dialog open={showPaymentModal} onOpenChange={(open) => { setShowPaymentModal(open); if (!open) setHasSentScreenshot(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary"><CreditCard className="h-6 w-6" /> Event Creation Fee: P{currentFee}</DialogTitle>
            <DialogDescription>
              {systemConfig?.specialActive && (
                <Badge className="bg-accent mb-2 gap-1"><Tag className="h-3 w-3" /> {systemConfig.specialName} Discount Applied!</Badge>
              )}
              <br />Complete the payment to publish.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="bg-secondary/30 p-4 rounded-xl space-y-3 text-sm">
              <div className="flex items-center justify-between border-b pb-2"><span>MyZaka</span><span className="font-bold text-primary">74266208</span></div>
              <div className="flex items-center justify-between border-b pb-2"><span>Orange Money</span><span className="font-black text-primary">76479543</span></div>
            </div>
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-3">
              <WhatsAppButton phoneNumber="+26774266208" message={`Hi, I've just paid P{currentFee} for my event "${formData.title}".`} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-9" size="sm" onClick={() => {
                setHasSentScreenshot(true);
                toast({ title: "WhatsApp Redirect", description: "Send your payment confirmation to the admin." });
              }}>Send Screenshot</WhatsAppButton>
              {hasSentScreenshot && <p className="text-[10px] text-green-600 font-bold text-center">Screenshot sent. You can now publish.</p>}
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
            <Button className="bg-primary flex-1" onClick={handleFinalPublish} disabled={loading || !hasSentScreenshot}>{loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Publish Now</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuggestions} onOpenChange={(open) => { if (!open) router.push('/gig-maker/dashboard'); setShowSuggestions(open); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-accent text-2xl font-headline"><Sparkles className="h-6 w-6" /> Perfect Match Found!</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-6">
            {matchedArtists.length > 0 ? matchedArtists.map((artist: any) => (
              <Card key={artist.id} className="border-2 border-accent/20 bg-accent/5 overflow-hidden">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-accent"><AvatarImage src={artist.profilePictureUrl} /><AvatarFallback>{artist.artistName?.substring(0, 2)}</AvatarFallback></Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2"><h4 className="font-bold text-lg text-primary">{artist.artistName}</h4><Badge className="bg-accent text-[9px] uppercase"><Star className="h-2 w-2 mr-1" /> PRO</Badge></div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{artist.bio || 'Professional talent.'}</p>
                    </div>
                  </div>
                  <WhatsAppButton phoneNumber={artist.whatsappNumber || ''} message={`Hi ${artist.artistName}, I just created an event "${formData.title}" and you were recommended.`} size="sm" className="bg-accent hover:bg-accent/90 text-white font-bold">Contact Now</WhatsAppButton>
                </CardContent>
              </Card>
            )) : <p className="text-center text-xs text-muted-foreground">No featured matches found for these genres.</p>}
          </div>
          <DialogFooter><Button className="w-full bg-primary" onClick={() => router.push('/gig-maker/dashboard')}>Go to Dashboard</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}