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

  // Check if user is logged in and redirect
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      console.log("API Base URL:", import.meta.env.VITE_API_BASE_URL);
      console.log("Sending login request...");
      const res = await authApi.login({ accountName, password });
      console.log("Login successful:", res);
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
      setError("Invalid username or password.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-100 to-purple-100 flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="bg-white/30 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20 transform transition-all duration-500 ease-out hover:scale-105">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
            Đăng nhập
          </h2>

          {error && (
            <div className="bg-red-100 text-red-600 text-sm rounded-lg p-3 mb-6 text-center animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên tài khoản
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-500">
                  <MdAccountCircle className="size-6" />
                </span>
                <input
                  type="text"
                  className="pl-10 w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition-all duration-300 placeholder-gray-400"
                  placeholder="Nhập tên tài khoản"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-500">
                  <FaLock className="size-5" />
                </span>
                <input
                  type="password"
                  className="pl-10 w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition-all duration-300 placeholder-gray-400"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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

        </div>
      </div>
    </div>
  );
}