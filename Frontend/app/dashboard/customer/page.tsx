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
import { Search, Edit, Trash2, Calendar, User as UserIcon } from "lucide-react";
import NavBar from "@/components/nav-bar";
import { useUser } from "@/context/user-context";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

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
  };
  roomQuantity?: number;
}

const ROOM_TYPES = [
  { value: "standard", label: "Standard" },
  { value: "deluxe", label: "Deluxe" },
  { value: "suite", label: "Suite" },
  { value: "residential", label: "Residential" },
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

export default function CustomerDashboard() {
  const { user, loading, updateCustomerProfile } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editProfile, setEditProfile] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    country: "",
    nic: "",
    birthDay: "",
    address: "",
  });

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationsLoading, setReservationsLoading] = useState(false);

  // Edit Reservation Dialog States
  const [reservationEditOpen, setReservationEditOpen] = useState(false);
  const [reservationToEdit, setReservationToEdit] =
    useState<Reservation | null>(null);
  const [reservationEditForm, setReservationEditForm] = useState<
    Omit<Reservation, "id" | "status">
  >({
    roomType: "",
    arrivalDate: "",
    departureDate: "",
    guests: 1,
    totalAmount: 0,
  });
  const [reservationEditLoading, setReservationEditLoading] = useState(false);
  const [reservationDeleteOpen, setReservationDeleteOpen] = useState(false);
  const [reservationToDelete, setReservationToDelete] =
    useState<Reservation | null>(null);
  const [reservationDeleteLoading, setReservationDeleteLoading] =
    useState(false);

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

  // Redirect if not authenticated after loading
  useEffect(() => {
    if (!loading && (!user || user.role !== "customer")) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Load current profile into edit state when dialog is opened
  useEffect(() => {
    if (user?.customerProfile && editOpen) {
      setEditProfile({
        firstName: user.customerProfile.firstName || "",
        lastName: user.customerProfile.lastName || "",
        phone: user.customerProfile.phone || "",
        country: user.customerProfile.country || "",
        nic: user.customerProfile.nic || "",
        birthDay: user.customerProfile.birthDay
          ? user.customerProfile.birthDay.split("T")[0]
          : "",
        address: user.customerProfile.address || "",
      });
    }
  }, [user, editOpen]);

  // Load reservation into edit dialog when opened
  useEffect(() => {
    if (reservationToEdit && reservationEditOpen) {
      setReservationEditForm({
        roomType: reservationToEdit.roomType || "",
        arrivalDate: reservationToEdit.arrivalDate.split("T")[0],
        departureDate: reservationToEdit.departureDate.split("T")[0],
        guests: reservationToEdit.guests,
        totalAmount: reservationToEdit.totalAmount,
      });
    }
  }, [reservationToEdit, reservationEditOpen]);

  // Get customer name: try user.customerProfile.firstName, fallback to user.email
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
        .includes(searchTerm.toLowerCase())
  );

  const handleCancelReservation = async (reservationId: string) => {
    setReservations((prev) =>
      prev.map((res) =>
        res.id === reservationId
          ? { ...res, status: "cancelled" as const }
          : res
      )
    );
    toast({
      title: "Reservation Cancelled",
      description: `Reservation ${reservationId} has been cancelled.`,
    });
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditProfile((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Profile dialog save
  const handleProfileSave = async () => {
    if (!user?.customerProfile?.id) return;
    const success = await updateCustomerProfile(editProfile);
    if (success) {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      setEditOpen(false);
    } else {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "Could not update profile.",
      });
    }
  };

  // Reservation edit dialog field change - auto-update totalAmount
  const handleReservationEditChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLSelectElement>
      | string
  ) => {
    let name: string, value: string;
    if (typeof e === "string") {
      name = "roomType";
      value = e;
    } else {
      name = e.target.name;
      value = e.target.value;
    }
    setReservationEditForm((prev) => {
      const update = {
        ...prev,
        [name]:
          name === "guests" || name === "totalAmount" ? Number(value) : value,
      };
      // Only auto-calculate for roomType, arrivalDate, departureDate
      if (
        ["roomType", "arrivalDate", "departureDate"].includes(name) &&
        update.roomType &&
        update.arrivalDate &&
        update.departureDate
      ) {
        const nights = getNights(update.arrivalDate, update.departureDate);
        const price = ROOM_TYPE_PRICES[update.roomType] || 0;
        update.totalAmount = nights > 0 ? price * nights : 0;
      }
      return update;
    });
  };

  // Reservation edit dialog save
  const handleReservationEditSave = async () => {
    if (!reservationToEdit) return;
    setReservationEditLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/reservations/${reservationToEdit.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(reservationEditForm),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setReservations((prev) =>
          prev.map((r) =>
            r.id === reservationToEdit.id ? { ...r, ...reservationEditForm } : r
          )
        );
        toast({
          title: "Reservation updated",
          description: "Your reservation has been updated successfully.",
        });
        setReservationEditOpen(false);
        setReservationToEdit(null);
      } else {
        toast({
          variant: "destructive",
          title: "Update failed",
          description: data.error || "Could not update reservation.",
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Network error",
        description: err.message || "Could not update reservation.",
      });
    } finally {
      setReservationEditLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending":
      case "pending_payment":
      case "Pending_payment":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  if (loading)
    return <div className="text-center pt-32 text-2xl">Loading...</div>;
  if (!user) return null;

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <NavBar />

      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome back, {customerName}!
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Manage your reservations and bookings
              </p>
            </div>
            {/* Edit Profile Button */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => setEditOpen(true)}
                >
                  <UserIcon className="h-4 w-4" />
                  Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto py-10 px-8 rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl mb-2">
                    Edit Profile
                  </DialogTitle>
                  <DialogDescription className="mb-6">
                    Update your personal information below.
                  </DialogDescription>
                </DialogHeader>
                <form>
                  <div className="space-y-5">
                    <div>
                      <label
                        htmlFor="firstName"
                        className="block text-sm font-semibold mb-1"
                      >
                        First Name
                      </label>
                      <Input
                        id="firstName"
                        name="firstName"
                        placeholder="First Name"
                        value={editProfile.firstName}
                        onChange={handleProfileChange}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="lastName"
                        className="block text-sm font-semibold mb-1"
                      >
                        Last Name
                      </label>
                      <Input
                        id="lastName"
                        name="lastName"
                        placeholder="Last Name"
                        value={editProfile.lastName}
                        onChange={handleProfileChange}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-semibold mb-1"
                      >
                        Phone
                      </label>
                      <Input
                        id="phone"
                        name="phone"
                        placeholder="Phone"
                        value={editProfile.phone}
                        onChange={handleProfileChange}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="country"
                        className="block text-sm font-semibold mb-1"
                      >
                        Country
                      </label>
                      <Input
                        id="country"
                        name="country"
                        placeholder="Country"
                        value={editProfile.country}
                        onChange={handleProfileChange}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="nic"
                        className="block text-sm font-semibold mb-1"
                      >
                        NIC
                      </label>
                      <Input
                        id="nic"
                        name="nic"
                        placeholder="NIC"
                        value={editProfile.nic}
                        onChange={handleProfileChange}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="birthDay"
                        className="block text-sm font-semibold mb-1"
                      >
                        Birthday
                      </label>
                      <Input
                        id="birthDay"
                        name="birthDay"
                        type="date"
                        placeholder="Birthday"
                        value={editProfile.birthDay}
                        onChange={handleProfileChange}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="address"
                        className="block text-sm font-semibold mb-1"
                      >
                        Address
                      </label>
                      <Input
                        id="address"
                        name="address"
                        placeholder="Address"
                        value={editProfile.address}
                        onChange={handleProfileChange}
                      />
                    </div>
                  </div>
                  <DialogFooter className="mt-8">
                    <Button
                      variant="outline"
                      onClick={() => setEditOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="button" onClick={handleProfileSave}>
                      Save Changes
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Total Reservations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {reservations.length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Upcoming Stays</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {
                    reservations.filter(
                      (r) =>
                        r.status === "confirmed" &&
                        new Date(r.arrivalDate) > new Date()
                    ).length
                  }
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick Book</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => router.push("/reservation")}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  New Reservation
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Reservations Table */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>My Reservations</CardTitle>
                  <CardDescription>
                    View and manage your hotel bookings
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search reservations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reservation ID</TableHead>
                      <TableHead>Hotel</TableHead>
                      <TableHead>Room Type</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Check-out</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reservationsLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          Loading reservations...
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReservations.map((reservation) => (
                        <TableRow key={reservation.id}>
                          <TableCell className="font-medium">
                            {reservation.id}
                          </TableCell>
                          <TableCell>
                            {reservation.hotel?.name || (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>{reservation.roomType}</TableCell>
                          <TableCell>
                            {new Date(
                              reservation.arrivalDate
                            ).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {new Date(
                              reservation.departureDate
                            ).toLocaleDateString()}
                          </TableCell>

                          <TableCell>
                            <Badge
                              className={getStatusColor(reservation.status)}
                            >
                              {reservation.status.charAt(0).toUpperCase() +
                                reservation.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>${reservation.totalAmount}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {/* Edit Reservation Dialog */}
                              <Dialog
                                open={
                                  reservationEditOpen &&
                                  reservationToEdit?.id === reservation.id
                                }
                                onOpenChange={(open) => {
                                  setReservationEditOpen(open);
                                  if (!open) setReservationToEdit(null);
                                }}
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={
                                      reservation.status === "cancelled"
                                    }
                                    onClick={() => {
                                      setReservationToEdit(reservation);
                                      setReservationEditOpen(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit Reservation</DialogTitle>
                                    <DialogDescription>
                                      Update your reservation details below.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <form
                                    onSubmit={(e) => {
                                      e.preventDefault();
                                      handleReservationEditSave();
                                    }}
                                  >
                                    <div className="space-y-4">
                                      <div>
                                        <label className="block text-sm font-semibold mb-1">
                                          Room Type
                                        </label>
                                        <Select
                                          value={reservationEditForm.roomType}
                                          onValueChange={(value) =>
                                            handleReservationEditChange(value)
                                          }
                                        >
                                          <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select room type" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {ROOM_TYPES.map((rt) => (
                                              <SelectItem
                                                key={rt.value}
                                                value={rt.value}
                                              >
                                                {rt.label}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <label className="block text-sm font-semibold mb-1">
                                          Check-in Date
                                        </label>
                                        <Input
                                          type="date"
                                          name="arrivalDate"
                                          value={
                                            reservationEditForm.arrivalDate
                                          }
                                          onChange={handleReservationEditChange}
                                          required
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-semibold mb-1">
                                          Check-out Date
                                        </label>
                                        <Input
                                          type="date"
                                          name="departureDate"
                                          value={
                                            reservationEditForm.departureDate
                                          }
                                          onChange={handleReservationEditChange}
                                          required
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-semibold mb-1">
                                          Guests
                                        </label>
                                        <Input
                                          type="number"
                                          name="guests"
                                          min={1}
                                          max={10}
                                          value={reservationEditForm.guests}
                                          onChange={handleReservationEditChange}
                                          required
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-semibold mb-1">
                                          Total Amount ($)
                                        </label>
                                        <Input
                                          type="number"
                                          name="totalAmount"
                                          value={
                                            reservationEditForm.totalAmount
                                          }
                                          readOnly
                                          required
                                        />
                                      </div>
                                    </div>
                                    <DialogFooter className="mt-6">
                                      <Button
                                        variant="outline"
                                        type="button"
                                        onClick={() => {
                                          setReservationEditOpen(false);
                                          setReservationToEdit(null);
                                        }}
                                        disabled={reservationEditLoading}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        type="submit"
                                        disabled={reservationEditLoading}
                                      >
                                        Save Changes
                                      </Button>
                                    </DialogFooter>
                                  </form>
                                </DialogContent>
                              </Dialog>
                              {/* Cancel Reservation Dialog */}
                              {/* Delete Reservation Dialog */}
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
                                    variant="outline"
                                    size="sm"
                                    disabled={
                                      reservation.status === "cancelled"
                                    }
                                    onClick={() => {
                                      setReservationToDelete(reservation);
                                      setReservationDeleteOpen(true);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>
                                      Delete Reservation
                                    </DialogTitle>
                                    <DialogDescription>
                                      Are you sure you want to{" "}
                                      <span className="font-bold text-red-500">
                                        permanently delete
                                      </span>{" "}
                                      reservation <b>{reservation.id}</b>? This
                                      action cannot be undone.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <Button
                                      variant="outline"
                                      type="button"
                                      onClick={() => {
                                        setReservationDeleteOpen(false);
                                        setReservationToDelete(null);
                                      }}
                                      disabled={reservationDeleteLoading}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      type="button"
                                      disabled={reservationDeleteLoading}
                                      onClick={handleDeleteReservation}
                                    >
                                      {reservationDeleteLoading
                                        ? "Deleting..."
                                        : "Delete Reservation"}
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
              {!reservationsLoading && filteredReservations.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No reservations found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {searchTerm
                      ? "Try adjusting your search terms."
                      : "You haven't made any reservations yet."}
                  </p>
                  {!searchTerm && (
                    <Button
                      onClick={() => router.push("/reservation")}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Make Your First Reservation
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
