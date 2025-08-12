"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import NavBar from "@/components/nav-bar";
import { useToast } from "@/hooks/use-toast";
import dynamic from "next/dynamic";

// Dynamically import Stripe form (avoids SSR issues)
const ReservationPaymentForm = dynamic(
  () => import("@/components/ReservationPaymentForm"),
  { ssr: false }
);

export default function ReservationPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    roomType: "",
    occupants: 1,
    arrivalDate: undefined as Date | undefined,
    departureDate: undefined as Date | undefined,
    skipCreditCard: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [reservationId, setReservationId] = useState<number | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.roomType) newErrors.roomType = "Room type is required";
    if (!formData.arrivalDate)
      newErrors.arrivalDate = "Arrival date is required";
    if (!formData.departureDate)
      newErrors.departureDate = "Departure date is required";
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

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const totalAmount =
        formData.roomType === "standard"
          ? 120
          : formData.roomType === "deluxe"
          ? 180
          : formData.roomType === "suite"
          ? 280
          : formData.roomType === "residential"
          ? 450
          : 100;
      const nights =
        formData.arrivalDate && formData.departureDate
          ? Math.max(
              1,
              Math.ceil(
                (formData.departureDate.getTime() -
                  formData.arrivalDate.getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            )
          : 1;
      const reqBody = {
        roomType: formData.roomType,
        arrivalDate: formData.arrivalDate?.toISOString(), // ISO string
        departureDate: formData.departureDate?.toISOString(),
        guests: formData.occupants,
        totalAmount: totalAmount * nights,
        skipCreditCard: formData.skipCreditCard,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
      };
      const token = localStorage.getItem("token");

      // Use full backend URL if on separate server
      const res = await fetch("http://localhost:5000/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reqBody),
      });

      const data = await res.json();

      // Debug: Log the entire response
      console.log("Reservation API result:", data);

      if (!res.ok) throw new Error(data.error || "Failed to make reservation");

      setReservationId(data.reservation.id);

      if (formData.skipCreditCard) {
        toast({
          title: "Reservation Created!",
          description: "Your reservation has been submitted.",
        });
        router.push("/dashboard/customer");
      } else {
        // Debug: Log clientSecret
        console.log("clientSecret from backend:", data.clientSecret);

        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          setShowPayment(true);
        } else {
          // If clientSecret is missing, show error toast
          toast({
            title: "Error",
            description:
              "No clientSecret received from backend. Stripe payment cannot proceed.",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create reservation.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    toast({
      title: "Payment Successful!",
      description: "Your reservation is confirmed.",
    });
    setShowPayment(false);
    router.push("/dashboard/customer");
  };

  // Debug: Log clientSecret each render
  if (typeof window !== "undefined") {
    console.log("Current clientSecret state:", clientSecret);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <NavBar />
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                Make a Reservation
              </CardTitle>
              <CardDescription className="text-center">
                Fill out the form below to book your stay
              </CardDescription>
            </CardHeader>
            <CardContent>
              {showPayment && clientSecret && (
                <ReservationPaymentForm
                  clientSecret={clientSecret}
                  onSuccess={handlePaymentSuccess}
                />
              )}
              {!showPayment && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Personal Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input
                          id="fullName"
                          value={formData.fullName}
                          onChange={(e) =>
                            updateFormData("fullName", e.target.value)
                          }
                          className={cn(errors.fullName && "border-red-500")}
                        />
                        {errors.fullName && (
                          <p className="text-sm text-red-500">
                            {errors.fullName}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            updateFormData("email", e.target.value)
                          }
                          className={cn(errors.email && "border-red-500")}
                        />
                        {errors.email && (
                          <p className="text-sm text-red-500">{errors.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) =>
                          updateFormData("phone", e.target.value)
                        }
                        className={cn(errors.phone && "border-red-500")}
                      />
                      {errors.phone && (
                        <p className="text-sm text-red-500">{errors.phone}</p>
                      )}
                    </div>
                  </div>
                  {/* Room Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Room Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <div className="space-y-2">
                        <Label htmlFor="occupants">Number of Occupants</Label>
                        <Select
                          value={formData.occupants.toString()}
                          onValueChange={(value) =>
                            updateFormData("occupants", Number.parseInt(value))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 Guest</SelectItem>
                            <SelectItem value="2">2 Guests</SelectItem>
                            <SelectItem value="3">3 Guests</SelectItem>
                            <SelectItem value="4">4 Guests</SelectItem>
                          </SelectContent>
                        </Select>
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
                                !formData.arrivalDate &&
                                  "text-muted-foreground",
                                errors.arrivalDate && "border-red-500"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.arrivalDate
                                ? format(formData.arrivalDate, "PPP")
                                : "Pick a date"}
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
                                : "Pick a date"}
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
                  </div>
                  {/* Payment Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Payment Details</h3>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="skipCreditCard"
                        checked={formData.skipCreditCard}
                        onCheckedChange={(checked) =>
                          updateFormData("skipCreditCard", checked)
                        }
                      />
                      <Label htmlFor="skipCreditCard">
                        Skip credit card (pay at hotel)
                      </Label>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Reservation...
                      </>
                    ) : (
                      "Create Reservation"
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
