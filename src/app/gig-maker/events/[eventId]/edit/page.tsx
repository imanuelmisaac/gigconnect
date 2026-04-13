
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarIcon, MapPin, Users, Briefcase, Loader2, ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const GENRES = [
  "Amapiano", "Afrobeats", "Afropop", "Pop", "Rock", "Hip Hop", "Jazz", "Classical", 
  "Electronic", "R&B", "Country", "Reggae", "Folk"
];

export default function EditEventPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [saving, setSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
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
    status: 'Open'
  });

  const eventRef = useMemo(() => {
    if (!db || !eventId) return null;
    return doc(db, 'events', eventId);
  }, [db, eventId]);

  const { data: event, loading: eventLoading } = useDoc(eventRef);

  useEffect(() => {
    if (event && !isInitialized) {
      if (event.gigMakerId !== user?.uid && !userLoading && user) {
        router.push('/gig-maker/dashboard');
        return;
      }
      setFormData({
        title: event.title || '',
        description: event.description || '',
        location: event.location || '',
        date: event.date || '',
        applicationDeadline: event.applicationDeadline || '',
        maxApplicants: event.maxApplicants?.toString() || '',
        minPrice: event.minPrice?.toString() || '',
        maxPrice: event.maxPrice?.toString() || '',
        experienceLevel: event.experienceLevel || 'Upcoming',
        genres: event.genres || [],
        status: event.status || 'Open'
      });
      setIsInitialized(true);
    }
  }, [event, user, userLoading, router, isInitialized]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: string, value: string) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !eventId) return;

    setSaving(true);
    try {
      const ref = doc(db, 'events', eventId);
      await updateDoc(ref, {
        ...formData,
        maxApplicants: Number(formData.maxApplicants),
        minPrice: Number(formData.minPrice),
        maxPrice: Number(formData.maxPrice),
        updatedAt: serverTimestamp(),
      });

      toast({ title: "Event Updated", description: "Changes have been saved successfully." });
      router.push('/gig-maker/dashboard');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (userLoading || eventLoading) {
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
          <h1 className="text-3xl font-bold tracking-tight text-primary font-headline">Edit Event</h1>
          <p className="text-muted-foreground">Update the details for your gig.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">General Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Name</Label>
                  <Input id="title" required value={formData.title} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" required className="min-h-[120px]" value={formData.description} onChange={handleInputChange} />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" required value={formData.location} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Event Date</Label>
                    <Input id="date" type="date" required value={formData.date} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Event Status</Label>
                  <Select onValueChange={(v) => handleSelectChange('status', v)} value={formData.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Requirements & Budget</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="applicationDeadline">Application Deadline</Label>
                    <Input id="applicationDeadline" type="date" required value={formData.applicationDeadline} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxApplicants">Max Applicants</Label>
                    <Input id="maxApplicants" type="number" required value={formData.maxApplicants} onChange={handleInputChange} />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Required Genres</Label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {GENRES.map(genre => (
                      <div key={genre} className="flex items-center space-x-2 bg-background p-2 rounded-md border border-input">
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
                    <Input id="minPrice" type="number" required value={formData.minPrice} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxPrice">Maximum Budget (P)</Label>
                    <Input id="maxPrice" type="number" required value={formData.maxPrice} onChange={handleInputChange} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experienceLevel">Experience Level</Label>
                  <Select onValueChange={(v) => handleSelectChange('experienceLevel', v)} value={formData.experienceLevel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Upcoming">Upcoming / Emerging</SelectItem>
                      <SelectItem value="Established">Established / Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4 pb-12">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" className="px-8 bg-primary gap-2" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
