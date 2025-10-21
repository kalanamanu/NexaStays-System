"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut,
  User as UserIcon,
  Settings,
  Layers,
  BookOpen,
} from "lucide-react";
import { useUser } from "@/context/user-context";
import { Button } from "@/components/ui/button";

function getDisplayName(user: any) {
  if (!user) return "";
  const cp = user.customerProfile;
  if (cp && (cp.firstName || cp.lastName)) {
    return `${cp.firstName ?? ""} ${cp.lastName ?? ""}`.trim();
  }
  if (user.travelCompanyProfile && user.travelCompanyProfile.companyName) {
    return user.travelCompanyProfile.companyName;
  }
  return user.email.split("@")[0];
}

function getInitials(user: any) {
  const name = getDisplayName(user);
  if (!name) return "U";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function UserMenu({ compact = false }: { compact?: boolean }) {
  const { user, logout } = useUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (menuRef.current.contains(e.target as Node)) return;
      if (buttonRef.current && buttonRef.current.contains(e.target as Node))
        return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "Tab") {
        // close on tab away to avoid trap (simple approach)
        // More advanced focus-trap could be used.
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  if (!user) return null;

  // Role-specific profile menu items
  const menuItems: {
    label: string;
    href?: string;
    icon?: React.ReactNode;
    onClick?: () => void;
  }[] = [
    {
      label: "Profile",
      href: "/dashboard/customer/profile",
      icon: <UserIcon className="h-4 w-4" />,
    },
  ];

  switch (user.role) {
    case "customer":
      menuItems.push(
        {
          label: "My Bookings",
          href: "/dashboard/customer",
          icon: <BookOpen className="h-4 w-4" />,
        },
        {
          label: "Quick Book",
          href: "/reservation",
          icon: <Layers className="h-4 w-4" />,
        }
      );
      break;
    case "clerk":
      menuItems.push({
        label: "Check-In/Out",
        href: "/dashboard/clerk",
        icon: <Layers className="h-4 w-4" />,
      });
      break;
    case "manager":
      menuItems.push({
        label: "Reports",
        href: "/dashboard/manager",
        icon: <Layers className="h-4 w-4" />,
      });
      break;
    case "travel-company":
      menuItems.push({
        label: "Travel Portal",
        href: "/travel-portal",
        icon: <Layers className="h-4 w-4" />,
      });
      break;
  }

  const handleNavigate = (href?: string, onClick?: () => void) => {
    setOpen(false);
    if (onClick) return onClick();
    if (href) router.push(href);
  };

  const handleLogout = () => {
    setOpen(false);
    logout();
    router.push("/login");
  };

  const displayName = getDisplayName(user);
  const initials = getInitials(user);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        ref={buttonRef}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((s) => !s)}
        className={`inline-flex items-center space-x-3 rounded-full px-2 py-1 focus:outline-none focus:ring-2 focus:ring-white/40 transition ${
          compact ? "text-sm" : "text-sm"
        }`}
      >
        <div className="flex items-center space-x-2">
          <div
            className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-white font-semibold"
            aria-hidden
          >
            {initials}
          </div>
          {!compact && (
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-sm font-medium">{displayName}</span>
              <span className="text-xs text-white/60 capitalize">
                {user.role}
              </span>
            </div>
          )}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -6 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-gradient-to-b from-white/6 to-white/3 border border-white/10 shadow-lg z-50 backdrop-blur-md"
            role="menu"
            aria-orientation="vertical"
            aria-label="User menu"
          >
            <div className="px-4 py-3 border-b border-white/6">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white font-semibold">
                  {initials}
                </div>
                <div className="truncate">
                  <div className="text-sm font-medium truncate">
                    {displayName}
                  </div>
                  <div className="text-xs text-white/60 truncate">
                    {user.email}
                  </div>
                </div>
              </div>
            </div>

            <div className="py-2">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavigate(item.href, item.onClick)}
                  className="w-full text-left px-4 py-2 flex items-center space-x-3 hover:bg-white/5 text-sm"
                  role="menuitem"
                >
                  <span className="text-white/80">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            <div className="px-3 py-2 border-t border-white/6">
              <button
                onClick={handleLogout}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm bg-red-500/10 hover:bg-red-500/20 text-white"
                role="menuitem"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>

              <button
                onClick={() => {
                  setOpen(false);
                  router.push("/settings");
                }}
                className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm bg-transparent hover:bg-white/3 text-white"
                role="menuitem"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
