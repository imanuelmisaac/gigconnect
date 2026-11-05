"use client"

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useDoc, useAuth } from '@/firebase';
import { 
  collection, 
  query, 
  where, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  getDoc,
  writeBatch,
  getDocs,
  setDoc
} from 'firebase/firestore';
import { 
  Loader2, 
  Users, 
  ShieldCheck, 
  Music, 
  Building2, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  CreditCard,
  Crown,
  Search,
  LayoutDashboard,
  LogOut,
  AlertTriangle,
  RefreshCcw,
  ArrowUpDown,
  UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

const TIER_OPTIONS = [
  { value: 'free', label: 'Free Tier' },
  { value: 'package2', label: 'Essential Pro (P20)' },
  { value: 'package3', label: 'Standard Pro (P60)' },
  { value: 'package4', label: 'Ultimate Pro (P80)' }
];

// Updated admin UID
const ADMIN_UID = 'rJq93j6Mi5NuAPEPNDYpLtSgFfc2';

export default function AdminDashboardPage() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettingAdmin, setIsSettingAdmin] = useState(false);

  // Auth Protection
  const userDocRef = useMemo(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: currentUserProfile, loading: profileLoading } = useDoc(userDocRef);

  useEffect(() => {
    if (!userLoading && !profileLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      
      const isSystemAdmin = user.uid === ADMIN_UID;
      const hasAdminRole = currentUserProfile?.role === 'admin';

      if (!isSystemAdmin && !hasAdminRole) {
        router.push('/login');
      }
    }
  }, [user, userLoading, currentUserProfile, profileLoading, router]);

  // Data Queries
  const usersQuery = useMemo(() => query(collection(db, 'users')), [db]);
  const artistsQuery = useMemo(() => query(collection(db, 'artists')), [db]);
  const eventsQuery = useMemo(() => query(collection(db, 'events')), [db]);

  const { data: users, loading: usersLoading } = useCollection(usersQuery);
  const { data: artists, loading: artistsLoading } = useCollection(artistsQuery);
  const { data: events, loading: eventsLoading } = useCollection(eventsQuery);

  // Filtering
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter((u: any) => 
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    return events.filter((e: any) => 
      e.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [events, searchTerm]);

  // Actions
  const handleUpdateEventPayment = (eventId: string, status: 'Complete' | 'Incomplete') => {
    const eventRef = doc(db, 'events', eventId);
    updateDoc(eventRef, { paymentStatus: status, updatedAt: serverTimestamp() });
    toast({ title: "Event Updated", description: `Payment status set to ${status}` });
  };

  const handleUpdateArtistTier = (artistId: string, tier: string) => {
    const artistRef = doc(db, 'artists', artistId);
    updateDoc(artistRef, { subscriptionTier: tier, updatedAt: serverTimestamp() });
    toast({ title: "Artist Updated", description: `Tier updated to ${tier.toUpperCase()}` });
  };

  const handleSetAdminRole = async () => {
    if (!user) return;
    setIsSettingAdmin(true);
    try {
      await setDoc(doc(db, 'users', user.uid), { 
        role: 'admin',
        updatedAt: serverTimestamp() 
      }, { merge: true });
      toast({ title: "Role Updated", description: "You now have the administrative role in the database." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setIsSettingAdmin(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    const uid = userToDelete.userId;

    try {
      // 1. Delete profiles
      await deleteDoc(doc(db, 'users', uid));
      await deleteDoc(doc(db, 'artists', uid));
      await deleteDoc(doc(db, 'gig-makers', uid));
      
      toast({ title: "User Deleted", description: "All profile documents removed." });
      setUserToDelete(null);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setIsDeleting(false);
    }
  };

  if (userLoading || profileLoading || usersLoading || artistsLoading || eventsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/10">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/10 flex">
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col shrink-0">
        <div className="p-6 border-b border-white/10 flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-accent" />
          <span className="text-xl font-bold font-headline text-white">Admin Console</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" onClick={() => setActiveTab('users')}>
            <Users className="mr-2 h-4 w-4" /> User Base
          </Button>
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" onClick={() => setActiveTab('events')}>
            <Building2 className="mr-2 h-4 w-4" /> Gig Oversight
          </Button>
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" onClick={() => setActiveTab('payments')}>
            <CreditCard className="mr-2 h-4 w-4" /> Subscriptions
          </Button>
        </nav>
        <div className="p-4 border-t border-white/10">
           <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" onClick={() => auth.signOut()}>
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold font-headline text-slate-900">Platform Manager</h1>
            <p className="text-muted-foreground">Human verification & content oversight</p>
            {user?.uid === ADMIN_UID && currentUserProfile?.role !== 'admin' && (
              <Button size="sm" variant="outline" className="w-fit gap-2 border-accent text-accent" onClick={handleSetAdminRole} disabled={isSettingAdmin}>
                {isSettingAdmin ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Claim Admin Role in Database
              </Button>
            )}
          </div>
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Filter list..." 
              className="pl-10" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border-none shadow-sm">
            <CardContent className="p-6">
               <p className="text-xs font-bold text-muted-foreground uppercase">Total Users</p>
               <p className="text-3xl font-black">{users?.length || 0}</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-none shadow-sm">
            <CardContent className="p-6">
               <p className="text-xs font-bold text-muted-foreground uppercase">Artists</p>
               <p className="text-3xl font-black text-blue-600">{artists?.length || 0}</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-none shadow-sm">
            <CardContent className="p-6">
               <p className="text-xs font-bold text-muted-foreground uppercase">Gigs</p>
               <p className="text-3xl font-black text-accent">{events?.length || 0}</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-none shadow-sm">
            <CardContent className="p-6">
               <p className="text-xs font-bold text-muted-foreground uppercase">Incomplete Gigs</p>
               <p className="text-3xl font-black text-destructive">{events?.filter((e: any) => e.paymentStatus === 'Incomplete').length || 0}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="users" className="space-y-4">
             <div className="grid gap-4">
               {filteredUsers.map((u: any) => (
                 <Card key={u.id} className="border-none shadow-sm overflow-hidden">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{u.firstName?.substring(0, 1)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold">{u.firstName} {u.lastName}</p>
                          <p className="text-xs text-muted-foreground">{u.email} • <span className="uppercase">{u.role}</span></p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {u.role !== 'admin' && u.userId !== ADMIN_UID && (
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setUserToDelete(u)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                 </Card>
               ))}
             </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
             <div className="grid gap-4">
               {filteredEvents.map((e: any) => (
                 <Card key={e.id} className="border-none shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-secondary rounded flex items-center justify-center"><Music className="h-5 w-5 text-primary" /></div>
                        <div>
                          <p className="font-bold">{e.title}</p>
                          <p className="text-xs text-muted-foreground">{e.location} • Status: <span className="font-bold">{e.paymentStatus}</span></p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {e.paymentStatus === 'Incomplete' ? (
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleUpdateEventPayment(e.id, 'Complete')}>Mark Complete</Button>
                        ) : (
                          <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleUpdateEventPayment(e.id, 'Incomplete')}>Flag Incomplete</Button>
                        )}
                      </div>
                    </CardContent>
                 </Card>
               ))}
             </div>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
             <div className="grid gap-4">
               {artists?.map((artist: any) => (
                 <Card key={artist.id} className="border-none shadow-sm">
                    <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-primary/10">
                          <AvatarImage src={artist.profilePictureUrl} />
                          <AvatarFallback>{artist.artistName?.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold">{artist.artistName}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] uppercase">{artist.subscriptionTier || 'free'}</Badge>
                            <span className="text-xs text-muted-foreground">{artist.whatsappNumber}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <Select 
                          defaultValue={artist.subscriptionTier || 'free'} 
                          onValueChange={(val) => handleUpdateArtistTier(artist.id, val)}
                        >
                          <SelectTrigger className="w-[180px] h-9">
                            <SelectValue placeholder="Update Tier" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIER_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                 </Card>
               ))}
             </div>
          </TabsContent>
        </Tabs>
      </main>

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanent Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{userToDelete?.firstName}</strong>? This action will remove their primary profile and professional data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-white" disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
