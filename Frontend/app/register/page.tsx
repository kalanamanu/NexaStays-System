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
import { UserPlus, Eye, EyeOff, Loader2 } from "lucide-react";
import { useUser } from "@/context/user-context";
import NavBar from "@/components/nav-bar";
import { motion, AnimatePresence } from "framer-motion";

// Minimal country data, expand as needed
const countryCodes = [
  { code: "+1", name: "USA" },
  { code: "+44", name: "UK" },
  { code: "+61", name: "AUS" },
  { code: "+94", name: "LK" },
  { code: "+91", name: "IN" },
  { code: "+65", name: "SG" },
  { code: "+81", name: "JP" },
  { code: "+86", name: "CH" },
];

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<"customer" | "travel-company">("customer");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Customer fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [customerCountry, setCustomerCountry] = useState("+94");
  const [customerPhone, setCustomerPhone] = useState("");
  const [nic, setNic] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [address, setAddress] = useState("");

  // Travel Company fields
  const [companyName, setCompanyName] = useState("");
  const [companyRegNo, setCompanyRegNo] = useState("");
  const [companyCountry, setCompanyCountry] = useState("+94");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const router = useRouter();

  // Validation helpers
  function validateEmail(email: string) {
    return /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);
  }
  function validatePw(pw: string) {
    return pw.length >= 8;
  }
  function validatePhone(phone: string) {
    return /^[0-9]{7,}$/.test(phone); // At least 7 digits
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate all fields
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!validatePw(password)) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (confirmPw !== password) {
      setError("Passwords do not match.");
      return;
    }

    if (role === "customer") {
      if (
        !firstName ||
        !lastName ||
        !customerPhone ||
        !nic ||
        !birthDay ||
        !address
      ) {
        setError("Please fill in all fields.");
        return;
      }
      if (!validatePhone(customerPhone)) {
        setError("Please enter a valid customer phone number.");
        return;
      }
    }
    if (role === "travel-company") {
      if (!companyName || !companyRegNo || !companyPhone || !companyAddress) {
        setError("Please fill in all fields.");
        return;
      }
      if (!validatePhone(companyPhone)) {
        setError("Please enter a valid company phone number.");
        return;
      }
    }

    setIsLoading(true);

    // Build the request body dynamically based on the role
    let reqBody: any = {
      email,
      password,
      role,
    };

    if (role === "customer") {
      reqBody = {
        ...reqBody,
        firstName,
        lastName,
        customerPhone,
        customerCountry,
        nic,
        birthDay,
        address,
      };
    } else if (role === "travel-company") {
      reqBody = {
        ...reqBody,
        companyName,
        companyRegNo,
        companyPhone,
        companyCountry,
        companyAddress,
      };
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reqBody),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Registration successful! Redirecting to login...");
        setTimeout(() => {
          router.push("/login");
        }, 1700);
      } else {
        setError(data.message || "Registration failed. Please try again.");
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
      <div className="fixed top-0 left-0 w-full z-30">
        <NavBar />
      </div>
      <div className="pt-20 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-3xl"
        >
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-2xl px-12 py-10 rounded-2xl">
            <CardHeader className="text-center space-y-4">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Create Your Account
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300 mt-2">
                Register as a customer or travel company
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Register as */}
                <div>
                  <Label
                    htmlFor="role"
                    className="text-gray-700 dark:text-gray-300 font-medium"
                  >
                    Register as
                  </Label>
                  <Select value={role} onValueChange={(v) => setRole(v as any)}>
                    <SelectTrigger className="bg-white/50 dark:bg-gray-700/50 border-purple-200 dark:border-purple-600 focus:border-purple-500 focus:ring-purple-500 rounded-lg w-full py-3 px-4">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="travel-company">
                        Travel Company
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Dynamic FIRST fields */}
                <AnimatePresence mode="wait">
                  {role === "customer" && (
                    <motion.div
                      key="customer-first-fields"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      transition={{ duration: 0.25 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      <div>
                        <Label
                          htmlFor="firstName"
                          className="text-gray-700 dark:text-gray-300 font-medium"
                        >
                          First Name
                        </Label>
                        <Input
                          id="firstName"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="bg-white/50 dark:bg-gray-700/50 border-purple-200 dark:border-purple-600 focus:border-purple-500 focus:ring-purple-500 rounded-lg w-full py-3 px-4"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="lastName"
                          className="text-gray-700 dark:text-gray-300 font-medium"
                        >
                          Last Name
                        </Label>
                        <Input
                          id="lastName"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="bg-white/50 dark:bg-gray-700/50 border-purple-200 dark:border-purple-600 focus:border-purple-500 focus:ring-purple-500 rounded-lg w-full py-3 px-4"
                        />
                      </div>
                    </motion.div>
                  )}
                  {role === "travel-company" && (
                    <motion.div
                      key="travel-company-first-fields"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-1"
                    >
                      <Label
                        htmlFor="companyName"
                        className="text-gray-700 dark:text-gray-300 font-medium"
                      >
                        Company Name
                      </Label>
                      <Input
                        id="companyName"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="bg-white/50 dark:bg-gray-700/50 border-purple-200 dark:border-purple-600 focus:border-purple-500 focus:ring-purple-500 rounded-lg w-full py-3 px-4"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email */}
                <div>
                  <Label
                    htmlFor="email"
                    className="text-gray-700 dark:text-gray-300 font-medium"
                  >
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    autoComplete="email"
                    type="email"
                    placeholder="Enter your email"
                    className="bg-white/50 dark:bg-gray-700/50 border-purple-200 dark:border-purple-600 focus:border-purple-500 focus:ring-purple-500 rounded-lg w-full py-3 px-4"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {/* Password and Confirm */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
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
                        placeholder="Create a password"
                        className="bg-white/50 dark:bg-gray-700/50 border-purple-200 dark:border-purple-600 focus:border-purple-500 focus:ring-purple-500 rounded-lg w-full py-3 px-4 pr-12"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-400"
                        onClick={() => setShowPassword((s) => !s)}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label
                      htmlFor="confirmPw"
                      className="text-gray-700 dark:text-gray-300 font-medium"
                    >
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPw"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        className="bg-white/50 dark:bg-gray-700/50 border-purple-200 dark:border-purple-600 focus:border-purple-500 focus:ring-purple-500 rounded-lg w-full py-3 px-4 pr-12"
                        value={confirmPw}
                        onChange={(e) => setConfirmPw(e.target.value)}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-400"
                        onClick={() => setShowConfirmPassword((s) => !s)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Dynamic rest of fields */}
                <AnimatePresence mode="wait">
                  {role === "customer" && (
                    <motion.div
                      key="customer-rest-fields"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <div>
                        <Label
                          htmlFor="customerPhone"
                          className="text-gray-700 dark:text-gray-300 font-medium"
                        >
                          Phone Number
                        </Label>
                        <div className="flex gap-2">
                          <Select
                            value={customerCountry}
                            onValueChange={(v) => setCustomerCountry(v)}
                          >
                            <SelectTrigger className="bg-white/50 dark:bg-gray-700/50 border-purple-200 dark:border-purple-600 focus:border-purple-500 focus:ring-purple-500 rounded-lg w-28 py-3 px-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {countryCodes.map((c) => (
                                <SelectItem value={c.code} key={c.code}>
                                  {c.name} {c.code}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            id="customerPhone"
                            type="tel"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className="bg-white/50 dark:bg-gray-700/50 border-purple-200 dark:border-purple-600 focus:border-purple-500 focus:ring-purple-500 rounded-lg flex-1 py-3 px-4"
                            placeholder="Phone number"
                          />
                        </div>
                      </div>
                      <div>
                        <Label
                          htmlFor="nic"
                          className="text-gray-700 dark:text-gray-300 font-medium"
                        >
                          NIC
                        </Label>
                        <Input
                          id="nic"
                          value={nic}
                          onChange={(e) => setNic(e.target.value)}
                          className="bg-white/50 dark:bg-gray-700/50 border-purple-200 dark:border-purple-600 focus:border-purple-500 focus:ring-purple-500 rounded-lg w-full py-3 px-4"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="birthDay"
                          className="text-gray-700 dark:text-gray-300 font-medium"
                        >
                          Birth Day
                        </Label>
                        <Input
                          id="birthDay"
                          type="date"
                          value={birthDay}
                          onChange={(e) => setBirthDay(e.target.value)}
                          className="bg-white/50 dark:bg-gray-700/50 border-purple-200 dark:border-purple-600 focus:border-purple-500 focus:ring-purple-500 rounded-lg w-full py-3 px-4"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="address"
                          className="text-gray-700 dark:text-gray-300 font-medium"
                        >
                          Address
                        </Label>
                        <Input
                          id="address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="bg-white/50 dark:bg-gray-700/50 border-purple-200 dark:border-purple-600 focus:border-purple-500 focus:ring-purple-500 rounded-lg w-full py-3 px-4"
                        />
                      </div>
                    </motion.div>
                  )}
                  {role === "travel-company" && (
                    <motion.div
                      key="company-rest-fields"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <div>
                        <Label
                          htmlFor="companyRegNo"
                          className="text-gray-700 dark:text-gray-300 font-medium"
                        >
                          Company Registration Number
                        </Label>
                        <Input
                          id="companyRegNo"
                          value={companyRegNo}
                          onChange={(e) => setCompanyRegNo(e.target.value)}
                          className="bg-white/50 dark:bg-gray-700/50 border-purple-200 dark:border-purple-600 focus:border-purple-500 focus:ring-purple-500 rounded-lg w-full py-3 px-4"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="companyPhone"
                          className="text-gray-700 dark:text-gray-300 font-medium"
                        >
                          Phone Number
                        </Label>
                        <div className="flex gap-2">
                          <Select
                            value={companyCountry}
                            onValueChange={(v) => setCompanyCountry(v)}
                          >
                            <SelectTrigger className="bg-white/50 dark:bg-gray-700/50 border-purple-200 dark:border-purple-600 focus:border-purple-500 focus:ring-purple-500 rounded-lg w-28 py-3 px-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {countryCodes.map((c) => (
                                <SelectItem value={c.code} key={c.code}>
                                  {c.name} {c.code}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            id="companyPhone"
                            type="tel"
                            value={companyPhone}
                            onChange={(e) => setCompanyPhone(e.target.value)}
                            className="bg-white/50 dark:bg-gray-700/50 border-purple-200 dark:border-purple-600 focus:border-purple-500 focus:ring-purple-500 rounded-lg flex-1 py-3 px-4"
                            placeholder="Phone number"
                          />
                        </div>
                      </div>
                      <div>
                        <Label
                          htmlFor="companyAddress"
                          className="text-gray-700 dark:text-gray-300 font-medium"
                        >
                          Company Address
                        </Label>
                        <Input
                          id="companyAddress"
                          value={companyAddress}
                          onChange={(e) => setCompanyAddress(e.target.value)}
                          className="bg-white/50 dark:bg-gray-700/50 border-purple-200 dark:border-purple-600 focus:border-purple-500 focus:ring-purple-500 rounded-lg w-full py-3 px-4"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {/* Error / Success */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="mb-2"
                    >
                      <Alert
                        variant="destructive"
                        className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                      >
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="mb-2"
                    >
                      <Alert
                        variant="default"
                        className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                      >
                        <AlertDescription>{success}</AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>
                <Button
                  type="submit"
                  className="w-full mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg shadow-lg text-base"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2 justify-center">
                      <Loader2 className="w-5 h-5 animate-spin" /> Creating
                      Account...
                    </span>
                  ) : (
                    "Register"
                  )}
                </Button>
                <div className="mt-6 text-center">
                  <Link
                    href="/login"
                    className="text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300 font-medium transition-colors duration-200 underline underline-offset-2"
                  >
                    Already have an account? Login
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
