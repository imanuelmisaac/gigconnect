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
import { Briefcase, ArrowLeft, Loader2, KeyRound, Mail, RefreshCw, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Access your GigConnect professional account.',
  robots: 'noindex, nofollow',
};

const ADMIN_UID = 'rJq93j6Mi5NuAPEPNDYpLtSgFfc2';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isUnverified, setIsUnverified] = useState(false);
  const [resending, setResending] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setIsUnverified(false);
    setSetupError(null);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

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

        if (role !== 'admin' && !user.emailVerified) {
          toast({
            variant: "destructive",
            title: "Verification Required",
            description: "Please check your inbox to verify your email address.",
          });
          setIsUnverified(true);
          setLoading(false);
          return;
        }

        toast({
          title: "Successfully logged in",
          description: `Welcome back, ${userData.firstName || 'User'}!`,
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
      let errorMsg = "Failed to login. Please check your credentials.";
      
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        errorMsg = "Incorrect email or password. Please try again.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMsg = "Too many failed attempts. Please try again later.";
      }

      toast({
        variant: "destructive",
        title: "Login Error",
        description: errorMsg,
      });
      
      if (error.message?.includes('400')) {
        setSetupError("Firebase Setup Error: Ensure 'Email/Password' is ENABLED in the Firebase Console.");
      }
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
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Back to Home
        </Link>
      </div>
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 slide-up">
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="bg-primary p-3 rounded-xl shadow-lg">
                <Briefcase className="h-8 w-8 text-white" aria-hidden="true" />
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-primary font-headline">Welcome Back</h1>
            <p className="text-muted-foreground">Enter your credentials to access your account</p>
          </div>

          {setupError && (
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              <AlertTitle className="font-bold">Login Issue</AlertTitle>
              <AlertDescription>
                {setupError}
              </AlertDescription>
            </Alert>
          )}

          {isUnverified && (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
              <Mail className="h-4 w-4" aria-hidden="true" />
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
                    autoComplete="email"
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
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      required 
                      className="h-11 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full h-11 bg-primary text-lg" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
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
      </main>
    </div>
  );
}
