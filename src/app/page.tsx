
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Briefcase, Shield, Zap, Globe } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function Home() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-bg');

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 lg:py-32 bg-secondary/30">
          <div className="container relative z-10 mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 slide-up">
              <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight text-primary leading-tight font-headline">
                Connect with the Best <span className="text-accent">Opportunities</span> Globally
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg">
                GigConnect is the professional platform designed to bridge the gap between world-class talent and innovative companies.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto text-lg h-12 px-8 bg-primary">
                    Get Started
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-12 px-8">
                    View Gigs
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl fade-in">
              {heroImage && (
                <Image
                  src={heroImage.imageUrl}
                  alt={heroImage.description}
                  fill
                  className="object-cover"
                  data-ai-hint={heroImage.imageHint}
                  priority
                />
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <h2 className="text-3xl lg:text-4xl font-bold text-primary font-headline">Why GigConnect?</h2>
              <p className="text-lg text-muted-foreground">We provide a secure and efficient ecosystem for professional growth and collaboration.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Shield className="h-10 w-10 text-accent" />,
                  title: "Trusted Security",
                  description: "Your data and payments are protected by industry-leading security protocols."
                },
                {
                  icon: <Zap className="h-10 w-10 text-accent" />,
                  title: "Fast Matching",
                  description: "Our AI-driven algorithms connect talent with the right gigs in seconds."
                },
                {
                  icon: <Globe className="h-10 w-10 text-accent" />,
                  title: "Global Reach",
                  description: "Access opportunities and talent from over 150 countries worldwide."
                }
              ].map((feature, i) => (
                <div key={i} className="p-8 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow space-y-4">
                  <div className="bg-secondary p-3 rounded-lg w-fit">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-primary font-headline">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-12 bg-muted/20">
        <div className="container mx-auto px-4 text-center space-y-4">
          <div className="flex justify-center items-center space-x-2 text-primary">
            <Briefcase className="h-6 w-6" />
            <span className="text-xl font-bold font-headline">GigConnect</span>
          </div>
          <p className="text-muted-foreground">© 2024 GigConnect. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
