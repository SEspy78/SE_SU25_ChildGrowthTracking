import { useState, useEffect } from "react";
import { getUserInfo } from "@/lib/storage";

export interface AuthUser {
  accountId: number;
  accountName: string;
  role: string;
  position?: string;
  facilityId: number;
  token: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = () => {
    const userInfo = getUserInfo();
    if (userInfo) {
      setUser(userInfo);
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const logout = () => {
    setUser(null);
    localStorage.removeItem("userInfo");
    setLoading(false);
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === "Admin";
  const isDoctor = user?.role === "FacilityStaff" && user?.position === "Doctor";
  const isManager = user?.role === "FacilityStaff" && user?.position === "Manager";
  const isStaff = user?.role === "FacilityStaff" && user?.position === "Staff";

  return {
    user,
    loading,
    isAuthenticated,
    isAdmin,
    isDoctor,
    isManager,
    isStaff,
    logout,
  };
};