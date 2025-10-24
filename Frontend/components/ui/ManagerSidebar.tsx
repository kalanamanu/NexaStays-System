"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart2,
  Users,
  ClipboardList,
  CalendarCheck2,
  BedDouble,
  Briefcase,
  LogOut,
  DollarSign,
} from "lucide-react";
import { useUser } from "@/context/user-context";
import { useRouter } from "next/navigation";

const managerNavLinks = [
  {
    href: "/dashboard/manager",
    label: "Manager Dashboard",
    icon: <BarChart2 className="w-5 h-5" />,
    description: "Summary, quick stats, recent activity",
  },
  {
    href: "/dashboard/manager/reports/occupancy",
    label: "Occupancy Report",
    icon: <CalendarCheck2 className="w-5 h-5" />,
    description: "Occupancy, projections, charts, export",
  },
  {
    href: "/dashboard/manager/reports/revenue",
    label: "Revenue Report",
    icon: <DollarSign className="w-5 h-5" />,
    description: "Revenue, breakdown, charts, export",
  },
  {
    href: "/dashboard/manager/reservations",
    label: "Reservation History",
    icon: <ClipboardList className="w-5 h-5" />,
    description: "Search, filter, view reservations",
  },
  // {
  //   href: "/dashboard/manager/reports/suites",
  //   label: "Suite Occupancy & Revenue",
  //   icon: <BedDouble className="w-5 h-5" />,
  //   description: "Suite bookings, suite revenue",
  // },
  {
    href: "/dashboard/manager/travel-companies",
    label: "Travel Company Bookings",
    icon: <Briefcase className="w-5 h-5" />,
    description:
      "Company bookings approve if manager agree with discount make as reserved the status of block booking",
  },
];

export default function ManagerSidebar() {
  const pathname = usePathname();
  const { logout } = useUser();
  const router = useRouter();

  return (
    <aside className="fixed top-0 left-0 bottom-0 w-60 bg-gradient-to-b from-purple-700 to-indigo-800 text-white flex flex-col z-40">
      <nav className="flex-1 flex flex-col pt-20 gap-0.5">
        {managerNavLinks.map((item) => {
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
              title={item.description}
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
