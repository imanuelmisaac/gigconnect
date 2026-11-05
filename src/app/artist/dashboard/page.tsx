
"use client"

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useCollection, useAuth } from '@/firebase';
import { doc, collectionGroup, query, where, collection, updateDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { 
  Loader2, 
  LayoutDashboard, 
  Music, 
  Calendar, 
  Settings, 
  LogOut, 
  UserCheck, 
  AlertCircle,
  MapPin,
  Briefcase,
  Search,
  Sparkles,
  Users,
  CheckCircle2,
  XCircle,
  Trash2,
  Archive,
  ArrowRight,
  TrendingUp,
  Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { WhatsAppButton } from '@/components/whatsapp-button';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

const SUBSCRIPTION_LIMITS = {
  free: { apps: 2, features: 3, label: "Free Tier" },
  package2: { apps: 25, features: 40, label: "Essential Pro" },
  package3: { apps: 100, features: 999, label: "Standard Pro" },
  package4: { apps: 9999, features: 9999, label: "Ultimate Pro" }
};

export default function ArtistDashboardPage() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [requestToDelete, setRequestToDelete] = useState<{ id: string, targetId?: string, isSent?: boolean } | null>(null);

  const artistDocRef = useMemo(() => {
    if (!db || !user) return null;
    return doc(db, 'artists', user.uid);
  }, [db, user]);

  const { data: artistProfile, loading: profileLoading } = useDoc(artistDocRef);

  // Current month usage calculation
  const startOfMonth = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return Timestamp.fromDate(d);
  }, []);

  const applicationsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collectionGroup(db, 'applications'),
      where('artistId', '==', user.uid)
    );
  }, [db, user]);

  const { data: rawApps, loading: appsLoading } = useCollection(applicationsQuery);

  const sentFeaturesQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collectionGroup(db, 'features'),
      where('senderId', '==', user.uid)
    );
  }, [db, user]);

  const { data: rawSentFeatures, loading: sentFeaturesLoading } = useCollection(sentFeaturesQuery);

  const featuresQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, 'artists', user.uid, 'features'));
  }, [db, user]);

  const { data: rawFeatures, loading: featuresLoading } = useCollection(featuresQuery);

  const usageStats = useMemo(() => {
    if (!rawApps || !rawSentFeatures) return { apps: 0, features: 0 };
    
    const monthlyApps = rawApps.filter((app: any) => 
      app.createdAt && (app.createdAt.seconds >= startOfMonth.seconds)
    ).length;

    const monthlyFeatures = rawSentFeatures.filter((feat: any) => 
      feat.createdAt && (feat.createdAt.seconds >= startOfMonth.seconds)
    ).length;

    return { apps: monthlyApps, features: monthlyFeatures };
  }, [rawApps, rawSentFeatures, startOfMonth]);

  const tierKey = (artistProfile?.subscriptionTier as keyof typeof SUBSCRIPTION_LIMITS) || 'free';
  const limits = SUBSCRIPTION_LIMITS[tierKey];

  useEffect(() => {
    if (!userLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      
      if (!user.emailVerified) {
        signOut(auth).then(() => {
          toast({
            variant: "destructive",
            title: "Verification Required",
            description: "Please verify your email address to access your dashboard.",
          });
          router.push('/login');
        });
        return;
      }

      if (!profileLoading && artistProfile) {
        if (artistProfile.profileComplete === false) {
          router.push('/artist/setup');
        }
      }
    }
  }, [user, userLoading, artistProfile, profileLoading, router, auth, toast]);

  const handleUpdateFeatureStatus = async (reqId: string, status: 'Accepted' | 'Rejected') => {
    if (!db || !user) return;
    const reqRef = doc(db, 'artists', user.uid, 'features', reqId);
    
    try {
      await updateDoc(reqRef, { 
        status, 
        updatedAt: serverTimestamp() 
      });
      toast({
        title: `Request ${status}`,
        description: status === 'Accepted' ? "You can now contact them via WhatsApp." : "Request has been declined.",
      });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const handleDeleteFeature = async (reqId: string, targetId?: string, isSent?: boolean) => {
    if (!db || !user) return;
    const finalTargetId = isSent ? targetId : user.uid;
    if (!finalTargetId) return;

    const reqRef = doc(db, 'artists', finalTargetId, 'features', reqId);
    
    try {
      await deleteDoc(reqRef);
      toast({ title: "Request Removed", description: "The request has been deleted from your dashboard." });
      setRequestToDelete(null);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  if (userLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/10">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/10 flex">
      <aside className="w-64 bg-primary text-white hidden md:flex flex-col shrink-0">
        <div className="p-6 border-b border-white/10 flex items-center gap-2">
          <Music className="h-6 w-6 text-accent" />
          <span className="text-xl font-bold font-headline text-white">GigConnect</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10 bg-white/5">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          <Link href="/artist/events">
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
              <Calendar className="mr-2 h-4 w-4" />
              Available Gigs
            </Button>
          </Link>
          <Link href="/artist/features">
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
              <Sparkles className="mr-2 h-4 w-4" />
              Find Features
            </Button>
          </Link>
          <Link href="/artist/subscription">
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
              <Crown className="mr-2 h-4 w-4" />
              Upgrade
            </Button>
          </Link>
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" onClick={() => router.push('/artist/setup')}>
            <Settings className="mr-2 h-4 w-4" />
            Profile Settings
          </Button>
        </nav>
        <div className="p-4 border-t border-white/10">
           <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" onClick={() => auth.signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold font-headline text-primary">Talent Hub</h1>
            <p className="text-muted-foreground">Manage your performances and collaborations</p>
          </div>
          
          <div className="flex items-center gap-3">
             <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 gap-1">
                <Crown className="h-3 w-3" />
                {limits.label}
              </Badge>
            {artistProfile?.profileComplete ? (
              <Badge className="bg-green-500/10 text-green-600 border-green-200 px-3 py-1 gap-1">
                <UserCheck className="h-3 w-3" />
                Verified
              </Badge>
            ) : null}
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-none shadow-md overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-primary to-accent" />
              <CardContent className="relative pt-0 text-center">
                <div className="flex justify-center -mt-12 mb-4">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                    <AvatarImage src={artistProfile?.profilePictureUrl} />
                    <AvatarFallback className="text-2xl bg-secondary text-primary">
                      {artistProfile?.artistName?.substring(0, 2).toUpperCase() || 'AR'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <h2 className="text-xl font-bold">{artistProfile?.artistName || 'Artist Name'}</h2>
                <div className="flex items-center justify-center text-muted-foreground text-sm gap-1 mb-4">
                  <MapPin className="h-3 w-3" />
                  {artistProfile?.location || 'Location not set'}
                </div>
                <div className="pt-4 border-t flex justify-between items-center text-xs">
                  <div className="flex-1">
                    <p className="text-muted-foreground">Gig Price</p>
                    <p className="font-bold text-primary uppercase">P{artistProfile?.bookingPrice || 0}</p>
                  </div>
                  <div className="flex-1 border-x">
                    <p className="text-muted-foreground">Feature</p>
                    <p className="font-bold text-accent uppercase">{artistProfile?.featurePrice ? `P${artistProfile.featurePrice}` : 'N/A'}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-muted-foreground">Rating</p>
                    <p className="font-bold text-green-500">5.0</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  Monthly Usage
                </CardTitle>
                <CardDescription>Resets every 1st of the month</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Event Applications</span>
                    <span>{usageStats.apps} / {limits.apps > 1000 ? '∞' : limits.apps}</span>
                  </div>
                  <Progress value={(usageStats.apps / limits.apps) * 100} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Feature Requests</span>
                    <span>{usageStats.features} / {limits.features > 1000 ? '∞' : limits.features}</span>
                  </div>
                  <Progress value={(usageStats.features / limits.features) * 100} className="h-2" />
                </div>

                {tierKey === 'free' && (
                  <Link href="/artist/subscription">
                    <Button className="w-full bg-accent hover:bg-accent/90 text-white font-bold gap-2 mt-2">
                      <Crown className="h-4 w-4" /> Upgrade for P20
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-primary text-white border-none shadow-lg overflow-hidden relative group cursor-pointer" onClick={() => router.push('/artist/events')}>
                <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 group-hover:scale-110 transition-transform">
                  <Briefcase className="h-full w-full rotate-12" />
                </div>
                <CardHeader>
                  <CardTitle className="text-xl font-headline">Gig Marketplace</CardTitle>
                  <CardDescription className="text-white/80">Apply for local gigs</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button size="sm" className="bg-accent hover:bg-accent/90 text-white font-bold gap-2 shadow-sm">
                    <Search className="h-4 w-4" /> Browse
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-accent text-white border-none shadow-lg overflow-hidden relative group cursor-pointer" onClick={() => router.push('/artist/features')}>
                <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 group-hover:scale-110 transition-transform">
                  <Sparkles className="h-full w-full -rotate-12" />
                </div>
                <CardHeader>
                  <CardTitle className="text-xl font-headline">Collaborations</CardTitle>
                  <CardDescription className="text-white/80">Find features & sets</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-white font-bold gap-2 shadow-sm">
                    <Users className="h-4 w-4" /> Find Talent
                  </Button>
                </CardContent>
              </Card>
            </div>

            <section className="space-y-4">
              <h3 className="text-xl font-bold font-headline flex items-center gap-2 text-primary">
                <Briefcase className="h-5 w-5 text-accent" />
                Recent Applications
              </h3>
              <div className="grid gap-4">
                {appsLoading ? (
                  <div className="h-24 flex items-center justify-center bg-white rounded-xl">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : rawApps && rawApps.length > 0 ? (
                  rawApps.slice(0, 5).map((app: any) => (
                    <Card key={app.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-primary font-bold">
                            P{app.price}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm">Application Sent</h4>
                            <p className="text-[10px] text-muted-foreground">{new Date(app.createdAt?.seconds * 1000).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <Badge variant={app.status === 'Accepted' ? 'default' : app.status === 'Rejected' ? 'destructive' : 'secondary'} className="text-[10px]">
                          {app.status}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic text-center py-8 bg-white rounded-xl border border-dashed">No active applications.</p>
                )}
              </div>
            </section>

             <section className="space-y-4">
              <h3 className="text-xl font-bold font-headline flex items-center gap-2 text-primary">
                <Sparkles className="h-5 w-5 text-accent" />
                Feature Requests
              </h3>
              <Tabs defaultValue="received">
                <TabsList className="grid w-full grid-cols-2 bg-secondary/20">
                  <TabsTrigger value="received">Received</TabsTrigger>
                  <TabsTrigger value="sent">Sent</TabsTrigger>
                </TabsList>
                <TabsContent value="received" className="pt-4 space-y-4">
                  {featuresLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto mt-4" /> : 
                    rawFeatures?.length ? rawFeatures.map((req: any) => (
                      <Card key={req.id} className="border-none shadow-sm">
                        <CardContent className="p-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                             <Avatar className="h-8 w-8">
                               <AvatarFallback className="text-xs">{req.senderName?.substring(0, 2)}</AvatarFallback>
                             </Avatar>
                             <div>
                               <p className="text-sm font-bold">{req.senderName}</p>
                               <p className="text-[10px] text-muted-foreground">Status: {req.status}</p>
                             </div>
                          </div>
                          <div className="flex gap-2">
                             {req.status === 'pending' ? (
                               <>
                                 <Button size="sm" variant="outline" className="h-7 text-[10px] text-green-600 border-green-200" onClick={() => handleUpdateFeatureStatus(req.id, 'Accepted')}>Accept</Button>
                                 <Button size="sm" variant="ghost" className="h-7 text-[10px] text-red-600" onClick={() => handleUpdateFeatureStatus(req.id, 'Rejected')}>Decline</Button>
                               </>
                             ) : (
                               req.status === 'Accepted' && req.senderWhatsapp && (
                                 <WhatsAppButton phoneNumber={req.senderWhatsapp} message="Hi, I've accepted your feature request!" size="sm" className="h-7 text-[10px]" />
                               )
                             )}
                          </div>
                        </CardContent>
                      </Card>
                    )) : <p className="text-xs text-center text-muted-foreground py-4">No requests received.</p>
                  }
                </TabsContent>
                <TabsContent value="sent" className="pt-4 space-y-4">
                   {sentFeaturesLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto mt-4" /> : 
                    rawSentFeatures?.length ? rawSentFeatures.map((req: any) => (
                      <Card key={req.id} className="border-none shadow-sm">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold">To: {req.targetName}</p>
                            <p className="text-[10px] text-muted-foreground">Status: {req.status}</p>
                          </div>
                          <Button variant="ghost" size="sm" className="h-7 text-destructive" onClick={() => setRequestToDelete({ id: req.id, targetId: req.targetId, isSent: true })}>
                             <Trash2 className="h-3 w-3" />
                          </Button>
                        </CardContent>
                      </Card>
                    )) : <p className="text-xs text-center text-muted-foreground py-4">No requests sent.</p>
                  }
                </TabsContent>
              </Tabs>
            </section>
          </div>
        </div>
      </main>

      <AlertDialog open={!!requestToDelete} onOpenChange={(open) => !open && setRequestToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Request?</AlertDialogTitle>
            <AlertDialogDescription>This will delete the request from your dashboard.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => requestToDelete && handleDeleteFeature(requestToDelete.id, requestToDelete.targetId, requestToDelete.isSent)} className="bg-destructive text-white">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
