"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import NavBar from "@/components/nav-bar";
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
import { CalendarIcon, Loader2, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
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

export default function EditBlockBookingPage() {
  const params = useParams();
  const id = params.id;
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState<boolean>(true);
  const [blockBooking, setBlockBooking] = useState<BlockBooking | null>(null);

  const [formData, setFormData] = useState({
    rooms: 3,
    roomType: "",
    arrivalDate: undefined as Date | undefined,
    departureDate: undefined as Date | undefined,
    discountRate: 10,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `http://localhost:5000/api/block-bookings/${id}`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error("Booking not found");
        const data = await res.json();
        setBlockBooking(data.blockBooking);
        setFormData({
          rooms: data.blockBooking.rooms,
          roomType: data.blockBooking.roomType,
          arrivalDate: new Date(data.blockBooking.arrivalDate),
          departureDate: new Date(data.blockBooking.departureDate),
          discountRate: data.blockBooking.discountRate,
        });
      } catch (e) {
        toast({
          title: "Error",
          description: "Failed to load block booking.",
          variant: "destructive",
        });
        router.push("/dashboard/company/block-bookings");
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id, router, toast]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      const url = `http://localhost:5000/api/block-bookings/${id}`;
      const response = await fetch(url, {
        method: "PUT",
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
      if (!response.ok) throw new Error("Failed to update block booking");
      toast({
        title: "Block Booking Updated!",
        description: `Successfully updated block booking.`,
      });
      router.push("/dashboard/company/block-bookings");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update block booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <NavBar />
        <div className="max-w-2xl mx-auto py-12 px-4">
          <h1 className="text-2xl">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div>
      <NavBar />
      <div className="max-w-2xl mx-auto py-12 px-4">
        <h1 className="text-2xl font-bold mb-4">Edit Block Booking</h1>
        <Card>
          <CardHeader>
            <CardTitle className="text-purple-700 dark:text-purple-300">
              Edit Block Booking
            </CardTitle>
            <CardDescription>
              Update your block booking details below.
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
                    onValueChange={(value) => updateFormData("roomType", value)}
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
                      <SelectItem value="suite">Suite - $280/night</SelectItem>
                      <SelectItem value="residential">
                        Residential Suite - $450/night
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.roomType && (
                    <p className="text-sm text-red-500">{errors.roomType}</p>
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
                        onSelect={(date) => updateFormData("arrivalDate", date)}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.arrivalDate && (
                    <p className="text-sm text-red-500">{errors.arrivalDate}</p>
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
                          !formData.departureDate && "text-muted-foreground",
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
                  <p className="text-sm text-red-500">{errors.discountRate}</p>
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
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating Block Booking...
                    </>
                  ) : (
                    "Update Block Booking"
                  )}
                </Button>
                <Button
                  type="button"
                  className="w-1/4 bg-gray-200 dark:bg-gray-700 dark:text-white"
                  onClick={() =>
                    router.push("/dashboard/company/block-bookings")
                  }
                  variant="outline"
                >
                  <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
