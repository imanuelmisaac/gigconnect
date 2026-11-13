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
  setDoc
} from 'firebase/firestore';
import { 
  Loader2, 
  Users, 
  ShieldCheck, 
  Music, 
  Building2, 
  CreditCard,
  Search,
  LogOut,
  AlertTriangle,
  UserPlus,
  UserMinus,
  Mail,
  ShieldAlert,
  Zap,
  Megaphone,
  Copy,
  MessageCircle,
  Tag,
  Save,
  CheckCircle2
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
  const [isSettingAdmin, setIsSettingAdmin] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

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
  const gigMakersQuery = useMemo(() => query(collection(db, 'gig-makers')), [db]);

  const { data: users, loading: usersLoading } = useCollection(usersQuery);
  const { data: artists, loading: artistsLoading } = useCollection(artistsQuery);
  const { data: events, loading: eventsLoading } = useCollection(eventsQuery);
  const { data: gigMakers, loading: gigMakersLoading } = useCollection(gigMakersQuery);

  // System Config
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

  // Filtering
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter((u: any) => 
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const broadcastUsers = useMemo(() => {
    if (!users) return [];
    if (broadcastRole === 'all') return users;
    return users.filter((u: any) => u.role === broadcastRole);
  }, [users, broadcastRole]);

  // Actions
  const handleUpdateConfig = async () => {
    setSavingConfig(true);
    try {
      await setDoc(configRef, {
        ...localConfig,
        updatedAt: serverTimestamp()
      }, { merge: true });
      toast({ title: "Configuration Saved", description: "Global settings and specials have been updated." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleCopyEmails = () => {
    const emails = broadcastUsers.map((u: any) => u.email).filter(Boolean).join(', ');
    navigator.clipboard.writeText(emails);
    toast({ title: "Emails Copied", description: "Pasted them into your BCC field." });
  };

  const handleCopyWhatsApp = () => {
    // We need to match users with their profiles to get phone numbers
    const targetIds = new Set(broadcastUsers.map((u: any) => u.userId));
    const artistPhones = artists?.filter((a: any) => targetIds.has(a.userId)).map((a: any) => a.whatsappNumber);
    const gmPhones = gigMakers?.filter((g: any) => targetIds.has(g.userId)).map((g: any) => g.whatsappNumber);
    const allPhones = [...(artistPhones || []), ...(gmPhones || [])].filter(Boolean).join(', ');
    
    navigator.clipboard.writeText(allPhones);
    toast({ title: "Numbers Copied", description: "Use them to create a WhatsApp Broadcast list." });
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    const uid = userToDelete.userId;
    try {
      await deleteDoc(doc(db, 'users', uid));
      await deleteDoc(doc(db, 'artists', uid));
      await deleteDoc(doc(db, 'gig-makers', uid));
      toast({ title: "User Purged", description: "Profile data removed. Delete from Auth Console to finalize." });
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
          <Button 
            variant="ghost" 
            className={`w-full justify-start text-white hover:bg-white/10 ${activeTab === 'users' ? 'bg-white/10' : ''}`} 
            onClick={() => setActiveTab('users')}
          >
            <Users className="mr-2 h-4 w-4" /> User Base
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
           <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" onClick={() => auth.signOut()}>
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold font-headline text-slate-900">Platform Manager</h1>
            <p className="text-muted-foreground">User lifecycle & platform configuration</p>
          </div>
          {activeTab === 'users' && (
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search name or email..." 
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
               {filteredUsers.length > 0 ? filteredUsers.map((u: any) => (
                 <Card key={u.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
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
                      </div>
                    </CardContent>
                 </Card>
               )) : (
                 <div className="text-center py-20 bg-white rounded-xl shadow-sm border-dashed border-2">
                   <Users className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
                   <p className="text-sm text-muted-foreground">No users found</p>
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
                    <Label>Event Creation Fee</Label>
                    <Input type="number" value={localConfig.eventFee} onChange={(e) => setLocalConfig({...localConfig, eventFee: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Essential Pro (Tier 2)</Label>
                    <Input type="number" value={localConfig.package2Price} onChange={(e) => setLocalConfig({...localConfig, package2Price: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Standard Pro (Tier 3)</Label>
                    <Input type="number" value={localConfig.package3Price} onChange={(e) => setLocalConfig({...localConfig, package3Price: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Ultimate Pro (Tier 4)</Label>
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
                      <Label>Activate Special</Label>
                      <p className="text-[10px] text-muted-foreground">Apply global discount to all fees</p>
                    </div>
                    <Switch checked={localConfig.specialActive} onCheckedChange={(val) => setLocalConfig({...localConfig, specialActive: val})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Promotion Name</Label>
                    <Input placeholder="e.g. Easter Madness" value={localConfig.specialName} onChange={(e) => setLocalConfig({...localConfig, specialName: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Discount Percentage (%)</Label>
                    <Input type="number" value={localConfig.specialDiscount} onChange={(e) => setLocalConfig({...localConfig, specialDiscount: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Expires On</Label>
                    <Input type="date" value={localConfig.specialExpires} onChange={(e) => setLocalConfig({...localConfig, specialExpires: e.target.value})} />
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button className="w-full bg-primary gap-2" onClick={handleUpdateConfig} disabled={savingConfig}>
                    {savingConfig ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Config & Specials
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="broadcast" className="space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-accent" /> User Communication
                </CardTitle>
                <CardDescription>Contact specific groups of users via external tools</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <Label>Select Target Group</Label>
                    <Select value={broadcastRole} onValueChange={setBroadcastRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users ({users?.length})</SelectItem>
                        <SelectItem value="artist">Artists & Musician ({users?.filter((u: any) => u.role === 'artist').length})</SelectItem>
                        <SelectItem value="dj">DJs ({users?.filter((u: any) => u.role === 'dj').length})</SelectItem>
                        <SelectItem value="gig-maker">Gig Makers & Bars ({users?.filter((u: any) => u.role === 'gig-maker').length})</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="gap-2" onClick={handleCopyEmails}>
                      <Copy className="h-4 w-4" /> Copy Emails
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={handleCopyWhatsApp}>
                      <MessageCircle className="h-4 w-4 text-green-600" /> Copy WhatsApps
                    </Button>
                  </div>
                </div>

                <div className="bg-primary/5 p-4 rounded-xl space-y-2">
                  <p className="text-xs font-bold text-primary flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Instructions
                  </p>
                  <ul className="text-[10px] text-muted-foreground list-disc pl-4 space-y-1">
                    <li><strong>Emails</strong>: Paste into the BCC field of your email client to message everyone at once.</li>
                    <li><strong>WhatsApp</strong>: Add these numbers to a WhatsApp Broadcast list to send direct messages without creating a group.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              <h3 className="font-bold text-sm">Targeted List ({broadcastUsers.length})</h3>
              {broadcastUsers.slice(0, 10).map((u: any) => (
                <Card key={`bc-${u.id}`} className="border-none shadow-sm">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-[10px]">{u.firstName?.substring(0, 1)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs font-bold">{u.firstName} {u.lastName}</p>
                        <p className="text-[9px] text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => {
                        navigator.clipboard.writeText(u.email);
                        toast({ title: "Email Copied" });
                      }}>Email</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {broadcastUsers.length > 10 && <p className="text-center text-[10px] text-muted-foreground">Showing first 10 results</p>}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex justify-center mb-4"><div className="bg-destructive/10 p-3 rounded-full"><ShieldAlert className="h-8 w-8 text-destructive" /></div></div>
            <AlertDialogTitle className="text-center">Confirm Platform Removal</AlertDialogTitle>
            <AlertDialogDescription className="text-center">Wipe all data for <strong>{userToDelete?.firstName}</strong>?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="grid grid-cols-2 gap-2">
            <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-white hover:bg-destructive/90 font-bold" disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Wipe'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}