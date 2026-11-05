"use client"

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Briefcase, Upload, Music, Video, User, Check, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const GENRES = [
  "Kwaito", "Kwasa", "Amapiano", "Afrobeats", "Afropop", "Pop", "Rock", "Hip Hop", "Jazz", "Classical", 
  "Electronic", "R&B", "Country", "Reggae", "Folk", "Other"
];

export default function ArtistSetupPage() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    artistName: '',
    dob: '',
    idNumber: '',
    genres: [] as string[],
    location: '',
    bio: '',
    bookingPrice: '',
    featurePrice: '',
    whatsappNumber: '',
    songLink1: '',
    songLink2: '',
    songLink3: '',
    videoLink: '',
  });

  const [files, setFiles] = useState<{
    profilePic: string | null;
  }>({
    profilePic: null,
  });

  const completionStats = useMemo(() => {
    const requiredFields = [
      formData.fullName,
      formData.artistName,
      formData.dob,
      formData.idNumber,
      formData.location,
      formData.bio,
      formData.bookingPrice,
      formData.whatsappNumber,
    ];
    
    const requiredFiles = [
      files.profilePic
    ];

    const filledFieldsCount = requiredFields.filter(field => field && field.trim().length > 0).length;
    const filledFilesCount = requiredFiles.filter(file => file !== null).length;
    const genresFilled = formData.genres.length > 0 ? 1 : 0;

    const totalRequired = requiredFields.length + requiredFiles.length + 1;
    const totalFilled = filledFieldsCount + filledFilesCount + genresFilled;
    
    const percentage = Math.round((totalFilled / totalRequired) * 100);
    const isComplete = percentage === 100;

    return { percentage, isComplete };
  }, [formData, files]);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleGenreChange = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, key: keyof typeof files) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 500 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please upload an image smaller than 500KB.",
        });
        return;
      }
      try {
        const base64 = await fileToBase64(file);
        setFiles(prev => ({ ...prev, [key]: base64 }));
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Error reading file",
          description: "Could not process the selected image.",
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const artistData = {
        userId: user.uid,
        fullName: formData.fullName,
        artistName: formData.artistName,
        dob: formData.dob,
        idNumber: formData.idNumber,
        genres: formData.genres,
        location: formData.location,
        bio: formData.bio,
        bookingPrice: Number(formData.bookingPrice),
        featurePrice: formData.featurePrice ? Number(formData.featurePrice) : null,
        whatsappNumber: formData.whatsappNumber,
        songLinks: [formData.songLink1, formData.songLink2, formData.songLink3].filter(link => link),
        videoLink: formData.videoLink,
        profilePictureUrl: files.profilePic,
        profileComplete: completionStats.isComplete,
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'artists', user.uid), artistData, { merge: true });

      toast({
        title: completionStats.isComplete ? "Profile Complete!" : "Progress Saved",
        description: completionStats.isComplete 
          ? "You can now access your talent dashboard." 
          : "Your progress has been saved. Please complete the remaining fields.",
      });

      if (completionStats.isComplete) {
        router.push('/artist/dashboard');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Setup Error",
        description: error.message || "Something went wrong while saving your profile.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/10 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <Card className="sticky top-4 z-20 border-primary/20 shadow-lg bg-background/95 backdrop-blur">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">Profile Completion</span>
              <span className="text-sm font-bold text-primary">{completionStats.percentage}%</span>
            </div>
            <Progress value={completionStats.percentage} className="h-3" />
            {!completionStats.isComplete && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Required: Basic info, genres, bio, booking price, WhatsApp, and profile picture.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="bg-primary p-3 rounded-xl shadow-lg text-white">
              <User className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-primary font-headline">Profile Setup</h1>
          <p className="text-muted-foreground text-lg">Tell us more about your craft to start getting gigs.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-8">
            <Card className="border-none shadow-md overflow-hidden">
              <CardHeader className="bg-primary/5 border-b">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <User className="h-5 w-5 text-primary" />
                  Basic Information
                </CardTitle>
                <CardDescription>Personal and identity details (Required)</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-6 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" placeholder="Legal name" required value={formData.fullName} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="artistName">Artist / Stage Name</Label>
                  <Input id="artistName" placeholder="e.g. DJ Amapiano Star" required value={formData.artistName} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input id="dob" type="date" required value={formData.dob} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idNumber">ID / Passport Number</Label>
                  <Input id="idNumber" placeholder="Number" required value={formData.idNumber} onChange={handleInputChange} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardHeader className="bg-primary/5 border-b">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Music className="h-5 w-5 text-primary" />
                  Artistic Details
                </CardTitle>
                <CardDescription>Your music style and pricing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    Genres (Select at least one)
                    {formData.genres.length === 0 && <span className="text-destructive text-xs font-bold">* Required</span>}
                  </Label>
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
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location (City, Country)</Label>
                    <Input id="location" placeholder="e.g. Gaborone, Botswana" required value={formData.location} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                    <Input id="whatsappNumber" placeholder="+267..." required value={formData.whatsappNumber} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bookingPrice">Booking Price (P)</Label>
                    <Input id="bookingPrice" type="number" placeholder="0.00" required value={formData.bookingPrice} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="featurePrice">Feature Price (Optional, P)</Label>
                    <Input id="featurePrice" type="number" placeholder="0.00" value={formData.featurePrice} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio / Career Overview</Label>
                  <Textarea id="bio" placeholder="Tell your story..." className="min-h-[120px]" required value={formData.bio} onChange={handleInputChange} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardHeader className="bg-primary/5 border-b">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Video className="h-5 w-5 text-primary" />
                  Portfolio Links (Optional)
                </CardTitle>
                <CardDescription>Share your best sets or tracks</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 pt-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="songLink1">Link 1</Label>
                    <Input id="songLink1" placeholder="SoundCloud / Spotify URL" value={formData.songLink1} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="songLink2">Link 2</Label>
                    <Input id="songLink2" placeholder="SoundCloud / Spotify URL" value={formData.songLink2} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="songLink3">Link 3</Label>
                    <Input id="songLink3" placeholder="SoundCloud / Spotify URL" value={formData.songLink3} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="videoLink">Performance / Set Video Link</Label>
                  <Input id="videoLink" placeholder="YouTube / Vimeo URL" value={formData.videoLink} onChange={handleInputChange} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardHeader className="bg-primary/5 border-b">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Upload className="h-5 w-5 text-primary" />
                  Media Uploads (Required)
                </CardTitle>
                <CardDescription>Upload a professional photo for your profile</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-1 gap-6 pt-6">
                <div className="space-y-2">
                  <Label>Profile Picture</Label>
                  <div className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 hover:bg-accent transition-colors ${!files.profilePic ? 'border-destructive/30' : 'border-primary/30'}`}>
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <Input type="file" className="hidden" id="profile-pic" accept="image/*" onChange={(e) => handleFileChange(e, 'profilePic')} />
                    <Label htmlFor="profile-pic" className="cursor-pointer text-sm font-bold text-primary truncate max-w-full px-2">
                      {files.profilePic ? 'Image Selected' : 'Choose Image'}
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row justify-end gap-4 pb-12">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" className="px-12 h-11 text-lg bg-primary" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    {completionStats.isComplete ? 'Complete Setup' : 'Save Progress'}
                    {completionStats.isComplete ? <Check className="ml-2 h-5 w-5" /> : null}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
