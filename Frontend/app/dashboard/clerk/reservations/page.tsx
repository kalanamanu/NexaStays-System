"use client";
import { useEffect, useState } from "react";
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
} from "@/components/ui/dialog";
import { Edit, Trash2, Search, AlertCircle, Key } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import NavBar from "@/components/nav-bar";
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
  arrivalDate: string; // ISO
  departureDate: string; // ISO
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
    guestName: "",
    email: "",
    phoneNumber: "",
    hotelId: "",
    roomType: "",
    roomNumber: "",
    guests: 1,
    arrivalDate: "",
    departureDate: "",
    rateType: "nightly" as "nightly" | "weekly" | "monthly",
  });
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);

  const [detailReservation, setDetailReservation] =
    useState<Reservation | null>(null);

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
          })
        );

        setReservations(flatReservations);
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
        .includes(searchTerm.toLowerCase());
    const matchesHotel =
      !selectedHotel || selectedHotel === "all-hotels"
        ? true
        : String(reservation.hotelId) === String(selectedHotel);
    return matchesSearch && matchesHotel;
  });

  // Status coloring
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
      case "reserved":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  // Edit reservation dialog
  function handleEditReservation(res: Reservation) {
    setEditingReservation(res);
    setReservationForm({
      guestName: res.guestName || "",
      email: res.email || "",
      phoneNumber: res.phoneNumber || "",
      hotelId: String(res.hotelId || ""),
      roomType: res.roomType || "",
      roomNumber: res.roomNumber || "",
      guests: res.guests || 1,
      arrivalDate: res.arrivalDate || "",
      departureDate: res.departureDate || "",
      rateType: res.rateType || "nightly",
    });
    setShowEditDialog(true);
  }

  async function handleSaveEditReservation() {
    if (!editingReservation) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/reservations/${editingReservation.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(reservationForm),
        }
      );
      if (!response.ok) throw new Error("Failed to update reservation");
      setReservations((prev) =>
        prev.map((r) =>
          r.id === editingReservation.id ? { ...r, ...reservationForm } : r
        )
      );
      setShowEditDialog(false);
      toast({
        title: "Reservation Updated",
        description: "Reservation details saved.",
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
        `http://localhost:5000/api/reservations/${cancelTarget.id}`,
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
        description: "Reservation has been cancelled.",
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
    if (!confirm("Are you sure you want to delete this reservation?")) return;
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
        description: "Reservation has been deleted.",
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

  function handleReservationFormChange(field: string, value: string) {
    setReservationForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <NavBar />
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Reservations
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Search, filter, view, edit, cancel, or delete reservations.
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Select
                value={String(selectedHotel)}
                onValueChange={setSelectedHotel}
              >
                <SelectTrigger className="min-w-[180px]">
                  <SelectValue placeholder="Filter by Hotel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-hotels" key="all-hotels">
                    All Hotels
                  </SelectItem>
                  {hotels.map((h) => (
                    <SelectItem key={h.id} value={String(h.id)}>
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by guest or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>All Reservations</CardTitle>
              <CardDescription>Manage all hotel reservations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Room / Hotel</TableHead>
                      <TableHead>Guest</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Check-out</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingReservations ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : reservationError ? (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="text-center text-red-500"
                        >
                          {reservationError}
                        </TableCell>
                      </TableRow>
                    ) : filteredReservations.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="text-center text-gray-400"
                        >
                          No reservations found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReservations.map((reservation) => (
                        <TableRow key={reservation.id}>
                          <TableCell className="font-medium">
                            {reservation.id}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-semibold">
                                {reservation.roomNumber
                                  ? `Room ${reservation.roomNumber}`
                                  : reservation.roomType}
                              </div>
                              <div className="text-xs text-gray-500">
                                {reservation.hotelName || reservation.hotelId}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {reservation.guestName || "-"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {reservation.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {reservation.phoneNumber || reservation.guestPhone}
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
                              !reservation.rateType && (
                                <span
                                  title="Will auto-cancel at 7 PM"
                                  className="ml-2 text-xs text-yellow-600 flex items-center gap-1"
                                ></span>
                              )}
                            {reservation.status === "no-show" && (
                              <span className="ml-2 text-xs text-red-600 flex items-center gap-1">
                                <Key className="inline h-3 w-3" /> No-Show
                              </span>
                            )}
                          </TableCell>
                          <TableCell>LKR {reservation.totalAmount}</TableCell>
                          <TableCell className="space-x-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleViewReservationDetail(reservation)
                              }
                            >
                              View
                            </Button>

                            {(reservation.status === "confirmed" ||
                              reservation.status === "pending" ||
                              reservation.status === "reserved") && (
                              <>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() =>
                                    handleCancelReservation(reservation)
                                  }
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleDeleteReservation(reservation)
                                  }
                                >
                                  Delete
                                </Button>
                              </>
                            )}
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

      {/* Reservation Details Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reservation Details</DialogTitle>
          </DialogHeader>
          {detailReservation ? (
            <div className="space-y-2">
              <div>
                <span className="font-bold">Reservation ID:</span>{" "}
                {detailReservation.id}
              </div>
              <div>
                <span className="font-bold">Hotel:</span>{" "}
                {detailReservation.hotelName || detailReservation.hotelId}
              </div>
              <div>
                <span className="font-bold">Guest:</span>{" "}
                {detailReservation.guestName}
              </div>
              <div>
                <span className="font-bold">Email:</span>{" "}
                {detailReservation.email}
              </div>
              <div>
                <span className="font-bold">Phone:</span>{" "}
                {detailReservation.phoneNumber || detailReservation.guestPhone}
              </div>
              <div>
                <span className="font-bold">Room:</span>{" "}
                {detailReservation.roomNumber
                  ? `${detailReservation.roomNumber} (${detailReservation.roomType})`
                  : detailReservation.roomType}
              </div>
              <div>
                <span className="font-bold">Guests:</span>{" "}
                {detailReservation.guests}
              </div>
              <div>
                <span className="font-bold">Check-in:</span>{" "}
                {detailReservation.arrivalDate}
              </div>
              <div>
                <span className="font-bold">Check-out:</span>{" "}
                {detailReservation.departureDate}
              </div>
              <div>
                <span className="font-bold">Status:</span>{" "}
                <Badge className={getStatusColor(detailReservation.status)}>
                  {detailReservation.status.charAt(0).toUpperCase() +
                    detailReservation.status.slice(1)}
                </Badge>
              </div>
              <div>
                <span className="font-bold">Total:</span> LKR{" "}
                {detailReservation.totalAmount}
              </div>
              <div>
                <span className="font-bold">Created At:</span>{" "}
                {new Date(detailReservation.createdAt).toLocaleString()}
              </div>
              <div>
                <span className="font-bold">Updated At:</span>{" "}
                {new Date(detailReservation.updatedAt).toLocaleString()}
              </div>
            </div>
          ) : (
            <div>Loading...</div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDetailDialog(false)}
            >
              Close
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
            <Input
              value={reservationForm.roomType}
              onChange={(e) =>
                handleReservationFormChange("roomType", e.target.value)
              }
              placeholder="e.g. Deluxe"
            />
            <Label>Room Number</Label>
            <Input
              value={reservationForm.roomNumber}
              onChange={(e) =>
                handleReservationFormChange("roomNumber", e.target.value)
              }
              placeholder="e.g. 102"
            />
            <Label>Guests</Label>
            <Input
              type="number"
              min={1}
              value={reservationForm.guests}
              onChange={(e) =>
                handleReservationFormChange("guests", e.target.value)
              }
            />
            <Label>Arrival Date*</Label>
            <Input
              type="date"
              value={reservationForm.arrivalDate}
              onChange={(e) =>
                handleReservationFormChange("arrivalDate", e.target.value)
              }
            />
            <Label>Departure Date*</Label>
            <Input
              type="date"
              value={reservationForm.departureDate}
              onChange={(e) =>
                handleReservationFormChange("departureDate", e.target.value)
              }
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
    </div>
  );
}
