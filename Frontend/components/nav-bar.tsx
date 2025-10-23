"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useUser } from "@/context/user-context";
import { motion } from "framer-motion";
import UserMenu from "@/components/ui/UserMenu";

/**
 * NavBar
 * - For "Travel Company" users: hide main nav links and disable home link
 * - For all others: show normal nav
 *
 * Save this file as: components/nav-bar.tsx
 */

export default function NavBar() {
  const { user } = useUser();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const primaryNav = [
    { href: "/", label: "Home" },
    { href: "/hotels", label: "Our Hotels" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact Us" },
  ];

  // Check if the user is Travel Company
  const isTravelCompany = user?.role?.toLowerCase() === "travel-company";

  if (!mounted) return null;

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white shadow-2xl sticky top-0 z-50 backdrop-blur-md border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 justify-between">
          {/* Left: Brand */}
          <div className="flex items-center flex-1">
            {isTravelCompany ? (
              // Just display the brand, no link
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent select-none cursor-default">
                Nexa Stays
              </span>
            ) : (
              <Link href="/" className="flex items-center space-x-3">
                <span className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  Nexa Stays
                </span>
              </Link>
            )}
          </div>

          {/* Middle: Primary navigation (visible on md+) */}
          {!isTravelCompany && (
            <div className="hidden md:flex items-center justify-center flex-1">
              <div className="flex items-center space-x-4">
                {primaryNav.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-4 py-2 text-sm font-medium text-white hover:text-purple-200 hover:bg-white/10 rounded-lg transition-all duration-200 backdrop-blur-sm"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Right: Theme toggle + auth / user */}
          <div className="flex items-center justify-end flex-1 space-x-2">
            <div className="flex items-center space-x-2">
              {/* Theme Toggle */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="text-white hover:bg-white/10 hover:text-purple-200 transition-all duration-200"
                >
                  {theme === "dark" ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </motion.div>

              {/* Auth buttons (when logged out) or UserMenu (when logged in) */}
              {user ? (
                <UserMenu />
              ) : (
                <div className="hidden sm:flex items-center space-x-2">
                  <Link href="/login">
                    <Button
                      variant="ghost"
                      className="text-white hover:bg-white/10"
                    >
                      Login
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="bg-white/10 text-white border border-white/10 hover:bg-white/20">
                      Register
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile: menu button */}
              <div className="md:hidden">
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                  <SheetTrigger asChild>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/10"
                      >
                        <Menu className="h-6 w-6" />
                      </Button>
                    </motion.div>
                  </SheetTrigger>

                  <SheetContent
                    side="right"
                    className="bg-gradient-to-b from-purple-600 to-indigo-700 text-white border-purple-500/20 backdrop-blur-md"
                  >
                    <div className="mt-6 px-4">
                      {/* Mobile profile preview when logged in */}
                      {user && (
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white font-semibold">
                              {user.customerProfile
                                ? `${(
                                    user.customerProfile.firstName ?? "U"
                                  ).charAt(0)}${(
                                    user.customerProfile.lastName ?? ""
                                  ).charAt(0)}`
                                : user.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-medium">
                                {user.customerProfile
                                  ? `${user.customerProfile.firstName} ${user.customerProfile.lastName}`
                                  : user.email.split("@")[0]}
                              </div>
                              <div className="text-xs text-white/60 capitalize">
                                {user.role}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Primary nav (mobile) */}
                      {!isTravelCompany && (
                        <nav className="space-y-2">
                          {primaryNav.map((link) => (
                            <Link
                              key={link.href}
                              href={link.href}
                              className="block rounded-md px-4 py-3 text-base font-medium text-white hover:bg-white/5"
                              onClick={() => setIsOpen(false)}
                            >
                              {link.label}
                            </Link>
                          ))}
                        </nav>
                      )}

                      <div className="pt-4 border-t border-white/6 mt-4">
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-white hover:bg-white/5"
                          onClick={() => {
                            setTheme(theme === "dark" ? "light" : "dark");
                            setIsOpen(false);
                          }}
                        >
                          {theme === "dark" ? (
                            <Sun className="h-4 w-4 mr-2" />
                          ) : (
                            <Moon className="h-4 w-4 mr-2" />
                          )}
                          Toggle Theme
                        </Button>

                        {user ? (
                          <div className="mt-3">
                            <UserMenu compact />
                          </div>
                        ) : (
                          <div className="mt-3 space-y-2">
                            <Link
                              href="/login"
                              onClick={() => setIsOpen(false)}
                            >
                              <Button variant="outline" className="w-full">
                                Login
                              </Button>
                            </Link>
                            <Link
                              href="/register"
                              onClick={() => setIsOpen(false)}
                            >
                              <Button className="w-full">Register</Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
