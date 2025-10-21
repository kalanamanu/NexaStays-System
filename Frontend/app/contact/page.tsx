"use client";

import { useState } from "react";
import NavBar from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";

/**
 * Contact page
 * - Client component with a simple contact form (name, email, subject, message)
 * - Posts JSON to /api/contact (replace with your backend endpoint)
 * - Shows inline validation, loading state, success and error messages
 *
 * Save as: app/contact/page.tsx
 */

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<null | { ok: boolean; msg: string }>(
    null
  );

  const validate = () => {
    if (!name.trim()) return "Please enter your name.";
    if (!email.trim()) return "Please enter your email.";
    // basic email check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address.";
    if (!subject.trim()) return "Please add a subject.";
    if (!message.trim() || message.trim().length < 10)
      return "Please enter a message (at least 10 characters).";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    const err = validate();
    if (err) {
      setStatus({ ok: false, msg: err });
      return;
    }

    setLoading(true);
    try {
      // Replace /api/contact with your backend route that handles contact messages
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });

      if (res.ok) {
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
        setStatus({
          ok: true,
          msg: "Thanks - your message has been sent. We'll get back to you shortly.",
        });
      } else {
        const data = await res.json().catch(() => null);
        setStatus({
          ok: false,
          msg: data?.message || "Something went wrong. Please try again later.",
        });
      }
    } catch (e) {
      setStatus({ ok: false, msg: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <NavBar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Contact Us
          </h1>
          <p className="mt-3 text-lg text-gray-700 dark:text-gray-300 max-w-2xl">
            Have a question, feedback, or want to partner with Nexa Stays? Fill
            out the form or use the contact details below.
          </p>
        </motion.header>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact info column */}
          <motion.aside
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45 }}
            className="space-y-6"
          >
            <div className="rounded-xl bg-white/90 dark:bg-gray-800/70 p-6 shadow-md">
              <h3 className="text-xl font-semibold mb-2">Get in touch</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                We're here to help - whether you're a guest, hotel partner or
                developer integrating with our API.
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-md bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Email</div>
                    <a
                      href="mailto:hello@nexastays.com"
                      className="text-sm text-gray-600 dark:text-gray-300 hover:underline"
                    >
                      hello@nexastays.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-md bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Phone</div>
                    <a
                      href="tel:+1234567890"
                      className="text-sm text-gray-600 dark:text-gray-300 hover:underline"
                    >
                      +94 (76) 372 1 457
                    </a>
                    <div className="text-xs text-gray-500">
                      Mon–Fri, 9am–6pm
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-md bg-pink-50 dark:bg-pink-900/10 text-pink-600">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Head office</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      123 Harbor Drive, Suite 400, Colombo
                    </div>
                    <div className="text-xs text-gray-500">Country • ZIP</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white/90 dark:bg-gray-800/70 p-6 shadow-md">
              <h4 className="font-semibold mb-2">Support</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                For support queries about bookings or reservations, please
                include your reservation ID in the message.
              </p>
              <div className="mt-4">
                <a
                  href="/help"
                  className="text-sm text-indigo-600 hover:underline"
                >
                  Visit Help Center →
                </a>
              </div>
            </div>
          </motion.aside>

          {/* Form column */}
          <motion.section
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45 }}
            className="lg:col-span-2"
          >
            <div className="rounded-xl bg-white/90 dark:bg-gray-800/70 p-8 shadow-lg">
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Full name
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-2 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      placeholder="Your name"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Email
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-2 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      placeholder="you@example.com"
                      required
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Subject
                  </span>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder="How can we help?"
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Message
                  </span>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                    className="mt-2 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder="Write your message..."
                    required
                  />
                </label>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Button
                      type="submit"
                      className="px-6 py-2"
                      disabled={loading}
                    >
                      {loading ? "Sending..." : "Send message"}
                    </Button>
                  </div>

                  <div className="text-sm">
                    {status ? (
                      <span
                        className={
                          status.ok ? "text-green-600" : "text-red-500"
                        }
                      >
                        {status.msg}
                      </span>
                    ) : (
                      <span className="text-gray-500">
                        We reply within 1–2 business days.
                      </span>
                    )}
                  </div>
                </div>
              </form>
            </div>

            {/* Optional: small privacy note */}
            <p className="mt-3 text-xs text-gray-500">
              By contacting us you agree to our{" "}
              <a className="underline">privacy policy</a>.
            </p>
          </motion.section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
