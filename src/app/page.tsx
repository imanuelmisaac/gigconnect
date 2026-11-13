import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Briefcase, Music, Star, Ticket, Users, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

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
                    Join as Talent
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
                  alt="GigConnect Hero - Musical Talent Hub"
                  fill
                  className="object-cover"
                  data-ai-hint={heroImage.imageHint}
                  priority
                />
              )}
            </div>
          </div>
        </section>

        {/* Explore Section */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12">
              <div className="bg-primary/5 p-12 rounded-3xl space-y-6">
                <Music className="h-12 w-12 text-primary" />
                <h2 className="text-3xl font-bold font-headline">For Artists & DJs</h2>
                <p className="text-muted-foreground">Build your professional profile, showcase your sets, and apply for high-paying gigs across Botswana.</p>
                <Link href="/events" className="inline-flex items-center text-primary font-bold hover:underline gap-2">
                  Browse Available Gigs <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="bg-accent/5 p-12 rounded-3xl space-y-6">
                <Ticket className="h-12 w-12 text-accent" />
                <h2 className="text-3xl font-bold font-headline">For Fans & Guests</h2>
                <p className="text-muted-foreground">Discover the hottest events in your city, track your favorite artists, and buy tickets directly via WhatsApp.</p>
                <Link href="/tickets" className="inline-flex items-center text-accent font-bold hover:underline gap-2">
                  Explore Ticket Hub <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Ecosystem Section */}
        <section className="py-24 bg-secondary/10" aria-labelledby="ecosystem-heading">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <h2 id="ecosystem-heading" className="text-3xl lg:text-4xl font-bold text-primary font-headline uppercase">A Complete Musical Ecosystem</h2>
              <p className="text-lg text-muted-foreground">From the first application to the final ticket sold.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Users className="h-10 w-10 text-accent" aria-hidden="true" />,
                  title: "Talent Discovery",
                  description: "Connect with verified Artists and DJs who ready to elevate your event experience."
                },
                {
                  icon: <Ticket className="h-10 w-10 text-accent" aria-hidden="true" />,
                  title: "Direct Ticketing",
                  description: "Skip the queues. Buy tickets directly from event organizers through direct WhatsApp communication."
                },
                {
                  icon: <Star className="h-10 w-10 text-accent" aria-hidden="true" />,
                  title: "Community Growth",
                  description: "See what's trending. Join thousands of Batswana in supporting our local creative industry."
                }
              ].map((feature, i) => (
                <div key={i} className="p-8 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow space-y-4">
                  <div className="bg-white p-3 rounded-lg w-fit shadow-inner">
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

      <footer className="border-t py-16 bg-slate-900 text-white">
        <div className="container mx-auto px-4 text-center space-y-8">
          <div className="flex justify-center items-center space-x-2">
            <Briefcase className="h-8 w-8 text-accent" aria-hidden="true" />
            <span className="text-2xl font-black font-headline uppercase tracking-tighter">GigConnect</span>
          </div>
          <div className="space-y-2">
            <p className="text-slate-400 font-medium italic">"Made by a Motswana for Batswana in Botswana"</p>
          </div>
          <nav className="pt-8 border-t border-white/10 max-w-md mx-auto" aria-label="Footer Navigation">
            <ul className="flex justify-center gap-8 mb-6 text-xs font-bold uppercase tracking-widest">
              <li><Link href="/events" className="hover:text-accent transition-colors">Find Gigs</Link></li>
              <li><Link href="/tickets" className="hover:text-accent transition-colors">Buy Tickets</Link></li>
              <li><Link href="/terms" className="hover:text-accent transition-colors">Terms</Link></li>
            </ul>
            <p className="text-[10px] text-slate-500">© {new Date().getFullYear()} GigConnect Botswana. Empowering local excellence.</p>
          </nav>
        </div>
      </footer>
    </div>
  );
}