"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from '@/components/navbar';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Info, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function FirebaseSettingsPage() {
  const [copied, setCopied] = useState(false);

  const envContent = `NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBlm8OFm5ZU0ocD1DRO5hTamv5QVS-xk6g
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=kei-blackboard.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://kei-blackboard-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=kei-blackboard
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=kei-blackboard.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=394060604555
NEXT_PUBLIC_FIREBASE_APP_ID=1:394060604555:web:5bad509b507a4be82c608e
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-LBEBM1SZ7F`;

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
                  The application is configured to read Firebase credentials from environment variables. 
                  Copy the snippet below into a file named <code className="bg-muted px-1 rounded">.env.local</code> in the root of your project.
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
