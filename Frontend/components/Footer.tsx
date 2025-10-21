"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Phone,
  MapPin,
  Twitter,
  Instagram,
  Facebook,
  Linkedin,
  Globe,
} from "lucide-react";

/**
 * Professional footer component with cohesive color palette and improved contrast.
 * Save as: components/Footer.tsx
 *
 * Notes:
 * - Keeps a smooth gradient that visually connects with the page sections above.
 * - Stronger contrast for text & inputs for accessibility.
 * - Clean, evenly spaced columns and a subtle top divider to separate the stats section.
 * - Newsletter form placeholder posts to /api/newsletter (implement server-side).
 */

export default function Footer() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | { ok: boolean; msg: string }>(
    null
  );

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setResult({ ok: false, msg: "Please enter a valid email address." });
      return;
    }

    setLoading(true);
    try {
      // Replace with your backend endpoint
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setResult({
          ok: true,
          msg: "Subscribed! Check your inbox for confirmation.",
        });
        setEmail("");
      } else {
        const data = await res.json().catch(() => null);
        setResult({
          ok: false,
          msg: data?.message || "Subscription failed. Try again later.",
        });
      }
    } catch (err) {
      setResult({ ok: false, msg: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="relative bg-gradient-to-tr from-[#2b0b59] via-[#3f1a8a] to-[#21306d] text-white mt-12">
      {/* Decorative top divider to blend with previous sections */}
      <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 pt-16 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-12 gap-10"
        >
          {/* Brand & Newsletter (left column) */}
          <div className="md:col-span-4">
            <div className="flex items-start gap-4">
              <div>
                <h3 className="text-2xl font-semibold tracking-tight">
                  Nexa Stays
                </h3>
                <p className="text-sm text-white/80 mt-1">
                  Seamless stays. Trusted hospitality.
                </p>
              </div>
            </div>

            <p className="mt-6 text-sm text-white/70 max-w-sm">
              Subscribe to receive curated hotel deals, travel tips and platform
              updates - no spam.
            </p>

            <form
              onSubmit={handleSubscribe}
              className="mt-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center"
              noValidate
            >
              <label htmlFor="footer-email" className="sr-only">
                Email address
              </label>
              <input
                id="footer-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="Email address"
                className="w-full sm:flex-1 rounded-md bg-white/6 text-white placeholder-white/60 px-3 py-2 border border-white/8 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              />
              <Button type="submit" className="px-4 py-2" disabled={loading}>
                {loading ? "Subscribing…" : "Subscribe"}
              </Button>
            </form>

            {result && (
              <div
                className={`mt-3 text-sm ${
                  result.ok ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {result.msg}
              </div>
            )}

            <div className="mt-6 flex items-center gap-3">
              <a
                aria-label="Twitter"
                href="#"
                className="p-2 rounded-md bg-white/6 hover:bg-white/10 transition"
              >
                <Twitter className="h-5 w-5 text-white" />
              </a>
              <a
                aria-label="Instagram"
                href="#"
                className="p-2 rounded-md bg-white/6 hover:bg-white/10 transition"
              >
                <Instagram className="h-5 w-5 text-white" />
              </a>
              <a
                aria-label="Facebook"
                href="#"
                className="p-2 rounded-md bg-white/6 hover:bg-white/10 transition"
              >
                <Facebook className="h-5 w-5 text-white" />
              </a>
              <a
                aria-label="LinkedIn"
                href="#"
                className="p-2 rounded-md bg-white/6 hover:bg-white/10 transition"
              >
                <Linkedin className="h-5 w-5 text-white" />
              </a>
            </div>
          </div>

          {/* Navigation columns */}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
            <div>
              <h4 className="text-sm font-semibold mb-3 text-white/90">
                Product
              </h4>
              <ul className="space-y-2 text-sm text-white/80">
                <li>
                  <Link href="/hotels" className="hover:text-white transition">
                    Our Hotels
                  </Link>
                </li>
                <li>
                  <Link
                    href="/reservation"
                    className="hover:text-white transition"
                  >
                    Reservations
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    className="hover:text-white transition"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/features"
                    className="hover:text-white transition"
                  >
                    Features
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3 text-white/90">
                Company
              </h4>
              <ul className="space-y-2 text-sm text-white/80">
                <li>
                  <Link href="/about" className="hover:text-white transition">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="hover:text-white transition">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="/press" className="hover:text-white transition">
                    Press
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-white transition">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3 text-white/90">
                Support
              </h4>
              <ul className="space-y-2 text-sm text-white/80">
                <li>
                  <Link href="/help" className="hover:text-white transition">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white transition">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3 text-white/90">
                Contact
              </h4>
              <ul className="space-y-3 text-sm text-white/80">
                <li className="flex items-start gap-3">
                  <div className="p-2 rounded-md bg-white/6">
                    <MapPin className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-white">123 Harbor Drive</div>
                    <div className="text-xs text-white/70">
                      Suite 400, Colombo
                    </div>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-white/6">
                    <Phone className="h-4 w-4 text-white" />
                  </div>
                  <a
                    href="tel:+1234567890"
                    className="text-white/80 hover:text-white"
                  >
                    +94 (76) 372 1 457
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-white/6">
                    <Mail className="h-4 w-4 text-white" />
                  </div>
                  <a
                    href="mailto:hello@nexastays.com"
                    className="text-white/80 hover:text-white"
                  >
                    hello@nexastays.example
                  </a>
                </li>
                <li className="pt-1">
                  <a
                    href="#"
                    className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white"
                  >
                    <Globe className="h-4 w-4" />
                    <span>English (US)</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-white/8 pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-white/70">
              © {new Date().getFullYear()} Nexa Stays. All rights reserved.
            </div>

            <div className="flex items-center gap-6">
              <nav className="hidden sm:flex items-center gap-6 text-sm text-white/70">
                <Link href="/privacy" className="hover:text-white transition">
                  Privacy
                </Link>
                <Link href="/terms" className="hover:text-white transition">
                  Terms
                </Link>
                <Link href="/sitemap" className="hover:text-white transition">
                  Sitemap
                </Link>
              </nav>

              <div className="text-sm text-white/70">
                Built with <span aria-hidden>❤️</span> for travel
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
