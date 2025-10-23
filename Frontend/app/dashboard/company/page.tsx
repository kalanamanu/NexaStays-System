"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import NavBar from "@/components/nav-bar";
import { useRouter } from "next/navigation";
import {
  CalendarPlus,
  ListChecks,
  Calendar,
  Users,
  Building2,
  DollarSign,
  Hotel,
  Loader2,
} from "lucide-react";

// Simplified BlockBooking interface (no eventName, no separate event column)
interface BlockBooking {
  id: string | number;
  hotelName: string;
  startDate: string;
  endDate: string;
  rooms: number;
  status: "confirmed" | "pending" | "cancelled";
  totalAmount: number;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString();
}

export default function TravelCompanyDashboard() {
  const router = useRouter();

  // Real data fetching state
  const [recentBookings, setRecentBookings] = useState<BlockBooking[]>([]);
  const [loading, setLoading] = useState(true);

  // Stats
  const [totalBookings, setTotalBookings] = useState(0);
  const [totalSpends, setTotalSpends] = useState(0);

  useEffect(() => {
    // Fetch dashboard stats and recent bookings from backend
    async function fetchDashboardData() {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        // Fetch all block bookings for this company, sorted by most recent
        const res = await fetch("http://localhost:5000/api/block-bookings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        // Recent first, up to 10
        const bookings: BlockBooking[] = (data.blockBookings || [])
          .sort(
            (a: any, b: any) =>
              new Date(b.arrivalDate).getTime() -
              new Date(a.arrivalDate).getTime()
          )
          .slice(0, 10)
          .map((b: any) => ({
            id: b.id,
            hotelName: b.hotel?.name || "N/A",
            startDate: b.arrivalDate,
            endDate: b.departureDate,
            rooms: b.roomTypes
              ? b.roomTypes.reduce((acc: number, rt: any) => acc + rt.rooms, 0)
              : b.rooms || 0,
            status: b.status,
            totalAmount: b.totalAmount,
          }));

        setRecentBookings(bookings);

        // Stats
        setTotalBookings(data.blockBookings ? data.blockBookings.length : 0);
        setTotalSpends(
          data.blockBookings
            ? data.blockBookings.reduce(
                (sum: number, b: any) =>
                  b.status !== "cancelled" ? sum + (b.totalAmount || 0) : sum,
                0
              )
            : 0
        );
      } catch {
        setRecentBookings([]);
        setTotalBookings(0);
        setTotalSpends(0);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <NavBar />
      <div className="max-w-7xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome, Travel Company!
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          Manage your block bookings and group stays
        </p>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div className="flex flex-col items-center bg-white/80 dark:bg-gray-800/80 rounded-2xl border border-indigo-100 dark:border-indigo-900 shadow p-8">
            <Hotel className="w-10 h-10 text-purple-600 mb-2" />
            <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">
              {totalBookings}
            </div>
            <div className="text-gray-700 dark:text-gray-300 mt-2">
              Total Bookings
            </div>
          </div>
          <div className="flex flex-col items-center bg-white/80 dark:bg-gray-800/80 rounded-2xl border border-green-100 dark:border-green-900 shadow p-8">
            <Users className="w-10 h-10 text-green-600 mb-2" />
            <div className="text-3xl font-bold text-green-700 dark:text-green-300">
              {recentBookings.reduce((sum, b) => sum + b.rooms, 0)}
            </div>
            <div className="text-gray-700 dark:text-gray-300 mt-2">
              Total Rooms (recent 10)
            </div>
          </div>
          <div className="flex flex-col items-center bg-white/80 dark:bg-gray-800/80 rounded-2xl border border-yellow-100 dark:border-yellow-900 shadow p-8">
            <DollarSign className="w-10 h-10 text-yellow-600 mb-2" />
            <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">
              LKR {totalSpends.toLocaleString()}
            </div>
            <div className="text-gray-700 dark:text-gray-300 mt-2">
              Total Spends
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {/* Create Block Booking Card */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-8 rounded-2xl shadow-md hover:shadow-lg transition-all flex flex-col items-center border border-blue-100 dark:border-blue-900">
            <CalendarPlus className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Create Block Booking
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4 text-center">
              Reserve multiple rooms for your group or event in one easy step.
            </p>
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 w-full"
              onClick={() =>
                router.push("/dashboard/company/block-bookings/create")
              }
            >
              Create Block Booking
            </Button>
          </div>
          {/* View Block Bookings Card */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-8 rounded-2xl shadow-md hover:shadow-lg transition-all flex flex-col items-center border border-green-100 dark:border-green-900">
            <ListChecks className="w-12 h-12 text-green-600 dark:text-green-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              View My Block Bookings
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4 text-center">
              See and manage all your existing group bookings and reservations.
            </p>
            <Button
              size="lg"
              className="bg-green-600 hover:bg-green-700 w-full"
              onClick={() => router.push("/dashboard/company/block-bookings")}
            >
              View Block Bookings
            </Button>
          </div>
        </div>

        {/* Recent Bookings Table */}
        <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl shadow p-6">
          <div className="mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Recent Block Bookings
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr>
                  <th className="py-2 px-3 text-gray-700 dark:text-gray-300 font-semibold">
                    Booking ID
                  </th>
                  <th className="py-2 px-3 text-gray-700 dark:text-gray-300 font-semibold">
                    Hotel
                  </th>
                  <th className="py-2 px-3 text-gray-700 dark:text-gray-300 font-semibold">
                    Dates
                  </th>
                  <th className="py-2 px-3 text-gray-700 dark:text-gray-300 font-semibold text-center">
                    Rooms
                  </th>
                  <th className="py-2 px-3 text-gray-700 dark:text-gray-300 font-semibold text-center">
                    Total
                  </th>
                  <th className="py-2 px-3 text-gray-700 dark:text-gray-300 font-semibold text-center">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-500">
                      <Loader2 className="inline w-6 h-6 animate-spin mr-2" />
                      Loading recent bookings...
                    </td>
                  </tr>
                ) : recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-400">
                      No recent block bookings found.
                    </td>
                  </tr>
                ) : (
                  recentBookings.map((b) => (
                    <tr
                      key={b.id}
                      className="hover:bg-blue-50/60 dark:hover:bg-blue-900/20 rounded-lg"
                    >
                      <td className="py-2 px-3 font-semibold">
                        BLK{String(b.id).padStart(4, "0")}
                      </td>
                      <td className="py-2 px-3 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-400" />
                        {b.hotelName}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        {formatDate(b.startDate)} &ndash;{" "}
                        {formatDate(b.endDate)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="inline-flex items-center gap-1">
                          <Users className="w-4 h-4 text-indigo-400" />
                          {b.rooms}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="font-semibold text-gray-800 dark:text-gray-100">
                          LKR {b.totalAmount.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            b.status
                          )}`}
                        >
                          {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
