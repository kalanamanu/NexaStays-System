"use client";
import { useEffect, useState } from "react";
import NavBar from "@/components/nav-bar";
import ClerkSidebar from "@/components/ui/ClerkSidebar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Eye,
  LogOut,
  Search,
  Filter,
  Building,
  Users,
  Calendar,
  Phone,
  Mail,
  User,
  CreditCard,
  X,
  MapPin,
  Bed,
  Clock,
  DollarSign,
  CalendarDays,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";

interface Reservation {
  id: string | number;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  hotelId: string | number;
  hotelName?: string;
  roomType: string;
  roomNumber?: string;
  roomId?: string | number;
  arrivalDate: string;
  departureDate: string;
  status: string;
  guests: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

interface Hotel {
  id: string | number;
  name: string;
}

export default function ClerkCheckoutPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filtered, setFiltered] = useState<Reservation[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<string | number | "">("");
  const [search, setSearch] = useState("");
  const router = useRouter();

  // Stats
  const [stats, setStats] = useState({
    checkedIn: 0,
    checkedOut: 0,
    totalActive: 0,
  });

  // View Dialog State
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);

  useEffect(() => {
    async function fetchHotels() {
      const res = await fetch("http://localhost:5000/api/hotels");
      const data = await res.json();
      setHotels(data.data || []);
    }
    fetchHotels();
  }, []);

  useEffect(() => {
    async function fetchReservations() {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/reservations/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const reservationsData = (data.reservations || []).map((r: any) => ({
        ...r,
        hotelName: r.hotel?.name || r.hotelName || r.hotelId,
        roomId: r.roomId,
      }));

      setReservations(reservationsData);

      // Calculate stats
      const checkedIn = reservationsData.filter(
        (r: Reservation) => r.status === "checked-in"
      ).length;

      const checkedOut = reservationsData.filter(
        (r: Reservation) => r.status === "checked-out"
      ).length;

      setStats({
        checkedIn,
        checkedOut,
        totalActive: checkedIn + checkedOut,
      });
    }
    fetchReservations();
  }, []);

  useEffect(() => {
    // Only checked-in and checked-out
    let list = reservations.filter(
      (r) => r.status === "checked-in" || r.status === "checked-out"
    );
    if (selectedHotel && selectedHotel !== "all-hotels") {
      list = list.filter((r) => String(r.hotelId) === String(selectedHotel));
    }
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          (r.guestName && r.guestName.toLowerCase().includes(s)) ||
          (r.guestPhone && r.guestPhone.toLowerCase().includes(s)) ||
          (r.guestEmail && r.guestEmail.toLowerCase().includes(s))
      );
    }
    setFiltered(list);
  }, [reservations, selectedHotel, search]);

  const statusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";

    switch (status) {
      case "checked-in":
        return (
          <Badge
            className={`${baseClasses} bg-green-100 text-green-800 border-green-200`}
          >
            Checked-In
          </Badge>
        );
      case "checked-out":
        return (
          <Badge
            className={`${baseClasses} bg-gray-100 text-gray-800 border-gray-200`}
          >
            Checked-Out
          </Badge>
        );
      default:
        return (
          <Badge
            className={`${baseClasses} bg-gray-100 text-gray-800 border-gray-200`}
          >
            {status}
          </Badge>
        );
    }
  };

  // Pass roomId as query param for checkout page
  const goToCheckout = (reservation: Reservation) => {
    if (reservation.roomId) {
      router.push(
        `/dashboard/clerk/checkout/${reservation.id}?roomId=${reservation.roomId}`
      );
    } else {
      router.push(`/dashboard/clerk/checkout/${reservation.id}`);
    }
  };

  const handleViewDetails = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setViewDialogOpen(true);
  };

  const calculateNights = (arrivalDate: string, departureDate: string) => {
    const arrival = new Date(arrivalDate);
    const departure = new Date(departureDate);
    const diffTime = Math.abs(departure.getTime() - arrival.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Top NavBar */}
      <NavBar />

      {/* Sidebar */}
      <ClerkSidebar />

      {/* Main Content */}
      <main className="ml-60 pt-16 min-h-screen">
        <div className="py-8 px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Check-Out Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage guest check-outs and view check-out history
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white/80 backdrop-blur-sm border-l-4 border-l-green-500 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Currently Checked-In
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.checkedIn}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Ready for check-out
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <User className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-l-4 border-l-blue-500 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Checked-Out Today
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.checkedOut}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Completed check-outs
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <LogOut className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-l-4 border-l-purple-500 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Active
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.totalActive}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Checked-in + Checked-out
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="shadow-lg border-0 mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Filter className="h-4 w-4" />
                  Filters:
                </div>
                <Select
                  value={String(selectedHotel)}
                  onValueChange={setSelectedHotel}
                >
                  <SelectTrigger className="min-w-[200px]">
                    <Building className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="All Hotels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-hotels">All Hotels</SelectItem>
                    {hotels
                      .filter((h) => h.id && h.id !== "")
                      .map((h) => (
                        <SelectItem key={h.id} value={String(h.id)}>
                          {h.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                <div className="relative flex-1 min-w-[300px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by guest name, phone, or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reservations Table */}
          <Card className="shadow-lg border-0">
            <CardHeader className="border-b border-gray-200 pb-4">
              <CardTitle className="text-xl font-semibold text-gray-900">
                Guest Reservations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold">Guest</TableHead>
                      <TableHead className="font-semibold">Hotel</TableHead>
                      <TableHead className="font-semibold">Room</TableHead>
                      <TableHead className="font-semibold">
                        Stay Duration
                      </TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <div className="flex flex-col items-center justify-center text-gray-500">
                            <Users className="h-12 w-12 mb-4 text-gray-300" />
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
                      filtered.map((r) => (
                        <TableRow
                          key={r.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">
                                {r.guestName}
                              </span>
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Phone className="h-3 w-3" />
                                {r.guestPhone}
                              </div>
                              {r.guestEmail && (
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                  <Mail className="h-3 w-3" />
                                  {r.guestEmail}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{r.hotelName}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{r.roomType}</span>
                              {r.roomNumber ? (
                                <span className="text-sm text-gray-600">
                                  Room {r.roomNumber}
                                </span>
                              ) : (
                                <span className="text-sm text-amber-600">
                                  Unassigned
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1 text-sm">
                                <Calendar className="h-3 w-3" />
                                {r.arrivalDate?.slice(0, 10)}
                              </div>
                              <div className="text-xs text-gray-500">
                                to {r.departureDate?.slice(0, 10)}
                              </div>
                              <div className="text-xs text-blue-600 font-medium">
                                {r.guests} {r.guests === 1 ? "guest" : "guests"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{statusBadge(r.status)}</TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(r)}
                                className="flex items-center gap-1"
                              >
                                <Eye className="h-3 w-3" />
                                Details
                              </Button>
                              {r.status === "checked-in" && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => goToCheckout(r)}
                                  className="flex items-center gap-1"
                                >
                                  <LogOut className="h-3 w-3" />
                                  Check-Out
                                </Button>
                              )}
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

          {/* Information Banner */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-900 mb-1">
                  Check-Out Process
                </h4>
                <p className="text-sm text-blue-700">
                  Use the "Check-Out" button to process guest departures. The
                  system will handle room status updates and generate final
                  bills automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* View Reservation Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Eye className="h-5 w-5 text-blue-600" />
              Reservation Details
            </DialogTitle>
            <DialogDescription>
              Complete information for reservation #{selectedReservation?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedReservation && (
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
                        {selectedReservation.guestName}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Email:
                      </span>
                      <span className="font-medium">
                        {selectedReservation.guestEmail || "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Phone:
                      </span>
                      <span className="font-medium">
                        {selectedReservation.guestPhone}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Number of Guests:
                      </span>
                      <span className="font-semibold text-blue-600">
                        {selectedReservation.guests}{" "}
                        {selectedReservation.guests === 1 ? "guest" : "guests"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stay Information Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-green-600" />
                  Stay Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Arrival Date:
                      </span>
                      <span className="font-medium">
                        {formatDate(selectedReservation.arrivalDate)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Departure Date:
                      </span>
                      <span className="font-medium">
                        {formatDate(selectedReservation.departureDate)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Duration:
                      </span>
                      <span className="font-semibold text-green-600">
                        {calculateNights(
                          selectedReservation.arrivalDate,
                          selectedReservation.departureDate
                        )}{" "}
                        nights
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Status:
                      </span>
                      {statusBadge(selectedReservation.status)}
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
                        {selectedReservation.hotelName}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Room Type:
                      </span>
                      <span className="font-medium">
                        {selectedReservation.roomType}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Room Number:
                      </span>
                      <span className="font-semibold">
                        {selectedReservation.roomNumber ? (
                          <span className="text-blue-600">
                            Room {selectedReservation.roomNumber}
                          </span>
                        ) : (
                          <span className="text-amber-600">Unassigned</span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Room ID:
                      </span>
                      <span className="font-mono text-sm">
                        {selectedReservation.roomId || "N/A"}
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
                        LKR {selectedReservation.totalAmount?.toLocaleString()}
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
                      {formatDateTime(selectedReservation.createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">
                      Last Updated:
                    </span>
                    <span className="text-sm font-medium">
                      {formatDateTime(selectedReservation.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                {selectedReservation.status === "checked-in" && (
                  <Button
                    onClick={() => {
                      setViewDialogOpen(false);
                      goToCheckout(selectedReservation);
                    }}
                    className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Proceed to Check-Out
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setViewDialogOpen(false)}
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
    </div>
  );
}
