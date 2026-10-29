'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DM_Sans, Space_Grotesk } from 'next/font/google';
import { useAuth } from '@/hooks/useAuth';
import { homeForRole } from '@/lib/auth-policy';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { LandingMidShowcase } from '@/components/landing/LandingMidShowcase';
import { CinematicFooter } from '@/components/landing/CinematicFooter';
import './landing.css';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' });

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace(homeForRole(user.role));
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07090d]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#d9bb4c]/20 border-t-[#d9bb4c]" />
      </div>
    );
  }

  return (
    <div className={`landing-root ${dmSans.variable} ${spaceGrotesk.variable}`}>
      <LandingNavbar />
      <HeroSection />
      <LandingMidShowcase />
      <CinematicFooter />
    </div>
  );
}
