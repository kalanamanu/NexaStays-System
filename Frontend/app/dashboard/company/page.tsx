"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarPlus,
  ListChecks,
  Calendar,
  Users,
  Building2,
  DollarSign,
  Hotel,
  Loader2,
  TrendingUp,
  FileText,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";
import NavBar from "@/components/nav-bar";

interface BlockBooking {
  id: string | number;
  hotelName: string;
  startDate: string;
  endDate: string;
  rooms: number;
  status: "confirmed" | "pending" | "cancelled" | "reserved";
  totalAmount: number;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function TravelCompanyDashboard() {
  const router = useRouter();

  const [recentBookings, setRecentBookings] = useState<BlockBooking[]>([]);
  const [loading, setLoading] = useState(true);

  // Stats ONLY for "reserved" bookings
  const [stats, setStats] = useState({
    reservedBookings: 0,
    reservedRooms: 0,
    reservedSpends: 0,
    averagePerReserved: 0,
    confirmationRate: 0,
  });

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/block-bookings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        const data = await res.json();

        const allBookings: BlockBooking[] = (data.blockBookings || [])
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

        setRecentBookings(allBookings);

        // Stats for reserved only
        const reservedBookingsArr = (data.blockBookings || []).filter(
          (b: any) => b.status === "reserved"
        );
        const reservedBookings = reservedBookingsArr.length;
        const reservedRooms = reservedBookingsArr.reduce(
          (sum: number, b: any) =>
            sum +
            (b.roomTypes?.reduce(
              (roomSum: number, rt: any) => roomSum + rt.rooms,
              0
            ) ||
              b.rooms ||
              0),
          0
        );
        const reservedSpends = reservedBookingsArr.reduce(
          (sum: number, b: any) => sum + (b.totalAmount || 0),
          0
        );
        const averagePerReserved =
          reservedBookings === 0 ? 0 : reservedSpends / reservedBookings;

        // Confirmation rate: reserved bookings / all bookings
        const confirmationRate =
          (reservedBookingsArr.length / (data.blockBookings?.length || 1)) *
          100;

        setStats({
          reservedBookings,
          reservedRooms,
          reservedSpends,
          averagePerReserved,
          confirmationRate,
        });
      } catch {
        setRecentBookings([]);
        setStats({
          reservedBookings: 0,
          reservedRooms: 0,
          reservedSpends: 0,
          averagePerReserved: 0,
          confirmationRate: 0,
        });
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "reserved":
        return {
          color: "bg-green-100 text-green-800 border-green-200",
          icon: CheckCircle,
        };
      case "confirmed":
        return {
          color: "bg-green-100 text-green-800 border-green-200",
          icon: CheckCircle,
        };
      case "pending":
        return {
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: Clock,
        };
      case "cancelled":
        return {
          color: "bg-red-100 text-red-800 border-red-200",
          icon: AlertCircle,
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: FileText,
        };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <NavBar />
      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Travel Company Portal
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your group bookings and optimize your travel operations
              </p>
            </div>
          </div>
        </div>

        {/* Stats Overview: ONLY RESERVED BOOKINGS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-14">
          <Card className="bg-white/80 backdrop-blur-sm border-l-4 border-l-blue-500 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Reserved Bookings
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.reservedBookings}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Hotel className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-l-4 border-l-green-500 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Confirmation Rate
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.confirmationRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Reserved / All Bookings
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-l-4 border-l-purple-500 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Rooms Booked
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.reservedRooms}
                  </p>
                  <p className="text-xs text-purple-700 mt-1">
                    Rooms in Reserved Bookings
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-l-4 border-l-amber-500 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Spends
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    LKR{" "}
                    {stats.reservedSpends.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Spends in Reserved Bookings
                  </p>
                </div>
                <div className="p-3 bg-amber-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-l-4 border-l-green-500 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Average per Booking
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    LKR{" "}
                    {stats.averagePerReserved.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Average for Reserved Bookings
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-14">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl border-0">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <CalendarPlus className="h-8 w-8 text-white" />
                    <div>
                      <CardTitle className="text-white text-xl">
                        Create Block Booking
                      </CardTitle>
                      <CardDescription className="text-blue-100">
                        Reserve multiple rooms for your group
                      </CardDescription>
                    </div>
                  </div>
                  <p className="text-blue-100 mb-6">
                    Streamline your group reservations with our bulk booking
                    system. Perfect for tours, events, and corporate travel.
                  </p>
                  <Button
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-blue-50 w-full sm:w-auto"
                    onClick={() =>
                      router.push("/dashboard/company/block-bookings/create")
                    }
                  >
                    Create New Booking
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl border-0">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <ListChecks className="h-8 w-8 text-white" />
                    <div>
                      <CardTitle className="text-white text-xl">
                        Manage Bookings
                      </CardTitle>
                      <CardDescription className="text-green-100">
                        View and track all your reservations
                      </CardDescription>
                    </div>
                  </div>
                  <p className="text-green-100 mb-6">
                    Access your complete booking history, track status updates,
                    and manage existing reservations efficiently.
                  </p>
                  <Button
                    size="lg"
                    className="bg-white text-green-600 hover:bg-green-50 w-full sm:w-auto"
                    onClick={() =>
                      router.push("/dashboard/company/block-bookings")
                    }
                  >
                    View All Bookings
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings Section */}
        <Card className="shadow-lg border-0 mb-14">
          <CardHeader className="border-b border-gray-200 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Recent Block Bookings
                </CardTitle>
                <CardDescription>
                  Your most recent group booking activities
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200"
              >
                {recentBookings.length} Recent
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="animate-spin h-12 w-12 text-blue-600 mb-4" />
                <p className="text-gray-600">Loading your recent bookings...</p>
              </div>
            ) : recentBookings.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Recent Bookings
                </h3>
                <p className="text-gray-600 max-w-md mx-auto mb-6">
                  You haven't made any block bookings yet. Create your first
                  booking to get started.
                </p>
                <Button
                  onClick={() =>
                    router.push("/dashboard/company/block-bookings/create")
                  }
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Create Your First Booking
                </Button>
              </div>
            ) : (
              <div className="overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold">
                        Booking ID
                      </TableHead>
                      <TableHead className="font-semibold">Hotel</TableHead>
                      <TableHead className="font-semibold">
                        Stay Duration
                      </TableHead>
                      <TableHead className="font-semibold text-center">
                        Rooms
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        Amount
                      </TableHead>
                      <TableHead className="font-semibold text-center">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentBookings.map((booking) => {
                      const statusConfig = getStatusConfig(booking.status);
                      const StatusIcon = statusConfig.icon;

                      return (
                        <TableRow
                          key={booking.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span className="font-bold">
                                BLK{String(booking.id).padStart(4, "0")}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">
                                {booking.hotelName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1 text-sm">
                                <Calendar className="h-3 w-3" />
                                {formatDate(booking.startDate)}
                              </div>
                              <div className="text-xs text-gray-500">
                                to {formatDate(booking.endDate)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Users className="h-4 w-4 text-purple-600" />
                              <span className="font-semibold">
                                {booking.rooms}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="font-bold text-green-700">
                              LKR {booking.totalAmount.toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className={`${statusConfig.color} flex items-center gap-1 w-fit mx-auto`}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {booking.status.charAt(0).toUpperCase() +
                                booking.status.slice(1)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
