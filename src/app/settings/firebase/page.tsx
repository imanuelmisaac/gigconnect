"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from '@/components/navbar';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Info, Copy, Check, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function FirebaseSettingsPage() {
  const [copied, setCopied] = useState(false);

  const envContent = `NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAKSnpljCHl0weO0Y7PfbvZPArhjSfVXlk
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gigconnect-ac1f9.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=gigconnect-ac1f9
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=gigconnect-ac1f9.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=146349558627
NEXT_PUBLIC_FIREBASE_APP_ID=1:146349558627:web:9a620aea99abe889b52156
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-GFWVQ12FVZ`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(envContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-secondary/10">
      <Navbar />
      <main className="container mx-auto py-10 px-4 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-primary p-2 rounded-lg">
            <ShieldCheck className="text-white h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold font-headline text-primary">Firebase Configuration</h1>
        </div>

        <div className="grid gap-8">
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="font-bold">Important Step Required</AlertTitle>
            <AlertDescription>
              To fix the 400 error during registration, you <strong>must</strong> enable the "Email/Password" provider in the Firebase Console under <strong>Authentication > Sign-in method</strong> for project <code>gigconnect-ac1f9</code>.
            </AlertDescription>
          </Alert>

          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-accent" />
                Setup Instructions
              </CardTitle>
              <CardDescription>
                Follow these steps to ensure your application is correctly connected to Firebase.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-bold text-primary">1. Environment Variables</h3>
                <p className="text-sm text-muted-foreground">
                  The application is configured to use the following credentials for <strong>GigConnect</strong>.
                </p>
              </div>

              <div className="relative group">
                <pre className="bg-slate-950 text-slate-50 p-6 rounded-xl overflow-x-auto text-xs font-mono border-2 border-primary/20">
                  {envContent}
                </pre>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="absolute top-2 right-2 text-slate-400 hover:text-white"
                  onClick={copyToClipboard}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              <div className="space-y-2 pt-4">
                <h3 className="font-bold text-primary">2. Required Fields</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'].map((field) => (
                    <Badge key={field} variant="secondary" className="justify-center py-1">
                      {field}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-accent/5 border-l-4 border-l-accent">
            <CardHeader>
              <CardTitle className="text-lg">Security Note</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Firebase Web SDK configuration is public by design. However, always ensure your 
                <strong> Firebase Security Rules</strong> are properly configured in the Firebase Console 
                to protect your data.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
