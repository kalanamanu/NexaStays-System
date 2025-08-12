"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Separator } from "@/components/ui/separator"
import { UserCheck, UserX, FileText, Search } from "lucide-react"
import NavBar from "@/components/nav-bar"
import { useUser } from "@/context/user-context"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface Reservation {
  id: string
  guestName: string
  email: string
  roomType: string
  roomNumber?: string
  arrivalDate: string
  departureDate: string
  status: "pending" | "confirmed" | "checked-in" | "checked-out"
  guests: number
  totalAmount: number
}

interface Room {
  number: string
  type: string
  status: "available" | "occupied" | "maintenance"
}

export default function ClerkDashboard() {
  const { user } = useUser()
  const router = useRouter()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedReservation, setSelectedReservation] = useState("")
  const [selectedRoom, setSelectedRoom] = useState("")
  const [checkoutBill, setCheckoutBill] = useState({
    roomCharges: 540,
    restaurant: 120,
    laundry: 45,
    other: 0,
  })
  const [paymentMethod, setPaymentMethod] = useState("")

  const [reservations] = useState<Reservation[]>([
    {
      id: "RES001",
      guestName: "John Doe",
      email: "john@example.com",
      roomType: "Deluxe",
      roomNumber: "201",
      arrivalDate: "2024-02-15",
      departureDate: "2024-02-18",
      status: "confirmed",
      guests: 2,
      totalAmount: 540,
    },
    {
      id: "RES002",
      guestName: "Jane Smith",
      email: "jane@example.com",
      roomType: "Suite",
      arrivalDate: "2024-02-16",
      departureDate: "2024-02-19",
      status: "checked-in",
      guests: 2,
      totalAmount: 840,
    },
  ])

  const [availableRooms] = useState<Room[]>([
    { number: "101", type: "Standard", status: "available" },
    { number: "102", type: "Standard", status: "available" },
    { number: "201", type: "Deluxe", status: "occupied" },
    { number: "301", type: "Suite", status: "available" },
    { number: "401", type: "Residential Suite", status: "available" },
  ])

  useEffect(() => {
    if (!user || user.role !== "clerk") {
      router.push("/login")
    }
  }, [user, router])

  const handleCheckIn = () => {
    if (!selectedReservation || !selectedRoom) {
      toast({
        title: "Error",
        description: "Please select both a reservation and a room.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Check-in Successful",
      description: `Guest has been checked into room ${selectedRoom}.`,
    })

    setSelectedReservation("")
    setSelectedRoom("")
  }

  const handleCheckOut = () => {
    if (!selectedReservation || !paymentMethod) {
      toast({
        title: "Error",
        description: "Please select a reservation and payment method.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Check-out Successful",
      description: "Guest has been checked out and receipt generated.",
    })

    setSelectedReservation("")
    setPaymentMethod("")
  }

  const totalBill = Object.values(checkoutBill).reduce((sum, amount) => sum + amount, 0)

  const filteredReservations = reservations.filter(
    (reservation) =>
      reservation.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "checked-in":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "checked-out":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Clerk Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Manage check-ins, check-outs, and reservations</p>
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
                  <CardDescription>Check in guests and assign rooms</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="guest-search">Search Guest</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input id="guest-search" placeholder="Search by name or email..." className="pl-10" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reservation-select">Select Reservation</Label>
                        <Select value={selectedReservation} onValueChange={setSelectedReservation}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose reservation" />
                          </SelectTrigger>
                          <SelectContent>
                            {reservations
                              .filter((r) => r.status === "confirmed")
                              .map((reservation) => (
                                <SelectItem key={reservation.id} value={reservation.id}>
                                  {reservation.id} - {reservation.guestName}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="room-select">Assign Room</Label>
                        <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose available room" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableRooms
                              .filter((r) => r.status === "available")
                              .map((room) => (
                                <SelectItem key={room.number} value={room.number}>
                                  Room {room.number} - {room.type}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button onClick={handleCheckIn} className="w-full bg-blue-600 hover:bg-blue-700">
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
                  <CardDescription>Process guest check-out and generate bills</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="checkout-reservation">Select Reservation</Label>
                        <Select value={selectedReservation} onValueChange={setSelectedReservation}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose reservation to check out" />
                          </SelectTrigger>
                          <SelectContent>
                            {reservations
                              .filter((r) => r.status === "checked-in")
                              .map((reservation) => (
                                <SelectItem key={reservation.id} value={reservation.id}>
                                  {reservation.id} - {reservation.guestName} (Room {reservation.roomNumber})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="payment-method">Payment Method</Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
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
                          <span>${checkoutBill.restaurant}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Laundry</span>
                          <span>${checkoutBill.laundry}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Other Charges</span>
                          <span>${checkoutBill.other}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-semibold text-lg">
                          <span>Total</span>
                          <span>${totalBill}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={handleCheckOut} className="flex-1 bg-green-600 hover:bg-green-700">
                          Process Check-Out
                        </Button>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline">
                              <FileText className="h-4 w-4 mr-2" />
                              Preview Receipt
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Receipt Preview</DialogTitle>
                              <DialogDescription>Guest receipt for reservation {selectedReservation}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="text-center">
                                <h3 className="text-lg font-bold">HotelChain</h3>
                                <p className="text-sm text-gray-600">Thank you for staying with us!</p>
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
                                  <span>Laundry</span>
                                  <span>${checkoutBill.laundry}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-bold">
                                  <span>Total</span>
                                  <span>${totalBill}</span>
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
                      <CardDescription>Manage all hotel reservations</CardDescription>
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
                          <TableHead>ID</TableHead>
                          <TableHead>Guest</TableHead>
                          <TableHead>Room</TableHead>
                          <TableHead>Check-in</TableHead>
                          <TableHead>Check-out</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredReservations.map((reservation) => (
                          <TableRow key={reservation.id}>
                            <TableCell className="font-medium">{reservation.id}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{reservation.guestName}</div>
                                <div className="text-sm text-gray-500">{reservation.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {reservation.roomNumber
                                ? `${reservation.roomNumber} (${reservation.roomType})`
                                : reservation.roomType}
                            </TableCell>
                            <TableCell>{new Date(reservation.arrivalDate).toLocaleDateString()}</TableCell>
                            <TableCell>{new Date(reservation.departureDate).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(reservation.status)}>
                                {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>${reservation.totalAmount}</TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
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
    </div>
  )
}
