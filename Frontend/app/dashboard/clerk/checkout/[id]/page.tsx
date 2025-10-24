"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import NavBar from "@/components/nav-bar";
import ClerkSidebar from "@/components/ui/ClerkSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

// For PDF generation
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { UserOptions } from "jspdf-autotable";

// Extend jsPDF type to include autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

interface Reservation {
  id: number | string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  hotelName?: string;
  roomType: string;
  roomNumber?: string;
  roomId?: number | string;
  arrivalDate: string;
  departureDate: string;
  status: string;
  guests: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  room?: {
    pricePerNight: number;
  };
}

interface BillingRecord {
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

export default function ClerkCheckoutDetailPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [bill, setBill] = useState<BillingRecord>({
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
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [processing, setProcessing] = useState(false);
  const [receiptMode, setReceiptMode] = useState<"preview" | "final">(
    "preview"
  );

  // Late checkout calculation
  let daysLate = 0;
  let nightly = reservation?.room?.pricePerNight || 0;
  let lateCheckoutDisplay = "";

  if (reservation) {
    const today = new Date();
    const scheduledDeparture = new Date(reservation.departureDate);
    // Remove time for both dates for accurate day calculation
    const todayDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const scheduledDate = new Date(
      scheduledDeparture.getFullYear(),
      scheduledDeparture.getMonth(),
      scheduledDeparture.getDate()
    );
    if (todayDate > scheduledDate) {
      daysLate = Math.ceil(
        (todayDate.getTime() - scheduledDate.getTime()) / (1000 * 60 * 60 * 24)
      );
    }
    lateCheckoutDisplay =
      daysLate > 0 && nightly > 0
        ? `(${daysLate} day${daysLate > 1 ? "s" : ""} x LKR ${nightly})`
        : "";
  }

  // Fetch reservation details
  useEffect(() => {
    async function fetchReservation() {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        // If roomId is passed as query param, add it to the fetch for extra data if needed
        const roomIdParam = searchParams.get("roomId");
        const res = await fetch(
          `http://localhost:5000/api/reservations/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        if (data.reservation) {
          let reservationData = data.reservation;
          // If roomId is in searchParams, patch it onto the reservation object (for consistency)
          if (roomIdParam) reservationData.roomId = roomIdParam;
          setReservation(reservationData);
          setBill((prev) => ({
            ...prev,
            roomCharges: reservationData.totalAmount,
          }));
        }
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to load reservation.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchReservation();
    // eslint-disable-next-line
  }, [id]);

  // Calculate late checkout in bill state if late
  useEffect(() => {
    if (!reservation) return;

    const today = new Date();
    const scheduledDeparture = new Date(reservation.departureDate);
    const todayDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const scheduledDate = new Date(
      scheduledDeparture.getFullYear(),
      scheduledDeparture.getMonth(),
      scheduledDeparture.getDate()
    );

    let daysLate = 0;
    if (todayDate > scheduledDate) {
      daysLate = Math.ceil(
        (todayDate.getTime() - scheduledDate.getTime()) / (1000 * 60 * 60 * 24)
      );
    }
    const nightly = reservation.room?.pricePerNight || 0;
    setBill((prev) => ({
      ...prev,
      lateCheckout: daysLate * nightly,
    }));
    // eslint-disable-next-line
  }, [reservation]);

  // Calculate bill total
  useEffect(() => {
    setBill((prev) => ({
      ...prev,
      total:
        prev.roomCharges +
        prev.restaurant +
        prev.roomService +
        prev.laundry +
        prev.telephone +
        prev.club +
        prev.other +
        prev.lateCheckout,
    }));
  }, [
    bill.roomCharges,
    bill.restaurant,
    bill.roomService,
    bill.laundry,
    bill.telephone,
    bill.club,
    bill.other,
    bill.lateCheckout,
  ]);

  const handleBillChange = (field: keyof BillingRecord, value: number) => {
    setBill((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCheckOut = async () => {
    setProcessing(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        "http://localhost:5000/api/reservations/checkout",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reservationId: reservation?.id,
            roomId: reservation?.roomId,
            paymentMethod,
            bill,
          }),
        }
      );
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Checkout failed.");
      }
      setReceiptMode("final");
      setShowReceiptDialog(true);
      toast({
        title: "Check-out Successful",
        description: "Guest has been checked out and receipt generated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Could not check out reservation",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  // Print/Download helpers
  const handlePrint = () => {
    window.print();
  };

  // Download PDF using jsPDF
  const handleDownloadPDF = () => {
    if (!reservation) return;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Nexa Stays - Guest Receipt", 14, 20);
    doc.setFontSize(12);

    let y = 30;
    doc.text(`Guest: ${reservation.guestName}`, 14, y);
    y += 8;
    doc.text(
      `Room: ${reservation.roomNumber} (${reservation.roomType})`,
      14,
      y
    );
    y += 8;
    doc.text(
      `Dates: ${
        reservation.arrivalDate
          ? new Date(reservation.arrivalDate).toLocaleDateString()
          : "-"
      } to ${
        reservation.departureDate
          ? new Date(reservation.departureDate).toLocaleDateString()
          : "-"
      }`,
      14,
      y
    );
    y += 10;
    autoTable(doc, {
      startY: y,
      head: [["Item", "Amount"]],
      body: [
        ["Room Charges", `LKR ${bill.roomCharges}`],
        ["Restaurant", `LKR ${bill.restaurant}`],
        ["Room Service", `LKR ${bill.roomService}`],
        ["Laundry", `LKR ${bill.laundry}`],
        ["Telephone", `LKR ${bill.telephone}`],
        ["Club", `LKR ${bill.club}`],
        ["Other", `LKR ${bill.other}`],
        [
          `Late Checkout${
            lateCheckoutDisplay ? " " + lateCheckoutDisplay : ""
          }`,
          `LKR ${bill.lateCheckout}`,
        ],
        ["Total", `LKR ${bill.total}`],
      ],
      styles: { fontSize: 11 },
      headStyles: { fillColor: [44, 62, 80] },
      margin: { left: 14, right: 14 },
    });

    doc.save(
      `Receipt_${reservation.guestName.replace(/\s+/g, "_")}_${
        reservation.id
      }.pdf`
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <NavBar />
        <ClerkSidebar />
        <main className="ml-60 pt-16 min-h-screen overflow-y-auto">
          <div className="p-8">Loading reservation...</div>
        </main>
      </div>
    );
  }
  if (!reservation) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <NavBar />
        <ClerkSidebar />
        <main className="ml-60 pt-16 min-h-screen overflow-y-auto">
          <div className="p-8">Reservation not found.</div>
        </main>
      </div>
    );
  }

  const isCheckedIn = reservation.status === "checked-in";
  const isCheckedOut = reservation.status === "checked-out";

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <NavBar />
      <ClerkSidebar />
      <main className="ml-60 pt-16 min-h-screen overflow-y-auto">
        <div className="max-w-3xl mx-auto py-8 px-4">
          <Card>
            <CardHeader>
              <CardTitle>Reservation Check-Out</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6 space-y-2">
                <div>
                  <span className="font-bold">Reservation ID:</span>{" "}
                  {reservation.id}
                </div>
                <div>
                  <span className="font-bold">Guest:</span>{" "}
                  {reservation.guestName}
                </div>
                <div>
                  <span className="font-bold">Email:</span>{" "}
                  {reservation.guestEmail}
                </div>
                <div>
                  <span className="font-bold">Phone:</span>{" "}
                  {reservation.guestPhone}
                </div>
                <div>
                  <span className="font-bold">Hotel:</span>{" "}
                  {reservation.hotelName}
                </div>
                <div>
                  <span className="font-bold">Room Type:</span>{" "}
                  {reservation.roomType}
                </div>
                <div>
                  <span className="font-bold">Room Number:</span>{" "}
                  {reservation.roomNumber}
                </div>
                <div>
                  <span className="font-bold">Dates:</span>{" "}
                  {reservation.arrivalDate
                    ? new Date(reservation.arrivalDate).toLocaleDateString()
                    : "-"}
                  {" to "}
                  {reservation.departureDate
                    ? new Date(reservation.departureDate).toLocaleDateString()
                    : "-"}
                </div>
                <div>
                  <span className="font-bold">Guests:</span>{" "}
                  {reservation.guests}
                </div>
                <div>
                  <span className="font-bold">Status:</span>{" "}
                  <Badge>
                    {reservation.status.charAt(0).toUpperCase() +
                      reservation.status.slice(1)}
                  </Badge>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Bill section */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Check-Out Bill</h3>
                {daysLate > 0 && (
                  <div className="text-xs text-yellow-700 flex justify-end mb-2">
                    <span>
                      <b>Note:</b> Guest is checking out {daysLate} day
                      {daysLate > 1 ? "s" : ""} late. Extra charge: LKR{" "}
                      {daysLate * nightly}
                    </span>
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Room Charges</Label>
                    <Input
                      type="number"
                      disabled
                      value={bill.roomCharges}
                      className="w-32"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <Label>Restaurant</Label>
                    <Input
                      type="number"
                      min={0}
                      value={bill.restaurant}
                      onChange={(e) =>
                        handleBillChange("restaurant", Number(e.target.value))
                      }
                      className="w-32"
                      disabled={isCheckedOut}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <Label>Room Service</Label>
                    <Input
                      type="number"
                      min={0}
                      value={bill.roomService}
                      onChange={(e) =>
                        handleBillChange("roomService", Number(e.target.value))
                      }
                      className="w-32"
                      disabled={isCheckedOut}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <Label>Laundry</Label>
                    <Input
                      type="number"
                      min={0}
                      value={bill.laundry}
                      onChange={(e) =>
                        handleBillChange("laundry", Number(e.target.value))
                      }
                      className="w-32"
                      disabled={isCheckedOut}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <Label>Telephone</Label>
                    <Input
                      type="number"
                      min={0}
                      value={bill.telephone}
                      onChange={(e) =>
                        handleBillChange("telephone", Number(e.target.value))
                      }
                      className="w-32"
                      disabled={isCheckedOut}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <Label>Club</Label>
                    <Input
                      type="number"
                      min={0}
                      value={bill.club}
                      onChange={(e) =>
                        handleBillChange("club", Number(e.target.value))
                      }
                      className="w-32"
                      disabled={isCheckedOut}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <Label>Other</Label>
                    <Input
                      type="number"
                      min={0}
                      value={bill.other}
                      onChange={(e) =>
                        handleBillChange("other", Number(e.target.value))
                      }
                      className="w-32"
                      disabled={isCheckedOut}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <Label>
                      Late Checkout{" "}
                      {lateCheckoutDisplay && (
                        <span className="text-xs text-gray-500 ml-2">
                          {lateCheckoutDisplay}
                        </span>
                      )}
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={bill.lateCheckout}
                      disabled
                      className="w-32"
                    />
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>Total</span>
                    <span>LKR {bill.total}</span>
                  </div>
                </div>
              </div>
              {/* Payment, only if not already checked-out */}
              {isCheckedIn && (
                <div className="mb-4">
                  <Label>Payment Method</Label>
                  <select
                    className="w-48 ml-4 border rounded p-2"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    disabled={isCheckedOut}
                  >
                    <option value="">Select...</option>
                    <option value="cash">Cash</option>
                    <option value="credit">Credit Card</option>
                    <option value="debit">Debit Card</option>
                  </select>
                </div>
              )}
              {/* Checkout button */}
              {isCheckedIn && (
                <Button
                  className="w-full mt-2"
                  onClick={() => {
                    setReceiptMode("final");
                    setShowReceiptDialog(true);
                    handleCheckOut();
                  }}
                  disabled={processing || !paymentMethod}
                >
                  {processing ? "Processing..." : "Process Check-Out"}
                </Button>
              )}
              {isCheckedOut && (
                <div className="text-center my-4">
                  <Badge className="bg-green-100 text-green-800">
                    Checked-Out
                  </Badge>
                </div>
              )}
              {/* Show receipt dialog after check-out or on demand */}
              <Dialog
                open={showReceiptDialog}
                onOpenChange={setShowReceiptDialog}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Receipt</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2">
                    <div className="font-bold text-center text-lg">
                      Nexa Stays
                    </div>
                    <Separator />
                    <div>
                      <span className="font-bold">Guest:</span>{" "}
                      {reservation.guestName}
                    </div>
                    <div>
                      <span className="font-bold">Room:</span>{" "}
                      {reservation.roomNumber} ({reservation.roomType})
                    </div>
                    <div>
                      <span className="font-bold">Dates:</span>{" "}
                      {reservation.arrivalDate
                        ? new Date(reservation.arrivalDate).toLocaleDateString()
                        : "-"}{" "}
                      to{" "}
                      {reservation.departureDate
                        ? new Date(
                            reservation.departureDate
                          ).toLocaleDateString()
                        : "-"}
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span>Room Charges</span>
                      <span>LKR {bill.roomCharges}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Restaurant</span>
                      <span>LKR {bill.restaurant}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Room Service</span>
                      <span>LKR {bill.roomService}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Laundry</span>
                      <span>LKR {bill.laundry}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Telephone</span>
                      <span>LKR {bill.telephone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Club</span>
                      <span>LKR {bill.club}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Other</span>
                      <span>LKR {bill.other}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>
                        Late Checkout{" "}
                        {lateCheckoutDisplay && (
                          <span className="text-xs text-gray-500 ml-1">
                            {lateCheckoutDisplay}
                          </span>
                        )}
                      </span>
                      <span>LKR {bill.lateCheckout}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>LKR {bill.total}</span>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handlePrint} variant="outline">
                      Print Receipt
                    </Button>
                    <Button onClick={handleDownloadPDF} variant="outline">
                      Download PDF
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowReceiptDialog(false)}
                    >
                      Close
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
