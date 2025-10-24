"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BarChart2,
  XCircle,
  CheckCircle,
  ClipboardList,
  LogOut,
  BarChart,
  DollarSign,
} from "lucide-react";
import { useUser } from "@/context/user-context";
import { useRouter } from "next/navigation";

const navLinks = [
  {
    href: "/dashboard/clerk",
    label: "Dashboard",
    icon: <Home className="w-5 h-5" />,
  },
  {
    href: "/dashboard/clerk/checkin",
    label: "Guest Check-In",
    icon: <CheckCircle className="w-5 h-5" />,
  },
  {
    href: "/dashboard/clerk/checkout",
    label: "Guest Check-Out",
    icon: <XCircle className="w-5 h-5" />,
  },
  {
    href: "/dashboard/clerk/reservations",
    label: "All Reservations",
    icon: <ClipboardList className="w-5 h-5" />,
  },
  {
    href: "/dashboard/clerk/reports/occupancy",
    label: "Occupancy Report",
    icon: <BarChart className="w-5 h-5" />,
  },
  {
    href: "/dashboard/clerk/reports/revenue",
    label: "Revenue Report",
    icon: <DollarSign className="w-5 h-5" />,
  },
];

export default function ClerkSidebar() {
  const pathname = usePathname();
  const { logout } = useUser();
  const router = useRouter();

  return (
    <aside className="fixed top-0 left-0 bottom-0 w-60 bg-gradient-to-b from-purple-700 to-indigo-800 text-white flex flex-col z-40">
      <nav className="flex-1 flex flex-col pt-20 gap-0.5">
        {/* pt-20 = enough padding for NavBar, adjust if NavBar is taller */}
        {navLinks.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-6 py-3 rounded-lg transition font-medium ${
                isActive
                  ? "bg-white/10 text-white shadow"
                  : "text-white/80 hover:bg-white/10"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-3">
        <button
          onClick={() => {
            logout();
            router.push("/login");
          }}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-500/10 hover:bg-red-600/20 text-white font-semibold py-2 transition"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
