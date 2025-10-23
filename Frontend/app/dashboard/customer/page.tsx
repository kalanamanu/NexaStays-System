"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Edit,
  Trash2,
  Calendar,
  Eye,
  User,
  Hotel,
  CreditCard,
  TrendingUp,
  MapPin,
  Clock,
  AlertTriangle,
} from "lucide-react";
import NavBar from "@/components/nav-bar";
import { useUser } from "@/context/user-context";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Reservation {
  id: string;
  roomType: string;
  arrivalDate: string;
  departureDate: string;
  status: "pending" | "confirmed" | "cancelled" | "pending_payment" | string;
  guests: number;
  totalAmount: number;
  hotel?: {
    id: number;
    name: string;
    location?: string;
  };
  roomQuantity?: number;
  roomNumber?: string;
  room?: { number?: string };
  cancellationReason?: string;
  customerNotified?: boolean;
}

const ROOM_TYPES = [
  { value: "standard", label: "Standard", icon: "🛏️" },
  { value: "deluxe", label: "Deluxe", icon: "🌟" },
  { value: "suite", label: "Suite", icon: "🏨" },
  { value: "residential", label: "Residential", icon: "🏠" },
];

const ROOM_TYPE_PRICES: Record<string, number> = {
  standard: 120,
  deluxe: 180,
  suite: 280,
  residential: 450,
};

function getNights(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0;
  const diffTime = endDate.getTime() - startDate.getTime();
  return Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 0);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Helper to calculate Total Spent (sum of statuses you consider paid)
function calculateTotalSpent(reservations: Reservation[]): number {
  const spentStatuses = ["paid", "checked-out", "confirmed"];
  return reservations
    .filter((r) => spentStatuses.includes(r.status))
    .reduce(
      (sum, r) =>
        sum + (isNaN(Number(r.totalAmount)) ? 0 : Number(r.totalAmount)),
      0
    );
}

export default function CustomerDashboard() {
  const { user, loading, updateCustomerProfile } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationsLoading, setReservationsLoading] = useState(true);

  // Edit Reservation Dialog States
  const [reservationDeleteOpen, setReservationDeleteOpen] = useState(false);
  const [reservationToDelete, setReservationToDelete] =
    useState<Reservation | null>(null);
  const [reservationDeleteLoading, setReservationDeleteLoading] =
    useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    pending: 0,
    spent: 0,
  });

  // Fetch reservations for the logged-in customer
  useEffect(() => {
    const fetchReservations = async () => {
      if (!user) return;
      setReservationsLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/reservations", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (res.ok) {
          setReservations(data.reservations || []);
        } else {
          toast({
            variant: "destructive",
            title: "Error loading reservations",
            description: data.error || "Could not fetch reservations.",
          });
        }
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "Network error",
          description: err.message || "Could not fetch reservations.",
        });
      } finally {
        setReservationsLoading(false);
      }
    };
    fetchReservations();
  }, [user, toast]);

  // Calculate stats when reservations change
  useEffect(() => {
    const now = new Date();
    const upcoming = reservations.filter(
      (r) =>
        (r.status === "confirmed" ||
          r.status === "pending" ||
          r.status === "pending_payment") &&
        new Date(r.arrivalDate) > now
    ).length;

    const pending = reservations.filter(
      (r) => r.status === "pending" || r.status === "pending_payment"
    ).length;

    const spent = calculateTotalSpent(reservations);

    setStats({
      total: reservations.length,
      upcoming,
      pending,
      spent,
    });
  }, [reservations]);

  // Redirect if not authenticated after loading
  useEffect(() => {
    if (!loading && (!user || user.role !== "customer")) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Get customer name
  const customerName = user?.customerProfile?.firstName
    ? `${user.customerProfile.firstName}${
        user.customerProfile.lastName ? " " + user.customerProfile.lastName : ""
      }`
    : user?.email?.split("@")[0] || "Customer";

  const filteredReservations = reservations.filter(
    (reservation) =>
      String(reservation.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reservation.roomType || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (reservation.hotel?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  // --- Notification logic for auto-cancelled reservations ---
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const autoCancelled = reservations.filter(
    (r) =>
      r.status === "cancelled" &&
      r.cancellationReason?.includes("auto-cancelled") &&
      !r.customerNotified
  );
  const notifiedRef = useRef(false);
  useEffect(() => {
    if (!notifiedRef.current && autoCancelled.length > 0 && token) {
      autoCancelled.forEach((r) => {
        fetch(`http://localhost:5000/api/reservations/${r.id}/mark-notified`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      });
      notifiedRef.current = true;
    }
  }, [autoCancelled, token]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800";
      case "pending":
      case "pending_payment":
      case "Pending_payment":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return null;
      case "pending":
      case "pending_payment":
        return null;
      case "cancelled":
        return null;
      default:
        return null;
    }
  };

  const handleDeleteReservation = async () => {
    if (!reservationToDelete) return;
    setReservationDeleteLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/reservations/${reservationToDelete.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      if (res.ok) {
        setReservations((prev) =>
          prev.filter((r) => r.id !== reservationToDelete.id)
        );
        toast({
          title: "Reservation deleted",
          description: "Your reservation has been deleted successfully.",
        });
        setReservationDeleteOpen(false);
        setReservationToDelete(null);
      } else {
        toast({
          variant: "destructive",
          title: "Delete failed",
          description: data.error || "Could not delete reservation.",
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Network error",
        description: err.message || "Could not delete reservation.",
      });
    } finally {
      setReservationDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <NavBar />
        <div className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center pt-16">
              <div className="flex justify-center mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
              <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-300">
                Loading your dashboard...
              </h2>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <NavBar />

      {/* Notification Banner */}
      {autoCancelled.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Reservation Update Required
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    {autoCancelled.length} reservation
                    {autoCancelled.length > 1 ? "s were" : " was"} automatically
                    cancelled due to missing payment details. Please contact the
                    hotel if you have any questions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  Welcome back, {customerName}!
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  Manage your reservations and plan your next stay
                </p>
              </div>
              <Button
                onClick={() => router.push("/reservation")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                size="lg"
              >
                <Hotel className="w-5 h-5 mr-2" />
                New Reservation
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-blue-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Reservations
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                      {stats.total}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-green-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Upcoming Stays
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                      {stats.upcoming}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                    <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-yellow-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Pending Actions
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                      {stats.pending}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                    <CreditCard className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-purple-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Spent
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                      LKR{stats.spent}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                    <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reservations Section */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                    My Reservations
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300 mt-1">
                    View and manage all your hotel bookings in one place
                  </CardDescription>
                </div>
                <div className="relative w-full lg:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by ID, hotel, or room type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50/50 dark:bg-gray-700/50">
                    <TableRow>
                      <TableHead className="font-semibold">
                        Reservation
                      </TableHead>
                      <TableHead className="font-semibold">
                        Hotel & Room
                      </TableHead>
                      <TableHead className="font-semibold">Dates</TableHead>
                      <TableHead className="font-semibold">Guests</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold text-right">
                        Amount
                      </TableHead>
                      <TableHead className="font-semibold text-center">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reservationsLoading ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Skeleton className="h-4 w-20" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-32" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-40" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-12" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-6 w-20 rounded-full" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-16 ml-auto" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-8 w-24 mx-auto" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : filteredReservations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <div className="flex flex-col items-center justify-center">
                            <Calendar className="h-16 w-16 text-gray-400 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              {searchTerm
                                ? "No matching reservations"
                                : "No reservations yet"}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md text-center">
                              {searchTerm
                                ? "Try adjusting your search terms to find what you're looking for."
                                : "Start your journey by making your first reservation. We're excited to host you!"}
                            </p>
                            {!searchTerm && (
                              <Button
                                onClick={() => router.push("/reservation")}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                              >
                                <Hotel className="w-4 h-4 mr-2" />
                                Make Your First Reservation
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReservations.map((reservation) => (
                        <TableRow
                          key={reservation.id}
                          className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                        >
                          <TableCell className="font-semibold">
                            <div className="flex items-center gap-2">
                              <span className="text-blue-600">
                                #{reservation.id}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {reservation.hotel?.name || "N/A"}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {reservation.roomType}
                                {reservation.roomNumber &&
                                  ` • Room ${reservation.roomNumber}`}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm">
                                <span className="font-medium">Check-in:</span>{" "}
                                {formatDate(reservation.arrivalDate)}
                              </div>
                              <div className="text-sm">
                                <span className="font-medium">Check-out:</span>{" "}
                                {formatDate(reservation.departureDate)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4 text-gray-500" />
                              <span>{reservation.guests}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${getStatusColor(
                                reservation.status
                              )} border font-medium`}
                            >
                              <span className="mr-1">
                                {getStatusIcon(reservation.status)}
                              </span>
                              {reservation.status.charAt(0).toUpperCase() +
                                reservation.status.slice(1).replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-right">
                              <div className="font-semibold text-gray-900 dark:text-white">
                                LKR{reservation.totalAmount}
                              </div>
                              <div className="text-xs text-gray-500">
                                {getNights(
                                  reservation.arrivalDate,
                                  reservation.departureDate
                                )}{" "}
                                night(s)
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  router.push(
                                    `/reservation/view/${reservation.id}`
                                  )
                                }
                                className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"
                                title="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={reservation.status === "cancelled"}
                                onClick={() =>
                                  router.push(
                                    `/reservation/edit/${reservation.id}`
                                  )
                                }
                                className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20"
                                title="Edit reservation"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Dialog
                                open={
                                  reservationDeleteOpen &&
                                  reservationToDelete?.id === reservation.id
                                }
                                onOpenChange={(open) => {
                                  setReservationDeleteOpen(open);
                                  if (!open) setReservationToDelete(null);
                                }}
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={
                                      reservation.status === "cancelled"
                                    }
                                    onClick={() => {
                                      setReservationToDelete(reservation);
                                      setReservationDeleteOpen(true);
                                    }}
                                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                                    title="Delete reservation"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                  <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                      <Trash2 className="h-5 w-5 text-red-500" />
                                      Delete Reservation
                                    </DialogTitle>
                                    <DialogDescription className="pt-4">
                                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                                        <p className="text-red-800 dark:text-red-300 font-medium">
                                          This action cannot be undone.
                                        </p>
                                      </div>
                                      <p>
                                        Are you sure you want to permanently
                                        delete reservation{" "}
                                        <b>#{reservation.id}</b> at{" "}
                                        <b>{reservation.hotel?.name}</b>?
                                      </p>
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
                                    <Button
                                      variant="outline"
                                      type="button"
                                      onClick={() => {
                                        setReservationDeleteOpen(false);
                                        setReservationToDelete(null);
                                      }}
                                      disabled={reservationDeleteLoading}
                                      className="flex-1"
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      type="button"
                                      disabled={reservationDeleteLoading}
                                      onClick={handleDeleteReservation}
                                      className="flex-1"
                                    >
                                      {reservationDeleteLoading ? (
                                        <>
                                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                          Deleting...
                                        </>
                                      ) : (
                                        "Delete Reservation"
                                      )}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
