
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase, MapPin, MessageCircle, Building2, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const COUNTRY_FLAGS: Record<string, string> = {
  '+267': '🇧🇼',
  '+27': '🇿🇦',
  '+254': '🇰🇪',
  '+234': '🇳🇬',
  '+263': '🇿🇼',
  '+260': '🇿🇲',
  '+244': '🇦🇴',
  '+255': '🇹🇿',
  '+256': '🇺🇬',
  '+264': '🇳🇦',
  '+268': '🇸🇿',
  '+266': '🇱🇸',
  '+233': '🇬🇭',
};

export default function GigMakerSetupPage() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    role: '',
    location: '',
    whatsappNumber: '',
  });

  const profileRef = useMemo(() => (user ? doc(db, 'gig-makers', user.uid) : null), [db, user]);
  const { data: profile, loading: profileLoading } = useDoc(profileRef);

  // Detect flag based on phone number
  const detectedFlag = useMemo(() => {
    const phone = formData.whatsappNumber;
    if (!phone.startsWith('+')) return null;
    
    // Check for 4-char prefixes first (+267, +234, etc)
    const prefix4 = phone.substring(0, 4);
    if (COUNTRY_FLAGS[prefix4]) return COUNTRY_FLAGS[prefix4];
    
    // Then 3-char prefixes (+27)
    const prefix3 = phone.substring(0, 3);
    if (COUNTRY_FLAGS[prefix3]) return COUNTRY_FLAGS[prefix3];
    
    return null;
  }, [formData.whatsappNumber]);

  useEffect(() => {
    if (profile && !isDataLoaded) {
      setFormData({
        businessName: profile.businessName || '',
        role: profile.role || '',
        location: profile.location || '',
        whatsappNumber: profile.whatsappNumber || '',
      });
      setIsDataLoaded(true);
    }
  }, [profile, isDataLoaded]);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow + and numbers
    const value = e.target.value.replace(/[^0-9+]/g, '');
    setFormData(prev => ({ ...prev, whatsappNumber: value }));
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
        description: "Please select your business role.",
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
        updatedAt: serverTimestamp(),
        // Only set createdAt if it doesn't exist
        ...(!profile && { createdAt: serverTimestamp() })
      };

      await setDoc(doc(db, 'gig-makers', user.uid), gigMakerData, { merge: true });

      toast({
        title: isDataLoaded ? "Profile Updated!" : "Profile Saved!",
        description: isDataLoaded 
          ? "Your business details have been updated." 
          : "Your business profile has been successfully created.",
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

  if (userLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/10">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/10 py-12 px-4">
      <div className="max-w-xl mx-auto space-y-8 slide-up">
        <div className="flex items-center justify-between">
           <Link href="/gig-maker/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Button>
           </Link>
        </div>

        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="bg-primary p-3 rounded-xl shadow-lg text-white">
              <Building2 className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-primary font-headline">
            {isDataLoaded ? 'Edit Business Profile' : 'Business Setup'}
          </h1>
          <p className="text-muted-foreground text-lg">
            {isDataLoaded ? 'Update your venue or organization details.' : 'Complete your business profile to start hiring talent.'}
          </p>
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
                    <SelectItem value="Church">Church</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
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
                  <div className="absolute left-3 top-3 flex items-center gap-2 text-muted-foreground">
                    {detectedFlag ? (
                      <span className="text-lg leading-none">{detectedFlag}</span>
                    ) : (
                      <MessageCircle className="h-4 w-4" />
                    )}
                  </div>
                  <Input 
                    id="whatsappNumber" 
                    placeholder="+267..." 
                    className="pl-10 h-11"
                    required 
                    value={formData.whatsappNumber} 
                    onChange={handlePhoneChange} 
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
                    {isDataLoaded ? 'Update Profile' : 'Complete Setup'}
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                You can always come back and update these details.
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
