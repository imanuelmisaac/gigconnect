
"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword, sendPasswordResetEmail, signOut, sendEmailVerification } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Briefcase, ArrowLeft, Loader2, KeyRound, Mail, RefreshCw, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Specific admin UID provided by user
const ADMIN_UID = 'yZMHgaiCt2dmbqfOziWkc2t33th2';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isUnverified, setIsUnverified] = useState(false);
  const [resending, setResending] = useState(false);
  
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setIsUnverified(false);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // IMMEDIATE ADMIN CHECK: If UID matches system owner, skip verification/role checks and go to admin
      if (user.uid === ADMIN_UID) {
        toast({ title: "Admin Login", description: "System administrator access granted." });
        router.push('/admin/dashboard');
        return;
      }

      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const role = userData.role;

        // Admins bypass email verification check
        if (role !== 'admin' && !user.emailVerified) {
          toast({
            variant: "destructive",
            title: "Account Not Verified",
            description: "Please verify your email address to access your dashboard.",
          });
          setIsUnverified(true);
          setLoading(false);
          return;
        }

        toast({
          title: "Welcome back!",
          description: "Login successful.",
        });

        if (role === 'admin') {
          router.push('/admin/dashboard');
        } else if (role === 'artist' || role === 'dj') {
          router.push('/artist/dashboard');
        } else if (role === 'gig-maker') {
          router.push('/gig-maker/dashboard');
        } else {
          router.push('/');
        }
      } else {
        toast({
          variant: "destructive",
          title: "Profile not found",
          description: "We couldn't find your professional profile details.",
        });
        await signOut(auth);
      }
    } catch (error: any) {
      console.error("Login Error:", error);
      toast({
        variant: "destructive",
        title: "Login Error",
        description: error.message || "Failed to login. Please check your credentials.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!auth.currentUser) return;
    setResending(true);
    try {
      await sendEmailVerification(auth.currentUser);
      toast({
        title: "Verification Sent",
        description: "A new activation link has been sent to your email.",
      });
      await signOut(auth);
      setIsUnverified(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to resend verification email.",
      });
    } finally {
      setResending(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast({ variant: "destructive", title: "Email Required", description: "Please enter your email address." });
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast({
        title: "Reset Link Sent",
        description: `Instructions have been sent to ${resetEmail}`,
      });
      setIsResetDialogOpen(false);
      setResetEmail('');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not send reset email.",
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-secondary/20">
      <div className="p-4">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 slide-up">
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="bg-primary p-3 rounded-xl shadow-lg">
                <Briefcase className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-primary font-headline">Welcome Back</h1>
            <p className="text-muted-foreground">Enter your credentials to access your account</p>
          </div>

          {isUnverified && (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
              <Mail className="h-4 w-4" />
              <AlertTitle>Verification Required</AlertTitle>
              <AlertDescription className="space-y-3">
                <p>Your email is not verified. Please check your inbox for the activation link.</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full font-bold gap-2" 
                  onClick={handleResendVerification}
                  disabled={resending}
                >
                  {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Resend Verification Email
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          <Card className="border-none shadow-xl">
            <form onSubmit={handleSubmit}>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-headline">Login</CardTitle>
                <CardDescription>
                  Enter your email and password below
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="john@example.com" 
                    required 
                    className="h-11"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                      <DialogTrigger asChild>
                        <button type="button" className="text-sm text-accent hover:underline font-medium">
                          Forgot password?
                        </button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <KeyRound className="h-5 w-5" />
                            Reset Password
                          </DialogTitle>
                          <DialogDescription>
                            Enter your email address and we'll send you a link to reset your password.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="reset-email">Email Address</Label>
                            <Input 
                              id="reset-email" 
                              type="email" 
                              placeholder="you@example.com" 
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>Cancel</Button>
                          <Button className="bg-primary" onClick={handlePasswordReset} disabled={resetLoading}>
                            {resetLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Reset Link'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    className="h-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full h-11 bg-primary text-lg" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    'Login'
                  )}
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  Don&apos;t have an account?{" "}
                  <Link href="/register" className="text-accent hover:underline font-bold">
                    Register
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
