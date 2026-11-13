
"use client"

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Loader2, 
  Check, 
  Crown, 
  ArrowLeft, 
  CreditCard, 
  CheckCircle2, 
  Zap, 
  Star, 
  Globe,
  Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { WhatsAppButton } from '@/components/whatsapp-button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function SubscriptionPage() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const { data: artistProfile, loading: profileLoading } = useDoc(user ? doc(db, 'artists', user.uid) : null);
  const { data: systemConfig } = useDoc(doc(db, 'system', 'config'));
  
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [hasSentScreenshot, setHasSentScreenshot] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  const currentTier = artistProfile?.subscriptionTier || 'free';

  const packages = useMemo(() => {
    const config = systemConfig || {};
    const baseP2 = config.package2Price || 20;
    const baseP3 = config.package3Price || 60;
    const baseP4 = config.package4Price || 80;
    
    const discount = (config.specialActive && config.specialDiscount) ? config.specialDiscount : 0;
    const calc = (p: number) => Math.floor(p * (1 - discount / 100));

    return [
      {
        id: 'free',
        name: 'Free Starter',
        price: 0,
        features: ['2 Event Applications / mo', '3 Feature Requests / mo', 'Standard Profile', 'Community Access'],
        limitLabel: '2 Apps, 3 Features',
        color: 'bg-muted'
      },
      {
        id: 'package2',
        name: 'Essential Pro',
        price: calc(baseP2),
        basePrice: baseP2,
        features: ['15 Event Applications / mo', '10 Feature Requests / mo', 'Pro Badge', 'Direct WhatsApp Contact'],
        limitLabel: '15 Apps, 10 Features',
        color: 'bg-blue-500',
        popular: true
      },
      {
        id: 'package3',
        name: 'Standard Pro',
        price: calc(baseP3),
        basePrice: baseP3,
        features: ['40 Event Applications / mo', 'Unlimited Feature Requests', 'Featured Artist Status', 'Analytics Dashboard'],
        limitLabel: '40 Apps, ∞ Features',
        color: 'bg-accent'
      },
      {
        id: 'package4',
        name: 'Ultimate Pro',
        price: calc(baseP4),
        basePrice: baseP4,
        features: ['Unlimited Everything', 'Priority Suggested to Promoters', 'Custom Profile Link', 'VIP Support'],
        limitLabel: '∞ Apps, ∞ Features',
        color: 'bg-primary'
      }
    ];
  }, [systemConfig]);

  const handleSelectPackage = (pkg: any) => {
    if (pkg.id === currentTier) {
      toast({ title: "Current Plan", description: "You are already on this plan." });
      return;
    }
    if (pkg.price === 0) {
       handleUpgrade(pkg.id);
       return;
    }
    setSelectedPackage(pkg);
    setShowPaymentModal(true);
  };

  const handleUpgrade = async (tierId: string) => {
    if (!user || !db) return;
    setUpgrading(true);

    try {
      const ref = doc(db, 'artists', user.uid);
      await updateDoc(ref, {
        subscriptionTier: tierId,
        updatedAt: serverTimestamp()
      });

      toast({ title: "Subscription Updated!", description: `Welcome to the ${tierId.toUpperCase()} package.` });
      setShowPaymentModal(false);
      router.push('/artist/dashboard');
    } catch (e: any) {
      toast({ variant: "destructive", title: "Update Error", description: e.message });
    } finally {
      setUpgrading(false);
    }
  };

  if (userLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/10">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/10 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="text-center space-y-4">
          <Link href="/artist/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Link>
          <div className="space-y-2">
            <h1 className="text-4xl lg:text-5xl font-extrabold text-primary font-headline uppercase tracking-tighter">Choose Your Pro Plan</h1>
            {systemConfig?.specialActive && (
              <div className="bg-accent/10 border border-accent/20 px-4 py-2 rounded-full w-fit mx-auto flex items-center gap-2 text-accent font-bold">
                <Tag className="h-4 w-4" /> {systemConfig.specialName}: {systemConfig.specialDiscount}% OFF!
              </div>
            )}
          </div>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {packages.map((pkg) => {
            const isCurrent = pkg.id === currentTier;
            return (
              <Card key={pkg.id} className={`border-none shadow-xl flex flex-col relative overflow-hidden transition-all hover:scale-105 ${isCurrent ? 'ring-2 ring-primary' : ''}`}>
                {pkg.popular && (
                  <div className="absolute top-4 -right-8 bg-accent text-white px-10 py-1 rotate-45 text-[10px] font-black uppercase tracking-widest">Best Value</div>
                )}
                <CardHeader className="text-center pb-2">
                   <div className={`h-12 w-12 rounded-xl ${pkg.color} text-white flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                     {pkg.id === 'free' ? <Zap className="h-6 w-6" /> : pkg.id === 'package2' ? <Star className="h-6 w-6" /> : pkg.id === 'package3' ? <Globe className="h-6 w-6" /> : <Crown className="h-6 w-6" />}
                   </div>
                   <CardTitle className="text-xl font-headline uppercase">{pkg.name}</CardTitle>
                   <CardDescription className="font-bold text-primary">{pkg.limitLabel}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-6">
                  <div className="text-center flex flex-col items-center">
                    {pkg.price < (pkg.basePrice || 0) && (
                      <span className="text-xs text-muted-foreground line-through">P{pkg.basePrice}</span>
                    )}
                    <div>
                      <span className="text-4xl font-black">P{pkg.price}</span>
                      <span className="text-muted-foreground text-sm ml-1">/ mo</span>
                    </div>
                  </div>
                  <ul className="space-y-3 text-xs">
                    {pkg.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2"><Check className="h-3 w-3 text-green-500 shrink-0" /><span className="text-muted-foreground">{f}</span></li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="pt-6">
                  <Button className={`w-full font-bold uppercase tracking-widest ${isCurrent ? 'bg-secondary text-primary hover:bg-secondary' : pkg.id === 'free' ? 'bg-muted text-muted-foreground' : 'bg-primary'}`} disabled={isCurrent || upgrading} onClick={() => handleSelectPackage(pkg)}>
                    {isCurrent ? 'Current Plan' : pkg.price === 0 ? 'Start Free' : `Upgrade Now`}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      <Dialog open={showPaymentModal} onOpenChange={(open) => { setShowPaymentModal(open); if (!open) setHasSentScreenshot(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary"><CreditCard className="h-6 w-6" /> Upgrade to {selectedPackage?.name}</DialogTitle>
            <DialogDescription>Pay P{selectedPackage?.price} to activate your pro limits.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="bg-secondary/30 p-4 rounded-xl space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2"><span>MyZaka</span><span className="font-black text-primary">74266208</span></div>
              <div className="flex justify-between border-b pb-2"><span>Orange Money</span><span className="font-black text-primary">76479543</span></div>
            </div>
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-3">
              <WhatsAppButton phoneNumber="+26774266208" message={`Hi, I've just paid P${selectedPackage?.price} for the ${selectedPackage?.name}. Email: ${user?.email}`} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-10" onClick={() => setHasSentScreenshot(true)}>Send Proof of Payment</WhatsAppButton>
              {hasSentScreenshot && <p className="text-[10px] text-green-600 font-bold text-center">Proof sent. You can now activate your plan.</p>}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
            <Button className="bg-primary flex-1 font-bold" onClick={() => handleUpgrade(selectedPackage?.id)} disabled={upgrading || !hasSentScreenshot}>
              {upgrading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Activate Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
