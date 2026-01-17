'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Upload,
  BarChart3,
  Target,
  Zap,
  TrendingUp,
  Users,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  Brain,
  Filter,
  Network,
  FlaskConical,
  Activity,
  Shield,
  Clock,
  FileText,
  Database,
  BarChart,
  Layers,
  Play,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <div className="fixed inset-0 gradient-mesh pointer-events-none" />
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-chart-2/5 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation */}
      <nav className="relative border-b bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">Persona Ranker</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/app">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Link href="/app">
                <Button className="gradient-primary text-white">
                  Get Started
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center space-y-8 animate-fade-in">
            <Badge className="badge-gradient px-4 py-1.5 text-sm">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered Lead Intelligence
            </Badge>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Transform Raw Leads Into
              <br />
              <span className="text-gradient">Ranked Opportunities</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Automatically qualify, score, and rank your B2B sales leads using advanced AI. 
              Focus on the right prospects at the right companies.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/app">
                <Button size="lg" className="gradient-primary text-white text-lg px-8 py-6 h-auto">
                  <Play className="h-5 w-5 mr-2" />
                  Start Ranking Leads
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 h-auto">
                <FileText className="h-5 w-5 mr-2" />
                View Documentation
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 max-w-3xl mx-auto">
              <div className="glass-card p-6 rounded-xl">
                <div className="text-3xl font-bold text-primary mb-2">3-Step</div>
                <div className="text-sm text-muted-foreground">AI Pipeline</div>
              </div>
              <div className="glass-card p-6 rounded-xl">
                <div className="text-3xl font-bold text-chart-2 mb-2">0-100</div>
                <div className="text-sm text-muted-foreground">Relevance Scoring</div>
              </div>
              <div className="glass-card p-6 rounded-xl">
                <div className="text-3xl font-bold text-chart-3 mb-2">40%</div>
                <div className="text-sm text-muted-foreground">Cost Reduction</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What It Does Section */}
      <section className="relative py-20 px-6 bg-secondary/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">What Persona Ranker Does</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A complete AI-powered solution for B2B lead qualification and prioritization
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="glass-card card-elevated border-2">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center mb-4">
                  <Filter className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-2xl">Qualify Leads</CardTitle>
                <CardDescription className="text-base">
                  Automatically determine if leads are worth contacting based on your ideal customer persona
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>Company size-aware targeting</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>Department and role matching</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>Hard exclusion rules (HR, Legal, etc.)</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="glass-card card-elevated border-2">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg gradient-secondary flex items-center justify-center mb-4">
                  <BarChart className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-2xl">Score Leads</CardTitle>
                <CardDescription className="text-base">
                  Rate each lead 0-100 based on how well they match your ideal customer profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-chart-2" />
                    <span>Relevance scoring (0-100)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-chart-2" />
                    <span>Buyer type classification</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-chart-2" />
                    <span>Positive & negative signals</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="glass-card card-elevated border-2">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg gradient-success flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-2xl">Rank Leads</CardTitle>
                <CardDescription className="text-base">
                  Prioritize leads within each company for optimal multi-threading outreach strategy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Company-level prioritization</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Multi-threading visualization</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Export top N per company</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A sophisticated 3-step AI pipeline that processes your leads efficiently
            </p>
          </div>

          <div className="space-y-12">
            {/* Step 1 */}
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <Badge className="badge-gradient w-fit">Step 1</Badge>
                <h3 className="text-3xl font-bold">Pre-Filter</h3>
                <p className="text-lg text-muted-foreground">
                  Quick AI-powered check to eliminate obviously irrelevant leads before expensive analysis.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Filters out HR, Legal, Finance, Engineering roles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Fast, low-cost relevance check</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Reduces processing costs by ~40%</span>
                  </li>
                </ul>
              </div>
              <div className="glass-card p-8 rounded-xl card-elevated">
                <div className="flex items-center justify-center h-64">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto">
                      <Filter className="h-10 w-10 text-white" />
                    </div>
                    <div className="text-2xl font-bold">Quick Check</div>
                    <div className="text-muted-foreground">Fast elimination of irrelevant leads</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="glass-card p-8 rounded-xl card-elevated order-2 md:order-1">
                <div className="flex items-center justify-center h-64">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 rounded-full gradient-secondary flex items-center justify-center mx-auto">
                      <Brain className="h-10 w-10 text-white" />
                    </div>
                    <div className="text-2xl font-bold">Deep Analysis</div>
                    <div className="text-muted-foreground">Comprehensive scoring & classification</div>
                  </div>
                </div>
              </div>
              <div className="space-y-4 order-1 md:order-2">
                <Badge className="badge-gradient w-fit">Step 2</Badge>
                <h3 className="text-3xl font-bold">Analyze</h3>
                <p className="text-lg text-muted-foreground">
                  Comprehensive AI analysis that scores leads and classifies them based on company size and persona fit.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-chart-2 mt-0.5 flex-shrink-0" />
                    <span>Company size-aware scoring (Startup/SMB/Mid-Market/Enterprise)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-chart-2 mt-0.5 flex-shrink-0" />
                    <span>Buyer type classification (Decision Maker, Champion, Influencer)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-chart-2 mt-0.5 flex-shrink-0" />
                    <span>Detailed reasoning and signal detection</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <Badge className="badge-gradient w-fit">Step 3</Badge>
                <h3 className="text-3xl font-bold">Rank</h3>
                <p className="text-lg text-muted-foreground">
                  Company-level ranking to prioritize contacts for multi-threading outreach strategies.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Prioritizes leads within each company</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Optimizes for multi-threading engagement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Visualizes contact hierarchy and strategy</span>
                  </li>
                </ul>
              </div>
              <div className="glass-card p-8 rounded-xl card-elevated">
                <div className="flex items-center justify-center h-64">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 rounded-full gradient-success flex items-center justify-center mx-auto">
                      <Layers className="h-10 w-10 text-white" />
                    </div>
                    <div className="text-2xl font-bold">Prioritization</div>
                    <div className="text-muted-foreground">Company-level ranking</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-6 bg-secondary/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to transform your lead qualification process
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="glass-card card-elevated">
              <CardHeader>
                <Upload className="h-8 w-8 text-primary mb-2" />
                <CardTitle>CSV Upload</CardTitle>
                <CardDescription>
                  Drag and drop or browse to upload your lead data
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-card card-elevated">
              <CardHeader>
                <Activity className="h-8 w-8 text-chart-2 mb-2" />
                <CardTitle>Real-Time Progress</CardTitle>
                <CardDescription>
                  Watch your leads being processed in real-time with live updates
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-card card-elevated">
              <CardHeader>
                <DollarSign className="h-8 w-8 text-chart-3 mb-2" />
                <CardTitle>Cost Tracking</CardTitle>
                <CardDescription>
                  Monitor AI costs per run with detailed token usage statistics
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-card card-elevated">
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Sortable Results</CardTitle>
                <CardDescription>
                  Filter and sort your ranked leads by score, company, or relevance
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-card card-elevated">
              <CardHeader>
                <FileText className="h-8 w-8 text-chart-2 mb-2" />
                <CardTitle>CSV Export</CardTitle>
                <CardDescription>
                  Export top N leads per company or all results to CSV
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-card card-elevated">
              <CardHeader>
                <FlaskConical className="h-8 w-8 text-chart-3 mb-2" />
                <CardTitle>A/B Testing</CardTitle>
                <CardDescription>
                  Compare different AI prompts to optimize accuracy and cost
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-card card-elevated">
              <CardHeader>
                <Network className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Multi-Threading</CardTitle>
                <CardDescription>
                  Visualize contact hierarchy and engagement strategy per company
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-card card-elevated">
              <CardHeader>
                <Database className="h-8 w-8 text-chart-2 mb-2" />
                <CardTitle>Run History</CardTitle>
                <CardDescription>
                  Track all your ranking runs and compare results over time
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-card card-elevated">
              <CardHeader>
                <Shield className="h-8 w-8 text-chart-3 mb-2" />
                <CardTitle>Persona-Aware</CardTitle>
                <CardDescription>
                  Built-in Throxy persona spec with company size-aware targeting
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Why Persona Ranker?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built specifically for B2B sales teams targeting complex verticals
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="glass-card card-elevated p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Save Time & Money</h3>
                  <p className="text-muted-foreground mb-4">
                    Pre-filtering reduces AI costs by ~40% by eliminating irrelevant leads before expensive analysis.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Cost-efficient GPT-4o-mini model</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Real-time cost tracking</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="glass-card card-elevated p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg gradient-secondary flex items-center justify-center flex-shrink-0">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Focus on Right Prospects</h3>
                  <p className="text-muted-foreground mb-4">
                    Company size-aware targeting ensures you contact the right decision-makers at each organization.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-chart-2" />
                      <span>Founders at startups, VPs at enterprises</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-chart-2" />
                      <span>Automatic hard exclusions (HR, Legal, etc.)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="glass-card card-elevated p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg gradient-success flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Improve Conversion</h3>
                  <p className="text-muted-foreground mb-4">
                    Multi-threading visualization helps you engage the right contacts in the optimal order.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Company-level prioritization</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Engagement strategy visualization</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="glass-card card-elevated p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg gradient-warning flex items-center justify-center flex-shrink-0">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">AI-Powered Intelligence</h3>
                  <p className="text-muted-foreground mb-4">
                    Advanced AI analysis with detailed reasoning, signals, and buyer type classification.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-yellow-600" />
                      <span>0-100 relevance scoring</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-yellow-600" />
                      <span>Positive & negative signal detection</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-6 bg-gradient-to-b from-secondary/30 to-background">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="glass-card card-elevated p-12 rounded-2xl space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold">Ready to Transform Your Lead Qualification?</h2>
              <p className="text-xl text-muted-foreground">
                Start ranking your leads with AI-powered intelligence today
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/app">
                <Button size="lg" className="gradient-primary text-white text-lg px-8 py-6 h-auto">
                  <Play className="h-5 w-5 mr-2" />
                  Get Started Now
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 h-auto">
                Learn More
              </Button>
            </div>

            <div className="pt-8 border-t flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Setup in minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Free to try</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold">Persona Ranker</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered lead qualification and ranking system for B2B sales.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/app" className="hover:text-foreground">Dashboard</Link></li>
                <li><Link href="/app" className="hover:text-foreground">Features</Link></li>
                <li><Link href="/app" className="hover:text-foreground">Pricing</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Documentation</Link></li>
                <li><Link href="#" className="hover:text-foreground">API Reference</Link></li>
                <li><Link href="#" className="hover:text-foreground">Support</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">About</Link></li>
                <li><Link href="#" className="hover:text-foreground">Blog</Link></li>
                <li><Link href="#" className="hover:text-foreground">Contact</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2024 Throxy Persona Ranker. Built for B2B sales teams.</p>
            <div className="flex items-center gap-4">
              <span>Built with Next.js</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground" />
              <span>OpenAI GPT-4o-mini</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
