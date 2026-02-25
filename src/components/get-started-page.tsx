'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { NeetProgressLogo } from '@/components/icons';
import { ArrowRight, BarChart, BrainCircuit, CheckCircle, Target, Users } from 'lucide-react';
import { Card } from './ui/card';
import { DeveloperCredit } from './developer-credit';

const FeatureCard = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
    <div className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-primary/10 transition-all duration-300 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2">
        <div className="flex items-center justify-center h-16 w-16 bg-primary/10 text-primary rounded-2xl mb-6">
            <Icon className="h-8 w-8" />
        </div>
        <h3 className="text-2xl font-bold mb-3">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
    </div>
);

export function GetStartedPage() {
  return (
    <div className="w-full min-h-screen bg-background text-foreground animate-fade-in">
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center gap-2 animate-glow">
          <NeetProgressLogo className="h-8 w-8 text-primary" />
          <span className="text-xl font-semibold">Exam Tracker</span>
        </div>
        <Button asChild>
          <Link href="/login">
            Sign In
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </header>

      <main className="pt-32 pb-20">
        <section className="text-center px-4">
          <div className="inline-block px-4 py-2 mb-6 text-sm font-semibold tracking-wider text-primary bg-primary/10 rounded-full animate-fade-in-up">
            Your Ultimate AI-Powered Study Partner
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter animate-text-reveal bg-gradient-to-br from-primary via-foreground to-accent bg-clip-text text-transparent">
            Conquer Your Exams, <br /> Master Your Syllabus.
          </h1>
          <p className="max-w-2xl mx-auto mt-6 text-lg text-muted-foreground animate-fade-in-up [animation-delay:0.5s]">
            Stop feeling overwhelmed. Our intelligent platform helps you track your progress, identify weaknesses, and stay motivated with gamified goals and a supportive community.
          </p>
          <div className="mt-10 animate-fade-in-up [animation-delay:0.8s]">
            <Button asChild size="lg" className="text-lg py-7 px-8 relative overflow-hidden group">
               <Link href="/signup">
                Get Started for Free
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 animate-shine" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="container mx-auto mt-32 px-4">
            <div className="text-center mb-16">
                <h2 className="text-4xl font-bold tracking-tight">Three Pillars of Your Success</h2>
                <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
                    We've built the ultimate toolkit to ensure you're not just studying, but studying smarter.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="animate-fade-in-up [animation-delay:1.2s]">
                    <FeatureCard 
                        icon={BrainCircuit}
                        title="AI-Powered Syllabus Tracking"
                        description="Visualize your entire syllabus with smart analytics. Our AI tracks your completion, confidence, and revision history to provide personalized insights and help you focus on what matters most."
                    />
                </div>
                <div className="animate-fade-in-up [animation-delay:1.5s]">
                    <FeatureCard 
                        icon={Target}
                        title="Gamified Daily Goals"
                        description="Build momentum with a powerful daily goal and streak system. Earn points for completing tasks, compete on leaderboards, and turn the grind of studying into a rewarding journey."
                    />
                </div>
                 <div className="animate-fade-in-up [animation-delay:1.8s]">
                    <FeatureCard 
                        icon={Users}
                        title="Collaborative Community"
                        description="You're not alone. Share your study moments on A-gram, collaborate in group chats, and connect with fellow aspirants. Find motivation, support, and friendship on your path to success."
                    />
                </div>
            </div>
        </section>
      </main>
      
      <DeveloperCredit />
    </div>
  );
}
