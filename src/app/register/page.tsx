import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Briefcase, ArrowLeft, Loader2, Mail, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register',
  description: 'Join the GigConnect network as an artist, DJ, or gig maker.',
  robots: 'noindex, nofollow',
};

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'artist' | 'gig-maker' | 'dj'>('artist');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !agreedToTerms) return;

    setLoading(true);
    setSetupError(null);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await sendEmailVerification(user);

      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        userId: user.uid,
        email: user.email,
        role: role,
        firstName,
        lastName,
        createdAt: serverTimestamp(),
      });

      setVerificationSent(true);
      toast({
        title: "Account Created Successfully",
        description: "Please check your email for a verification link.",
      });
    } catch (error: any) {
      console.error("Registration Error:", error);
      let errorMsg = "Failed to create account. Please try again.";
      
      if (error.code === 'auth/email-already-in-use') {
        errorMsg = "This email is already registered.";
      } else if (error.code === 'auth/weak-password') {
        errorMsg = "Password is too weak. Use at least 6 characters.";
      }

      toast({
        variant: "destructive",
        title: "Registration Error",
        description: errorMsg,
      });

      if (error.message?.includes('400')) {
        setSetupError("Firebase Setup Error: Ensure 'Email/Password' is ENABLED in your Firebase Console.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (verificationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/20 p-4">
        <Card className="max-w-md w-full border-none shadow-xl text-center py-8">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-4 rounded-full">
                <Mail className="h-12 w-12 text-green-600" aria-hidden="true" />
              </div>
            </div>
            <CardTitle className="text-2xl font-headline">Verify Your Email</CardTitle>
            <CardDescription>
              We've sent a verification link to <span className="font-bold text-foreground">{email}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please check your inbox (and spam folder) and click the link to activate your account.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Link href="/login" className="w-full">
              <Button className="w-full bg-primary h-11">
                Go to Login
              </Button>
            </Link>
            <Button variant="ghost" className="text-xs" onClick={() => setVerificationSent(false)}>
              Back to registration
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold tracking-tight text-primary font-headline">Create an Account</h1>
            <p className="text-muted-foreground">Join the professional talent network</p>
          </div>

          {setupError && (
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              <AlertTitle className="font-bold">Setup Required</AlertTitle>
              <AlertDescription>
                {setupError}
              </AlertDescription>
            </Alert>
          )}
          
          <Card className="border-none shadow-xl">
            <form onSubmit={handleSubmit}>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-headline">Register</CardTitle>
                <CardDescription>
                  Start your journey with GigConnect today
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="first-name">First Name</Label>
                    <Input 
                      id="first-name" 
                      placeholder="John" 
                      required 
                      className="h-11"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      autoComplete="given-name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="last-name">Last Name</Label>
                    <Input 
                      id="last-name" 
                      placeholder="Doe" 
                      required 
                      className="h-11"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      autoComplete="family-name"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">I am a...</Label>
                  <Select value={role} onValueChange={(val: any) => setRole(val)}>
                    <SelectTrigger className="h-11" id="role">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="artist">Musician / Artist</SelectItem>
                      <SelectItem value="dj">Disc Jockey (DJ)</SelectItem>
                      <SelectItem value="gig-maker">Gig Maker / Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="john.doe@example.com" 
                    required 
                    className="h-11"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      required 
                      className="h-11 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
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

                <div className="flex items-start space-x-3 pt-4 border-t">
                  <Checkbox 
                    id="terms" 
                    checked={agreedToTerms} 
                    onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="terms" className="text-xs font-medium cursor-pointer">
                      I agree to the{" "}
                      <Link href="/terms" target="_blank" className="text-accent hover:underline font-bold">
                        Terms and Conditions
                      </Link>
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                      Including data residency in the USA.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full h-11 bg-primary text-lg" disabled={loading || !agreedToTerms}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      Creating Account...
                    </>
                  ) : (
                    'Register'
                  )}
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/login" className="text-accent hover:underline font-bold">
                    Login
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
