"use client"

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useDoc, useAuth } from '@/firebase';
import { 
  collection, 
  query, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  setDoc,
  orderBy
} from 'firebase/firestore';
import { 
  Loader2, 
  Users, 
  ShieldCheck, 
  Calendar, 
  CreditCard,
  Search,
  LogOut,
  UserMinus,
  Mail,
  ShieldAlert,
  Megaphone,
  Copy,
  MessageCircle,
  Tag,
  Save,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const TIER_OPTIONS = [
  { value: 'free', label: 'Free Tier' },
  { value: 'package2', label: 'Essential Pro' },
  { value: 'package3', label: 'Standard Pro' },
  { value: 'package4', label: 'Ultimate Pro' }
];

const ADMIN_UID = 'rJq93j6Mi5NuAPEPNDYpLtSgFfc2';

export default function AdminDashboardPage() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [broadcastRole, setBroadcastRole] = useState('all');
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

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
        toast({ variant: "destructive", title: "Access Denied", description: "You do not have administrator privileges." });
        router.push('/login');
      }
    }
  }, [user, userLoading, currentUserProfile, profileLoading, router, toast]);

  const usersQuery = useMemo(() => query(collection(db, 'users'), orderBy('createdAt', 'desc')), [db]);
  const artistsQuery = useMemo(() => query(collection(db, 'artists')), [db]);
  const eventsQuery = useMemo(() => query(collection(db, 'events'), orderBy('createdAt', 'desc')), [db]);
  const gigMakersQuery = useMemo(() => query(collection(db, 'gig-makers')), [db]);

  const { data: users, loading: usersLoading } = useCollection(usersQuery);
  const { data: artists, loading: artistsLoading } = useCollection(artistsQuery);
  const { data: events, loading: eventsLoading } = useCollection(eventsQuery);
  const { data: gigMakers, loading: gigMakersLoading } = useCollection(gigMakersQuery);

  const configRef = useMemo(() => doc(db, 'system', 'config'), [db]);
  const { data: systemConfig } = useDoc(configRef);
  const [localConfig, setLocalConfig] = useState<any>({
    eventFee: 25,
    package2Price: 20,
    package3Price: 60,
    package4Price: 80,
    specialActive: false,
    specialDiscount: 0,
    specialName: '',
    specialExpires: ''
  });

  useEffect(() => {
    if (systemConfig) {
      setLocalConfig(systemConfig);
    }
  }, [systemConfig]);

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

  const broadcastUsers = useMemo(() => {
    if (!users) return [];
    if (broadcastRole === 'all') return users;
    return users.filter((u: any) => u.role === broadcastRole);
  }, [users, broadcastRole]);

  const handleUpdateConfig = async () => {
    setSavingConfig(true);
    try {
      await setDoc(configRef, {
        ...localConfig,
        updatedAt: serverTimestamp()
      }, { merge: true });
      toast({ title: "Configuration Saved", description: "Global settings and specials have been updated." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Update Error", description: e.message });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleUpdateUserTier = async (userId: string, tier: string) => {
    try {
      const artistRef = doc(db, 'artists', userId);
      await updateDoc(artistRef, {
        subscriptionTier: tier,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Subscription Tier Updated", description: `User is now on the ${tier.toUpperCase()} plan.` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Tier Update Failed", description: "Ensure the user is a registered artist." });
    }
  };

  const handleUpdateEventStatus = async (eventId: string, status: string) => {
    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        paymentStatus: status,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Event Status Updated", description: `Visibility is now set to ${status}.` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const handleCopyEmails = () => {
    const emails = broadcastUsers.map((u: any) => u.email).filter(Boolean).join(', ');
    if (!emails) {
      toast({ variant: "destructive", title: "No Emails", description: "No users found in the selected category." });
      return;
    }
    navigator.clipboard.writeText(emails);
    toast({ title: "Emails Copied", description: "Pasted them into your BCC field." });
  };

  const handleCopyWhatsApp = () => {
    const targetIds = new Set(broadcastUsers.map((u: any) => u.userId));
    const artistPhones = artists?.filter((a: any) => targetIds.has(a.userId)).map((a: any) => a.whatsappNumber);
    const gmPhones = gigMakers?.filter((g: any) => targetIds.has(g.userId)).map((g: any) => g.whatsappNumber);
    const allPhones = [...(artistPhones || []), ...(gmPhones || [])].filter(Boolean).join(', ');
    
    if (!allPhones) {
      toast({ variant: "destructive", title: "No Phone Numbers", description: "No valid contact numbers found." });
      return;
    }

    navigator.clipboard.writeText(allPhones);
    toast({ title: "WhatsApp Numbers Copied", description: "Ready for your broadcast list." });
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    const uid = userToDelete.userId;
    try {
      await deleteDoc(doc(db, 'users', uid));
      await deleteDoc(doc(db, 'artists', uid));
      await deleteDoc(doc(db, 'gig-makers', uid));
      toast({ title: "User Profile Purged", description: "All professional data has been removed from the platform." });
      setUserToDelete(null);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Purge Error", description: e.message });
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
            <Calendar className="mr-2 h-4 w-4" /> Platform Events
          </Button>
          <Button 
            variant="ghost" 
            className={`w-full justify-start text-white hover:bg-white/10 ${activeTab === 'specials' ? 'bg-white/10' : ''}`} 
            onClick={() => setActiveTab('specials')}
          >
            <Tag className="mr-2 h-4 w-4" /> Specials
          </Button>
          <Button 
            variant="ghost" 
            className={`w-full justify-start text-white hover:bg-white/10 ${activeTab === 'broadcast' ? 'bg-white/10' : ''}`} 
            onClick={() => setActiveTab('broadcast')}
          >
            <Megaphone className="mr-2 h-4 w-4" /> Broadcast
          </Button>
        </nav>
        <div className="p-4 border-t border-white/10">
           <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" onClick={() => {
             auth.signOut();
             toast({ title: "Logged Out", description: "Admin session ended." });
           }}>
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold font-headline text-slate-900 uppercase">Platform Control</h1>
            <p className="text-muted-foreground text-sm">Managing {users?.length} users and {events?.length} events</p>
          </div>
          {(activeTab === 'users' || activeTab === 'events') && (
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder={`Search ${activeTab}...`} 
                className="pl-10 h-11 border-none shadow-sm" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
          )}
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="users" className="space-y-4">
             <div className="grid gap-4">
               {filteredUsers.length > 0 ? filteredUsers.map((u: any) => {
                 const artist = artists?.find((a: any) => a.userId === u.userId);
                 const currentTier = artist?.subscriptionTier || 'free';
                 
                 return (
                   <Card key={u.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 border">
                            <AvatarImage src={artist?.profilePictureUrl} />
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

                        <div className="flex items-center gap-3">
                          {(u.role === 'artist' || u.role === 'dj') && (
                            <div className="flex flex-col gap-1 min-w-[140px]">
                              <p className="text-[9px] font-bold text-muted-foreground uppercase">Current Tier</p>
                              <Select value={currentTier} onValueChange={(val) => handleUpdateUserTier(u.userId, val)}>
                                <SelectTrigger className="h-8 text-[10px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {TIER_OPTIONS.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                          <div className="flex gap-2">
                            {u.role !== 'admin' && u.userId !== ADMIN_UID && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-destructive hover:bg-destructive/10 h-8" 
                                onClick={() => setUserToDelete(u)}
                                aria-label="Delete User"
                              >
                                <UserMinus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                   </Card>
                 );
               }) : (
                 <div className="text-center py-20 bg-white rounded-xl shadow-sm border-dashed border-2">
                   <Users className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
                   <p className="text-sm text-muted-foreground">No users found</p>
                 </div>
               )}
             </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
             <div className="grid gap-4">
               {filteredEvents.length > 0 ? filteredEvents.map((e: any) => (
                 <Card key={e.id} className="border-none shadow-sm">
                   <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                     <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-sm tracking-tight">{e.title}</p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span>{e.location}</span>
                            <span>•</span>
                            <span>{e.date}</span>
                            <span>•</span>
                            <Badge variant={e.status === 'Open' ? 'secondary' : 'outline'} className="text-[8px] py-0 px-1">{e.status}</Badge>
                          </div>
                        </div>
                     </div>
                     
                     <div className="flex items-center gap-3">
                        <div className="text-right hidden md:block">
                          <p className="text-[9px] font-bold text-muted-foreground uppercase">Budget</p>
                          <p className="text-xs font-bold text-green-600">P{e.maxPrice}</p>
                        </div>
                        <div className="flex flex-col gap-1 min-w-[150px]">
                          <p className="text-[9px] font-bold text-muted-foreground uppercase">Payment Status</p>
                          <Select 
                            value={e.paymentStatus || 'Pending'} 
                            onValueChange={(val) => handleUpdateEventStatus(e.id || e.eventId, val)}
                          >
                            <SelectTrigger className="h-8 text-[10px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="Complete">Complete (Active)</SelectItem>
                              <SelectItem value="Incomplete">Incomplete (Hidden)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {e.paymentStatus !== 'Complete' && (
                          <div className="text-amber-500" title="This listing is hidden until marked Complete">
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                        )}
                     </div>
                   </CardContent>
                 </Card>
               )) : (
                 <div className="text-center py-20 bg-white rounded-xl shadow-sm border-dashed border-2">
                    <Calendar className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No events listed</p>
                 </div>
               )}
             </div>
          </TabsContent>

          <TabsContent value="specials" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" /> Standard Pricing (P)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">Event Creation Fee</Label>
                    <Input type="number" value={localConfig.eventFee} onChange={(e) => setLocalConfig({...localConfig, eventFee: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">Essential Pro (Tier 2)</Label>
                    <Input type="number" value={localConfig.package2Price} onChange={(e) => setLocalConfig({...localConfig, package2Price: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">Standard Pro (Tier 3)</Label>
                    <Input type="number" value={localConfig.package3Price} onChange={(e) => setLocalConfig({...localConfig, package3Price: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">Ultimate Pro (Tier 4)</Label>
                    <Input type="number" value={localConfig.package4Price} onChange={(e) => setLocalConfig({...localConfig, package4Price: Number(e.target.value)})} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Tag className="h-5 w-5 text-accent" /> Special Promotion
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-bold">Activate Special</Label>
                      <p className="text-[10px] text-muted-foreground uppercase">Global discount for all fees</p>
                    </div>
                    <Switch checked={localConfig.specialActive} onCheckedChange={(val) => setLocalConfig({...localConfig, specialActive: val})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">Promotion Name</Label>
                    <Input placeholder="e.g. Independence Day Sale" value={localConfig.specialName} onChange={(e) => setLocalConfig({...localConfig, specialName: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">Discount Percentage (%)</Label>
                    <Input type="number" value={localConfig.specialDiscount} onChange={(e) => setLocalConfig({...localConfig, specialDiscount: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">Expires On</Label>
                    <Input type="date" value={localConfig.specialExpires} onChange={(e) => setLocalConfig({...localConfig, specialExpires: e.target.value})} />
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button className="w-full bg-primary gap-2 font-bold uppercase tracking-wider" onClick={handleUpdateConfig} disabled={savingConfig}>
                    {savingConfig ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Deploy Updates
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="broadcast" className="space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 uppercase tracking-tight">
                  <Megaphone className="h-5 w-5 text-accent" /> Communication Hub
                </CardTitle>
                <CardDescription>Blast notifications or capture leads from your user base</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <Label className="text-xs font-bold">Targeted Audience</Label>
                    <Select value={broadcastRole} onValueChange={setBroadcastRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Registered ({users?.length})</SelectItem>
                        <SelectItem value="artist">Artists ({users?.filter((u: any) => u.role === 'artist').length})</SelectItem>
                        <SelectItem value="dj">DJs ({users?.filter((u: any) => u.role === 'dj').length})</SelectItem>
                        <SelectItem value="gig-maker">Gig Makers ({users?.filter((u: any) => u.role === 'gig-maker').length})</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="gap-2 font-bold h-10" onClick={handleCopyEmails}>
                      <Copy className="h-4 w-4" /> Emails (BCC)
                    </Button>
                    <Button variant="outline" className="gap-2 font-bold h-10 text-green-600 border-green-200" onClick={handleCopyWhatsApp}>
                      <MessageCircle className="h-4 w-4" /> WhatsApps
                    </Button>
                  </div>
                </div>

                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                  <p className="text-[11px] font-bold text-primary mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Communication Workflow
                  </p>
                  <ul className="text-[10px] text-muted-foreground list-disc pl-4 space-y-1">
                    <li><strong>Email Blast</strong>: Copy emails and paste into your email client&apos;s BCC field for bulk notification.</li>
                    <li><strong>WhatsApp Broadcast</strong>: Import these numbers into a WhatsApp Broadcast list for direct messaging.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Recent Targets ({broadcastUsers.length})</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {broadcastUsers.slice(0, 10).map((u: any) => (
                  <Card key={`bc-${u.id}`} className="border-none shadow-sm">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-[10px] font-bold">{u.firstName?.substring(0, 1)}</AvatarFallback>
                        </Avatar>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold truncate">{u.firstName} {u.lastName}</p>
                          <p className="text-[9px] text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => {
                        navigator.clipboard.writeText(u.email);
                        toast({ title: "Email Copied" });
                      }}>Copy</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {broadcastUsers.length > 10 && <p className="text-center text-[10px] text-muted-foreground italic">...and {broadcastUsers.length - 10} more</p>}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex justify-center mb-4"><div className="bg-destructive/10 p-3 rounded-full"><ShieldAlert className="h-8 w-8 text-destructive" /></div></div>
            <AlertDialogTitle className="text-center uppercase font-headline">Platform Removal</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              This will wipe all professional and profile data for <strong>{userToDelete?.firstName}</strong>. 
              They will be removed from all discovery features.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="grid grid-cols-2 gap-2">
            <AlertDialogCancel className="mt-0">Back</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-white hover:bg-destructive/90 font-bold" disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Wipe'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
