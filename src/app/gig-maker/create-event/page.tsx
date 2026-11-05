
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarIcon, MapPin, Users, Briefcase, Loader2, ArrowLeft, CreditCard, MessageSquare, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { WhatsAppButton } from '@/components/whatsapp-button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const GENRES = [
  "Kwaito", "Kwasa", "Amapiano", "Afrobeats", "Afropop", "Pop", "Rock", "Hip Hop", "Jazz", "Classical", 
  "Electronic", "R&B", "Country", "Reggae", "Folk", "Other"
];

export default function CreateEventPage() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
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

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, experienceLevel: value }));
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
      toast({
        variant: "destructive",
        title: "Missing Genres",
        description: "Please select at least one genre.",
      });
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
      const expiresAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days from now

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
        paymentStatus: 'Complete', // Optimistically complete as per instructions
        listingExpiresAt: expiresAt.toISOString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(eventRef, eventData);

      toast({
        title: "Event Created!",
        description: "Your event is now live. Please ensure you've sent the payment confirmation.",
      });

      router.push('/gig-maker/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create event. Please try again.",
      });
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
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-primary font-headline">Create New Event</h1>
          <p className="text-muted-foreground">Fill in the details to find the perfect talent for your gig.</p>
        </div>

        <form onSubmit={handlePreSubmit}>
          <div className="grid gap-6">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">General Information</CardTitle>
                <CardDescription>Basic details about your event</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Name</Label>
                  <Input id="title" placeholder="e.g. Afrobeat Night" required value={formData.title} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Describe the vibe, audience, and expectations..." className="min-h-[120px]" required value={formData.description} onChange={handleInputChange} />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="location" placeholder="City, Venue" className="pl-10" required value={formData.location} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Event Date</Label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="date" type="date" className="pl-10" required value={formData.date} onChange={handleInputChange} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Requirements & Budget</CardTitle>
                <CardDescription>Define who you're looking for and what you offer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="applicationDeadline">Application Deadline</Label>
                    <Input id="applicationDeadline" type="date" required value={formData.applicationDeadline} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxApplicants">Max Applicants</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="maxApplicants" type="number" placeholder="e.g. 50" className="pl-10" required value={formData.maxApplicants} onChange={handleInputChange} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Required Genres</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {GENRES.map(genre => (
                      <div key={genre} className="flex items-center space-x-2 bg-background p-2 rounded-md border border-input hover:border-primary transition-colors cursor-pointer">
                        <Checkbox 
                          id={`genre-${genre}`} 
                          checked={formData.genres.includes(genre)} 
                          onCheckedChange={() => handleGenreChange(genre)} 
                        />
                        <Label htmlFor={`genre-${genre}`} className="cursor-pointer font-medium text-xs">{genre}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minPrice">Minimum Budget (P)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground font-bold">P</span>
                      <Input id="minPrice" type="number" placeholder="0.00" className="pl-8" required value={formData.minPrice} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxPrice">Maximum Budget (P)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground font-bold">P</span>
                      <Input id="maxPrice" type="number" placeholder="0.00" className="pl-8" required value={formData.maxPrice} onChange={handleInputChange} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experienceLevel">Experience Level</Label>
                  <Select onValueChange={handleSelectChange} value={formData.experienceLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Upcoming">Upcoming / Emerging Talent</SelectItem>
                      <SelectItem value="Established">Established / Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4 pb-12">
              <Link href="/gig-maker/dashboard">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" className="px-8 bg-primary">
                Proceed to Payment
              </Button>
            </div>
          </div>
        </form>
      </div>

      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <CreditCard className="h-6 w-6" />
              Event Creation Fee: P25
            </DialogTitle>
            <DialogDescription>
              To publish your event, please complete the payment using one of the methods below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid gap-4">
              <div className="bg-secondary/30 p-4 rounded-xl space-y-3">
                <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Payment Options</h4>
                
                <div className="flex items-center justify-between text-sm border-b pb-2">
                  <span className="font-medium">MyZaka</span>
                  <span className="font-bold text-primary">74266208</span>
                </div>
                
                <div className="flex items-center justify-between text-sm border-b pb-2">
                  <span className="font-medium">Orange Money</span>
                  <span className="font-bold text-primary">76479543</span>
                </div>
                
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-medium block">Bank Voucher / Instant Cash</span>
                  <div className="flex items-center justify-between text-sm border-b pb-2">
                    <span>Number:</span>
                    <span className="font-bold text-primary">74266208</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">
                    * Send voucher PIN message to WhatsApp after transaction.
                  </p>
                </div>
              </div>

              <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-3">
                <h4 className="font-bold text-sm flex items-center gap-2 text-primary">
                  <MessageSquare className="h-4 w-4" />
                  Step 2: Verification
                </h4>
                <p className="text-xs text-muted-foreground">
                  Send a screenshot of the transaction or the Bank Voucher PIN to our official WhatsApp line.
                </p>
                <WhatsAppButton 
                  phoneNumber="+26774266208"
                  message={`Hi, I've just paid P25 for my event "${formData.title}". Here is the proof of payment.`}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-9"
                  size="sm"
                >
                  Send Screenshot
                </WhatsAppButton>
              </div>
            </div>

            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
              <p className="text-[10px] text-amber-800 flex items-start gap-2">
                <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0" />
                Note: Your event will be live for 3 days. The admin will verify payment and may mark it as incomplete if no proof is received.
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowPaymentModal(false)} disabled={loading}>
              Cancel
            </Button>
            <Button className="bg-primary flex-1" onClick={handleFinalPublish} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Publish Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
