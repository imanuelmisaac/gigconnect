import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Briefcase, Zap, Globe, Music, Star, Ticket, Users } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GigConnect | Botswana Musical Talent & Event Hub',
  description: 'The home for Batswana musical excellence. Find gigs, hire professional DJs and artists, and buy event tickets across Botswana.',
  alternates: {
    canonical: '/',
  },
};

export default function Home() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-bg');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'GigConnect',
    url: 'https://gigconnect.bw',
    logo: 'https://gigconnect.bw/logo.png',
    description: 'Botswana’s premier musical talent and event ticketing marketplace.',
    sameAs: [
      'https://facebook.com/gigconnectbw',
      'https://instagram.com/gigconnectbw',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+26774266208',
      contactType: 'customer service',
      areaServed: 'BW',
      availableLanguage: 'en',
    },
  };

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'GigConnect',
    url: 'https://gigconnect.bw',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://gigconnect.bw/events?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
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
                The Beat of <span className="text-accent">Botswana</span> Connects Here
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg">
                GigConnect is the home for Batswana musical excellence. Whether you are an artist seeking gigs, an organizer hiring talent, or a fan looking for tickets—we bring everyone together.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto text-lg h-12 px-8 bg-primary">
                    Join the Movement
                  </Button>
                </Link>
                <Link href="/tickets">
                  <Button size="lg" className="w-full sm:w-auto text-lg h-12 px-8 bg-accent text-white hover:bg-accent/90">
                    Buy Tickets <Ticket className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl fade-in">
              {heroImage && (
                <Image
                  src={heroImage.imageUrl}
                  alt="GigConnect Hero - Professional Networking in Botswana"
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
        <section className="py-24 bg-background" aria-labelledby="features-heading">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <h2 id="features-heading" className="text-3xl lg:text-4xl font-bold text-primary font-headline">A Complete Musical Ecosystem</h2>
              <p className="text-lg text-muted-foreground">From the first application to the final ticket sold.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Music className="h-10 w-10 text-accent" aria-hidden="true" />,
                  title: "Talent Discovery",
                  description: "Artists and DJs can find professional gigs and collaboration opportunities across the country."
                },
                {
                  icon: <Ticket className="h-10 w-10 text-accent" aria-hidden="true" />,
                  title: "Ticket Marketplace",
                  description: "Fans can discover upcoming events and buy tickets directly from verified organizers via WhatsApp."
                },
                {
                  icon: <Users className="h-10 w-10 text-accent" aria-hidden="true" />,
                  title: "Community Interest",
                  description: "See what's trending. Track how many people are interested in events and build hype for your shows."
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
            <Briefcase className="h-6 w-6" aria-hidden="true" />
            <span className="text-xl font-bold font-headline uppercase tracking-tighter">GigConnect</span>
          </div>
          <div className="space-y-2">
            <p className="text-muted-foreground font-medium italic">"Made by a Motswana for Batswana in Botswana"</p>
            <p className="text-sm text-primary/70 font-bold">
              Mogakolodi Ranthokwane
            </p>
          </div>
          <nav className="pt-8 border-t max-w-xs mx-auto" aria-label="Footer Navigation">
            <ul className="flex justify-center gap-4 mb-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
              <li><Link href="/events" className="hover:text-primary">Gigs</Link></li>
              <li><Link href="/tickets" className="hover:text-primary">Tickets</Link></li>
              <li><Link href="/terms" className="hover:text-primary">Terms</Link></li>
            </ul>
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} GigConnect. All rights reserved.</p>
          </nav>
        </div>
      </footer>
    </div>
  );
}
