"use client";
import { useEffect, useState } from "react";
import NavBar from "@/components/nav-bar";
import ClerkSidebar from "@/components/ui/ClerkSidebar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Search,
  Filter,
  Building,
  Users,
  Calendar,
  Phone,
  Mail,
  Eye,
  Edit,
  Trash2,
  X,
  User,
  Bed,
  DollarSign,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Ban,
} from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/context/user-context";
import { useToast } from "@/hooks/use-toast";

type ReservationStatus =
  | "pending"
  | "confirmed"
  | "reserved"
  | "pending_payment"
  | "checked-in"
  | "checked-out"
  | "no-show"
  | "cancelled";

interface Reservation {
  id: string;
  guestName: string;
  email: string;
  guestPhone: string;
  phoneNumber?: string;
  hotelId?: string | number;
  hotelName?: string;
  roomType: string;
  roomNumber?: string;
  arrivalDate: string;
  departureDate: string;
  status: ReservationStatus;
  guests: number;
  totalAmount: number;
  rateType?: "nightly" | "weekly" | "monthly";
  createdAt: string;
  updatedAt: string;
}

interface Hotel {
  id: string | number;
  name: string;
}

export default function ClerkReservationsPage() {
  const { user } = useUser();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<string | number | "">("");
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [reservationError, setReservationError] = useState<string | null>(null);

  // Dialog states
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [editingReservation, setEditingReservation] =
    useState<Reservation | null>(null);
  const [reservationForm, setReservationForm] = useState({
    departureDate: "",
  });
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);
  const [detailReservation, setDetailReservation] =
    useState<Reservation | null>(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    checkedIn: 0,
    pending: 0,
    confirmed: 0,
  });

  // Fetch all hotels for filtering
  useEffect(() => {
    async function fetchHotels() {
      try {
        const res = await fetch("http://localhost:5000/api/hotels");
        const data = await res.json();
        setHotels(data.data || []);
      } catch {
        // ignore
      }
    }
    fetchHotels();
  }, []);

  // Fetch all reservations
  useEffect(() => {
    async function fetchAllReservations() {
      setLoadingReservations(true);
      setReservationError(null);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/reservations/all", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error("Failed to fetch reservations");
        const data = await res.json();

        const flatReservations: Reservation[] = data.reservations.map(
          (r: any) => ({
            ...r,
            guestName: r.customer
              ? `${r.customer.firstName} ${r.customer.lastName}`
              : r.guestName || "-",
            phoneNumber:
              r.customer?.phone || r.phoneNumber || r.guestPhone || "-",
            email: r.customer?.email || r.email || r.guestEmail || "-",
            hotelName: r.hotel?.name || r.hotelName || r.hotelId,
            hotelId: r.hotelId,
            arrivalDate: r.arrivalDate?.slice(0, 10),
            departureDate: r.departureDate?.slice(0, 10),
            rateType: r.rateType || "nightly",
            room: r.room || undefined,
          })
        );

        setReservations(flatReservations);

        // Calculate stats
        const checkedIn = flatReservations.filter(
          (r) => r.status === "checked-in"
        ).length;
        const pending = flatReservations.filter(
          (r) => r.status === "pending"
        ).length;
        const confirmed = flatReservations.filter(
          (r) => r.status === "confirmed"
        ).length;

        setStats({
          total: flatReservations.length,
          checkedIn,
          pending,
          confirmed,
        });
      } catch (err: any) {
        setReservationError(err.message || "Failed to load reservations.");
      } finally {
        setLoadingReservations(false);
      }
    }
    fetchAllReservations();
  }, []);

  // Filtering
  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch =
      (reservation.guestName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (reservation.guestPhone || reservation.phoneNumber || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (reservation.email || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesHotel =
      !selectedHotel || selectedHotel === "all-hotels"
        ? true
        : String(reservation.hotelId) === String(selectedHotel);
    return matchesSearch && matchesHotel;
  });

  // Status coloring and icons
  const getStatusConfig = (status: ReservationStatus) => {
    switch (status) {
      case "confirmed":
        return {
          color: "bg-blue-100 text-blue-800 border-blue-200",
          icon: CheckCircle,
        };
      case "checked-in":
        return {
          color: "bg-green-100 text-green-800 border-green-200",
          icon: CheckCircle,
        };
      case "checked-out":
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: CheckCircle,
        };
      case "pending":
        return {
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: Clock,
        };
      case "no-show":
        return {
          color: "bg-red-100 text-red-800 border-red-200",
          icon: Ban,
        };
      case "cancelled":
        return {
          color: "bg-gray-200 text-gray-600 border-gray-300",
          icon: Ban,
        };
      case "reserved":
        return {
          color: "bg-orange-100 text-orange-800 border-orange-200",
          icon: CheckCircle,
        };
      case "pending_payment":
        return {
          color: "bg-purple-100 text-purple-800 border-purple-200",
          icon: Clock,
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: Clock,
        };
    }
  };

  // Edit reservation dialog: Only departure date
  function handleEditReservation(res: Reservation) {
    setEditingReservation(res);
    setReservationForm({
      departureDate: res.departureDate || "",
    });
    setShowEditDialog(true);
  }

  // Helper: Calculate total amount based on new departure date
  function calculateTotalAmount(res: Reservation, newDepartureDate: string) {
    if (!res.arrivalDate || !newDepartureDate) return res.totalAmount;
    const arrival = new Date(res.arrivalDate);
    const departure = new Date(newDepartureDate);
    const nights = Math.max(
      1,
      Math.ceil(
        (departure.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24)
      )
    );
    // Use pricePerNight from room if available
    const pricePerNight =
      (res as any).room?.pricePerNight ||
      (res.totalAmount && nights > 0
        ? res.totalAmount /
          (res.departureDate
            ? Math.max(
                1,
                Math.ceil(
                  (new Date(res.departureDate).getTime() - arrival.getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              )
            : nights)
        : res.totalAmount);
    return pricePerNight * nights;
  }

  async function handleSaveEditReservation() {
    if (!editingReservation) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/reservations/${editingReservation.id}/clerk-update-departure`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            departureDate: reservationForm.departureDate,
          }),
        }
      );
      if (!response.ok) throw new Error("Failed to update reservation");
      const updated = await response.json();
      setReservations((prev) =>
        prev.map((r) =>
          r.id === editingReservation.id
            ? {
                ...r,
                departureDate: reservationForm.departureDate,
                totalAmount: updated.totalAmount,
              }
            : r
        )
      );
      setShowEditDialog(false);
      toast({
        title: "Reservation Updated",
        description: "Departure date and total amount updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Could not update reservation",
        variant: "destructive",
      });
    }
  }

  // Cancel reservation dialog
  function handleCancelReservation(res: Reservation) {
    setCancelTarget(res);
    setShowCancelDialog(true);
  }

  async function doCancelReservation() {
    if (!cancelTarget) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/reservations/${cancelTarget.id}/clerk-cancel`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: "cancelled" }),
        }
      );
      if (!response.ok) throw new Error("Failed to cancel reservation");
      setReservations((prev) =>
        prev.map((r) =>
          r.id === cancelTarget.id
            ? { ...r, status: "cancelled", updatedAt: new Date().toISOString() }
            : r
        )
      );
      setShowCancelDialog(false);
      setCancelTarget(null);
      toast({
        title: "Reservation Cancelled",
        description: "Reservation has been successfully cancelled.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Could not cancel reservation",
        variant: "destructive",
      });
    }
  }

  // Delete reservation
  async function handleDeleteReservation(res: Reservation) {
    if (
      !confirm(
        "Are you sure you want to permanently delete this reservation? This action cannot be undone."
      )
    )
      return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/reservations/${res.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to delete reservation");
      setReservations((prev) => prev.filter((r) => r.id !== res.id));
      toast({
        title: "Reservation Deleted",
        description: "Reservation has been permanently deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Could not delete reservation",
        variant: "destructive",
      });
    }
  }

  // Detail dialog
  function handleViewReservationDetail(res: Reservation) {
    setDetailReservation(res);
    setShowDetailDialog(true);
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <NavBar />
      <ClerkSidebar />
      <main className="ml-60 pt-16 min-h-screen">
        <div className="py-8 px-6 lg:px-8 max-w-7xl mx-auto">
          {/* ...stats, filters, table... unchanged ... */}
          {/* Reservations Table */}
          <Card className="shadow-lg border-0">
            <CardHeader className="border-b border-gray-200 pb-4">
              <CardTitle className="text-xl font-semibold text-gray-900">
                All Reservations
              </CardTitle>
              <CardDescription>
                {filteredReservations.length} reservation
                {filteredReservations.length !== 1 ? "s" : ""} found
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold">Guest</TableHead>
                      <TableHead className="font-semibold">
                        Hotel & Room
                      </TableHead>
                      <TableHead className="font-semibold">
                        Stay Duration
                      </TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold text-right">
                        Amount
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingReservations ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <div className="flex flex-col items-center justify-center text-gray-500">
                            <Clock className="h-12 w-12 mb-4 text-gray-300 animate-spin" />
                            <p className="text-lg font-medium">
                              Loading reservations...
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : reservationError ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <div className="flex flex-col items-center justify-center text-red-500">
                            <AlertTriangle className="h-12 w-12 mb-4" />
                            <p className="text-lg font-medium">
                              Error loading reservations
                            </p>
                            <p className="text-sm">{reservationError}</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredReservations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <div className="flex flex-col items-center justify-center text-gray-500">
                            <Search className="h-12 w-12 mb-4 text-gray-300" />
                            <p className="text-lg font-medium mb-2">
                              No reservations found
                            </p>
                            <p className="text-sm">
                              Try adjusting your search or filters
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReservations.map((reservation) => {
                        const statusConfig = getStatusConfig(
                          reservation.status
                        );
                        const StatusIcon = statusConfig.icon;

                        return (
                          <TableRow
                            key={reservation.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-900">
                                  {reservation.guestName || "-"}
                                </span>
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                  <Phone className="h-3 w-3" />
                                  {reservation.phoneNumber ||
                                    reservation.guestPhone}
                                </div>
                                {reservation.email && (
                                  <div className="flex items-center gap-1 text-sm text-gray-500">
                                    <Mail className="h-3 w-3" />
                                    {reservation.email}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {reservation.hotelName || reservation.hotelId}
                                </span>
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <Bed className="h-3 w-3" />
                                  {reservation.roomType}
                                  {reservation.roomNumber &&
                                    ` • Room ${reservation.roomNumber}`}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1 text-sm">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(reservation.arrivalDate)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  to {formatDate(reservation.departureDate)}
                                </div>
                                <div className="text-xs text-blue-600 font-medium">
                                  {reservation.guests}{" "}
                                  {reservation.guests === 1
                                    ? "guest"
                                    : "guests"}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={`${statusConfig.color} flex items-center gap-1 w-fit`}
                              >
                                <StatusIcon className="h-3 w-3" />
                                {reservation.status.charAt(0).toUpperCase() +
                                  reservation.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="font-bold text-gray-900">
                                LKR {reservation.totalAmount?.toLocaleString()}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleViewReservationDetail(reservation)
                                  }
                                  className="flex items-center gap-1"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>

                                {(reservation.status === "confirmed" ||
                                  reservation.status === "pending" ||
                                  reservation.status === "reserved") && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handleEditReservation(reservation)
                                      }
                                      className="flex items-center gap-1"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() =>
                                        handleCancelReservation(reservation)
                                      }
                                      className="flex items-center gap-1"
                                    >
                                      <Ban className="h-3 w-3" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      // ...rest of your component above...
      {/* Reservation Details Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Eye className="h-5 w-5 text-blue-600" />
              Reservation Details
            </DialogTitle>
            <DialogDescription>
              Complete information for reservation #{detailReservation?.id}
            </DialogDescription>
          </DialogHeader>
          {detailReservation && (
            <div className="space-y-6">
              {/* Guest Information Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Guest Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Full Name:
                      </span>
                      <span className="font-semibold">
                        {detailReservation.guestName}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Email:
                      </span>
                      <span className="font-medium">
                        {detailReservation.email || "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Phone:
                      </span>
                      <span className="font-medium">
                        {detailReservation.phoneNumber ||
                          detailReservation.guestPhone}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Number of Guests:
                      </span>
                      <span className="font-semibold text-blue-600">
                        {detailReservation.guests}{" "}
                        {detailReservation.guests === 1 ? "guest" : "guests"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stay Information Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-600" />
                  Stay Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Arrival Date:
                      </span>
                      <span className="font-medium">
                        {formatDate(detailReservation.arrivalDate)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Departure Date:
                      </span>
                      <span className="font-medium">
                        {formatDate(detailReservation.departureDate)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Status:
                      </span>
                      {(() => {
                        const statusConfig = getStatusConfig(
                          detailReservation.status
                        );
                        const StatusIcon = statusConfig.icon;
                        return (
                          <Badge
                            className={`${statusConfig.color} flex items-center gap-1`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {detailReservation.status.charAt(0).toUpperCase() +
                              detailReservation.status.slice(1)}
                          </Badge>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Accommodation Details Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Bed className="h-5 w-5 text-purple-600" />
                  Accommodation Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Hotel:
                      </span>
                      <span className="font-medium flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-red-500" />
                        {detailReservation.hotelName ||
                          detailReservation.hotelId}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Room Type:
                      </span>
                      <span className="font-medium">
                        {detailReservation.roomType}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Room Number:
                      </span>
                      <span className="font-semibold">
                        {detailReservation.roomNumber ? (
                          <span className="text-blue-600">
                            Room {detailReservation.roomNumber}
                          </span>
                        ) : (
                          <span className="text-amber-600">Unassigned</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Information Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Payment Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Total Amount:
                      </span>
                      <span className="font-bold text-lg text-green-600">
                        LKR {detailReservation.totalAmount?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Rate Type:
                      </span>
                      <span className="font-medium capitalize">
                        {detailReservation.rateType || "nightly"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-600" />
                  Reservation Timeline
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">
                      Created:
                    </span>
                    <span className="text-sm font-medium">
                      {formatDateTime(detailReservation.createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">
                      Last Updated:
                    </span>
                    <span className="text-sm font-medium">
                      {formatDateTime(detailReservation.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailDialog(false)}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Edit Reservation Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Edit className="h-5 w-5 text-blue-600" />
              Change Departure Date
            </DialogTitle>
            <DialogDescription>
              Update only the departure date for reservation #
              {editingReservation?.id}
            </DialogDescription>
          </DialogHeader>
          {editingReservation && (
            <div className="space-y-6">
              <div>
                <Label className="text-sm font-medium">Departure Date *</Label>
                <Input
                  type="date"
                  value={reservationForm.departureDate}
                  min={editingReservation.arrivalDate}
                  onChange={(e) =>
                    setReservationForm({ departureDate: e.target.value })
                  }
                />
              </div>
              <div className="bg-gray-50 p-4 rounded flex items-center justify-between">
                <span className="text-lg font-semibold">New Total Amount</span>
                <span className="font-bold text-green-700 text-xl">
                  LKR{" "}
                  {calculateTotalAmount(
                    editingReservation,
                    reservationForm.departureDate
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEditReservation}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Cancel Reservation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Cancel Reservation
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. The reservation will be marked as
              cancelled.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-900">
                  Cancellation Warning
                </h4>
                <p className="text-sm text-amber-700 mt-1">
                  Are you sure you want to cancel reservation{" "}
                  <span className="font-bold">#{cancelTarget?.id}</span> for{" "}
                  <span className="font-bold">{cancelTarget?.guestName}</span>?
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              Keep Reservation
            </Button>
            <Button variant="destructive" onClick={doCancelReservation}>
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
