

import Header from "@/Components/Header";
import { useState, useEffect } from "react";
import { FaLock } from "react-icons/fa";
import { MdAccountCircle } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/api/authenApi";
import { useAuth } from "@/Hooks/useAuth";
import { Spin } from "antd";

export default function LoginPage() {
  const [accountName, setAccountName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Kiểm tra nếu user đã đăng nhập thì redirect
  useEffect(() => {
    if (!loading && user) {
      if (user.role === "Admin") {
        navigate("/admin/members", { replace: true });
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
  }, [user, loading, navigate]);

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      console.log("API Base URL:", import.meta.env.VITE_API_BASE_URL);
      console.log("Đang gửi request login...");
      const res = await authApi.login({ accountName, password });
      console.log("Đăng nhập thành công:", res);
      if (res.role === "Admin") {
        navigate("/admin/members");
      } else if (res.role === "FacilityStaff") {
        if (res.position === "Doctor") {
          navigate("/doctor/appointments");
        } else if (res.position === "Manager") {
          navigate("/manager/staffs-management");
        } else if (res.position === "Staff") {
          navigate("/staff/appointments");
        }
      }
    } catch (err) {
      setError("Tên tài khoản hoặc mật khẩu không đúng.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden">
      <Header />
      <div className="min-h-screen flex items-center justify-center mb-20 bg-gradient-to-br from-blue-100 to-blue-300 px-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md space-y-6 animate-fade-in">
          <h2 className="text-3xl font-extrabold text-center text-blue-700">
            Đăng nhập
          </h2>

          {error && (
            <p className="text-red-500 text-sm text-center animate-pulse">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
Tên tài khoản
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-500">
                  <MdAccountCircle className="size-6" />
                </span>
                <input
                  type="text"
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all duration-300"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-500">
                  <FaLock />
                </span>
                <input
                  type="password"
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all duration-300"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full hover:cursor-pointer bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Spin size="small" className="mr-2" />
                  Đang đăng nhập...
                </>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>

          <p className="text-sm text-center mt-4 text-gray-600">
            Chưa có tài khoản?{" "}
            <a
              href="/register"
              className="text-blue-600 hover:cursor-pointer font-semibold hover:underline"
            >
              Đăng ký ngay
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}