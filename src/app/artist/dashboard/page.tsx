
"use client"

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useCollection, useAuth } from '@/firebase';
import { doc, collectionGroup, query, where, collection, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
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
  Archive
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

export default function ArtistDashboardPage() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);

  const artistDocRef = useMemo(() => {
    if (!db || !user) return null;
    return doc(db, 'artists', user.uid);
  }, [db, user]);

  const { data: artistProfile, loading: profileLoading } = useDoc(artistDocRef);

  const applicationsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collectionGroup(db, 'applications'),
      where('artistId', '==', user.uid)
    );
  }, [db, user]);

  const { data: rawApps, loading: appsLoading } = useCollection(applicationsQuery);

  const featuresQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'artists', user.uid, 'features')
    );
  }, [db, user]);

  const { data: rawFeatures, loading: featuresLoading } = useCollection(featuresQuery);

  const applications = useMemo(() => {
    if (!rawApps) return [];
    return [...rawApps].sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [rawApps]);

  const featureRequests = useMemo(() => {
    if (!rawFeatures) return [];
    return [...rawFeatures].sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [rawFeatures]);

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

  const handleDeleteFeature = async (reqId: string) => {
    if (!db || !user) return;
    const reqRef = doc(db, 'artists', user.uid, 'features', reqId);
    
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

  const isComplete = artistProfile?.profileComplete || false;

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
            {isComplete ? (
              <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-200 px-3 py-1 gap-1">
                <UserCheck className="h-3 w-3" />
                Verified Profile
              </Badge>
            ) : (
              <Badge variant="destructive" className="px-3 py-1 gap-1">
                <AlertCircle className="h-3 w-3" />
                Setup Required
              </Badge>
            )}
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-1 border-none shadow-md overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-primary to-accent" />
            <CardContent className="relative pt-0">
              <div className="flex justify-center -mt-12 mb-4">
                <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                  <AvatarImage src={artistProfile?.profilePictureUrl} />
                  <AvatarFallback className="text-2xl bg-secondary text-primary">
                    {artistProfile?.artistName?.substring(0, 2).toUpperCase() || 'AR'}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="text-center space-y-1 mb-6">
                <h2 className="text-xl font-bold">{artistProfile?.artistName || 'Artist Name'}</h2>
                <div className="flex items-center justify-center text-muted-foreground text-sm gap-1">
                  <MapPin className="h-3 w-3" />
                  {artistProfile?.location || 'Location not set'}
                </div>
              </div>

              <div className="space-y-4">
                <div className="pt-4 border-t flex justify-between items-center">
                  <div className="text-center px-2">
                    <p className="text-xs text-muted-foreground">Gig Price</p>
                    <p className="font-bold text-primary">P{artistProfile?.bookingPrice || 0}</p>
                  </div>
                  <div className="text-center px-2 border-l border-r">
                    <p className="text-xs text-muted-foreground">Feature</p>
                    <p className="font-bold text-accent">{artistProfile?.featurePrice ? `P${artistProfile.featurePrice}` : 'N/A'}</p>
                  </div>
                  <div className="text-center px-2">
                    <p className="text-xs text-muted-foreground">Rating</p>
                    <p className="font-bold text-green-500">5.0</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 pt-4">
              <Button variant="outline" size="sm" className="w-full border-primary/20 text-primary" onClick={() => router.push('/artist/setup')}>
                Update Bio & Portfolio
              </Button>
            </CardFooter>
          </Card>

          <div className="lg:col-span-2 space-y-8">
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-primary text-white border-none shadow-lg overflow-hidden relative group">
                <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 group-hover:scale-110 transition-transform">
                  <Briefcase className="h-full w-full rotate-12" />
                </div>
                <CardHeader>
                  <CardTitle className="text-xl font-headline">Gig Marketplace</CardTitle>
                  <CardDescription className="text-white/80">
                    Apply for live events
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/artist/events">
                    <Button size="sm" className="bg-accent hover:bg-accent/90 text-white font-bold gap-2 shadow-sm">
                      <Search className="h-4 w-4" />
                      Browse Gigs
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-accent text-white border-none shadow-lg overflow-hidden relative group">
                <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 group-hover:scale-110 transition-transform">
                  <Sparkles className="h-full w-full -rotate-12" />
                </div>
                <CardHeader>
                  <CardTitle className="text-xl font-headline">Features</CardTitle>
                  <CardDescription className="text-white/80">
                    Collaborate with others
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/artist/features">
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-white font-bold gap-2 shadow-sm">
                      <Users className="h-4 w-4" />
                      Find Collabs
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            <section className="space-y-4">
              <h3 className="text-xl font-bold font-headline flex items-center gap-2 text-primary">
                <Briefcase className="h-5 w-5 text-accent" />
                Gig Status
              </h3>
              <div className="grid gap-4">
                {appsLoading ? (
                  <div className="h-24 flex items-center justify-center bg-white rounded-xl">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : applications && applications.length > 0 ? (
                  applications.slice(0, 5).map((app: any) => (
                    <Card key={`${app.eventId}-${app.artistId}`} className="border-none shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-primary font-bold">
                            P{app.price}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm">Application for Gig</h4>
                            <p className="text-[10px] text-muted-foreground">{new Date(app.createdAt?.seconds * 1000).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <Badge variant={app.status === 'Accepted' ? 'default' : app.status === 'Rejected' ? 'destructive' : 'secondary'} className="text-[10px]">
                            {app.status}
                          </Badge>
                          {app.status === 'Accepted' && app.gigMakerWhatsapp && (
                            <WhatsAppButton 
                              phoneNumber={app.gigMakerWhatsapp}
                              message={`Hi ${app.businessName || 'there'}, my application for the event was accepted. I'm ready to talk about the details!`}
                              size="sm"
                              className="bg-green-600 text-white hover:bg-green-700 font-bold h-8 text-xs"
                            >
                              Contact Gig Maker
                            </WhatsAppButton>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic text-center py-4 bg-white rounded-xl border border-dashed">No active applications.</p>
                )}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-bold font-headline flex items-center gap-2 text-primary">
                <Sparkles className="h-5 w-5 text-accent" />
                Collaboration Requests
              </h3>
              <div className="grid gap-4">
                {featuresLoading ? (
                  <div className="h-24 flex items-center justify-center bg-white rounded-xl">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : featureRequests && featureRequests.length > 0 ? (
                  featureRequests.map((req: any) => (
                    <Card key={req.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10 border">
                              <AvatarFallback className="bg-secondary text-primary font-bold text-xs">
                                {req.senderName?.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-bold text-sm">{req.senderName}</h4>
                              <p className="text-[10px] text-muted-foreground">Request: {req.status}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px]">{req.status}</Badge>
                        </div>
                        
                        <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg italic">
                          "{req.message}"
                        </p>

                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {req.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700 text-white font-bold h-8 gap-1"
                                onClick={() => handleUpdateFeatureStatus(req.id, 'Accepted')}
                              >
                                <CheckCircle2 className="h-3 w-3" /> Accept
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                className="h-8 font-bold gap-1"
                                onClick={() => handleUpdateFeatureStatus(req.id, 'Rejected')}
                              >
                                <XCircle className="h-3 w-3" /> Reject
                              </Button>
                            </>
                          )}
                          
                          {req.status === 'Accepted' && (
                            <>
                              {req.senderWhatsapp && (
                                <WhatsAppButton 
                                  phoneNumber={req.senderWhatsapp} 
                                  message={`Hi ${req.senderName}, I've accepted your collaboration request on GigConnect. Let's work!`}
                                  size="sm"
                                  className="bg-green-600 text-white hover:bg-green-700 font-bold h-8"
                                />
                              )}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 gap-1 text-muted-foreground"
                                onClick={() => setRequestToDelete(req.id)}
                              >
                                <Archive className="h-3 w-3" /> Done
                              </Button>
                            </>
                          )}

                          {req.status === 'Rejected' && (
                             <Button 
                             variant="ghost" 
                             size="sm" 
                             className="h-8 gap-1 text-destructive"
                             onClick={() => setRequestToDelete(req.id)}
                           >
                             <Trash2 className="h-3 w-3" /> Clear
                           </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic text-center py-4 bg-white rounded-xl border border-dashed">No feature requests received.</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      <AlertDialog open={!!requestToDelete} onOpenChange={(open) => !open && setRequestToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the request from your dashboard. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => requestToDelete && handleDeleteFeature(requestToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
