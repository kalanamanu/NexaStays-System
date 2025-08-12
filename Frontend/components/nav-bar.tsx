"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Moon, Sun, LogOut, Hotel, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import { useUser } from "@/context/user-context";
import { motion, AnimatePresence } from "framer-motion";

export default function NavBar() {
  const { user, logout } = useUser();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const getNavLinks = () => {
    if (!user) {
      return [
        { href: "/register", label: "Register" },
        { href: "/login", label: "Login" },
      ];
    }

    switch (user.role) {
      case "customer":
        return [
          { href: "/", label: "Home" },
          { href: "/reservation", label: "Make Reservation" },
          { href: "/dashboard/customer", label: "My Bookings" },
        ];
      case "clerk":
        return [
          { href: "/", label: "Home" },
          { href: "/dashboard/clerk", label: "Check-In/Out" },
          { href: "/dashboard/clerk?tab=reservations", label: "Reservations" },
        ];
      case "manager":
        return [
          { href: "/", label: "Home" },
          { href: "/dashboard/manager", label: "Reports" },
        ];
      case "travel-company":
        return [
          { href: "/", label: "Home" },
          { href: "/travel-portal", label: "Block Bookings" },
        ];
      default:
        return [{ href: "/", label: "Home" }];
    }
  };

  const navLinks = getNavLinks();

  const NavLinks = ({ mobile = false }) => (
    <AnimatePresence>
      {navLinks.map((link, index) => (
        <motion.div
          key={link.href}
          initial={{ opacity: 0, y: mobile ? 20 : -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: mobile ? 20 : -20 }}
          transition={{ delay: index * 0.1 }}
        >
          <Link
            href={link.href}
            className={`${
              mobile
                ? "block px-4 py-3 text-base font-medium"
                : "px-4 py-2 text-sm font-medium"
            } text-white hover:text-purple-200 hover:bg-white/10 rounded-lg transition-all duration-300 backdrop-blur-sm`}
            onClick={() => mobile && setIsOpen(false)}
          >
            {link.label}
          </Link>
        </motion.div>
      ))}
    </AnimatePresence>
  );

  if (!mounted) return null;

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white shadow-2xl sticky top-0 z-50 backdrop-blur-md border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link href="/" className="flex items-center space-x-3 group">
              <motion.div
                transition={{
                  duration: 20,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
                className="relative"
              ></motion.div>
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Nexa Stays
              </span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <NavLinks />

            {/* Theme Toggle */}
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="text-white hover:bg-white/10 hover:text-purple-200 transition-all duration-300"
              >
                <AnimatePresence mode="wait">
                  {theme === "dark" ? (
                    <motion.div
                      key="sun"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Sun className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="moon"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Moon className="h-5 w-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
                <span className="sr-only">Toggle theme</span>
              </Button>
            </motion.div>

            {/* Logout Button */}
            {user && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="text-white hover:bg-red-500/20 hover:text-red-200 transition-all duration-300 border border-white/20 hover:border-red-300/50"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </motion.div>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
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
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col space-y-4 mt-8"
                >
                  <NavLinks mobile />

                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="ghost"
                      onClick={() =>
                        setTheme(theme === "dark" ? "light" : "dark")
                      }
                      className="justify-start text-white hover:bg-white/10 w-full"
                    >
                      {theme === "dark" ? (
                        <Sun className="h-4 w-4 mr-2" />
                      ) : (
                        <Moon className="h-4 w-4 mr-2" />
                      )}
                      Toggle Theme
                    </Button>
                  </motion.div>

                  {user && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={handleLogout}
                        variant="ghost"
                        className="justify-start text-white hover:bg-red-500/20 w-full border border-white/20 hover:border-red-300/50"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
