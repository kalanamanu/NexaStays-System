"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CalendarIcon, Download, TrendingUp, Users, DollarSign, Bed } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import NavBar from "@/components/nav-bar"
import { useUser } from "@/context/user-context"
import { useRouter } from "next/navigation"
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const occupancyData = [
  { date: "2024-01-01", occupancy: 85, rooms: 120 },
  { date: "2024-01-02", occupancy: 92, rooms: 120 },
  { date: "2024-01-03", occupancy: 78, rooms: 120 },
  { date: "2024-01-04", occupancy: 88, rooms: 120 },
  { date: "2024-01-05", occupancy: 95, rooms: 120 },
  { date: "2024-01-06", occupancy: 82, rooms: 120 },
  { date: "2024-01-07", occupancy: 90, rooms: 120 },
]

const revenueData = [
  { month: "Jan", room: 45000, restaurant: 12000, other: 3000 },
  { month: "Feb", room: 52000, restaurant: 14000, other: 3500 },
  { month: "Mar", room: 48000, restaurant: 13000, other: 3200 },
  { month: "Apr", room: 61000, restaurant: 16000, other: 4000 },
  { month: "May", room: 55000, restaurant: 15000, other: 3800 },
  { month: "Jun", room: 67000, restaurant: 18000, other: 4500 },
]

export default function ManagerDashboard() {
  const { user } = useUser()
  const router = useRouter()
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: new Date(2024, 0, 1),
    to: new Date(2024, 0, 31),
  })

  useEffect(() => {
    if (!user || user.role !== "manager") {
      router.push("/login")
    }
  }, [user, router])

  const totalRevenue = revenueData.reduce((sum, month) => sum + month.room + month.restaurant + month.other, 0)
  const averageOccupancy = Math.round(occupancyData.reduce((sum, day) => sum + day.occupancy, 0) / occupancyData.length)

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <NavBar />

      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manager Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Monitor hotel performance and analytics</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">+12% from last period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Occupancy</CardTitle>
                <Bed className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averageOccupancy}%</div>
                <p className="text-xs text-muted-foreground">+5% from last period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Guests</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,234</div>
                <p className="text-xs text-muted-foreground">+8% from last period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+15.2%</div>
                <p className="text-xs text-muted-foreground">Monthly growth rate</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="occupancy" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="occupancy">Occupancy Reports</TabsTrigger>
              <TabsTrigger value="revenue">Revenue Reports</TabsTrigger>
            </TabsList>

            {/* Occupancy Tab */}
            <TabsContent value="occupancy">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <CardTitle>Occupancy Analysis</CardTitle>
                        <CardDescription>Track room occupancy over time</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "justify-start text-left font-normal",
                                !dateRange.from && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateRange.from ? (
                                dateRange.to ? (
                                  <>
                                    {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                                  </>
                                ) : (
                                  format(dateRange.from, "LLL dd, y")
                                )
                              ) : (
                                "Pick a date range"
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                              initialFocus
                              mode="range"
                              defaultMonth={dateRange.from}
                              selected={dateRange}
                              onSelect={setDateRange}
                              numberOfMonths={2}
                            />
                          </PopoverContent>
                        </Popover>
                        <Button variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={occupancyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tickFormatter={(value) => format(new Date(value), "MMM dd")} />
                          <YAxis />
                          <Tooltip
                            labelFormatter={(value) => format(new Date(value), "MMM dd, yyyy")}
                            formatter={(value: number) => [`${value}%`, "Occupancy"]}
                          />
                          <Bar dataKey="occupancy" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Current Occupancy</CardTitle>
                      <CardDescription>Real-time room status</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Room Type</TableHead>
                            <TableHead>Occupied</TableHead>
                            <TableHead>Available</TableHead>
                            <TableHead>Rate</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>Standard</TableCell>
                            <TableCell>45</TableCell>
                            <TableCell>15</TableCell>
                            <TableCell>75%</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Deluxe</TableCell>
                            <TableCell>28</TableCell>
                            <TableCell>7</TableCell>
                            <TableCell>80%</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Suite</TableCell>
                            <TableCell>12</TableCell>
                            <TableCell>3</TableCell>
                            <TableCell>80%</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Residential</TableCell>
                            <TableCell>8</TableCell>
                            <TableCell>2</TableCell>
                            <TableCell>80%</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Projected Occupancy</CardTitle>
                      <CardDescription>Next 7 days forecast</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {[
                          { date: "Today", occupancy: 92, trend: "up" },
                          { date: "Tomorrow", occupancy: 88, trend: "down" },
                          { date: "Feb 17", occupancy: 95, trend: "up" },
                          { date: "Feb 18", occupancy: 82, trend: "down" },
                          { date: "Feb 19", occupancy: 90, trend: "up" },
                          { date: "Feb 20", occupancy: 87, trend: "down" },
                          { date: "Feb 21", occupancy: 93, trend: "up" },
                        ].map((day) => (
                          <div key={day.date} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{day.date}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{day.occupancy}%</span>
                              <TrendingUp
                                className={cn(
                                  "h-4 w-4",
                                  day.trend === "up" ? "text-green-500" : "text-red-500 rotate-180",
                                )}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Revenue Tab */}
            <TabsContent value="revenue">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <CardTitle>Revenue Analysis</CardTitle>
                        <CardDescription>Track revenue across all sources</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "justify-start text-left font-normal",
                                !dateRange.from && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateRange.from ? (
                                dateRange.to ? (
                                  <>
                                    {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                                  </>
                                ) : (
                                  format(dateRange.from, "LLL dd, y")
                                )
                              ) : (
                                "Pick a date range"
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                              initialFocus
                              mode="range"
                              defaultMonth={dateRange.from}
                              selected={dateRange}
                              onSelect={setDateRange}
                              numberOfMonths={2}
                            />
                          </PopoverContent>
                        </Popover>
                        <Button variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Export PDF
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={revenueData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, ""]} />
                          <Line type="monotone" dataKey="room" stroke="#3b82f6" strokeWidth={2} name="Room Revenue" />
                          <Line
                            type="monotone"
                            dataKey="restaurant"
                            stroke="#10b981"
                            strokeWidth={2}
                            name="Restaurant"
                          />
                          <Line
                            type="monotone"
                            dataKey="other"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            name="Other Services"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Revenue Breakdown</CardTitle>
                      <CardDescription>Current month performance</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="text-sm">Room Revenue</span>
                          </div>
                          <span className="font-semibold">$67,000</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-sm">Restaurant</span>
                          </div>
                          <span className="font-semibold">$18,000</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            <span className="text-sm">Other Services</span>
                          </div>
                          <span className="font-semibold">$4,500</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span className="text-sm">No-shows</span>
                          </div>
                          <span className="font-semibold text-red-600">-$2,100</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Metrics</CardTitle>
                      <CardDescription>Key performance indicators</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Average Daily Rate</span>
                          <span className="font-semibold">$185</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Revenue per Room</span>
                          <span className="font-semibold">$156</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Guest Satisfaction</span>
                          <span className="font-semibold">4.7/5</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Repeat Customers</span>
                          <span className="font-semibold">32%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
