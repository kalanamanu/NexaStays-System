"use client";
import { useEffect, useState } from "react";
import NavBar from "@/components/nav-bar";
import ClerkSidebar from "@/components/ui/ClerkSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
  Eye,
  CheckCircle2,
  UserPlus,
  Search,
  Filter,
  Building,
  Phone,
  Calendar,
  User,
  Mail,
  CreditCard,
} from "lucide-react";

interface Hotel {
  id: string | number;
  name: string;
}

interface Reservation {
  id: string | number;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  hotelId: string | number;
  hotelName?: string;
  roomType: string;
  roomNumber?: string;
  arrivalDate: string;
  departureDate: string;
  status: string;
  guests: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export default function ClerkCheckInPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filtered, setFiltered] = useState<Reservation[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<string | number | "">("");
  const [search, setSearch] = useState("");

  // View/Check-in Dialogs
  const [viewReservation, setViewReservation] = useState<Reservation | null>(
    null
  );
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [checkInTarget, setCheckInTarget] = useState<Reservation | null>(null);

  // Walk-In Check-In Dialog
  const [showWalkInDialog, setShowWalkInDialog] = useState(false);
  const [roomTypes, setRoomTypes] = useState<
    { type: string; label: string; price: number; available: number }[]
  >([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<any[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<string | number | "">(
    ""
  );
  const [walkInForm, setWalkInForm] = useState({
    guestName: "",
    email: "",
    phoneNumber: "",
    hotelId: "",
    roomType: "",
    roomNumber: "",
    arrivalDate: "",
    departureDate: "",
    guests: 1,
  });

  // Stats
  const [stats, setStats] = useState({
    totalReservations: 0,
    pendingCheckIns: 0,
    checkedIn: 0,
  });

  // Toast
  const { toast } = require("@/hooks/use-toast");

  // Fetch hotels once
  useEffect(() => {
    async function fetchHotels() {
      const res = await fetch("http://localhost:5000/api/hotels");
      const data = await res.json();
      setHotels(data.data || []);
    }
    fetchHotels();
  }, []);

  // Fetch reservations
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
      }));

      setReservations(reservationsData);

      // Calculate stats
      const pendingCheckIns = reservationsData.filter((r: Reservation) =>
        [
          "confirmed",
          "pending",
          "reserved",
          "pending_payment",
          "paid",
        ].includes(r.status)
      ).length;

      const checkedIn = reservationsData.filter(
        (r: Reservation) => r.status === "checked-in"
      ).length;

      setStats({
        totalReservations: reservationsData.length,
        pendingCheckIns,
        checkedIn,
      });
    }
    fetchReservations();
  }, []);

  // Filter reservations
  useEffect(() => {
    let list = reservations;
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

  // Open view dialog
  function handleView(res: Reservation) {
    setViewReservation(res);
    setShowViewDialog(true);
  }

  // Open check-in confirm dialog
  function handleCheckIn(res: Reservation) {
    setCheckInTarget(res);
    setShowCheckInDialog(true);
  }

  // Confirm check-in
  async function confirmCheckIn() {
    if (!checkInTarget) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        "http://localhost:5000/api/reservations/checkin",
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reservationId: checkInTarget.id,
          }),
        }
      );
      if (!res.ok) throw new Error("Check-in failed");
      setReservations((prev) =>
        prev.map((r) =>
          r.id === checkInTarget.id ? { ...r, status: "checked-in" } : r
        )
      );
      toast({
        title: "Success!",
        description: "Guest has been checked in successfully.",
        variant: "default",
      });
      setShowCheckInDialog(false);
      setCheckInTarget(null);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Could not check in reservation.",
        variant: "destructive",
      });
    }
  }

  const statusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";

    switch (status) {
      case "confirmed":
        return (
          <Badge
            className={`${baseClasses} bg-blue-100 text-blue-800 border-blue-200`}
          >
            Confirmed
          </Badge>
        );
      case "pending":
        return (
          <Badge
            className={`${baseClasses} bg-yellow-100 text-yellow-800 border-yellow-200`}
          >
            Pending
          </Badge>
        );
      case "reserved":
        return (
          <Badge
            className={`${baseClasses} bg-purple-100 text-purple-800 border-purple-200`}
          >
            Reserved
          </Badge>
        );
      case "paid":
        return (
          <Badge
            className={`${baseClasses} bg-gray-100 text-gray-800 border-gray-200`}
          >
            Paid
          </Badge>
        );
      case "pending_payment":
        return (
          <Badge
            className={`${baseClasses} bg-orange-100 text-orange-800 border-orange-200`}
          >
            Pending Payment
          </Badge>
        );
      case "checked-in":
        return (
          <Badge
            className={`${baseClasses} bg-green-100 text-green-800 border-green-200`}
          >
            Checked In
          </Badge>
        );
      case "checked-out":
        return (
          <Badge
            className={`${baseClasses} bg-emerald-100 text-emerald-800 border-emerald-200`}
          >
            Checked Out
          </Badge>
        );
      case "no-show":
        return (
          <Badge
            className={`${baseClasses} bg-red-100 text-red-800 border-red-200`}
          >
            No Show
          </Badge>
        );
      case "cancelled":
        return (
          <Badge
            className={`${baseClasses} bg-gray-200 text-gray-600 border-gray-300`}
          >
            Cancelled
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

  // Walk-In Check-In Logic
  useEffect(() => {
    if (!selectedHotelId) return;
    async function fetchRooms() {
      const res = await fetch(
        `http://localhost:5000/api/hotels/${selectedHotelId}`
      );
      const data = await res.json();
      const hotelRooms = data.data?.rooms || [];
      setRooms(hotelRooms);

      const typeMap: Record<
        string,
        { type: string; label: string; price: number; available: number }
      > = {};
      hotelRooms.forEach((room: any) => {
        const key = room.type.trim().toLowerCase();
        if (!typeMap[key]) {
          typeMap[key] = {
            type: key,
            label: room.type,
            price: room.pricePerNight,
            available: room.status === "available" ? 1 : 0,
          };
        } else {
          if (room.status === "available") typeMap[key].available += 1;
        }
      });
      setRoomTypes(Object.values(typeMap));
    }
    fetchRooms();
  }, [selectedHotelId]);

  useEffect(() => {
    if (walkInForm.roomType) {
      setFilteredRooms(
        rooms.filter(
          (room) =>
            room.type.trim().toLowerCase() ===
              walkInForm.roomType.toLowerCase() &&
            room.status === "available" &&
            room.number &&
            room.number !== ""
        )
      );
    } else {
      setFilteredRooms([]);
    }
  }, [walkInForm.roomType, rooms]);

  function handleWalkInChange(field: string, value: string) {
    setWalkInForm((prev) => ({ ...prev, [field]: value }));
    if (field === "hotelId") {
      setSelectedHotelId(value);
      setWalkInForm((prev) => ({
        ...prev,
        hotelId: value,
        roomType: "",
        roomNumber: "",
      }));
    }
    if (field === "roomType") {
      setWalkInForm((prev) => ({
        ...prev,
        roomNumber: "",
      }));
    }
  }

  async function handleWalkInCheckIn() {
    if (
      !walkInForm.guestName ||
      !walkInForm.phoneNumber ||
      !walkInForm.hotelId ||
      !walkInForm.roomType ||
      !walkInForm.roomNumber ||
      !walkInForm.arrivalDate ||
      !walkInForm.departureDate
    ) {
      toast({
        title: "Missing Fields",
        description: "All fields marked with * are required.",
        variant: "destructive",
      });
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const payload = {
        guestName: walkInForm.guestName,
        guestEmail: walkInForm.email,
        guestPhone: walkInForm.phoneNumber,
        hotelId: walkInForm.hotelId,
        roomType: walkInForm.roomType,
        roomNumber: walkInForm.roomNumber,
        arrivalDate: walkInForm.arrivalDate,
        departureDate: walkInForm.departureDate,
        status: "checked-in",
        guests: walkInForm.guests,
      };
      const res = await fetch("http://localhost:5000/api/reservations/clerk", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to check in walk-in guest.");
      toast({
        title: "Success!",
        description: "Walk-in guest has been checked in successfully.",
      });
      setShowWalkInDialog(false);
      setWalkInForm({
        guestName: "",
        email: "",
        phoneNumber: "",
        hotelId: "",
        roomType: "",
        roomNumber: "",
        arrivalDate: "",
        departureDate: "",
        guests: 1,
      });
      setSelectedHotelId("");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Could not check in walk-in guest.",
        variant: "destructive",
      });
    }
  }

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
                  Check-In Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage reservations and process guest check-ins efficiently
                </p>
              </div>
              {/* <Button
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                onClick={() => setShowWalkInDialog(true)}
              >
                <UserPlus className="h-4 w-4" />
                Walk-In Check-In
              </Button> */}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white/80 backdrop-blur-sm border-l-4 border-l-blue-500 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Reservations
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.totalReservations}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-l-4 border-l-amber-500 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Pending Check-Ins
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.pendingCheckIns}
                    </p>
                  </div>
                  <div className="p-3 bg-amber-100 rounded-lg">
                    <User className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

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
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
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
                Reservations
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
                      <TableHead className="font-semibold">Dates</TableHead>
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
                            </div>
                          </TableCell>
                          <TableCell>{statusBadge(r.status)}</TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleView(r)}
                                className="flex items-center gap-1"
                              >
                                <Eye className="h-3 w-3" />
                                View
                              </Button>
                              {r.status === "checked-in" ? (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() =>
                                    (window.location.href = `/dashboard/clerk/checkout/${r.id}`)
                                  }
                                >
                                  Check-Out
                                </Button>
                              ) : (
                                [
                                  "confirmed",
                                  "pending",
                                  "reserved",
                                  "pending_payment",
                                  "paid",
                                ].includes(r.status) && (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleCheckIn(r)}
                                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle2 className="h-3 w-3" />
                                    Check-In
                                  </Button>
                                )
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
        </div>

        {/* Reservation View Dialog */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Eye className="h-5 w-5 text-blue-600" />
                Reservation Details
              </DialogTitle>
            </DialogHeader>
            {viewReservation && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Guest Information
                    </Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Name:</span>
                        <span className="font-medium">
                          {viewReservation.guestName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Email:</span>
                        <span className="font-medium">
                          {viewReservation.guestEmail}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Phone:</span>
                        <span className="font-medium">
                          {viewReservation.guestPhone}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Guests:</span>
                        <span className="font-medium">
                          {viewReservation.guests}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Stay Information
                    </Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Arrival:</span>
                        <span className="font-medium">
                          {viewReservation.arrivalDate?.slice(0, 10)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Departure:</span>
                        <span className="font-medium">
                          {viewReservation.departureDate?.slice(0, 10)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Accommodation
                    </Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Hotel:</span>
                        <span className="font-medium">
                          {viewReservation.hotelName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Room Type:</span>
                        <span className="font-medium">
                          {viewReservation.roomType}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Room Number:</span>
                        <span className="font-medium">
                          {viewReservation.roomNumber || (
                            <span className="text-amber-600">Unassigned</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Payment & Status
                    </Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Total Amount:</span>
                        <span className="font-medium">
                          LKR {viewReservation.totalAmount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Status:</span>
                        {statusBadge(viewReservation.status)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="flex gap-2">
              {viewReservation &&
                [
                  "confirmed",
                  "pending",
                  "reserved",
                  "pending_payment",
                  "paid",
                ].includes(viewReservation.status) && (
                  <Button
                    onClick={() => {
                      setShowViewDialog(false);
                      handleCheckIn(viewReservation);
                    }}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Check-In Guest
                  </Button>
                )}
              <Button
                variant="outline"
                onClick={() => setShowViewDialog(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Check-In Confirm Dialog */}
        <Dialog open={showCheckInDialog} onOpenChange={setShowCheckInDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Confirm Check-In
              </DialogTitle>
              <DialogDescription>
                You are about to check in{" "}
                <span className="font-bold text-gray-900">
                  {checkInTarget?.guestName}
                </span>
                for reservation{" "}
                <span className="font-bold text-gray-900">
                  #{checkInTarget?.id}
                </span>
                . This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCheckInDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmCheckIn}
                className="bg-green-600 hover:bg-green-700"
              >
                Confirm Check-In
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Walk-In Check-In Dialog */}
        <Dialog open={showWalkInDialog} onOpenChange={setShowWalkInDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <UserPlus className="h-5 w-5 text-blue-600" />
                Walk-In Check-In
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Guest Name *</Label>
                  <Input
                    value={walkInForm.guestName}
                    onChange={(e) =>
                      handleWalkInChange("guestName", e.target.value)
                    }
                    placeholder="Enter guest full name"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <Input
                    type="email"
                    value={walkInForm.email}
                    onChange={(e) =>
                      handleWalkInChange("email", e.target.value)
                    }
                    placeholder="guest@example.com"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Phone Number *</Label>
                  <Input
                    value={walkInForm.phoneNumber}
                    onChange={(e) =>
                      handleWalkInChange("phoneNumber", e.target.value)
                    }
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">
                    Number of Guests
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    value={walkInForm.guests}
                    onChange={(e) =>
                      handleWalkInChange("guests", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Hotel *</Label>
                  <Select
                    value={walkInForm.hotelId}
                    onValueChange={(v) => handleWalkInChange("hotelId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select hotel" />
                    </SelectTrigger>
                    <SelectContent>
                      {hotels
                        .filter((h) => h.id && h.id !== "")
                        .map((h) => (
                          <SelectItem key={h.id} value={String(h.id)}>
                            {h.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Room Type *</Label>
                  <Select
                    value={walkInForm.roomType}
                    onValueChange={(v) => handleWalkInChange("roomType", v)}
                    disabled={!walkInForm.hotelId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select room type" />
                    </SelectTrigger>
                    <SelectContent>
                      {roomTypes
                        .filter((rt) => rt.type && rt.type !== "")
                        .map((rt) => (
                          <SelectItem key={rt.type} value={rt.type}>
                            {rt.label} (LKR {rt.price}/night) - {rt.available}{" "}
                            available
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Room Number *</Label>
                  <Select
                    value={walkInForm.roomNumber}
                    onValueChange={(v) => handleWalkInChange("roomNumber", v)}
                    disabled={!walkInForm.roomType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select room number" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredRooms
                        .filter((room) => room.number && room.number !== "")
                        .map((room) => (
                          <SelectItem key={room.number} value={room.number}>
                            Room {room.number} (LKR {room.pricePerNight}/night)
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium">
                      Arrival Date *
                    </Label>
                    <Input
                      type="date"
                      value={walkInForm.arrivalDate}
                      onChange={(e) =>
                        handleWalkInChange("arrivalDate", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">
                      Departure Date *
                    </Label>
                    <Input
                      type="date"
                      value={walkInForm.departureDate}
                      onChange={(e) =>
                        handleWalkInChange("departureDate", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowWalkInDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleWalkInCheckIn}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Check-In Guest
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
