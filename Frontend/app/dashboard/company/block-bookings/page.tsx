"use client";

import { useState, useEffect } from "react";
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
  Edit2,
  Eye,
  Trash2,
  Loader2,
  Building2,
  Plus,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  FileText,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import NavBar from "@/components/nav-bar";

interface BlockBookingRoomType {
  id: number | string;
  roomType: string;
  rooms: number;
}

interface BlockBooking {
  id: number | string;
  roomTypes: BlockBookingRoomType[];
  arrivalDate: string;
  departureDate: string;
  discountRate: number;
  status: "pending" | "confirmed" | "cancelled" | "reserved" | "rejected";
  totalAmount: number;
  hotel?: { name: string };
}

export default function TravelCompanyDashboard() {
  const router = useRouter();
  const { toast } = useToast();

  const [blockBookings, setBlockBookings] = useState<BlockBooking[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    totalRooms: 0,
    totalDiscount: 0,
    avgDiscount: 0,
    minDiscount: 0,
    maxDiscount: 0,
  });

  // Fetch block bookings from backend
  useEffect(() => {
    const fetchBookings = async () => {
      setFetchLoading(true);
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          "http://localhost:5000/api/block-bookings",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) throw new Error("Fetch failed");
        const data = await response.json();
        const bookings = data.blockBookings || [];
        setBlockBookings(bookings);

        // Calculate stats
        const pending = bookings.filter(
          (b: BlockBooking) => b.status === "pending"
        ).length;
        // Treat "reserved" as "confirmed"
        const confirmed: number = bookings.filter(
          (b: BlockBooking) => b.status === "reserved"
        ).length;
        const totalRooms = bookings.reduce(
          (sum: number, booking: BlockBooking) =>
            sum +
            (booking.roomTypes?.reduce(
              (roomSum, rt) => roomSum + rt.rooms,
              0
            ) || 0),
          0
        );

        // Discount stats (for all bookings)
        const discounts: number[] = bookings.map(
          (b: BlockBooking) => b.discountRate
        );
        const totalDiscount = discounts.reduce(
          (sum: number, d: number) => sum + d,
          0
        );
        const avgDiscount =
          discounts.length > 0 ? totalDiscount / discounts.length : 0;
        const minDiscount = discounts.length > 0 ? Math.min(...discounts) : 0;
        const maxDiscount = discounts.length > 0 ? Math.max(...discounts) : 0;

        setStats({
          total: bookings.length,
          pending,
          confirmed,
          totalRooms,
          totalDiscount,
          avgDiscount,
          minDiscount,
          maxDiscount,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch block bookings.",
          variant: "destructive",
        });
      } finally {
        setFetchLoading(false);
      }
    };
    fetchBookings();
  }, [toast]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "confirmed":
        return {
          color: "bg-green-100 text-green-800 border-green-200",
          icon: TrendingUp,
        };
      case "reserved":
        return {
          color: "bg-green-100 text-green-800 border-green-200",
          icon: CheckCircle,
        };
      case "pending":
        return {
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: Loader2,
        };
      case "cancelled":
      case "rejected":
        return {
          color: "bg-red-100 text-red-800 border-red-200",
          icon: FileText,
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: FileText,
        };
    }
  };

  // Only allow Edit/Delete for "pending" status
  const canEditOrDelete = (status: string) => status === "pending";

  // Delete Block Booking
  const handleDelete = async (id: number | string) => {
    setDeleteId(id);
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/block-bookings/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error();
      setBlockBookings((prev) => prev.filter((b) => b.id !== id));
      toast({
        title: "Success",
        description: "Block booking has been deleted successfully.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete block booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <NavBar />
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Block Booking Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your group bookings and bulk reservations efficiently
              </p>
            </div>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              onClick={() =>
                router.push("/dashboard/company/block-bookings/create")
              }
            >
              <Plus className="h-4 w-4" />
              Create Block Booking
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-l-4 border-l-blue-500 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Bookings
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.total}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-l-4 border-l-yellow-500 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.pending}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Loader2 className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-l-4 border-l-green-500 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Confirmed</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.confirmed}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    (Reserved & Approved)
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-l-4 border-l-purple-500 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Rooms
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.totalRooms}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Block Bookings Section */}
        <Card className="shadow-lg border-0">
          <CardHeader className="border-b border-gray-200 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  My Block Bookings
                </CardTitle>
                <CardDescription>
                  Manage and track all your group booking requests
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200"
              >
                {blockBookings.length} Bookings
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {fetchLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="animate-spin h-12 w-12 text-blue-600 mb-4" />
                <p className="text-gray-600">Loading your block bookings...</p>
              </div>
            ) : blockBookings.length === 0 ? (
              <div className="text-center py-16">
                <Building2 className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No block bookings yet
                </h3>
                <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto mb-6">
                  Start by creating your first block booking to manage group
                  reservations efficiently.
                </p>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                  onClick={() =>
                    router.push("/dashboard/company/block-bookings/create")
                  }
                >
                  <Plus className="h-4 w-4" />
                  Create Your First Block Booking
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {blockBookings.map((booking) => {
                  const totalRooms = booking.roomTypes
                    ? booking.roomTypes.reduce((sum, rt) => sum + rt.rooms, 0)
                    : 0;
                  const editDeleteDisabled = !canEditOrDelete(booking.status);
                  const statusConfig = getStatusConfig(booking.status);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <div
                      key={booking.id}
                      className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        {/* Booking Information */}
                        <div className="flex-1 space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-bold text-lg text-gray-900 dark:text-white">
                                  BLK{String(booking.id).padStart(3, "0")}
                                </h4>
                                <Badge
                                  className={`${statusConfig.color} flex items-center gap-1`}
                                >
                                  <StatusIcon className="h-3 w-3" />
                                  {booking.status.charAt(0).toUpperCase() +
                                    booking.status.slice(1)}
                                </Badge>
                              </div>
                              <p className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                {booking.hotel?.name || "Hotel not specified"}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-blue-600" />
                              <div>
                                <div className="font-medium text-gray-900">
                                  Check-in
                                </div>
                                <div className="text-gray-600">
                                  {formatDate(booking.arrivalDate)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-green-600" />
                              <div>
                                <div className="font-medium text-gray-900">
                                  Check-out
                                </div>
                                <div className="text-gray-600">
                                  {formatDate(booking.departureDate)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-purple-600" />
                              <div>
                                <div className="font-medium text-gray-900">
                                  Total Rooms
                                </div>
                                <div className="text-gray-600">
                                  {totalRooms} rooms
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <div>
                                <div className="font-medium text-gray-900">
                                  Total Amount
                                </div>
                                <div className="text-gray-600">
                                  LKR {booking.totalAmount.toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Room Type Breakdown */}
                          {booking.roomTypes &&
                            booking.roomTypes.length > 0 && (
                              <div className="mt-4">
                                <div className="font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                  Room Allocation:
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {booking.roomTypes.map((rt) => (
                                    <Badge
                                      key={rt.roomType}
                                      variant="outline"
                                      className="bg-gray-50 text-gray-700"
                                    >
                                      {rt.rooms} x {rt.roomType}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex lg:flex-col gap-2 lg:items-end">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-2"
                            onClick={() =>
                              router.push(
                                `/dashboard/company/block-bookings/${booking.id}/view`
                              )
                            }
                          >
                            <Eye className="h-3 w-3" />
                            View Details
                            <ArrowRight className="h-3 w-3" />
                          </Button>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={editDeleteDisabled}
                              onClick={() =>
                                !editDeleteDisabled &&
                                router.push(
                                  `/dashboard/company/block-bookings/${booking.id}/edit`
                                )
                              }
                              className={cn(
                                "flex items-center gap-1",
                                editDeleteDisabled &&
                                  "opacity-50 cursor-not-allowed"
                              )}
                            >
                              <Edit2 className="h-3 w-3" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={
                                editDeleteDisabled ||
                                (deleting && deleteId === booking.id)
                              }
                              onClick={() =>
                                !editDeleteDisabled && handleDelete(booking.id)
                              }
                              className={cn(
                                "flex items-center gap-1",
                                editDeleteDisabled &&
                                  "opacity-50 cursor-not-allowed"
                              )}
                            >
                              {deleting && deleteId === booking.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                      {/* Show requested discount per booking */}
                      <div className="mt-4 flex items-center gap-2 text-sm text-amber-700 font-medium">
                        <DollarSign className="h-4 w-4" />
                        Discount Requested: {booking.discountRate}%
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
