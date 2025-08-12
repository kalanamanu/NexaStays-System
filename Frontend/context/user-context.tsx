"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";

type UserRole = "customer" | "clerk" | "manager" | "travel-company";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface UserContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  register: (
    email: string,
    password: string,
    role: UserRole
  ) => Promise<boolean>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem("hotel-user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (
    email: string,
    password: string,
    role: UserRole
  ): Promise<boolean> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock authentication - in real app, this would be an API call
    if (email && password) {
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: email.split("@")[0],
        email,
        role,
      };
      setUser(newUser);
      localStorage.setItem("hotel-user", JSON.stringify(newUser));
      return true;
    }
    return false;
  };

  // Register works the same as login in this mock, but you can add extra logic
  const register = async (
    email: string,
    password: string,
    role: UserRole
  ): Promise<boolean> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock registration - in real app, this would be an API call
    if (
      email &&
      password &&
      (role === "customer" || role === "travel-company")
    ) {
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: email.split("@")[0],
        email,
        role,
      };
      setUser(newUser);
      localStorage.setItem("hotel-user", JSON.stringify(newUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("hotel-user");
  };

  return (
    <UserContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        register,
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
