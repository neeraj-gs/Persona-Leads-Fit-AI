'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  ArrowRight,
  Play,
  Filter,
  Brain,
  Target,
  Zap,
  BarChart3,
  Upload,
  DollarSign,
  Users,
  TrendingUp,
  CheckCircle2,
  Network,
  FlaskConical,
  FileText,
  Shield,
  Clock,
  Activity,
  ChevronRight,
  Star,
  Github,
  Twitter,
  Linkedin,
  Mail,
  MousePointer,
  Layers,
  Database,
} from 'lucide-react';

// Animated counter hook
function useCountUp(end: number, duration: number = 2000, startOnView: boolean = true) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startOnView) {
      setHasStarted(true);
    }
  }, [startOnView]);

  useEffect(() => {
    if (startOnView && ref.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !hasStarted) {
            setHasStarted(true);
          }
        },
        { threshold: 0.5 }
      );
      observer.observe(ref.current);
      return () => observer.disconnect();
    }
  }, [startOnView, hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, hasStarted]);

  return { count, ref };
}

// Intersection Observer hook for reveal animations
function useRevealOnScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

export default function LandingPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Track mouse position for spotlight effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Stats with animated counters
  const stat1 = useCountUp(3, 1500);
  const stat2 = useCountUp(100, 2000);
  const stat3 = useCountUp(40, 1800);

  // Reveal animations for sections
  const heroReveal = useRevealOnScroll();
  const featuresReveal = useRevealOnScroll();
  const howItWorksReveal = useRevealOnScroll();
  const benefitsReveal = useRevealOnScroll();
  const ctaReveal = useRevealOnScroll();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Background Effects */}
      <div className="aurora-bg" />
      <div className="animated-grid" />

      {/* Floating Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Navigation */}
      <nav className="relative border-b border-border/40 bg-background/60 backdrop-blur-2xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center shadow-lg icon-glow">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight">Persona Ranker</span>
                <div className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">
                  by Throxy
                </div>
              </div>
            </div>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              <a href="#features" className="nav-link">Features</a>
              <a href="#how-it-works" className="nav-link">How It Works</a>
              <a href="#benefits" className="nav-link">Benefits</a>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <Link href="/app">
                <Button variant="ghost" className="hidden sm:flex font-medium">
                  Dashboard
                </Button>
              </Link>
              <Link href="/app">
                <Button className="btn-primary flex items-center gap-2">
                  <span>Get Started</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        ref={heroReveal.ref}
        className="relative pt-20 md:pt-32 pb-20 px-6"
      >
        <div className="container mx-auto max-w-6xl">
          <div className={`text-center space-y-8 ${heroReveal.isVisible ? 'reveal-up' : 'opacity-0'}`}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/80 border border-border/50 backdrop-blur-sm badge-shimmer">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium">AI-Powered Lead Intelligence</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                Transform Raw Leads
                <br />
                <span className="text-gradient glow-text">Into Revenue</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Automatically qualify, score, and rank your B2B sales leads using advanced AI.
                Focus on the prospects that matter most.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/app">
                <Button size="lg" className="btn-primary text-lg px-8 py-6 h-auto group">
                  <Play className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                  <span>Start Ranking Leads</span>
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="btn-secondary text-lg px-8 py-6 h-auto">
                <FileText className="h-5 w-5 mr-2" />
                View Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-16 max-w-3xl mx-auto">
              <div ref={stat1.ref} className="stats-card group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Layers className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-4xl font-bold counter-value">{stat1.count}</span>
                  <span className="text-2xl font-bold text-muted-foreground">-Step</span>
                </div>
                <p className="text-sm text-muted-foreground">AI Pipeline Process</p>
              </div>

              <div ref={stat2.ref} className="stats-card group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-4xl font-bold counter-value">0-{stat2.count}</span>
                </div>
                <p className="text-sm text-muted-foreground">Relevance Scoring</p>
              </div>

              <div ref={stat3.ref} className="stats-card group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-4xl font-bold counter-value">{stat3.count}%</span>
                </div>
                <p className="text-sm text-muted-foreground">Cost Reduction</p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-1/2 left-10 w-20 h-20 rounded-full border border-border/30 floating-shape" style={{ animationDelay: '0s' }} />
        <div className="absolute top-1/3 right-20 w-16 h-16 rounded-lg border border-border/20 floating-shape" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-1/4 left-1/4 w-12 h-12 rounded-full border border-border/20 floating-shape" style={{ animationDelay: '4s' }} />
      </section>

      {/* Section Divider */}
      <div className="section-divider mx-auto w-full max-w-4xl" />

      {/* VSL Demo Section */}
      <section className="relative py-24 px-6">
        <div className="container mx-auto max-w-5xl">
          {/* Section Header */}
          <div className="text-center mb-12 reveal-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/80 border border-border/50 text-sm font-medium mb-4">
              <Play className="h-3.5 w-3.5" />
              <span>See It In Action</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Watch How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how Persona Ranker transforms your lead qualification process in under 2 minutes
            </p>
          </div>

          {/* Video Container */}
          <div className="relative group">
            {/* Glow Effect Behind Video */}
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Video Frame */}
            <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-secondary/30 backdrop-blur-sm shadow-2xl">
              {/* Animated Border */}
              <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              {/* Video Placeholder - Replace with actual video embed */}
              <div className="relative aspect-video bg-gradient-to-br from-secondary/80 to-secondary flex items-center justify-center">
                {/* Grid Pattern Overlay */}
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                    backgroundSize: '40px 40px',
                  }} />
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-8 left-8 w-32 h-32 rounded-2xl border border-border/30 opacity-50" />
                <div className="absolute bottom-8 right-8 w-24 h-24 rounded-full border border-border/30 opacity-50" />
                <div className="absolute top-1/4 right-1/4 w-16 h-16 rounded-lg border border-border/20 opacity-30 rotate-12" />

                {/* Play Button */}
                <button className="relative z-10 group/play">
                  {/* Pulse Rings */}
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
                  <div className="absolute -inset-4 rounded-full bg-primary/10 animate-pulse" />

                  {/* Button */}
                  <div className="relative w-24 h-24 rounded-full gradient-primary flex items-center justify-center shadow-2xl group-hover/play:scale-110 transition-transform duration-300">
                    <Play className="h-10 w-10 text-white ml-1" fill="white" />
                  </div>
                </button>

                {/* Video Timestamp Badge */}
                <div className="absolute bottom-6 right-6 px-3 py-1.5 rounded-lg bg-background/90 backdrop-blur-sm border border-border/50 text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>1:47</span>
                </div>

                {/* Demo Label */}
                <div className="absolute top-6 left-6 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                  Product Demo
                </div>
              </div>
            </div>
          </div>

          {/* Trust Indicators Below Video */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>No signup required to watch</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span>Trusted by 500+ sales teams</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" fill="currentColor" />
              <span>4.9/5 average rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="section-divider mx-auto w-full max-w-4xl" />

      {/* Bento Grid Features Section */}
      <section
        id="features"
        ref={featuresReveal.ref}
        className="relative py-24 px-6"
      >
        <div className="container mx-auto max-w-6xl">
          {/* Section Header */}
          <div className={`text-center mb-16 ${featuresReveal.isVisible ? 'reveal-up' : 'opacity-0'}`}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/80 border border-border/50 text-sm font-medium mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Powerful Features</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Everything You Need to
              <br />
              <span className="text-gradient">Qualify Leads at Scale</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete AI-powered solution designed for modern B2B sales teams
            </p>
          </div>

          {/* Features Grid - Clean Layout */}
          <div className={`space-y-4 ${featuresReveal.isVisible ? 'reveal-up reveal-delay-2' : 'opacity-0'}`}>
            {/* Row 1: Main features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* AI Analysis - Large Card */}
              <div className="md:col-span-2 bento-item hover-lift p-8">
                <div className="flex flex-col h-full">
                  <div className="feature-icon-box mb-6">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">AI-Powered Analysis</h3>
                  <p className="text-muted-foreground mb-6">
                    Advanced GPT-4o-mini integration that understands context, seniority, and buying signals to score leads accurately.
                  </p>
                  <div className="mt-auto grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
                      <div className="text-3xl font-bold mb-1">0-100</div>
                      <div className="text-sm text-muted-foreground">Relevance Score</div>
                    </div>
                    <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
                      <div className="text-3xl font-bold mb-1">3 Types</div>
                      <div className="text-sm text-muted-foreground">Buyer Classification</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Multi-threading */}
              <div className="bento-item hover-lift p-6">
                <div className="flex flex-col h-full">
                  <div className="feature-icon-box mb-4">
                    <Network className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Multi-Threading</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Visualize contact hierarchy per company
                  </p>
                  <div className="mt-auto p-4 rounded-xl bg-secondary/30 border border-border/50">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-sm font-bold">1</div>
                        <span className="text-sm">Decision Maker</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-sm font-bold">2</div>
                        <span className="text-sm">Champion</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-sm font-bold">3</div>
                        <span className="text-sm">Influencer</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Quick features */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bento-item hover-lift p-6">
                <div className="feature-icon-box w-12 h-12 mb-4">
                  <Upload className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold mb-1">CSV Upload</h3>
                <p className="text-sm text-muted-foreground">Drag & drop your lead data</p>
              </div>

              <div className="bento-item hover-lift p-6">
                <div className="feature-icon-box w-12 h-12 mb-4">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold mb-1">Real-Time Progress</h3>
                <p className="text-sm text-muted-foreground">Watch leads process live</p>
              </div>

              <div className="bento-item hover-lift p-6">
                <div className="feature-icon-box w-12 h-12 mb-4">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold mb-1">Cost Tracking</h3>
                <p className="text-sm text-muted-foreground">Monitor AI costs per run</p>
              </div>

              <div className="bento-item hover-lift p-6">
                <div className="feature-icon-box w-12 h-12 mb-4">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold mb-1">Sortable Results</h3>
                <p className="text-sm text-muted-foreground">Filter by any metric</p>
              </div>
            </div>

            {/* Row 3: A/B Testing and Export */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* A/B Testing */}
              <div className="bento-item hover-lift p-6">
                <div className="flex flex-col h-full">
                  <div className="feature-icon-box mb-4">
                    <FlaskConical className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">A/B Testing</h3>
                  <p className="text-muted-foreground mb-4">
                    Compare different AI prompts to optimize accuracy and cost
                  </p>
                  <div className="mt-auto grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">Prompt A</span>
                      </div>
                      <div className="text-xs text-muted-foreground">92% accuracy</div>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/50 border border-border/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="h-4 w-4" />
                        <span className="text-sm font-medium">Prompt B</span>
                      </div>
                      <div className="text-xs text-muted-foreground">87% accuracy</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Export */}
              <div className="bento-item hover-lift p-6">
                <div className="flex flex-col h-full">
                  <div className="feature-icon-box mb-4">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Export to CSV</h3>
                  <p className="text-muted-foreground mb-4">
                    Export all results or top N leads per company for your CRM
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2">
                    <span className="px-4 py-2 rounded-lg bg-secondary/80 border border-border/50 text-sm font-medium">All Leads</span>
                    <span className="px-4 py-2 rounded-lg bg-secondary/80 border border-border/50 text-sm font-medium">Top N per Company</span>
                    <span className="px-4 py-2 rounded-lg bg-secondary/80 border border-border/50 text-sm font-medium">Custom Filter</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 4: Bottom features */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bento-item hover-lift p-6">
                <div className="feature-icon-box w-12 h-12 mb-4">
                  <Database className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold mb-1">Run History</h3>
                <p className="text-sm text-muted-foreground">Track all ranking runs and compare results</p>
              </div>

              <div className="bento-item hover-lift p-6">
                <div className="feature-icon-box w-12 h-12 mb-4">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold mb-1">Persona-Aware</h3>
                <p className="text-sm text-muted-foreground">Company size-aware targeting built-in</p>
              </div>

              <div className="bento-item hover-lift p-6 md:col-span-1 col-span-2">
                <div className="feature-icon-box w-12 h-12 mb-4">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold mb-1">Lightning Fast</h3>
                <p className="text-sm text-muted-foreground">Process thousands of leads in minutes</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        ref={howItWorksReveal.ref}
        className="relative py-24 px-6 cta-gradient"
      >
        <div className="container mx-auto max-w-6xl">
          {/* Section Header */}
          <div className={`text-center mb-16 ${howItWorksReveal.isVisible ? 'reveal-up' : 'opacity-0'}`}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/80 border border-border/50 text-sm font-medium mb-4">
              <Zap className="h-3.5 w-3.5" />
              <span>Simple Process</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A sophisticated 3-step AI pipeline that processes your leads efficiently
            </p>
          </div>

          {/* Steps */}
          <div className={`grid md:grid-cols-3 gap-8 ${howItWorksReveal.isVisible ? 'reveal-up reveal-delay-2' : 'opacity-0'}`}>
            {/* Step 1 */}
            <div className="relative">
              <div className="gradient-border p-8 h-full">
                <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  1
                </div>
                <div className="pt-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <Filter className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Pre-Filter</h3>
                  <p className="text-muted-foreground mb-6">
                    Quick AI-powered check to eliminate obviously irrelevant leads before expensive analysis.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Filters HR, Legal, Finance roles</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Fast, low-cost relevance check</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Reduces costs by ~40%</span>
                    </li>
                  </ul>
                </div>
              </div>
              {/* Connector Line */}
              <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-border to-transparent" />
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="gradient-border p-8 h-full">
                <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  2
                </div>
                <div className="pt-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <Brain className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Analyze</h3>
                  <p className="text-muted-foreground mb-6">
                    Comprehensive AI analysis that scores leads and classifies them by persona fit.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Company size-aware scoring</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Buyer type classification</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Signal detection & reasoning</span>
                    </li>
                  </ul>
                </div>
              </div>
              {/* Connector Line */}
              <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-border to-transparent" />
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="gradient-border p-8 h-full">
                <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  3
                </div>
                <div className="pt-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <Target className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Rank</h3>
                  <p className="text-muted-foreground mb-6">
                    Company-level ranking for optimal multi-threading outreach strategy.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Prioritizes within companies</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Multi-threading visualization</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Export top N per company</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section
        id="benefits"
        ref={benefitsReveal.ref}
        className="relative py-24 px-6"
      >
        <div className="container mx-auto max-w-6xl">
          {/* Section Header */}
          <div className={`text-center mb-16 ${benefitsReveal.isVisible ? 'reveal-up' : 'opacity-0'}`}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/80 border border-border/50 text-sm font-medium mb-4">
              <Star className="h-3.5 w-3.5" />
              <span>Why Choose Us</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Built for Modern
              <br />
              <span className="text-gradient">B2B Sales Teams</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Every feature designed to help you close more deals faster
            </p>
          </div>

          {/* Benefits Grid */}
          <div className={`grid md:grid-cols-2 gap-6 ${benefitsReveal.isVisible ? 'reveal-up reveal-delay-2' : 'opacity-0'}`}>
            {/* Benefit 1 */}
            <div className="testimonial-card hover-lift">
              <div className="flex gap-6">
                <div className="feature-icon-box flex-shrink-0">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Save Time & Money</h3>
                  <p className="text-muted-foreground mb-4">
                    Pre-filtering reduces AI costs by ~40% by eliminating irrelevant leads before expensive analysis.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="code-badge">Cost-efficient GPT-4o-mini</span>
                    <span className="code-badge">Real-time tracking</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefit 2 */}
            <div className="testimonial-card hover-lift">
              <div className="flex gap-6">
                <div className="feature-icon-box flex-shrink-0">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Focus on Right Prospects</h3>
                  <p className="text-muted-foreground mb-4">
                    Company size-aware targeting ensures you contact the right decision-makers at each organization.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="code-badge">Founders at startups</span>
                    <span className="code-badge">VPs at enterprises</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefit 3 */}
            <div className="testimonial-card hover-lift">
              <div className="flex gap-6">
                <div className="feature-icon-box flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Improve Conversion</h3>
                  <p className="text-muted-foreground mb-4">
                    Multi-threading visualization helps you engage the right contacts in the optimal order.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="code-badge">Company prioritization</span>
                    <span className="code-badge">Strategy visualization</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefit 4 */}
            <div className="testimonial-card hover-lift">
              <div className="flex gap-6">
                <div className="feature-icon-box flex-shrink-0">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">AI-Powered Intelligence</h3>
                  <p className="text-muted-foreground mb-4">
                    Advanced analysis with detailed reasoning, signals, and buyer type classification.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="code-badge">0-100 scoring</span>
                    <span className="code-badge">Signal detection</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        ref={ctaReveal.ref}
        className="relative py-24 px-6"
      >
        <div className="container mx-auto max-w-4xl">
          <div className={`animated-border p-12 md:p-16 text-center ${ctaReveal.isVisible ? 'reveal-scale' : 'opacity-0'}`}>
            <div className="relative z-10 space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/80 border border-border/50">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">Start Free Today</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                Ready to Transform Your
                <br />
                <span className="text-gradient">Lead Qualification?</span>
              </h2>

              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Join sales teams who are already closing more deals with AI-powered lead intelligence.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/app">
                  <Button size="lg" className="btn-primary text-lg px-10 py-6 h-auto">
                    <Play className="h-5 w-5 mr-2" />
                    Get Started Now
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Setup in minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Free to try</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-border/40 bg-background/60 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-16">
          <div className="grid md:grid-cols-5 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">Persona Ranker</span>
              </div>
              <p className="text-muted-foreground mb-6 max-w-sm">
                AI-powered lead qualification and ranking system built for modern B2B sales teams.
              </p>
              <div className="flex items-center gap-3">
                <a href="#" className="w-10 h-10 rounded-lg bg-secondary/80 flex items-center justify-center hover:bg-secondary transition-colors">
                  <Github className="h-5 w-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-secondary/80 flex items-center justify-center hover:bg-secondary transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-secondary/80 flex items-center justify-center hover:bg-secondary transition-colors">
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li><Link href="/app" className="hover:text-foreground transition-colors">Dashboard</Link></li>
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Support</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-border/40 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 Throxy Persona Ranker. Built for B2B sales teams.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Built with Next.js
              </span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground" />
              <span>OpenAI GPT-4o-mini</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
