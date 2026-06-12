"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Trophy, CalendarDays, Users, BarChart3, Award, QrCode, Shield } from "lucide-react"
import { motion } from "framer-motion"

const features = [
  { icon: CalendarDays, title: "Unlimited Events", desc: "Create and manage unlimited events from a single account" },
  { icon: Users, title: "Multi-Role System", desc: "Super Admin, Event Admin, Judge, Student, and Public roles" },
  { icon: Award, title: "Smart Scoring", desc: "Custom point systems, penalties, and real-time leaderboards" },
  { icon: BarChart3, title: "Analytics", desc: "Detailed analytics with charts and export capabilities" },
  { icon: QrCode, title: "QR & Certificates", desc: "Auto-generate QR codes, ID cards, certificates, and posters" },
  { icon: Shield, title: "Secure & Scalable", desc: "Row-level security with Supabase, ready for Vercel deployment" },
]

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-24 sm:py-32 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-purple-600/10" />
        <div className="mx-auto max-w-4xl text-center relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Trophy className="mx-auto h-16 w-16 text-primary mb-6" />
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              FestBoard
            </h1>
            <p className="mt-4 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
              Multi-Event Competition & Score Management Platform
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Create, manage, and score unlimited events — from a single account
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-10 flex items-center justify-center gap-4"
          >
            <Link href="/login">
              <Button size="lg" className="gradient-primary">Get Started</Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline">Create Account</Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">Everything you need to manage events</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass-card rounded-xl p-6"
              >
                <feature.icon className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>FestBoard &copy; {new Date().getFullYear()} &mdash; Multi-Event Competition Platform</p>
      </footer>
    </div>
  )
}
