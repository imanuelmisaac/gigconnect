import Link from 'next/link';
import { ArrowLeft, ShieldAlert, Globe, Scale, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-secondary/10 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex flex-col gap-4">
          <Link href="/register">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Registration
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-primary font-headline uppercase">Terms and Conditions</h1>
          <p className="text-muted-foreground italic text-lg">Last updated: May 2024</p>
        </header>

        <div className="grid gap-6">
          <Card className="border-none shadow-md">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Globe className="h-5 w-5 text-primary" />
                1. Data Storage & International Transfer
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 prose prose-slate max-w-none text-sm leading-relaxed">
              <p>
                <strong>Important Notice:</strong> Our application services and databases are hosted and managed on servers located in the <strong>United States of America (USA)</strong>.
              </p>
              <p>
                By using GigConnect, you acknowledge and agree that your personal information, profile data, and any content you upload will be transferred to, stored, and processed in the USA. Data protection laws in the USA may differ from those in your home country. We take all reasonable steps to ensure your data is treated securely and in accordance with international security standards.
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Scale className="h-5 w-5 text-primary" />
                2. Platform Role & Disclaimer
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 prose prose-slate max-w-none text-sm leading-relaxed">
              <p>
                GigConnect acts solely as an intermediary marketplace connecting musical talent ("Artists") with event organizers ("Gig Makers"). 
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>We do not employ the Artists nor are we agents for the Gig Makers.</li>
                <li>We do not guarantee that any Artist will find work or that any Gig Maker will find suitable talent.</li>
                <li>We are not responsible for the quality, safety, or legality of the events listed, the truth or accuracy of the listings, or the ability of Gig Makers to pay Artists.</li>
                <li>Any contractual agreement made between users is strictly between those users. GigConnect is not a party to such agreements.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="flex items-center gap-2 text-xl">
                <ShieldAlert className="h-5 w-5 text-primary" />
                3. Limitation of Liability
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 prose prose-slate max-w-none text-sm leading-relaxed">
              <p>
                To the maximum extent permitted by law, GigConnect and its creator (Mogakolodi Ranthokwane) shall not be liable for any direct, indirect, incidental, or consequential damages resulting from:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Disputes between users (e.g., non-payment for a gig, artist no-shows).</li>
                <li>Personal injury or property damage occurring during an event found through the platform.</li>
                <li>Loss of data or unauthorized access to your account by third parties.</li>
                <li>Service interruptions or technical failures.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Lock className="h-5 w-5 text-primary" />
                4. Account Security & Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 prose prose-slate max-w-none text-sm leading-relaxed">
              <p>
                Users are responsible for maintaining the confidentiality of their account credentials. You agree to:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Provide accurate and truthful information during registration.</li>
                <li>Complete the required email verification process.</li>
                <li>Not use the platform for any fraudulent or illegal purposes.</li>
                <li>Acknowledge that we reserve the right to terminate accounts that violate these terms or engage in unprofessional conduct.</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <footer className="text-center pt-8">
          <p className="text-sm text-muted-foreground">
            By checking the agreement box during registration, you signify your acceptance of these terms.
          </p>
        </footer>
      </div>
    </div>
  );
}
