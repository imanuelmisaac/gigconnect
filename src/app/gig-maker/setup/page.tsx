
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase, MapPin, MessageCircle, Building2, Loader2, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function GigMakerSetupPage() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    role: '',
    location: '',
    whatsappNumber: '',
  });

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!formData.role) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please select your business role (Bar or Event Organizer).",
      });
      return;
    }

    setLoading(true);

    try {
      const gigMakerData = {
        userId: user.uid,
        businessName: formData.businessName,
        role: formData.role,
        location: formData.location,
        whatsappNumber: formData.whatsappNumber,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'gig-makers', user.uid), gigMakerData, { merge: true });

      toast({
        title: "Profile Saved!",
        description: "Your business profile has been successfully created.",
      });

      router.push('/gig-maker/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Setup Error",
        description: error.message || "Something went wrong while saving your business profile.",
      });
    } finally {
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
      <div className="max-w-xl mx-auto space-y-8 slide-up">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="bg-primary p-3 rounded-xl shadow-lg text-white">
              <Building2 className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-primary font-headline">Business Setup</h1>
          <p className="text-muted-foreground text-lg">Complete your business profile to start hiring talent.</p>
        </div>

        <Card className="border-none shadow-xl">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Business Details</CardTitle>
              <CardDescription>Tell us about your venue or event organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="businessName" 
                    placeholder="e.g. Blue Note Jazz Club" 
                    className="pl-10 h-11"
                    required 
                    value={formData.businessName} 
                    onChange={handleInputChange} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Business Type</Label>
                <Select onValueChange={handleSelectChange} value={formData.role}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bar">Bar / Club</SelectItem>
                    <SelectItem value="Event Organizer">Event Organizer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="location" 
                    placeholder="City, Country" 
                    className="pl-10 h-11"
                    required 
                    value={formData.location} 
                    onChange={handleInputChange} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                <div className="relative">
                  <MessageCircle className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="whatsappNumber" 
                    placeholder="+254..." 
                    className="pl-10 h-11"
                    required 
                    value={formData.whatsappNumber} 
                    onChange={handleInputChange} 
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full h-11 bg-primary text-lg gap-2" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                You can update these details later from your dashboard settings.
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
