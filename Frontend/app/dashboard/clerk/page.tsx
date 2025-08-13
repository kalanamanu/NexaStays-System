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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  UserCheck,
  UserX,
  FileText,
  Search,
  Plus,
  Edit,
  Trash2,
  Key,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import NavBar from "@/components/nav-bar";
import { useUser } from "@/context/user-context";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  formatISO,
  isAfter,
  isBefore,
  isToday,
  parseISO,
  addWeeks,
  addMonths,
  differenceInCalendarDays,
} from "date-fns";

type ReservationStatus =
  | "pending"
  | "confirmed"
  | "checked-in"
  | "checked-out"
  | "no-show"
  | "cancelled";

interface Reservation {
  id: string;
  guestName: string;
  email: string;
  phoneNumber?: string;
  roomType: string;
  roomNumber?: string;
  arrivalDate: string; // ISO
  departureDate: string; // ISO
  status: ReservationStatus;
  guests: number;
  totalAmount: number;
  creditCard?: string; // if present, it's guaranteed
  rateType?: "nightly" | "weekly" | "monthly";
  createdAt: string;
  updatedAt: string;
}

interface Room {
  id: number;
  number: string;
  type: string;
  status: "available" | "occupied" | "maintenance";
  pricePerNight: number;
}
interface Bill {
  roomCharges: number;
  restaurant: number;
  roomService: number;
  laundry: number;
  telephone: number;
  club: number;
  other: number;
  lateCheckout: number;
  total: number;
}

export default function ClerkDashboard() {
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReservation, setSelectedReservation] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [showReservationDialog, setShowReservationDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showBillDialog, setShowBillDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showNoShowDialog, setShowNoShowDialog] = useState(false);
  const [walkInMode, setWalkInMode] = useState(false);
  const [editingReservation, setEditingReservation] =
    useState<Reservation | null>(null);
  const [reservationForm, setReservationForm] = useState({
    guestName: "",
    email: "",
    phoneNumber: "",
    roomType: "",
    guests: 1,
    arrivalDate: "",
    departureDate: "",
    creditCard: "",
    rateType: "nightly" as "nightly" | "weekly" | "monthly",
  });
  const [checkoutBill, setCheckoutBill] = useState<Bill>({
    roomCharges: 0,
    restaurant: 0,
    roomService: 0,
    laundry: 0,
    telephone: 0,
    club: 0,
    other: 0,
    lateCheckout: 0,
    total: 0,
  });
  const [reportDialog, setReportDialog] = useState(false);
  const [todayOccupancy, setTodayOccupancy] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);
  const [noShowTarget, setNoShowTarget] = useState<Reservation | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);

  //Get all available rooms
  useEffect(() => {
    async function fetchRooms() {
      try {
        const res = await fetch("http://localhost:5000/api/rooms");
        const data = await res.json();
        setRooms(data);
        setAvailableRooms(
          data.filter((room: Room) => room.status === "available")
        );
      } catch (err) {
        setRooms([]);
        setAvailableRooms([]);
      }
    }
    fetchRooms();
  }, []);

  // Demo data
  const [reservations, setReservations] = useState<Reservation[]>([
    {
      id: "RES001",
      guestName: "John Doe",
      email: "john@example.com",
      phoneNumber: "555-123-4567",
      roomType: "Deluxe",
      roomNumber: "201",
      arrivalDate: "2025-08-13",
      departureDate: "2025-08-16",
      status: "confirmed",
      guests: 2,
      totalAmount: 540,
      creditCard: "VISA ****1234",
      rateType: "nightly",
      createdAt: "2025-08-10T10:00:00Z",
      updatedAt: "2025-08-10T10:00:00Z",
    },
    {
      id: "RES002",
      guestName: "Jane Smith",
      email: "jane@example.com",
      phoneNumber: "555-222-3333",
      roomType: "Residential Suite",
      arrivalDate: "2025-08-13",
      departureDate: "2025-08-20",
      status: "pending",
      guests: 2,
      totalAmount: 2700,
      rateType: "weekly",
      creditCard: "",
      createdAt: "2025-08-10T12:00:00Z",
      updatedAt: "2025-08-10T12:00:00Z",
    },
    {
      id: "RES003",
      guestName: "Mark Brown",
      email: "mark@example.com",
      phoneNumber: "555-987-6543",
      roomType: "Standard",
      arrivalDate: "2025-08-12",
      departureDate: "2025-08-13",
      status: "checked-in",
      roomNumber: "101",
      guests: 1,
      totalAmount: 120,
      rateType: "nightly",
      createdAt: "2025-08-10T13:00:00Z",
      updatedAt: "2025-08-12T15:00:00Z",
    },
    {
      id: "RES004",
      guestName: "Lucy Green",
      email: "lucy@example.com",
      phoneNumber: "555-444-1234",
      roomType: "Suite",
      arrivalDate: "2025-08-11",
      departureDate: "2025-08-13",
      status: "no-show",
      guests: 2,
      totalAmount: 420,
      rateType: "nightly",
      createdAt: "2025-08-10T14:00:00Z",
      updatedAt: "2025-08-11T20:00:00Z",
    },
  ]);

  // Auto-cancel and no-show simulation: Mark reservations for today without credit card as auto-cancelled after 7 PM.
  useEffect(() => {
    // Simulate: At 7 PM, auto-cancel pending/confirmed reservations for today without credit card
    const now = new Date();
    const isNight = now.getHours() >= 19;
    if (isNight) {
      setReservations((prev) =>
        prev.map((r) => {
          if (
            (r.status === "pending" || r.status === "confirmed") &&
            !r.creditCard &&
            isToday(new Date(r.arrivalDate)) &&
            (!r.roomNumber || r.roomNumber === "")
          ) {
            return {
              ...r,
              status: "cancelled",
              updatedAt: new Date().toISOString(),
            };
          }
          return r;
        })
      );
    }
    // Simulate: At 7 PM, mark today's no-shows and create bills
    if (isNight) {
      setReservations((prev) =>
        prev.map((r) => {
          if (
            (r.status === "confirmed" || r.status === "pending") &&
            isToday(new Date(r.arrivalDate)) &&
            (!r.roomNumber || r.roomNumber === "")
          ) {
            return {
              ...r,
              status: "no-show",
              updatedAt: new Date().toISOString(),
            };
          }
          return r;
        })
      );
    }
    // Calculate today's occupancy and revenue (yesterday night)
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const occ = reservations.filter(
      (r) =>
        r.status === "checked-in" &&
        isAfter(new Date(r.departureDate), yesterday) &&
        isBefore(new Date(r.arrivalDate), now)
    ).length;
    setTodayOccupancy(occ);
    const rev = reservations
      .filter(
        (r) =>
          r.status === "checked-out" &&
          isAfter(new Date(r.departureDate), yesterday)
      )
      .reduce((sum, r) => sum + r.totalAmount, 0);
    setTodayRevenue(rev);
  }, []);

  useEffect(() => {
    if (!user || user.role !== "clerk") {
      router.push("/login");
    }
  }, [user, router]);

  // Reservation Form Handlers
  function openNewReservationDialog(walkin = false) {
    setWalkInMode(walkin);
    setReservationForm({
      guestName: "",
      email: "",
      phoneNumber: "",
      roomType: "",
      guests: 1,
      arrivalDate: formatISO(new Date(), { representation: "date" }),
      departureDate: formatISO(new Date(Date.now() + 86400000), {
        representation: "date",
      }),
      creditCard: "",
      rateType: "nightly",
    });
    setShowReservationDialog(true);
  }

  function handleReservationFormChange(field: string, value: string | number) {
    setReservationForm((prev) => {
      let arrival = prev.arrivalDate;
      let departure = prev.departureDate;
      let rateType = prev.rateType;
      if (field === "arrivalDate") {
        arrival = value as string;
        // If residential suite and non-nightly, auto-calculate departure
        if (
          prev.roomType === "Residential Suite" &&
          prev.rateType !== "nightly"
        ) {
          if (prev.rateType === "weekly") {
            departure = formatISO(addWeeks(new Date(arrival), 1), {
              representation: "date",
            });
          } else if (prev.rateType === "monthly") {
            departure = formatISO(addMonths(new Date(arrival), 1), {
              representation: "date",
            });
          }
        }
      }
      if (field === "rateType") {
        rateType = value as "nightly" | "weekly" | "monthly";
        if (
          prev.roomType === "Residential Suite" &&
          (value === "weekly" || value === "monthly")
        ) {
          if (prev.arrivalDate) {
            if (value === "weekly") {
              departure = formatISO(addWeeks(new Date(prev.arrivalDate), 1), {
                representation: "date",
              });
            } else if (value === "monthly") {
              departure = formatISO(addMonths(new Date(prev.arrivalDate), 1), {
                representation: "date",
              });
            }
          }
        }
      }
      if (field === "roomType" && value === "Residential Suite") {
        rateType = "weekly";
        if (prev.arrivalDate) {
          departure = formatISO(addWeeks(new Date(prev.arrivalDate), 1), {
            representation: "date",
          });
        }
      }
      if (field === "roomType" && value !== "Residential Suite") {
        rateType = "nightly";
      }
      return {
        ...prev,
        [field]: value,
        arrivalDate: arrival,
        departureDate: departure,
        rateType,
      };
    });
  }

  function handleCreateReservation() {
    if (
      !reservationForm.guestName ||
      !reservationForm.roomType ||
      !reservationForm.arrivalDate ||
      !reservationForm.departureDate ||
      !reservationForm.phoneNumber
    ) {
      toast({
        title: "Missing Fields",
        description: "All required fields must be filled.",
        variant: "destructive",
      });
      return;
    }
    const newRes: Reservation = {
      id: `RES${Math.floor(Math.random() * 10000)}`,
      guestName: reservationForm.guestName,
      email: reservationForm.email,
      phoneNumber: reservationForm.phoneNumber,
      roomType: reservationForm.roomType,
      guests: reservationForm.guests,
      arrivalDate: reservationForm.arrivalDate,
      departureDate: reservationForm.departureDate,
      status: walkInMode ? "checked-in" : "confirmed",
      roomNumber: walkInMode
        ? getAvailableRoomForType(reservationForm.roomType)
        : undefined,
      totalAmount: calculateRoomCharges(
        reservationForm.roomType,
        reservationForm.arrivalDate,
        reservationForm.departureDate,
        reservationForm.guests,
        reservationForm.rateType
      ),
      creditCard: reservationForm.creditCard,
      rateType: reservationForm.rateType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setReservations((prev) => [...prev, newRes]);
    if (walkInMode && newRes.roomNumber) {
      setAvailableRooms((prev) =>
        prev.map((r) =>
          r.number === newRes.roomNumber ? { ...r, status: "occupied" } : r
        )
      );
    }
    setShowReservationDialog(false);
    setWalkInMode(false);
    toast({
      title: walkInMode ? "Walk-in Checked In" : "Reservation Created",
      description: `${reservationForm.guestName} ${
        walkInMode ? "checked in" : "reservation has been created"
      }`,
    });
  }

  function handleEditReservation(res: Reservation) {
    setEditingReservation(res);
    setReservationForm({
      guestName: res.guestName,
      email: res.email,
      phoneNumber: res.phoneNumber ?? "",
      roomType: res.roomType,
      guests: res.guests,
      arrivalDate: res.arrivalDate,
      departureDate: res.departureDate,
      creditCard: res.creditCard ?? "",
      rateType: res.rateType ?? "nightly",
    });
    setShowEditDialog(true);
  }

  function handleSaveEditReservation() {
    if (!editingReservation) return;
    setReservations((prev) =>
      prev.map((r) =>
        r.id === editingReservation.id
          ? {
              ...r,
              guestName: reservationForm.guestName,
              email: reservationForm.email,
              phoneNumber: reservationForm.phoneNumber,
              roomType: reservationForm.roomType,
              guests: reservationForm.guests,
              arrivalDate: reservationForm.arrivalDate,
              departureDate: reservationForm.departureDate,
              creditCard: reservationForm.creditCard,
              rateType: reservationForm.rateType,
              updatedAt: new Date().toISOString(),
            }
          : r
      )
    );
    setShowEditDialog(false);
    toast({
      title: "Reservation Updated",
      description: "Reservation details saved.",
    });
  }

  function handleCancelReservation(res: Reservation) {
    setCancelTarget(res);
    setShowCancelDialog(true);
  }

  function doCancelReservation() {
    if (!cancelTarget) return;
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
      description: "Reservation has been cancelled.",
    });
  }

  function handleNoShow(res: Reservation) {
    setNoShowTarget(res);
    setShowNoShowDialog(true);
  }

  function doNoShow() {
    if (!noShowTarget) return;
    setReservations((prev) =>
      prev.map((r) =>
        r.id === noShowTarget.id
          ? { ...r, status: "no-show", updatedAt: new Date().toISOString() }
          : r
      )
    );
    setShowNoShowDialog(false);
    setNoShowTarget(null);
    toast({
      title: "Marked as No-Show",
      description: "Billing record has been created for no-show.",
    });
  }

  function getAvailableRoomForType(roomType: string): string | undefined {
    const room = availableRooms.find(
      (r) => r.type === roomType && r.status === "available"
    );
    return room?.number;
  }

  function calculateRoomCharges(
    roomType: string,
    arrival: string,
    departure: string,
    guests: number,
    rateType: "nightly" | "weekly" | "monthly" = "nightly"
  ): number {
    // Find a real room for this type
    const room = rooms.find((r) => r.type === roomType);
    const nightlyPrice = room?.pricePerNight ?? 0;

    if (roomType === "Residential Suite" && rateType !== "nightly") {
      if (rateType === "weekly") return nightlyPrice * 7;
      if (rateType === "monthly") return nightlyPrice * 30;
    }
    // Nightly calculation
    const nights = Math.max(
      1,
      differenceInCalendarDays(new Date(departure), new Date(arrival))
    );
    return nights * nightlyPrice;
  }
  // Check-In Logic
  function handleAssignRoomAndCheckIn() {
    if (!selectedReservation || !selectedRoom) {
      toast({
        title: "Error",
        description: "Please select both a reservation and a room.",
        variant: "destructive",
      });
      return;
    }
    setReservations((prev) =>
      prev.map((r) =>
        r.id === selectedReservation
          ? {
              ...r,
              status: "checked-in",
              roomNumber: selectedRoom,
              updatedAt: new Date().toISOString(),
            }
          : r
      )
    );
    setAvailableRooms((prev) =>
      prev.map((r) =>
        r.number === selectedRoom ? { ...r, status: "occupied" } : r
      )
    );
    toast({
      title: "Check-in Successful",
      description: `Guest has been checked into room ${selectedRoom}.`,
    });
    setSelectedReservation("");
    setSelectedRoom("");
  }

  // Check-Out Logic
  function handleCheckOut() {
    if (!selectedReservation || !paymentMethod) {
      toast({
        title: "Error",
        description: "Please select a reservation and payment method.",
        variant: "destructive",
      });
      return;
    }
    // Find reservation
    const res = reservations.find((r) => r.id === selectedReservation);
    if (!res) return;
    // Calculate late checkout
    let lateFee = 0;
    const scheduled = new Date(res.departureDate);
    const now = new Date();
    if (isAfter(now, scheduled)) {
      lateFee = calculateRoomCharges(
        res.roomType,
        res.departureDate,
        formatISO(now, { representation: "date" }),
        res.guests,
        res.rateType
      );
    }
    const bill: Bill = {
      ...checkoutBill,
      lateCheckout: lateFee,
      total:
        res.totalAmount +
        checkoutBill.restaurant +
        checkoutBill.roomService +
        checkoutBill.laundry +
        checkoutBill.telephone +
        checkoutBill.club +
        checkoutBill.other +
        lateFee,
      roomCharges: res.totalAmount,
    };
    setCheckoutBill(bill);

    // Mark reservation as checked-out
    setReservations((prev) =>
      prev.map((r) =>
        r.id === selectedReservation
          ? { ...r, status: "checked-out", updatedAt: new Date().toISOString() }
          : r
      )
    );
    // Make room available
    setAvailableRooms((prev) =>
      prev.map((r) =>
        r.number === res.roomNumber ? { ...r, status: "available" } : r
      )
    );
    setShowBillDialog(true);
    setSelectedReservation("");
    setPaymentMethod("");
    toast({
      title: "Check-out Successful",
      description: "Guest has been checked out and receipt generated.",
    });
  }

  // Filtering, coloring, helpers
  const filteredReservations = reservations.filter(
    (reservation) =>
      reservation.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: ReservationStatus) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "checked-in":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "checked-out":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "no-show":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "cancelled":
        return "bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <NavBar />

      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Clerk Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Manage check-ins, check-outs, and reservations
              </p>
            </div>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setReportDialog(true)}
            >
              <FileText className="h-4 w-4" />
              Daily Occupancy/Revenue Report
            </Button>
          </div>

          <Tabs defaultValue="checkin" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="checkin">Check-In</TabsTrigger>
              <TabsTrigger value="checkout">Check-Out</TabsTrigger>
              <TabsTrigger value="reservations">Reservations</TabsTrigger>
            </TabsList>

            {/* Check-In Tab */}
            <TabsContent value="checkin">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Guest Check-In
                  </CardTitle>
                  <CardDescription>
                    Check in guests and assign rooms or process walk-ins
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="guest-search">Search Guest</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            id="guest-search"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reservation-select">
                          Select Reservation
                        </Label>
                        <Select
                          value={selectedReservation}
                          onValueChange={setSelectedReservation}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose reservation" />
                          </SelectTrigger>
                          <SelectContent>
                            {reservations
                              .filter(
                                (r) =>
                                  r.status === "confirmed" ||
                                  r.status === "pending"
                              )
                              .map((reservation) => (
                                <SelectItem
                                  key={reservation.id}
                                  value={reservation.id}
                                >
                                  {reservation.id} - {reservation.guestName} (
                                  {reservation.roomType}
                                  {reservation.creditCard ? (
                                    <span title="Guaranteed by card">
                                      {" "}
                                      <CreditCard className="inline h-3 w-3 text-green-600" />
                                    </span>
                                  ) : (
                                    <span title="Not guaranteed">
                                      {" "}
                                      <AlertCircle className="inline h-3 w-3 text-yellow-600" />
                                    </span>
                                  )}
                                  )
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Separator />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => openNewReservationDialog(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Walk-In Check-In
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => openNewReservationDialog(false)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          New Reservation
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="room-select">Assign Room</Label>
                        <Select
                          value={selectedRoom}
                          onValueChange={setSelectedRoom}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose available room" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableRooms.map((room) => (
                              <SelectItem key={room.number} value={room.number}>
                                Room {room.number} - {room.type} ($
                                {room.pricePerNight}/night)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        onClick={handleAssignRoomAndCheckIn}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        Check In Guest
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Check-Out Tab */}
            <TabsContent value="checkout">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserX className="h-5 w-5" />
                    Guest Check-Out
                  </CardTitle>
                  <CardDescription>
                    Process guest check-out, change checkout date, add charges
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="checkout-reservation">
                          Select Reservation
                        </Label>
                        <Select
                          value={selectedReservation}
                          onValueChange={setSelectedReservation}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose reservation to check out" />
                          </SelectTrigger>
                          <SelectContent>
                            {reservations
                              .filter((r) => r.status === "checked-in")
                              .map((reservation) => (
                                <SelectItem
                                  key={reservation.id}
                                  value={reservation.id}
                                >
                                  {reservation.id} - {reservation.guestName}{" "}
                                  (Room {reservation.roomNumber})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="payment-method">Payment Method</Label>
                        <Select
                          value={paymentMethod}
                          onValueChange={setPaymentMethod}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="credit">Credit Card</SelectItem>
                            <SelectItem value="debit">Debit Card</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Change checkout date */}
                      <div className="space-y-2">
                        <Label htmlFor="change-checkout-date">
                          Change Checkout Date
                        </Label>
                        <Input
                          id="change-checkout-date"
                          type="date"
                          value={
                            reservations.find(
                              (r) => r.id === selectedReservation
                            )?.departureDate || ""
                          }
                          onChange={(e) => {
                            setReservations((prev) =>
                              prev.map((r) =>
                                r.id === selectedReservation
                                  ? { ...r, departureDate: e.target.value }
                                  : r
                              )
                            );
                          }}
                        />
                        <span className="text-xs text-gray-500">
                          Changing the checkout date may result in extra charges
                          for late checkout.
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Bill Summary</h3>
                      <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex justify-between">
                          <span>Room Charges</span>
                          <span>${checkoutBill.roomCharges}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Restaurant</span>
                          <Input
                            type="number"
                            min={0}
                            value={checkoutBill.restaurant}
                            onChange={(e) =>
                              setCheckoutBill((prev) => ({
                                ...prev,
                                restaurant: Number(e.target.value),
                              }))
                            }
                            className="w-20"
                          />
                        </div>
                        <div className="flex justify-between">
                          <span>Room Service</span>
                          <Input
                            type="number"
                            min={0}
                            value={checkoutBill.roomService}
                            onChange={(e) =>
                              setCheckoutBill((prev) => ({
                                ...prev,
                                roomService: Number(e.target.value),
                              }))
                            }
                            className="w-20"
                          />
                        </div>
                        <div className="flex justify-between">
                          <span>Laundry</span>
                          <Input
                            type="number"
                            min={0}
                            value={checkoutBill.laundry}
                            onChange={(e) =>
                              setCheckoutBill((prev) => ({
                                ...prev,
                                laundry: Number(e.target.value),
                              }))
                            }
                            className="w-20"
                          />
                        </div>
                        <div className="flex justify-between">
                          <span>Telephone</span>
                          <Input
                            type="number"
                            min={0}
                            value={checkoutBill.telephone}
                            onChange={(e) =>
                              setCheckoutBill((prev) => ({
                                ...prev,
                                telephone: Number(e.target.value),
                              }))
                            }
                            className="w-20"
                          />
                        </div>
                        <div className="flex justify-between">
                          <span>Club Facility</span>
                          <Input
                            type="number"
                            min={0}
                            value={checkoutBill.club}
                            onChange={(e) =>
                              setCheckoutBill((prev) => ({
                                ...prev,
                                club: Number(e.target.value),
                              }))
                            }
                            className="w-20"
                          />
                        </div>
                        <div className="flex justify-between">
                          <span>Other Charges</span>
                          <Input
                            type="number"
                            min={0}
                            value={checkoutBill.other}
                            onChange={(e) =>
                              setCheckoutBill((prev) => ({
                                ...prev,
                                other: Number(e.target.value),
                              }))
                            }
                            className="w-20"
                          />
                        </div>
                        <Separator />
                        <div className="flex justify-between font-semibold text-lg">
                          <span>Total</span>
                          <span>
                            $
                            {checkoutBill.roomCharges +
                              checkoutBill.restaurant +
                              checkoutBill.roomService +
                              checkoutBill.laundry +
                              checkoutBill.telephone +
                              checkoutBill.club +
                              checkoutBill.other +
                              checkoutBill.lateCheckout}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={handleCheckOut}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          Process Check-Out
                        </Button>
                        <Dialog
                          open={showBillDialog}
                          onOpenChange={setShowBillDialog}
                        >
                          <DialogTrigger asChild>
                            <Button variant="outline">
                              <FileText className="h-4 w-4 mr-2" />
                              Preview Receipt
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Receipt Preview</DialogTitle>
                              <DialogDescription>
                                Guest receipt for reservation{" "}
                                {selectedReservation}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="text-center">
                                <h3 className="text-lg font-bold">
                                  HotelChain
                                </h3>
                                <p className="text-sm text-gray-600">
                                  Thank you for staying with us!
                                </p>
                              </div>
                              <Separator />
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span>Room Charges</span>
                                  <span>${checkoutBill.roomCharges}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Restaurant</span>
                                  <span>${checkoutBill.restaurant}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Room Service</span>
                                  <span>${checkoutBill.roomService}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Laundry</span>
                                  <span>${checkoutBill.laundry}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Telephone</span>
                                  <span>${checkoutBill.telephone}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Club Facility</span>
                                  <span>${checkoutBill.club}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Other</span>
                                  <span>${checkoutBill.other}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Late Checkout</span>
                                  <span>${checkoutBill.lateCheckout}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-bold">
                                  <span>Total</span>
                                  <span>
                                    $
                                    {checkoutBill.roomCharges +
                                      checkoutBill.restaurant +
                                      checkoutBill.roomService +
                                      checkoutBill.laundry +
                                      checkoutBill.telephone +
                                      checkoutBill.club +
                                      checkoutBill.other +
                                      checkoutBill.lateCheckout}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline">Print Receipt</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reservations Tab */}
            <TabsContent value="reservations">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <CardTitle>All Reservations</CardTitle>
                      <CardDescription>
                        Manage all hotel reservations
                      </CardDescription>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        className="gap-2"
                        onClick={() => openNewReservationDialog(false)}
                      >
                        <Plus className="h-4 w-4" />
                        New Reservation
                      </Button>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Search reservations..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-64"
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Guest</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Room</TableHead>
                          <TableHead>Check-in</TableHead>
                          <TableHead>Check-out</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Credit Card</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredReservations.map((reservation) => (
                          <TableRow key={reservation.id}>
                            <TableCell className="font-medium">
                              {reservation.id}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {reservation.guestName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {reservation.email}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{reservation.phoneNumber}</TableCell>
                            <TableCell>
                              {reservation.roomNumber
                                ? `${reservation.roomNumber} (${reservation.roomType})`
                                : reservation.roomType}
                              {reservation.rateType &&
                              reservation.roomType === "Residential Suite" ? (
                                <div className="text-xs text-gray-500">
                                  ({reservation.rateType})
                                </div>
                              ) : null}
                            </TableCell>
                            <TableCell>{reservation.arrivalDate}</TableCell>
                            <TableCell>{reservation.departureDate}</TableCell>
                            <TableCell>
                              <Badge
                                className={getStatusColor(reservation.status)}
                              >
                                {reservation.status.charAt(0).toUpperCase() +
                                  reservation.status.slice(1)}
                              </Badge>
                              {reservation.status === "pending" &&
                                !reservation.creditCard && (
                                  <span
                                    title="Will auto-cancel at 7 PM"
                                    className="ml-2 text-xs text-yellow-600 flex items-center gap-1"
                                  >
                                    <AlertCircle className="inline h-3 w-3" />{" "}
                                    Not guaranteed
                                  </span>
                                )}
                              {reservation.status === "no-show" && (
                                <span className="ml-2 text-xs text-red-600 flex items-center gap-1">
                                  <Key className="inline h-3 w-3" /> No-Show
                                </span>
                              )}
                            </TableCell>
                            <TableCell>${reservation.totalAmount}</TableCell>
                            <TableCell>
                              {reservation.creditCard ? (
                                <span>
                                  <CreditCard className="inline h-4 w-4 text-green-600" />{" "}
                                  {reservation.creditCard}
                                </span>
                              ) : (
                                <span className="text-yellow-600 font-medium">
                                  No Card
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="space-x-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleEditReservation(reservation)
                                }
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              {(reservation.status === "confirmed" ||
                                reservation.status === "pending") && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() =>
                                    handleCancelReservation(reservation)
                                  }
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                              {(reservation.status === "confirmed" ||
                                reservation.status === "pending") &&
                                isToday(new Date(reservation.arrivalDate)) &&
                                (!reservation.roomNumber ||
                                  reservation.roomNumber === "") && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleNoShow(reservation)}
                                  >
                                    Mark No-Show
                                  </Button>
                                )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* New Reservation Dialog */}
      <Dialog
        open={showReservationDialog}
        onOpenChange={setShowReservationDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {walkInMode ? "Walk-In Check-In" : "New Reservation"}
            </DialogTitle>
            <DialogDescription>
              {walkInMode
                ? "Create and check in a walk-in guest."
                : "Create a new reservation for a guest."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Guest Name*</Label>
            <Input
              value={reservationForm.guestName}
              onChange={(e) =>
                handleReservationFormChange("guestName", e.target.value)
              }
            />
            <Label>Email</Label>
            <Input
              type="email"
              value={reservationForm.email}
              onChange={(e) =>
                handleReservationFormChange("email", e.target.value)
              }
            />
            <Label>Phone Number*</Label>
            <Input
              value={reservationForm.phoneNumber}
              onChange={(e) =>
                handleReservationFormChange("phoneNumber", e.target.value)
              }
              placeholder="e.g. 555-123-4567"
            />
            <Label>Room Type*</Label>
            <Select
              value={reservationForm.roomType}
              onValueChange={(value) =>
                handleReservationFormChange("roomType", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select room type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Standard">Standard</SelectItem>
                <SelectItem value="Deluxe">Deluxe</SelectItem>
                <SelectItem value="Suite">Suite</SelectItem>
                <SelectItem value="Residential Suite">
                  Residential Suite
                </SelectItem>
              </SelectContent>
            </Select>
            {reservationForm.roomType === "Residential Suite" && (
              <>
                <Label>Rate Type*</Label>
                <Select
                  value={reservationForm.rateType}
                  onValueChange={(value) =>
                    handleReservationFormChange(
                      "rateType",
                      value as "nightly" | "weekly" | "monthly"
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rate type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="nightly">Nightly</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
            {reservationForm.roomType === "Residential Suite" &&
            reservationForm.rateType !== "nightly" ? (
              <>
                <Label>Start Date*</Label>
                <Input
                  type="date"
                  value={reservationForm.arrivalDate}
                  onChange={(e) =>
                    handleReservationFormChange("arrivalDate", e.target.value)
                  }
                />
                <Label>End Date*</Label>
                <Input
                  type="date"
                  value={reservationForm.departureDate}
                  disabled
                />
              </>
            ) : (
              <div className="flex gap-2">
                <div>
                  <Label>Arrival Date*</Label>
                  <Input
                    type="date"
                    value={reservationForm.arrivalDate}
                    onChange={(e) =>
                      handleReservationFormChange("arrivalDate", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label>Departure Date*</Label>
                  <Input
                    type="date"
                    value={reservationForm.departureDate}
                    onChange={(e) =>
                      handleReservationFormChange(
                        "departureDate",
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>
            )}
            <Label>Credit Card (optional, for guarantee)</Label>
            <Input
              value={reservationForm.creditCard}
              onChange={(e) =>
                handleReservationFormChange("creditCard", e.target.value)
              }
              placeholder="VISA 4111 1111 1111 1111"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleCreateReservation}>
              {walkInMode ? "Check In Walk-In" : "Create Reservation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Reservation Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Reservation</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Guest Name*</Label>
            <Input
              value={reservationForm.guestName}
              onChange={(e) =>
                handleReservationFormChange("guestName", e.target.value)
              }
            />
            <Label>Email</Label>
            <Input
              type="email"
              value={reservationForm.email}
              onChange={(e) =>
                handleReservationFormChange("email", e.target.value)
              }
            />
            <Label>Phone Number*</Label>
            <Input
              value={reservationForm.phoneNumber}
              onChange={(e) =>
                handleReservationFormChange("phoneNumber", e.target.value)
              }
              placeholder="e.g. 555-123-4567"
            />
            <Label>Room Type*</Label>
            <Select
              value={reservationForm.roomType}
              onValueChange={(value) =>
                handleReservationFormChange("roomType", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select room type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Standard">Standard</SelectItem>
                <SelectItem value="Deluxe">Deluxe</SelectItem>
                <SelectItem value="Suite">Suite</SelectItem>
                <SelectItem value="Residential Suite">
                  Residential Suite
                </SelectItem>
              </SelectContent>
            </Select>
            {reservationForm.roomType === "Residential Suite" && (
              <>
                <Label>Rate Type*</Label>
                <Select
                  value={reservationForm.rateType}
                  onValueChange={(value) =>
                    handleReservationFormChange(
                      "rateType",
                      value as "nightly" | "weekly" | "monthly"
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rate type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="nightly">Nightly</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
            {reservationForm.roomType === "Residential Suite" &&
            reservationForm.rateType !== "nightly" ? (
              <>
                <Label>Start Date*</Label>
                <Input
                  type="date"
                  value={reservationForm.arrivalDate}
                  onChange={(e) =>
                    handleReservationFormChange("arrivalDate", e.target.value)
                  }
                />
                <Label>End Date*</Label>
                <Input
                  type="date"
                  value={reservationForm.departureDate}
                  disabled
                />
              </>
            ) : (
              <div className="flex gap-2">
                <div>
                  <Label>Arrival Date*</Label>
                  <Input
                    type="date"
                    value={reservationForm.arrivalDate}
                    onChange={(e) =>
                      handleReservationFormChange("arrivalDate", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label>Departure Date*</Label>
                  <Input
                    type="date"
                    value={reservationForm.departureDate}
                    onChange={(e) =>
                      handleReservationFormChange(
                        "departureDate",
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>
            )}
            <Label>Credit Card (optional, for guarantee)</Label>
            <Input
              value={reservationForm.creditCard}
              onChange={(e) =>
                handleReservationFormChange("creditCard", e.target.value)
              }
              placeholder="VISA 4111 1111 1111 1111"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleSaveEditReservation}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Reservation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Reservation</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to cancel reservation{" "}
            <span className="font-bold">{cancelTarget?.id}</span> for{" "}
            {cancelTarget?.guestName}?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              No
            </Button>
            <Button variant="destructive" onClick={doCancelReservation}>
              Yes, Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* No-Show Dialog */}
      <Dialog open={showNoShowDialog} onOpenChange={setShowNoShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as No-Show</DialogTitle>
          </DialogHeader>
          <p>
            Mark reservation{" "}
            <span className="font-bold">{noShowTarget?.id}</span> for{" "}
            {noShowTarget?.guestName} as No-Show? A billing record will be
            created.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNoShowDialog(false)}
            >
              No
            </Button>
            <Button variant="destructive" onClick={doNoShow}>
              Yes, Mark No-Show
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Occupancy/Revenue Report Dialog */}
      <Dialog open={reportDialog} onOpenChange={setReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Occupancy & Revenue Report (Previous Night)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div>
              <span className="font-bold">Occupancy:</span> {todayOccupancy}{" "}
              rooms
            </div>
            <div>
              <span className="font-bold">Revenue:</span> ${todayRevenue}
            </div>
            {/* Add more analytics as needed */}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
