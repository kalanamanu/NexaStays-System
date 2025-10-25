"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import NavBar from "@/components/nav-bar";
import { format } from "date-fns";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function ViewReservationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id?.toString();

  const [reservation, setReservation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem("token");
    fetch(`${API_BASE}/api/reservations/${id}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "application/json",
      },
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setReservation(data.reservation);
        setLoading(false);
      });
  }, [id]);

  const handleDownloadReceipt = async () => {
    if (!id) return;
    setDownloading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/reservations/${id}/receipt`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to download receipt.");
      const blob = await res.blob();
      // Create download link and click it
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Reservation_${id}_Receipt.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      alert("Could not download receipt. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading || !reservation) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <NavBar />
        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center text-lg">
            <Loader2 className="animate-spin h-6 w-6 inline-block mr-2" />{" "}
            Loading reservation...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <NavBar />
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                View Reservation
              </CardTitle>
              <CardDescription className="text-center">
                Reservation details (read-only)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Hotel:</Label>
                  <div className="mt-1">{reservation.hotel?.name || "N/A"}</div>
                </div>
                <div>
                  <Label>Room Type:</Label>
                  <div className="mt-1">{reservation.roomType || "N/A"}</div>
                </div>
                <div>
                  <Label>Room Number:</Label>
                  <div className="mt-1">
                    {reservation.roomNumber ||
                      reservation.room?.number ||
                      "N/A"}
                  </div>
                </div>
                <div>
                  <Label>Guest Name:</Label>
                  <div className="mt-1">{reservation.guestName || "N/A"}</div>
                </div>
                <div>
                  <Label>Guest Email:</Label>
                  <div className="mt-1">{reservation.guestEmail || "N/A"}</div>
                </div>
                <div>
                  <Label>Guest Phone:</Label>
                  <div className="mt-1">{reservation.guestPhone || "N/A"}</div>
                </div>
                <div>
                  <Label>Check-in:</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-blue-600" />
                    {reservation.arrivalDate
                      ? format(new Date(reservation.arrivalDate), "PPP")
                      : "N/A"}
                  </div>
                </div>
                <div>
                  <Label>Check-out:</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-blue-600" />
                    {reservation.departureDate
                      ? format(new Date(reservation.departureDate), "PPP")
                      : "N/A"}
                  </div>
                </div>
                <div>
                  <Label>Guests:</Label>
                  <div className="mt-1">{reservation.guests}</div>
                </div>
                <div>
                  <Label>Total Amount:</Label>
                  <div className="mt-1 font-bold text-green-700 dark:text-green-300">
                    LKR {reservation.totalAmount}
                  </div>
                </div>
                <div>
                  <Label>Status:</Label>
                  <div className="mt-1">{reservation.status}</div>
                </div>
              </div>
              <div className="mt-8 flex flex-wrap justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard/customer")}
                >
                  Back to Dashboard
                </Button>
                <Button
                  onClick={() =>
                    router.push(`/reservation/edit/${reservation.id}`)
                  }
                >
                  Edit Reservation
                </Button>
                {reservation.status === "paid" && (
                  <Button
                    onClick={handleDownloadReceipt}
                    disabled={downloading}
                    variant="secondary"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {downloading ? "Preparing receipt..." : "Download Receipt"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
