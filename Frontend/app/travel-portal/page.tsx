"use client";

import type React from "react";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CalendarIcon,
  Loader2,
  Building2,
  Edit2,
  Trash2,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import NavBar from "@/components/nav-bar";
import { useUser } from "@/context/user-context";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface BlockBooking {
  id: number | string;
  rooms: number;
  roomType: string;
  arrivalDate: string;
  departureDate: string;
  discountRate: number;
  status: "pending" | "confirmed" | "cancelled";
  totalAmount: number;
}

export default function TravelCompanyPortal() {
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    rooms: 3,
    roomType: "",
    arrivalDate: undefined as Date | undefined,
    departureDate: undefined as Date | undefined,
    discountRate: 10,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [blockBookings, setBlockBookings] = useState<BlockBooking[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);

  // Edit state
  const [editingBookingId, setEditingBookingId] = useState<
    number | string | null
  >(null);

  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<BlockBooking | null>(
    null
  );

  useEffect(() => {
    if (!user || user.role !== "travel-company") {
      router.push("/login");
      return;
    }

    // Fetch block bookings from backend
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
        setBlockBookings(data.blockBookings || []);
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
  }, [user, router, toast]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.rooms < 3)
      newErrors.rooms = "Minimum 3 rooms required for block booking";
    if (!formData.roomType) newErrors.roomType = "Room type is required";
    if (!formData.arrivalDate)
      newErrors.arrivalDate = "Arrival date is required";
    if (!formData.departureDate)
      newErrors.departureDate = "Departure date is required";
    if (formData.discountRate < 0 || formData.discountRate > 50) {
      newErrors.discountRate = "Discount rate must be between 0% and 50%";
    }

    if (
      formData.arrivalDate &&
      formData.departureDate &&
      formData.arrivalDate >= formData.departureDate
    ) {
      newErrors.departureDate = "Departure date must be after arrival date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Unified Create/Update handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const url = editingBookingId
        ? `http://localhost:5000/api/block-bookings/${editingBookingId}`
        : "http://localhost:5000/api/block-bookings";
      const method = editingBookingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rooms: formData.rooms,
          roomType: formData.roomType,
          arrivalDate: formData.arrivalDate?.toISOString(),
          departureDate: formData.departureDate?.toISOString(),
          discountRate: formData.discountRate,
          totalAmount: calculateTotal(),
        }),
      });

      if (!response.ok)
        throw new Error(
          editingBookingId
            ? "Failed to update block booking."
            : "Failed to create block booking."
        );
      const data = await response.json();

      if (editingBookingId) {
        setBlockBookings((prev) =>
          prev.map((b) => (b.id === editingBookingId ? data.blockBooking : b))
        );
        toast({
          title: "Block Booking Updated!",
          description: `Successfully updated block booking.`,
        });
      } else {
        setBlockBookings((prev) => [data.blockBooking, ...prev]);
        toast({
          title: "Block Booking Created!",
          description: `Successfully created block booking for ${formData.rooms} rooms.`,
        });
      }

      // Reset form and editing state
      setFormData({
        rooms: 3,
        roomType: "",
        arrivalDate: undefined,
        departureDate: undefined,
        discountRate: 10,
      });
      setEditingBookingId(null);
    } catch (error) {
      toast({
        title: "Error",
        description: editingBookingId
          ? "Failed to update block booking. Please try again."
          : "Failed to create block booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fill form for editing
  const handleEdit = (booking: BlockBooking) => {
    setFormData({
      rooms: booking.rooms,
      roomType: booking.roomType,
      arrivalDate: new Date(booking.arrivalDate),
      departureDate: new Date(booking.departureDate),
      discountRate: booking.discountRate,
    });
    setEditingBookingId(booking.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setFormData({
      rooms: 3,
      roomType: "",
      arrivalDate: undefined,
      departureDate: undefined,
      discountRate: 10,
    });
    setEditingBookingId(null);
    setErrors({});
  };

  // Show dialog for delete
  const handleDeleteClick = (booking: BlockBooking) => {
    setBookingToDelete(booking);
    setShowDeleteDialog(true);
  };

  // Actual delete action, called when confirmed
  const handleConfirmDelete = async () => {
    if (!bookingToDelete) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/block-bookings/${bookingToDelete.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to delete block booking.");
      setBlockBookings((prev) =>
        prev.filter((b) => b.id !== bookingToDelete.id)
      );
      toast({
        title: "Block Booking Deleted!",
        description: "Block booking was deleted successfully.",
      });
      if (editingBookingId === bookingToDelete.id) handleCancelEdit();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete block booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setBookingToDelete(null);
    }
  };

  const calculateTotal = () => {
    if (!formData.arrivalDate || !formData.departureDate || !formData.roomType)
      return 0;

    const nights = Math.ceil(
      (formData.departureDate.getTime() - formData.arrivalDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const roomRates = {
      standard: 120,
      deluxe: 180,
      suite: 280,
      residential: 450,
    };

    const baseRate =
      roomRates[formData.roomType as keyof typeof roomRates] || 0;
    const totalBeforeDiscount = baseRate * nights * formData.rooms;
    const discountAmount = totalBeforeDiscount * (formData.discountRate / 100);

    return totalBeforeDiscount - discountAmount;
  };

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-800">
      <NavBar />

      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Building2 className="h-8 w-8 text-purple-600" />
              Travel Company Portal
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Manage block bookings and group reservations
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Block Booking Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-purple-700 dark:text-purple-300">
                  {editingBookingId
                    ? "Edit Block Booking"
                    : "Create Block Booking"}
                </CardTitle>
                <CardDescription>
                  Book multiple rooms with special rates (minimum 3 rooms)
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rooms">Number of Rooms *</Label>
                      <Input
                        id="rooms"
                        type="number"
                        min="3"
                        value={formData.rooms}
                        onChange={(e) =>
                          updateFormData(
                            "rooms",
                            Number.parseInt(e.target.value) || 3
                          )
                        }
                        className={cn(errors.rooms && "border-red-500")}
                      />
                      {errors.rooms && (
                        <p className="text-sm text-red-500">{errors.rooms}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="roomType">Room Type *</Label>
                      <Select
                        value={formData.roomType}
                        onValueChange={(value) =>
                          updateFormData("roomType", value)
                        }
                      >
                        <SelectTrigger
                          className={cn(errors.roomType && "border-red-500")}
                        >
                          <SelectValue placeholder="Select room type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">
                            Standard - $120/night
                          </SelectItem>
                          <SelectItem value="deluxe">
                            Deluxe - $180/night
                          </SelectItem>
                          <SelectItem value="suite">
                            Suite - $280/night
                          </SelectItem>
                          <SelectItem value="residential">
                            Residential Suite - $450/night
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.roomType && (
                        <p className="text-sm text-red-500">
                          {errors.roomType}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Arrival Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.arrivalDate && "text-muted-foreground",
                              errors.arrivalDate && "border-red-500"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.arrivalDate
                              ? format(formData.arrivalDate, "PPP")
                              : "Pick arrival date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.arrivalDate}
                            onSelect={(date) =>
                              updateFormData("arrivalDate", date)
                            }
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {errors.arrivalDate && (
                        <p className="text-sm text-red-500">
                          {errors.arrivalDate}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Departure Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.departureDate &&
                                "text-muted-foreground",
                              errors.departureDate && "border-red-500"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.departureDate
                              ? format(formData.departureDate, "PPP")
                              : "Pick departure date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.departureDate}
                            onSelect={(date) =>
                              updateFormData("departureDate", date)
                            }
                            disabled={(date) =>
                              date < new Date() ||
                              (formData.arrivalDate
                                ? date <= formData.arrivalDate
                                : false)
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {errors.departureDate && (
                        <p className="text-sm text-red-500">
                          {errors.departureDate}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discountRate">Discount Rate (%)</Label>
                    <Input
                      id="discountRate"
                      type="number"
                      min="0"
                      max="50"
                      value={formData.discountRate}
                      onChange={(e) =>
                        updateFormData(
                          "discountRate",
                          Number.parseInt(e.target.value) || 0
                        )
                      }
                      className={cn(errors.discountRate && "border-red-500")}
                    />
                    {errors.discountRate && (
                      <p className="text-sm text-red-500">
                        {errors.discountRate}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      Negotiated discount rate for bulk booking
                    </p>
                  </div>

                  {formData.arrivalDate &&
                    formData.departureDate &&
                    formData.roomType && (
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <h4 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">
                          Booking Summary
                        </h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Rooms:</span>
                            <span>{formData.rooms}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Nights:</span>
                            <span>
                              {Math.ceil(
                                (formData.departureDate.getTime() -
                                  formData.arrivalDate.getTime()) /
                                  (1000 * 60 * 60 * 24)
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Discount:</span>
                            <span>{formData.discountRate}%</span>
                          </div>
                          <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                            <span>Total:</span>
                            <span>${calculateTotal().toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )}

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {editingBookingId
                            ? "Updating..."
                            : "Creating Block Booking..."}
                        </>
                      ) : editingBookingId ? (
                        "Update Block Booking"
                      ) : (
                        "Create Block Booking"
                      )}
                    </Button>
                    {editingBookingId && (
                      <Button
                        type="button"
                        className="w-1/4 bg-gray-200 dark:bg-gray-700 dark:text-white"
                        onClick={handleCancelEdit}
                        variant="outline"
                      >
                        <X className="mr-2 h-4 w-4" /> Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Block Bookings List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-purple-700 dark:text-purple-300">
                  My Block Bookings
                </CardTitle>
                <CardDescription>
                  View and manage your group reservations
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {fetchLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="animate-spin h-6 w-6 text-purple-600" />
                    </div>
                  ) : blockBookings.length === 0 ? (
                    <div className="text-center py-8">
                      <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No block bookings yet
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        Create your first block booking to get started.
                      </p>
                    </div>
                  ) : (
                    blockBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className={cn(
                          "p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 relative",
                          editingBookingId === booking.id &&
                            "ring-2 ring-purple-400"
                        )}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold">{`BLK${String(
                              booking.id
                            ).padStart(3, "0")}`}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {booking.rooms} {booking.roomType} rooms
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Edit"
                              onClick={() => handleEdit(booking)}
                            >
                              <Edit2 className="w-4 h-4 text-purple-600" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Delete"
                              onClick={() => handleDeleteClick(booking)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status.charAt(0).toUpperCase() +
                                booking.status.slice(1)}
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Check-in:</span>
                            <div>
                              {new Date(
                                booking.arrivalDate
                              ).toLocaleDateString()}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Check-out:</span>
                            <div>
                              {new Date(
                                booking.departureDate
                              ).toLocaleDateString()}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Discount:</span>
                            <div>{booking.discountRate}%</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Total:</span>
                            <div className="font-semibold">
                              ${booking.totalAmount.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Block Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete block booking{" "}
              <span className="font-bold">
                {bookingToDelete
                  ? `BLK${String(bookingToDelete.id).padStart(3, "0")}`
                  : ""}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={handleConfirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
