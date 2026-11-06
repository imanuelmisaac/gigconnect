
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
  UserPlus,
  UserMinus,
  Mail,
  ShieldAlert
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const TIER_OPTIONS = [
  { value: 'free', label: 'Free Tier' },
  { value: 'package2', label: 'Essential Pro (P20)' },
  { value: 'package3', label: 'Standard Pro (P60)' },
  { value: 'package4', label: 'Ultimate Pro (P80)' }
];

// System Admin UID
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
      // Delete profiles across all possible collections
      await deleteDoc(doc(db, 'users', uid));
      await deleteDoc(doc(db, 'artists', uid));
      await deleteDoc(doc(db, 'gig-makers', uid));
      
      toast({ 
        title: "User Profile Removed", 
        description: "Firestore records deleted. Note: You must manually delete the user from the Firebase Authentication console for full removal." 
      });
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
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col shrink-0">
        <div className="p-6 border-b border-white/10 flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-accent" />
          <span className="text-xl font-bold font-headline text-white">Admin Console</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Button 
            variant="ghost" 
            className={`w-full justify-start text-white hover:bg-white/10 ${activeTab === 'users' ? 'bg-white/10' : ''}`} 
            onClick={() => setActiveTab('users')}
          >
            <Users className="mr-2 h-4 w-4" /> User Base
          </Button>
          <Button 
            variant="ghost" 
            className={`w-full justify-start text-white hover:bg-white/10 ${activeTab === 'events' ? 'bg-white/10' : ''}`} 
            onClick={() => setActiveTab('events')}
          >
            <Building2 className="mr-2 h-4 w-4" /> Gig Oversight
          </Button>
          <Button 
            variant="ghost" 
            className={`w-full justify-start text-white hover:bg-white/10 ${activeTab === 'payments' ? 'bg-white/10' : ''}`} 
            onClick={() => setActiveTab('payments')}
          >
            <CreditCard className="mr-2 h-4 w-4" /> Subscriptions
          </Button>
        </nav>
        <div className="p-4 border-t border-white/10">
           <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" onClick={() => auth.signOut()}>
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold font-headline text-slate-900">Platform Manager</h1>
            <p className="text-muted-foreground">User lifecycle & content moderation</p>
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
              placeholder="Search users or events..." 
              className="pl-10 h-11 border-none shadow-sm" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border-none shadow-sm overflow-hidden">
            <div className="h-1 bg-primary" />
            <CardContent className="p-6">
               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Accounts</p>
               <p className="text-3xl font-black mt-1">{users?.length || 0}</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-none shadow-sm overflow-hidden">
            <div className="h-1 bg-blue-600" />
            <CardContent className="p-6">
               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Talent Profiles</p>
               <p className="text-3xl font-black text-blue-600 mt-1">{artists?.length || 0}</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-none shadow-sm overflow-hidden">
            <div className="h-1 bg-accent" />
            <CardContent className="p-6">
               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Gigs</p>
               <p className="text-3xl font-black text-accent mt-1">{events?.length || 0}</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-none shadow-sm overflow-hidden">
            <div className="h-1 bg-destructive" />
            <CardContent className="p-6">
               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Unpaid Listings</p>
               <p className="text-3xl font-black text-destructive mt-1">{events?.filter((e: any) => e.paymentStatus === 'Incomplete').length || 0}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="users" className="space-y-4">
             <div className="grid gap-4">
               {filteredUsers.length > 0 ? filteredUsers.map((u: any) => (
                 <Card key={u.id} className="border-none shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {u.firstName?.substring(0, 1) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-sm">{u.firstName} {u.lastName}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Mail className="h-2.5 w-2.5" /> {u.email}
                            </span>
                            <Badge variant="secondary" className="text-[9px] uppercase px-1.5 py-0">{u.role}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {u.role !== 'admin' && u.userId !== ADMIN_UID && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive hover:bg-destructive/10" 
                            onClick={() => setUserToDelete(u)}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        )}
                        {u.role === 'admin' && (
                           <ShieldCheck className="h-4 w-4 text-green-600 mr-2" />
                        )}
                      </div>
                    </CardContent>
                 </Card>
               )) : (
                 <div className="text-center py-20 bg-white rounded-xl shadow-sm border-dashed border-2">
                   <Users className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
                   <p className="text-sm text-muted-foreground">No users found matching "{searchTerm}"</p>
                 </div>
               )}
             </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
             <div className="grid gap-4">
               {filteredEvents.length > 0 ? filteredEvents.map((e: any) => (
                 <Card key={e.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-secondary rounded-lg flex items-center justify-center">
                          <Music className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{e.title}</p>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Building2 className="h-2.5 w-2.5" /> {e.location}
                            </span>
                            <Badge 
                              variant={e.paymentStatus === 'Complete' ? 'secondary' : 'destructive'} 
                              className="text-[9px] uppercase px-1.5 py-0"
                            >
                              {e.paymentStatus}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {e.paymentStatus === 'Incomplete' ? (
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 text-white font-bold text-[10px] h-8" 
                            onClick={() => handleUpdateEventPayment(e.id, 'Complete')}
                          >
                            Approve
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-destructive border-destructive/20 hover:bg-destructive/10 text-[10px] h-8" 
                            onClick={() => handleUpdateEventPayment(e.id, 'Incomplete')}
                          >
                            Flag Unpaid
                          </Button>
                        )}
                      </div>
                    </CardContent>
                 </Card>
               )) : (
                 <div className="text-center py-20 bg-white rounded-xl shadow-sm border-dashed border-2">
                   <Music className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
                   <p className="text-sm text-muted-foreground">No gigs found matching "{searchTerm}"</p>
                 </div>
               )}
             </div>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
             <div className="grid gap-4">
               {artists?.length ? artists.map((artist: any) => (
                 <Card key={artist.id} className="border-none shadow-sm">
                    <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-primary/10 shadow-sm">
                          <AvatarImage src={artist.profilePictureUrl} />
                          <AvatarFallback className="bg-secondary text-primary font-bold">
                            {artist.artistName?.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-sm">{artist.artistName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[9px] uppercase font-black tracking-widest text-primary border-primary/20">
                              {artist.subscriptionTier || 'free'}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">{artist.whatsappNumber}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <Select 
                          defaultValue={artist.subscriptionTier || 'free'} 
                          onValueChange={(val) => handleUpdateArtistTier(artist.id, val)}
                        >
                          <SelectTrigger className="w-[180px] h-9 text-xs">
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
               )) : <p className="text-center text-sm text-muted-foreground py-10">No artist profiles found.</p>}
             </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Delete User Confirmation */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
               <div className="bg-destructive/10 p-3 rounded-full">
                 <ShieldAlert className="h-8 w-8 text-destructive" />
               </div>
            </div>
            <AlertDialogTitle className="text-center">Confirm Platform Removal</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Are you sure you want to delete <strong>{userToDelete?.firstName} {userToDelete?.lastName}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 text-destructive text-[11px]">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="font-bold uppercase tracking-wider">Warning</AlertTitle>
              <AlertDescription>
                This will wipe their Firestore profile data. <strong>You must also manually delete them from the Firebase Auth Console</strong> to prevent them from logging back in.
              </AlertDescription>
            </Alert>
          </div>
          <AlertDialogFooter className="grid grid-cols-2 gap-2">
            <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser} 
              className="bg-destructive text-white hover:bg-destructive/90 font-bold" 
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Wipe'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
