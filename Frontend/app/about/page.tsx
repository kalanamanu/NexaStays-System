"use client";

import Link from "next/link";
import NavBar from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { motion } from "framer-motion";
import { Users, Globe, Heart, Clock, Mail } from "lucide-react";
import Footer from "@/components/Footer";

const team = [
  {
    id: 1,
    name: "Kalana Jayasekara",
    role: "Founder & CEO",
    bio: "Product lead focused on hospitality experiences and platform strategy.",
    avatar: "/images/team-1.jpg",
  },
  {
    id: 2,
    name: "Amara Perera",
    role: "Head of Engineering",
    bio: "Builds reliable systems, payments and reservation flows.",
    avatar: "/images/team-2.jpg",
  },
  {
    id: 3,
    name: "Nihara Silva",
    role: "Head of Design",
    bio: "Designs polished UIs and delightful user journeys.",
    avatar: "/images/team-3.jpg",
  },
];

const container = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <NavBar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              About Nexa Stays
            </h1>
            <p className="mt-6 text-lg text-gray-700 dark:text-gray-300 max-w-xl">
              Nexa Stays is a modern reservation platform built to simplify
              hotel discovery, booking, and stay management for both travelers
              and hoteliers. We combine beautiful design, robust backend
              services, and thoughtful user experiences to make hospitality
              delightful.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/hotels">
                <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                  Explore Hotels
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" className="border-indigo-300">
                  Contact Sales
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-6 bg-white/80 dark:bg-gray-800/70">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-700/20">
                      <Globe className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Global Coverage</CardTitle>
                      <CardDescription className="text-sm">
                        500+ partner hotels across 150+ countries.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="p-6 bg-white/80 dark:bg-gray-800/70">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-700/20">
                      <Heart className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Guest-first</CardTitle>
                      <CardDescription className="text-sm">
                        Design and features built around guest delight.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="p-6 bg-white/80 dark:bg-gray-800/70">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-sky-100 dark:bg-sky-700/20">
                      <Clock className="h-6 w-6 text-sky-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Fast & Reliable</CardTitle>
                      <CardDescription className="text-sm">
                        Engineered for speed and accuracy at scale.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="p-6 bg-white/80 dark:bg-gray-800/70">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-violet-100 dark:bg-violet-700/20">
                      <Users className="h-6 w-6 text-violet-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        Trusted by Hotels
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Close partnerships with hotel teams and operators.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </motion.div>
        </section>

        {/* Mission & Values */}
        <section className="mb-16">
          <motion.div
            className="prose max-w-none dark:prose-invert"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold mb-4">Our mission</h2>
            <p className="text-gray-700 dark:text-gray-300 max-w-3xl">
              We exist to make travel planning and hotel operations simple and
              transparent. From fast bookings to smooth check-ins and reliable
              billing, our platform helps hotels deliver consistent experiences
              while giving guests confidence and choice.
            </p>
          </motion.div>
        </section>

        {/* Timeline / Story */}
        <section className="mb-16">
          <h3 className="text-2xl font-bold mb-6">Our story</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              className="p-6 bg-white/80 dark:bg-gray-800/70 rounded-lg shadow-md"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <h4 className="font-semibold mb-2">Founded</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                2022 - Started building a reservation platform to reduce
                friction in bookings.
              </p>
            </motion.div>

            <motion.div
              className="p-6 bg-white/80 dark:bg-gray-800/70 rounded-lg shadow-md"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
            >
              <h4 className="font-semibold mb-2">First partnerships</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                2023 - Onboarded our first 50 hotels and launched core booking
                features.
              </p>
            </motion.div>

            <motion.div
              className="p-6 bg-white/80 dark:bg-gray-800/70 rounded-lg shadow-md"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h4 className="font-semibold mb-2">Scaling</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                2024 - Focused on reliability, dashboards for hoteliers and
                easier check-in flows.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="mb-20">
          <div className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-10 shadow-xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h3 className="text-2xl font-bold">
                  Want to partner or learn more?
                </h3>
                <p className="mt-2 text-white/90 max-w-xl">
                  Reach out — whether you're a traveler, hotel operator or
                  partner, we’d love to talk.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link href="/contact">
                  <Button className="bg-white text-indigo-700">
                    Get in touch
                  </Button>
                </Link>
                <a
                  href="mailto:hello@nexastays.example"
                  className="flex items-center gap-2 text-white/90 hover:underline"
                >
                  <Mail className="h-5 w-5" />
                  hello@nexastays.example
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
