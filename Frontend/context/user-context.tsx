"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

export type UserRole = "customer" | "clerk" | "manager" | "travel-company";

export interface CustomerProfile {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  phone: string;
  country: string;
  nic: string;
  birthDay: string;
  address: string;
}

export interface TravelCompanyProfile {
  id: number;
  userId: number;
  companyName: string;
  companyRegNo: string;
  phone: string;
  country: string;
  address: string;
}

export interface User {
  id: number;
  email: string;
  role: UserRole;
  customerProfile?: CustomerProfile;
  travelCompanyProfile?: TravelCompanyProfile;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  register: (
    formData: Record<string, any>
  ) => Promise<{ success: boolean; message: string }>;
  refreshUser: () => Promise<void>;
  updateCustomerProfile: (
    profileData: Partial<CustomerProfile>
  ) => Promise<boolean>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const response = await fetch("http://localhost:5000/api/me", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem("hotel-user", JSON.stringify(data.user));
      } else {
        setUser(null);
        localStorage.removeItem("hotel-user");
        localStorage.removeItem("token");
      }
    } catch (err) {
      setUser(null);
      localStorage.removeItem("hotel-user");
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedUser = localStorage.getItem("hotel-user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
        localStorage.removeItem("hotel-user");
      }
      setLoading(false);
    } else {
      const token = localStorage.getItem("token");
      if (token) {
        refreshUser();
      } else {
        setLoading(false);
      }
    }
  }, [refreshUser]);

  const login = async (
    email: string,
    password: string,
    role: UserRole
  ): Promise<boolean> => {
    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });
      const data = await response.json();

      if (response.ok && data.token && data.user) {
        setUser(data.user);
        localStorage.setItem("hotel-user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);
        return true;
      } else {
        return false;
      }
    } catch (err) {
      return false;
    }
  };

  const register = async (
    formData: Record<string, any>
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (response.ok && data.user) {
        // Optionally auto-login after register:
        // await login(formData.email, formData.password, formData.role);
        return { success: true, message: "Registered successfully" };
      } else {
        return {
          success: false,
          message: data.message || "Registration failed",
        };
      }
    } catch (err) {
      return { success: false, message: "Registration failed" };
    }
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("hotel-user");
      localStorage.removeItem("token");
    }
  };

  /**
   * Update the current user's customer profile and refresh user context.
   * Usage: await updateCustomerProfile({ firstName: "New", ... });
   */
  const updateCustomerProfile = async (
    profileData: Partial<CustomerProfile>
  ): Promise<boolean> => {
    if (!user?.customerProfile?.id) return false;
    const token = localStorage.getItem("token");
    if (!token) return false;

    try {
      const res = await fetch(
        `http://localhost:5000/api/customer-profile/${user.customerProfile.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(profileData),
        }
      );
      if (res.ok) {
        // Refetch the user to get the latest profile data
        await refreshUser();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        register,
        refreshUser,
        updateCustomerProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
