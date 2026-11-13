
"use client"

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useDoc } from '@/firebase';
import { doc, collection, query, updateDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Loader2, 
  ArrowLeft, 
  Music, 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  Calendar,
  MapPin,
  Video,
  Search,
  Filter,
  Megaphone,
  Copy,
  Check,
  Users,
  Heart,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { WhatsAppButton } from '@/components/whatsapp-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function GigMakerApplicationsPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [copied, setCopied] = useState(false);

  const gigMakerProfileRef = useMemo(() => {
    if (!db || !user) return null;
    return doc(db, 'gig-makers', user.uid);
  }, [db, user]);

  const { data: gigMakerProfile } = useDoc(gigMakerProfileRef);

  const eventDocRef = useMemo(() => {
    if (!db || !eventId) return null;
    return doc(db, 'events', eventId);
  }, [db, eventId]);

  const { data: event, loading: eventLoading } = useDoc(eventDocRef);

  const appsQuery = useMemo(() => {
    if (!db || !eventId) return null;
    return query(collection(db, 'events', eventId, 'applications'));
  }, [db, eventId]);

  const { data: rawApps, loading: appsLoading } = useCollection(appsQuery);

  const filteredApplications = useMemo(() => {
    if (!rawApps) return [];
    
    return rawApps
      .filter((app: any) => {
        if (activeTab === 'Interested') return false;
        const matchesStatus = activeTab === 'all' || app.status === activeTab;
        const matchesSearch = app.artistName?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
      })
      .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [rawApps, activeTab, searchQuery]);

  const bulkNumbers = useMemo(() => {
    return filteredApplications
      .filter((app: any) => app.artistWhatsapp)
      .map((app: any) => app.artistWhatsapp)
      .join(', ');
  }, [filteredApplications]);

  const handleUpdateStatus = (appId: string, status: 'Accepted' | 'Rejected') => {
    if (!db || !eventId || !gigMakerProfile) return;

    const appRef = doc(db, 'events', eventId, 'applications', appId);
    const updateData: any = { status, updatedAt: serverTimestamp() };

    if (status === 'Accepted') {
      updateData.gigMakerWhatsapp = gigMakerProfile.whatsappNumber || '';
      updateData.businessName = gigMakerProfile.businessName || 'the Gig Maker';
    }

    updateDoc(appRef, updateData)
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: appRef.path,
          operation: 'update',
          requestResourceData: updateData,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const copyBulkNumbers = () => {
    if (!bulkNumbers) return;
    navigator.clipboard.writeText(bulkNumbers);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Numbers Copied", description: "You can now paste these into your broadcast tool." });
  };

  const copyBulkEmails = () => {
    if (!event?.interestedUsers?.length) return;
    const emails = event.interestedUsers.join(', ');
    navigator.clipboard.writeText(emails);
    toast({ title: "Emails Copied", description: "All interested customer emails copied." });
  };

  if (userLoading || eventLoading || appsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/10">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/10 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="space-y-4">
          <Link href="/gig-maker/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-primary font-headline">{event?.title}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {event?.date}</span>
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {event?.location}</span>
                <span className="flex items-center gap-1 text-green-600 font-bold font-mono">P{event?.minPrice} - P{event?.maxPrice}</span>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Filtered View</p>
              <p className="text-4xl font-black text-primary">
                {activeTab === 'Interested' ? (event?.interestedUsers?.length || 0) : filteredApplications.length}
              </p>
            </div>
          </div>
        </header>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative w-full md:max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder={activeTab === 'Interested' ? "Search fans..." : "Search artist name..."}
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="Accepted">Accepted</TabsTrigger>
                  <TabsTrigger value="Rejected">Rejected</TabsTrigger>
                  <TabsTrigger value="Interested" className="gap-2">
                    <Heart className="h-3 w-3 fill-current" /> Fans
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {activeTab === 'Interested' ? (
          <div className="space-y-6">
            <Alert className="bg-accent/5 border-accent/20">
              <Heart className="h-4 w-4 text-accent fill-accent" />
              <AlertTitle className="font-bold text-accent">Customer Interest Leads</AlertTitle>
              <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                <p className="text-xs text-muted-foreground">
                  Found {event?.interestedUsers?.length || 0} fans who shared their email. These are your primary ticket buyers.
                </p>
                <Button size="sm" variant="outline" className="gap-2 shrink-0 border-accent text-accent" onClick={copyBulkEmails}>
                  <Copy className="h-4 w-4" />
                  Copy All Emails
                </Button>
              </AlertDescription>
            </Alert>

            <div className="grid gap-4">
              {event?.interestedUsers && event.interestedUsers.length > 0 ? (
                event.interestedUsers
                  .filter((email: string) => email.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((email: string, idx: number) => (
                    <Card key={idx} className="border-none shadow-sm slide-up">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="bg-primary/10 p-2.5 rounded-full">
                            <Mail className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-bold text-sm">{email}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">Potential Attendee</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 gap-2 text-muted-foreground hover:text-primary"
                          onClick={() => {
                            navigator.clipboard.writeText(email);
                            toast({ title: "Email Copied" });
                          }}
                        >
                          <Copy className="h-3 w-3" />
                          <span className="text-[10px] font-bold">COPY</span>
                        </Button>
                      </CardContent>
                    </Card>
                  ))
              ) : (
                <Card className="border-dashed border-2 py-20 text-center">
                  <CardContent className="space-y-4">
                    <div className="bg-accent/5 p-4 rounded-full w-fit mx-auto">
                      <Heart className="h-12 w-12 text-accent/20" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">No interest registered yet</h2>
                      <p className="text-muted-foreground">Leads will appear here as guests register interest in your public listing.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <>
            {activeTab !== 'pending' && filteredApplications.length > 0 && (
              <Alert className="bg-primary/5 border-primary/20">
                <Megaphone className="h-4 w-4" />
                <AlertTitle className="font-bold">Bulk Notify {activeTab === 'all' ? 'Current View' : activeTab}</AlertTitle>
                <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    Found {filteredApplications.length} contact numbers. Copy them to broadcast your decision.
                  </p>
                  <Button size="sm" variant="outline" className="gap-2 shrink-0" onClick={copyBulkNumbers}>
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    Copy Numbers
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-6">
              {filteredApplications.length > 0 ? (
                filteredApplications.map((app: any) => (
                  <Card key={app.id} className="border-none shadow-md overflow-hidden slide-up">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-primary/10">
                          <AvatarFallback className="bg-secondary text-primary font-bold">
                            {app.artistName?.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-xl font-headline">{app.artistName}</CardTitle>
                          <div className="flex gap-2 mt-1">
                            {app.artistGenres?.map((g: string) => (
                              <Badge key={g} variant="secondary" className="text-[10px] py-0">{g}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600 font-mono">P{app.price}</p>
                        <Badge className={`mt-1 ${
                          app.status === 'Accepted' ? 'bg-green-500' : 
                          app.status === 'Rejected' ? 'bg-red-500' : 'bg-orange-500'
                        }`}>
                          {app.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      <div className="bg-muted/30 p-4 rounded-lg italic text-sm text-muted-foreground">
                        "{app.message || 'No message provided.'}"
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Song Links</h4>
                          <div className="flex flex-col gap-2">
                            {app.songLinks?.map((link: string, i: number) => (
                              <a key={i} href={link} target="_blank" rel="noopener" className="inline-flex items-center gap-2 text-xs text-accent hover:underline">
                                <Music className="h-3 w-3" /> Song {i + 1} <ExternalLink className="h-2 w-2" />
                              </a>
                            )) || <span className="text-xs text-muted-foreground italic">No songs shared</span>}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Performance Video</h4>
                          {app.videoLink ? (
                            <a href={app.videoLink} target="_blank" rel="noopener" className="inline-flex items-center gap-2 text-xs text-accent hover:underline">
                              <Video className="h-3 w-3" /> Watch Video <ExternalLink className="h-2 w-2" />
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No video shared</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-muted/10 border-t p-4 flex flex-wrap justify-between gap-4">
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 font-bold gap-2" 
                          onClick={() => handleUpdateStatus(app.id, 'Accepted')}
                          disabled={app.status === 'Accepted'}
                        >
                          <CheckCircle2 className="h-4 w-4" /> Accept
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          className="font-bold gap-2"
                          onClick={() => handleUpdateStatus(app.id, 'Rejected')}
                          disabled={app.status === 'Rejected'}
                        >
                          <XCircle className="h-4 w-4" /> Reject
                        </Button>
                      </div>
                      
                      {app.artistWhatsapp && (
                        <WhatsAppButton 
                          phoneNumber={app.artistWhatsapp} 
                          message={`Hi ${app.artistName}, I saw your application for ${event?.title}. Let's discuss booking.`}
                          variant="outline"
                          className="border-green-500 text-green-600 hover:bg-green-50 font-bold"
                        />
                      )}
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <Card className="border-dashed border-2 py-20 text-center">
                  <CardContent className="space-y-4">
                    <div className="bg-primary/5 p-4 rounded-full w-fit mx-auto">
                      <Filter className="h-12 w-12 text-primary/20" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">No results found</h2>
                      <p className="text-muted-foreground">Adjust your filters or search query.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
