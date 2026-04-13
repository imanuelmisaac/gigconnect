
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore, useStorage, useUser } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Briefcase, Upload, Music, Video, User, Check, Loader2, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const GENRES = [
  "Pop", "Rock", "Hip Hop", "Jazz", "Classical", 
  "Electronic", "R&B", "Country", "Reggae", "Folk"
];

export default function ArtistSetupPage() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const storage = useStorage();
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
    idFront: File | null;
    idBack: File | null;
    profilePic: File | null;
  }>({
    idFront: null,
    idBack: null,
    profilePic: null,
  });

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, key: keyof typeof files) => {
    if (e.target.files && e.target.files[0]) {
      setFiles(prev => ({ ...prev, [key]: e.target.files![0] }));
    }
  };

  const uploadFile = async (file: File, path: string) => {
    const fileRef = ref(storage, path);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      let idFrontUrl = '';
      let idBackUrl = '';
      let profilePictureUrl = '';

      if (files.idFront) idFrontUrl = await uploadFile(files.idFront, `artists/${user.uid}/id_front`);
      if (files.idBack) idBackUrl = await uploadFile(files.idBack, `artists/${user.uid}/id_back`);
      if (files.profilePic) profilePictureUrl = await uploadFile(files.profilePic, `artists/${user.uid}/profile_pic`);

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
        idFrontUrl,
        idBackUrl,
        profilePictureUrl,
        profileComplete: false,
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'artists', user.uid), artistData);

      toast({
        title: "Profile Saved",
        description: "Your artist profile has been created successfully.",
      });

      router.push('/artist/dashboard');
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
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="bg-primary p-3 rounded-xl shadow-lg text-white">
              <User className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-primary font-headline">Artist Profile Setup</h1>
          <p className="text-muted-foreground text-lg">Tell us more about your craft to start getting gigs.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-8">
            {/* Basic Information */}
            <Card className="border-none shadow-md overflow-hidden">
              <CardHeader className="bg-primary/5 border-b">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <User className="h-5 w-5 text-primary" />
                  Basic Information
                </CardTitle>
                <CardDescription>Personal and identity details</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-6 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" placeholder="Legal name" required value={formData.fullName} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="artistName">Artist Name / Stage Name</Label>
                  <Input id="artistName" placeholder="Stage name" required value={formData.artistName} onChange={handleInputChange} />
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

            {/* Artistic Details */}
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
                  <Label>Genres (Select all that apply)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {GENRES.map(genre => (
                      <div key={genre} className="flex items-center space-x-2 bg-background p-2 rounded-md border border-input hover:border-primary transition-colors cursor-pointer">
                        <Checkbox 
                          id={`genre-${genre}`} 
                          checked={formData.genres.includes(genre)} 
                          onCheckedChange={() => handleGenreChange(genre)} 
                        />
                        <Label htmlFor={`genre-${genre}`} className="cursor-pointer font-medium">{genre}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location (City, Country)</Label>
                    <Input id="location" placeholder="e.g. Nairobi, Kenya" required value={formData.location} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                    <Input id="whatsappNumber" placeholder="+254..." required value={formData.whatsappNumber} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bookingPrice">Booking Price ($)</Label>
                    <Input id="bookingPrice" type="number" placeholder="0.00" required value={formData.bookingPrice} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="featurePrice">Feature Price (Optional, $)</Label>
                    <Input id="featurePrice" type="number" placeholder="0.00" value={formData.featurePrice} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Artist Bio</Label>
                  <Textarea id="bio" placeholder="Tell your story..." className="min-h-[120px]" required value={formData.bio} onChange={handleInputChange} />
                </div>
              </CardContent>
            </Card>

            {/* Content Links */}
            <Card className="border-none shadow-md">
              <CardHeader className="bg-primary/5 border-b">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Video className="h-5 w-5 text-primary" />
                  Portfolio Links
                </CardTitle>
                <CardDescription>Share your best work</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 pt-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="songLink1">Song Link 1</Label>
                    <Input id="songLink1" placeholder="SoundCloud / Spotify URL" value={formData.songLink1} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="songLink2">Song Link 2</Label>
                    <Input id="songLink2" placeholder="SoundCloud / Spotify URL" value={formData.songLink2} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="songLink3">Song Link 3</Label>
                    <Input id="songLink3" placeholder="SoundCloud / Spotify URL" value={formData.songLink3} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="videoLink">Performance Video Link</Label>
                  <Input id="videoLink" placeholder="YouTube / Vimeo URL" value={formData.videoLink} onChange={handleInputChange} />
                </div>
              </CardContent>
            </Card>

            {/* Media Uploads */}
            <Card className="border-none shadow-md">
              <CardHeader className="bg-primary/5 border-b">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Upload className="h-5 w-5 text-primary" />
                  Media Uploads
                </CardTitle>
                <CardDescription>Upload necessary documents and photos</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-3 gap-6 pt-6">
                <div className="space-y-2">
                  <Label>Profile Picture</Label>
                  <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 hover:bg-accent transition-colors">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <Input type="file" className="hidden" id="profile-pic" accept="image/*" onChange={(e) => handleFileChange(e, 'profilePic')} />
                    <Label htmlFor="profile-pic" className="cursor-pointer text-sm font-bold text-primary">
                      {files.profilePic ? files.profilePic.name : 'Choose File'}
                    </Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>ID Front Side</Label>
                  <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 hover:bg-accent transition-colors">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <Input type="file" className="hidden" id="id-front" accept="image/*" onChange={(e) => handleFileChange(e, 'idFront')} />
                    <Label htmlFor="id-front" className="cursor-pointer text-sm font-bold text-primary">
                      {files.idFront ? files.idFront.name : 'Choose File'}
                    </Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>ID Back Side</Label>
                  <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 hover:bg-accent transition-colors">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <Input type="file" className="hidden" id="id-back" accept="image/*" onChange={(e) => handleFileChange(e, 'idBack')} />
                    <Label htmlFor="id-back" className="cursor-pointer text-sm font-bold text-primary">
                      {files.idBack ? files.idBack.name : 'Choose File'}
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4 pb-12">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" className="px-12 h-11 text-lg bg-primary" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Profile...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <Check className="ml-2 h-5 w-5" />
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
