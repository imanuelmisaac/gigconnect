import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Briefcase, Shield, Zap, Globe, Music, Star } from 'lucide-react';
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
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                <Star className="h-3 w-3" />
                Made by Motswana for Batswana
              </div>
              <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight text-primary leading-tight font-headline">
                Empowering <span className="text-accent">Batswana</span> Talent Everywhere
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg">
                GigConnect provides convenience for both event makers and talented Batswana artists. We bridge the gap between local craft and professional opportunities.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto text-lg h-12 px-8 bg-primary">
                    Join the Movement
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-12 px-8">
                    Browse Gigs
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
              <h2 className="text-3xl lg:text-4xl font-bold text-primary font-headline">Local Pride, Professional Reach</h2>
              <p className="text-lg text-muted-foreground">Built in Botswana to support our vibrant musical ecosystem.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Music className="h-10 w-10 text-accent" />,
                  title: "Batswana First",
                  description: "Designed specifically to solve the unique challenges faced by artists and DJs in Botswana."
                },
                {
                  icon: <Zap className="h-10 w-10 text-accent" />,
                  title: "Seamless Convenience",
                  description: "Apply for gigs or hire talent with just a few clicks. We handle the logistics so you can focus on the music."
                },
                {
                  icon: <Globe className="h-10 w-10 text-accent" />,
                  title: "Bodiragatsi Spirit",
                  description: "Rooted in the excellence and creative drive of our local communities."
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

      <footer className="border-t py-16 bg-muted/20">
        <div className="container mx-auto px-4 text-center space-y-6">
          <div className="flex justify-center items-center space-x-2 text-primary">
            <Briefcase className="h-6 w-6" />
            <span className="text-xl font-bold font-headline uppercase tracking-tighter">GigConnect</span>
          </div>
          <div className="space-y-2">
            <p className="text-muted-foreground font-medium italic">"Made for Batswana by Motswana of Botswana"</p>
            <p className="text-sm text-primary/70 font-bold">
              Created by Mogakolodi Ranthokwane
              <br />
              <span className="text-xs font-normal">(also known as Trustin Hymn from Umlazi Nation)</span>
            </p>
          </div>
          <div className="pt-8 border-t max-w-xs mx-auto">
            <p className="text-xs text-muted-foreground">© 2026 GigConnect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
