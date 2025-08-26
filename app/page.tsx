"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Brain, Target, TrendingUp, Shield, Zap, BarChart3 } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        {/* Large emerald gradient circle - top right */}
        <div className="absolute -top-40 -right-80 w-96 h-96 bg-gradient-to-r from-emerald-500/20 to-teal-500/15 rounded-full blur-3xl animate-pulse"></div>

        {/* Blue gradient circle - bottom left */}
        <div
          className="absolute -bottom-40 -left-80 w-80 h-80 bg-gradient-to-r from-blue-500/15 to-cyan-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>

        {/* Purple gradient circle - center */}
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/8 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>

        {/* Additional smaller circles for more visual interest */}
        <div
          className="absolute top-20 left-1/4 w-64 h-64 bg-gradient-to-r from-emerald-400/15 to-green-400/10 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>

        <div
          className="absolute bottom-20 right-1/4 w-72 h-72 bg-gradient-to-r from-teal-400/12 to-cyan-400/8 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "3s" }}
        ></div>

        {/* Floating animated circles */}
        <motion.div
          className="absolute top-1/3 right-1/3 w-48 h-48 bg-gradient-to-r from-indigo-500/15 to-blue-500/10 rounded-full blur-2xl"
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
          }}
          transition={{
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        ></motion.div>

        <motion.div
          className="absolute bottom-1/3 left-1/3 w-56 h-56 bg-gradient-to-r from-violet-500/12 to-purple-500/8 rounded-full blur-2xl"
          animate={{
            y: [0, 15, 0],
            x: [0, -15, 0],
          }}
          transition={{
            duration: 10,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 2,
          }}
        ></motion.div>

        {/* Overlay gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/40"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-border/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-serif font-black text-foreground">Finance.ai</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-4"
            >
              <Link href="/auth">
                <Button variant="ghost" className="text-foreground hover:bg-primary/10 cursor-pointer">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth">
                <Button className="bg-primary hover:bg-primary/90 cursor-pointer">Get Started</Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-black text-foreground leading-tight">
                Start Saving{" "}
                <span className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">Smarter</span>
              </h1>
              <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                AI-powered financial management that analyzes your spending patterns and provides personalized savings
                strategies to help you reach your goals faster.
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link href="/auth">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 py-6 cursor-pointer">
                  Start Saving Smarter
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="glass border-border/50 text-lg px-8 py-6 bg-transparent cursor-pointer">
                Watch Demo
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-foreground mb-4">
              Intelligent Financial Management
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powered by advanced AI to give you insights that traditional budgeting apps can't match
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "AI-Powered Insights",
                description:
                  "Get personalized savings recommendations based on your unique spending patterns and financial goals.",
                delay: 0.1,
              },
              {
                icon: Target,
                title: "Smart Goal Tracking",
                description:
                  "Set and track financial goals with intelligent progress monitoring and milestone celebrations.",
                delay: 0.2,
              },
              {
                icon: TrendingUp,
                title: "Expense Analytics",
                description:
                  "Visualize your spending with beautiful charts and discover hidden patterns in your finances.",
                delay: 0.3,
              },
              {
                icon: Shield,
                title: "Secure & Private",
                description: "Bank-level security with end-to-end encryption. Your financial data stays protected.",
                delay: 0.4,
              },
              {
                icon: Zap,
                title: "Real-time Updates",
                description:
                  "Get instant notifications and updates on your financial progress and optimization opportunities.",
                delay: 0.5,
              },
              {
                icon: BarChart3,
                title: "Advanced Reporting",
                description:
                  "Generate detailed financial reports and export data for tax preparation or financial planning.",
                delay: 0.6,
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: feature.delay, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <Card className="glass-strong border-border/30 hover:border-primary/30 transition-all duration-300 h-full">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl font-serif font-bold text-foreground">{feature.title}</CardTitle>
                    <CardDescription className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Card className="glass-strong border-border/30 text-center">
              <CardContent className="py-16">
                <div className="space-y-6">
                  <h2 className="text-3xl sm:text-4xl font-serif font-black text-foreground">
                    Ready to Transform Your Finances?
                  </h2>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Join thousands of users who have already optimized their savings with our AI-powered platform.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                    <Link href="/auth">
                      <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 py-6 cursor-pointer">
                        Start Your Journey
                        <ArrowRight className="w-5 h-5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/20 py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-serif font-black text-foreground">Finance.ai</span>
            </div>
            <p className="text-muted-foreground text-center md:text-right">
              © 2024 Finance.ai. Built with AI-powered insights for smarter financial decisions.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
