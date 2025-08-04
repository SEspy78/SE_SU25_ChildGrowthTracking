import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/Hooks/useAuth";
import { Spin } from "antd";

const AuthRedirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, isLoggingOut } = useAuth();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Reset flag khi user thay đổi (login/logout)
    if (!user) {
      hasRedirected.current = false;
      return;
    }

    // Chỉ redirect 1 lần khi có user và đang ở trang chủ/login, và không đang logout
    if (!loading && user && !hasRedirected.current && !isLoggingOut) {
      if (location.pathname === "/" || location.pathname === "/login") {
        hasRedirected.current = true;
        
        // Redirect theo role và position
        if (user.role === "Admin") {
          navigate("/admin/dashboard", { replace: true });
        } else if (user.role === "FacilityStaff") {
          if (user.position === "Doctor") {
            navigate("/doctor/appointments", { replace: true });
          } else if (user.position === "Manager") {
            navigate("/manager/staffs-management", { replace: true });
          } else if (user.position === "Staff") {
            navigate("/staff/appointments", { replace: true });
          }
        }
      }
    }
  }, [user, loading, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" tip="Đang tải..." />
      </div>
    );
  }

  return null;
};

export default AuthRedirect;