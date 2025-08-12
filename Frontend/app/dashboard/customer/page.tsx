"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Edit, Trash2, Calendar } from "lucide-react"
import NavBar from "@/components/nav-bar"
import { useUser } from "@/context/user-context"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface Reservation {
  id: string
  roomType: string
  arrivalDate: string
  departureDate: string
  status: "pending" | "confirmed" | "cancelled"
  guests: number
  totalAmount: number
}

export default function CustomerDashboard() {
  const { user } = useUser()
  const router = useRouter()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [reservations, setReservations] = useState<Reservation[]>([
    {
      id: "RES001",
      roomType: "Deluxe",
      arrivalDate: "2024-02-15",
      departureDate: "2024-02-18",
      status: "confirmed",
      guests: 2,
      totalAmount: 540,
    },
    {
      id: "RES002",
      roomType: "Suite",
      arrivalDate: "2024-03-10",
      departureDate: "2024-03-12",
      status: "pending",
      guests: 2,
      totalAmount: 560,
    },
    {
      id: "RES003",
      roomType: "Standard",
      arrivalDate: "2024-01-20",
      departureDate: "2024-01-22",
      status: "cancelled",
      guests: 1,
      totalAmount: 240,
    },
  ])

  useEffect(() => {
    if (!user || user.role !== "customer") {
      router.push("/login")
    }
  }, [user, router])

  const filteredReservations = reservations.filter(
    (reservation) =>
      reservation.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.roomType.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleCancelReservation = (reservationId: string) => {
    setReservations((prev) =>
      prev.map((res) => (res.id === reservationId ? { ...res, status: "cancelled" as const } : res)),
    )
    toast({
      title: "Reservation Cancelled",
      description: `Reservation ${reservationId} has been cancelled.`,
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <NavBar />

      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back, {user.name}!</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Manage your reservations and bookings</p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Total Reservations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{reservations.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Upcoming Stays</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {reservations.filter((r) => r.status === "confirmed" && new Date(r.arrivalDate) > new Date()).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick Book</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={() => router.push("/reservation")} className="w-full bg-blue-600 hover:bg-blue-700">
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
                  <CardDescription>View and manage your hotel bookings</CardDescription>
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
                      <TableHead>Room Type</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Check-out</TableHead>
                      <TableHead>Guests</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReservations.map((reservation) => (
                      <TableRow key={reservation.id}>
                        <TableCell className="font-medium">{reservation.id}</TableCell>
                        <TableCell>{reservation.roomType}</TableCell>
                        <TableCell>{new Date(reservation.arrivalDate).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(reservation.departureDate).toLocaleDateString()}</TableCell>
                        <TableCell>{reservation.guests}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(reservation.status)}>
                            {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>${reservation.totalAmount}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" disabled={reservation.status === "cancelled"}>
                              <Edit className="h-4 w-4" />
                            </Button>

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" disabled={reservation.status === "cancelled"}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Cancel Reservation</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to cancel reservation {reservation.id}? This action cannot be
                                    undone.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button variant="outline">Keep Reservation</Button>
                                  <Button variant="destructive" onClick={() => handleCancelReservation(reservation.id)}>
                                    Cancel Reservation
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredReservations.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No reservations found</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {searchTerm ? "Try adjusting your search terms." : "You haven't made any reservations yet."}
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => router.push("/reservation")} className="bg-blue-600 hover:bg-blue-700">
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
  )
}
