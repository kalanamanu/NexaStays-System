"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CalendarIcon,
  Download,
  TrendingUp,
  Users,
  DollarSign,
  Bed,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import NavBar from "@/components/nav-bar";
import { useUser } from "@/context/user-context";
import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ManagerDashboard() {
  const { user } = useUser();
  const router = useRouter();
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to?: Date | undefined;
  }>({
    from: new Date(new Date().getFullYear(), 0, 1), // Jan 1st this year
    to: new Date(), // today
  });

  // State for analytics
  const [occupancyData, setOccupancyData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [totalGuests, setTotalGuests] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!dateRange.from || !dateRange.to) return;
    setLoading(true);
    const from = dateRange.from.toISOString().slice(0, 10);
    const to = dateRange.to.toISOString().slice(0, 10);

    Promise.all([
      fetch(
        `http://localhost:5000/api/analytics/occupancy?from=${from}&to=${to}`
      ).then((r) => r.json()),
      fetch(
        `http://localhost:5000/api/analytics/revenue?from=${from}&to=${to}`
      ).then((r) => r.json()),
      fetch(
        `http://localhost:5000/api/analytics/guests?from=${from}&to=${to}`
      ).then((r) => r.json()),
    ])
      .then(([occupancy, revenue, guests]) => {
        setOccupancyData(occupancy);
        setRevenueData(revenue);
        setTotalGuests(guests.totalGuests);
      })
      .catch(() => {
        setOccupancyData([]);
        setRevenueData([]);
        setTotalGuests(0);
      })
      .finally(() => setLoading(false));
  }, [dateRange, user]);

  // Calculate metrics from fetched data
  const totalRevenue = revenueData.reduce(
    (sum, month) =>
      sum + (month.room || 0) + (month.restaurant || 0) + (month.other || 0),
    0
  );
  const averageOccupancy = occupancyData.length
    ? Math.round(
        occupancyData.reduce((sum, day) => sum + (day.occupancy || 0), 0) /
          occupancyData.length
      )
    : 0;

  // Calculate Total Room Revenue and Sold Room Nights
  const totalRoomRevenue = revenueData.reduce(
    (sum, month) => sum + (month.room || 0),
    0
  );
  const soldRoomNights = occupancyData.reduce(
    (sum, day) =>
      sum +
      (Object.values(day.byType || {}).reduce(
        (a: number, b: unknown) => a + (typeof b === "number" ? b : 0),
        0
      ) || 0),
    0
  );
  const totalDays = occupancyData.length;
  const totalRooms = occupancyData.length > 0 ? occupancyData[0].rooms : 0;
  const totalAvailableRoomNights = totalRooms * totalDays;

  const averageDailyRate = soldRoomNights
    ? totalRoomRevenue / soldRoomNights
    : 0;
  const revenuePerRoom = totalAvailableRoomNights
    ? totalRoomRevenue / totalAvailableRoomNights
    : 0;

  // PDF Export Handlers
  function exportOccupancyPDF() {
    const doc = new jsPDF();
    doc.text("Occupancy Report", 14, 16);
    if (!occupancyData.length) {
      doc.text("No data", 14, 30);
    } else {
      const byTypeKeys = Object.keys(occupancyData[0]?.byType || {});
      const head = [
        [
          "Date",
          "Occupancy (%)",
          ...byTypeKeys.map((type) => `${type} (Occupied)`),
        ],
      ];
      const body = occupancyData.map((day) => [
        day.date,
        day.occupancy,
        ...byTypeKeys.map((type) => day.byType[type] ?? 0),
      ]);
      autoTable(doc, {
        head,
        body,
        startY: 22,
      });
    }
    doc.save(
      `occupancy-report_${
        dateRange.from?.toISOString().slice(0, 10) ?? ""
      }_to_${dateRange.to?.toISOString().slice(0, 10) ?? ""}.pdf`
    );
  }

  function exportRevenuePDF() {
    const doc = new jsPDF();
    doc.text("Revenue Report", 14, 16);
    if (!revenueData.length) {
      doc.text("No data", 14, 30);
    } else {
      const head = [["Month", "Room Revenue", "Restaurant", "Other Services"]];
      const body = revenueData.map((r) => [
        r.month,
        r.room,
        r.restaurant,
        r.other,
      ]);
      autoTable(doc, {
        head,
        body,
        startY: 22,
      });
    }
    doc.save(
      `revenue-report_${dateRange.from?.toISOString().slice(0, 10) ?? ""}_to_${
        dateRange.to?.toISOString().slice(0, 10) ?? ""
      }.pdf`
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <NavBar />

      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Manager Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Monitor hotel performance and analytics
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "Loading..." : `$${totalRevenue.toLocaleString()}`}
                </div>
                <p className="text-xs text-muted-foreground">
                  +12% from last period
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Occupancy
                </CardTitle>
                <Bed className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "Loading..." : `${averageOccupancy}%`}
                </div>
                <p className="text-xs text-muted-foreground">
                  +5% from last period
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Guests
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "Loading..." : totalGuests}
                </div>
                <p className="text-xs text-muted-foreground">
                  +8% from last period
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Growth Rate
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+15.2%</div>
                <p className="text-xs text-muted-foreground">
                  Monthly growth rate
                </p>
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
                        <CardDescription>
                          Track room occupancy over time
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "justify-start text-left font-normal",
                                !dateRange.from && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateRange.from ? (
                                dateRange.to ? (
                                  <>
                                    {format(dateRange.from, "LLL dd, y")} -{" "}
                                    {format(dateRange.to, "LLL dd, y")}
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
                              onSelect={(range) => {
                                if (range) setDateRange(range);
                              }}
                              numberOfMonths={2}
                              required={false}
                            />
                          </PopoverContent>
                        </Popover>
                        <Button variant="outline" onClick={exportOccupancyPDF}>
                          <Download className="h-4 w-4 mr-2" />
                          Export PDF
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={occupancyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(value) =>
                              format(new Date(value), "MMM dd")
                            }
                          />
                          <YAxis />
                          <Tooltip
                            labelFormatter={(value) =>
                              format(new Date(value), "MMM dd, yyyy")
                            }
                            formatter={(value: number) => [
                              `${value}%`,
                              "Occupancy",
                            ]}
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
                          {occupancyData.length > 0 &&
                          occupancyData[occupancyData.length - 1].byType &&
                          occupancyData[occupancyData.length - 1]
                            .roomsByType ? (
                            Object.entries(
                              occupancyData[occupancyData.length - 1].byType
                            ).map(([type, occupied]: any) => {
                              const totalRooms =
                                occupancyData[occupancyData.length - 1]
                                  .roomsByType[type] || 0;
                              const available = totalRooms - occupied;
                              const rate = totalRooms
                                ? Math.round((occupied / totalRooms) * 100)
                                : 0;
                              return (
                                <TableRow key={type}>
                                  <TableCell>{type}</TableCell>
                                  <TableCell>{occupied}</TableCell>
                                  <TableCell>{available}</TableCell>
                                  <TableCell>{rate}%</TableCell>
                                </TableRow>
                              );
                            })
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4}>No data</TableCell>
                            </TableRow>
                          )}
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
                          { date: "Aug 17", occupancy: 95, trend: "up" },
                          { date: "Aug 18", occupancy: 82, trend: "down" },
                          { date: "Aug 19", occupancy: 90, trend: "up" },
                          { date: "Aug 20", occupancy: 87, trend: "down" },
                          { date: "Aug 21", occupancy: 93, trend: "up" },
                        ].map((day) => (
                          <div
                            key={day.date}
                            className="flex items-center justify-between"
                          >
                            <span className="text-sm font-medium">
                              {day.date}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{day.occupancy}%</span>
                              <TrendingUp
                                className={cn(
                                  "h-4 w-4",
                                  day.trend === "up"
                                    ? "text-green-500"
                                    : "text-red-500 rotate-180"
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
                        <CardDescription>
                          Track revenue across all sources
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "justify-start text-left font-normal",
                                !dateRange.from && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateRange.from ? (
                                dateRange.to ? (
                                  <>
                                    {format(dateRange.from, "LLL dd, y")} -{" "}
                                    {format(dateRange.to, "LLL dd, y")}
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
                              onSelect={(range) => {
                                if (range) setDateRange(range);
                              }}
                              numberOfMonths={2}
                              required={false}
                            />
                          </PopoverContent>
                        </Popover>
                        <Button variant="outline" onClick={exportRevenuePDF}>
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
                          <Tooltip
                            formatter={(value: number) => [
                              `$${value.toLocaleString()}`,
                              "",
                            ]}
                          />
                          <Line
                            type="monotone"
                            dataKey="room"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            name="Room Revenue"
                          />
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
                      <CardDescription>
                        Current month performance
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Example: show most recent month breakdown */}
                      {revenueData.length > 0 ? (
                        (() => {
                          const lastMonth = revenueData[revenueData.length - 1];
                          return (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                  <span className="text-sm">Room Revenue</span>
                                </div>
                                <span className="font-semibold">
                                  ${lastMonth.room?.toLocaleString() ?? 0}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                  <span className="text-sm">Restaurant</span>
                                </div>
                                <span className="font-semibold">
                                  ${lastMonth.restaurant?.toLocaleString() ?? 0}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                  <span className="text-sm">
                                    Other Services
                                  </span>
                                </div>
                                <span className="font-semibold">
                                  ${lastMonth.other?.toLocaleString() ?? 0}
                                </span>
                              </div>
                              {/* Add any other breakdowns as needed */}
                            </div>
                          );
                        })()
                      ) : (
                        <div>No data available</div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Metrics</CardTitle>
                      <CardDescription>
                        Key performance indicators
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Average Daily Rate</span>
                          <span className="font-semibold">
                            {loading
                              ? "Loading..."
                              : `$${averageDailyRate.toFixed(2)}`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Revenue per Room</span>
                          <span className="font-semibold">
                            {loading
                              ? "Loading..."
                              : `$${revenuePerRoom.toFixed(2)}`}
                          </span>
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
  );
}
