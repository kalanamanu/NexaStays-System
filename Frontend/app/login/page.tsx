"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Hotel, Loader2, Sparkles, Eye, EyeOff } from "lucide-react";
import { useUser } from "@/context/user-context";
import NavBar from "@/components/nav-bar";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<
    "customer" | "clerk" | "manager" | "travel-company"
  >("customer");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useUser();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const success = await login(email, password, role);
      if (success) {
        // Redirect based on role
        switch (role) {
          case "customer":
            router.push("/dashboard/customer");
            break;
          case "clerk":
            router.push("/dashboard/clerk");
            break;
          case "manager":
            router.push("/dashboard/manager");
            break;
          case "travel-company":
            router.push("/travel-portal");
            break;
          default:
            router.push("/");
        }
      } else {
        setError("Invalid credentials. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ rotate: -360, scale: [1.2, 1, 1.2] }}
          transition={{
            duration: 25,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl"
        />
      </div>

      <NavBar />

      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-2xl">
            <CardHeader className="text-center space-y-4">
              <motion.div
                transition={{
                  duration: 20,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
                className="flex justify-center"
              >
                <div className="relative">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                    }}
                    className="absolute -top-2 -right-2"
                  ></motion.div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Welcome Back
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300 mt-2">
                  Login to your LuxeStay account
                </CardDescription>
              </motion.div>
            </CardHeader>

            <CardContent>
              <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-2"
                >
                  <Label
                    htmlFor="email"
                    className="text-gray-700 dark:text-gray-300 font-medium"
                  >
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-white/50 dark:bg-gray-700/50 border-purple-200 dark:border-purple-600 focus:border-purple-500 focus:ring-purple-500 rounded-lg"
                  />
                </motion.div>

                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-2"
                >
                  <Label
                    htmlFor="password"
                    className="text-gray-700 dark:text-gray-300 font-medium"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-white/50 dark:bg-gray-700/50 border-purple-200 dark:border-purple-600 focus:border-purple-500 focus:ring-purple-500 rounded-lg pr-12"
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-purple-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </motion.button>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-2"
                >
                  <Label
                    htmlFor="role"
                    className="text-gray-700 dark:text-gray-300 font-medium"
                  >
                    Login as
                  </Label>
                  <Select
                    value={role}
                    onValueChange={(value: any) => setRole(value)}
                  >
                    <SelectTrigger className="bg-white/50 dark:bg-gray-700/50 border-purple-200 dark:border-purple-600 focus:border-purple-500 focus:ring-purple-500 rounded-lg">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="clerk">Hotel Clerk</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="travel-company">
                        Travel Company
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Alert
                        variant="destructive"
                        className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                      >
                        <AlertDescription className="text-red-700 dark:text-red-300">
                          {error}
                        </AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg shadow-lg"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <motion.div
                          transition={{
                            duration: 1,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "linear",
                          }}
                          className="flex items-center"
                        >
                          <Loader2 className="mr-2 h-5 w-5" />
                          Login...
                        </motion.div>
                      ) : (
                        "LogIn"
                      )}
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.form>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-8 space-y-4"
              >
                <div className="text-center">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      href="/register"
                      className="text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300 font-medium transition-colors duration-200"
                    >
                      Don't have an account? Register
                    </Link>
                  </motion.div>
                </div>

                {/* <div className="text-center text-sm text-gray-500 dark:text-gray-400 bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="font-medium text-purple-700 dark:text-purple-300 mb-2">
                    Demo Access Available
                  </div>
                  <div>
                    Use any email/password combination to explore the system
                  </div>
                </div> */}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
