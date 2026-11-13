import Link from 'next/link';
import { Briefcase, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4 mx-auto max-w-7xl">
        <Link href="/" className="flex items-center space-x-2">
          <Briefcase className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold font-headline text-primary uppercase tracking-tighter">GigConnect</span>
        </Link>
        <div className="flex items-center space-x-6">
          <Link href="/events" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors hidden sm:flex items-center gap-1.5 uppercase tracking-widest">
            <Music className="h-3.5 w-3.5" />
            Explore Gigs
          </Link>
          <div className="flex items-center space-x-3">
            <Link href="/login">
              <Button variant="ghost" className="font-bold text-xs uppercase tracking-widest">Login</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-primary hover:bg-primary/90 font-bold text-xs uppercase tracking-widest shadow-md">Register</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
