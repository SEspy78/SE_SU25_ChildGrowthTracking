import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { getItemWithExpiry, removeItem } from "@/lib/storage";
import { useEffect, useState } from "react";
import { 
  Users, 
  Building2, 
  Syringe, 
  Package,
  Calendar,
  File,
  DollarSign,
  ScrollText
  
} from "lucide-react";

export default function ManagerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userInfo, setUserInfo] = useState<{ accountName: string } | null>(null);

  useEffect(() => {
    const stored = getItemWithExpiry("userInfo");
    if (!stored) {
      navigate("/login");
    } else {
      setUserInfo(stored);  
    }
  }, [navigate]);

  const handleLogout = () => {
    removeItem("accessToken");
    removeItem("userInfo");
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50 animate-fadeIn">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-xl p-6 space-y-6 transition-all duration-500 ease-in-out animate-slideInLeft">
        <h2 className="text-2xl font-bold text-teal-700 mb-4 tracking-wide flex items-center gap-2">
          <Syringe className="w-14 h-14 text-teal-700 animate-pulse" />
          KidTrack Manager
        </h2>

        <nav className="space-y-2">
           <Link
            to="/manager/dashboard"
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-md
              ${location.pathname === "/manager/dashboard" ? "bg-teal-100 text-teal-800 font-semibold" : "text-gray-700 hover:bg-teal-100 hover:text-teal-800"}`}
          >
            <Users className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" />
            Dashboard
          </Link>
          <Link
            to="/manager/staffs-management"
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-md
              ${location.pathname === "/manager/staffs-management" ? "bg-teal-100 text-teal-800 font-semibold" : "text-gray-700 hover:bg-teal-100 hover:text-teal-800"}`}
          >
            <Users className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" />
            Quản lý nhân viên 
          </Link>

          <Link
            to="/manager/facility-management"
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-md
              ${location.pathname === "/manager/facility-management" ? "bg-teal-100 text-teal-800 font-semibold" : "text-gray-700 hover:bg-teal-100 hover:text-teal-800"}`}
          >
            <Building2 className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" />
            Trung tâm tiêm chủng
          </Link>

          <Link
            to="/manager/vaccines-management"
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-md
              ${location.pathname === "/manager/vaccines-management" ? "bg-teal-100 text-teal-800 font-semibold" : "text-gray-700 hover:bg-teal-100 hover:text-teal-800"}`}
          >
            <Syringe className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" />
            Quản lý vaccine
          </Link>

            <Link
            to="/manager/survey-management"
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-md
              ${location.pathname === "/manager/survey-management" ? "bg-teal-100 text-teal-800 font-semibold" : "text-gray-700 hover:bg-teal-100 hover:text-teal-800"}`}
          >
            <File className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" />
            Phiếu thăm khám
          </Link>
          
          <Link
            to="/manager/vaccine-packages"
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-md
              ${location.pathname === "/manager/vaccine-packages" ? "bg-teal-100 text-teal-800 font-semibold" : "text-gray-700 hover:bg-teal-100 hover:text-teal-800"}`}
          >
            <Package className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" />
            Gói tiêm chủng trẻ em
          </Link>

          <Link
            to="/manager/schedule-slots"
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-md
              ${location.pathname === "/manager/schedule-slots" ? "bg-teal-100 text-teal-800 font-semibold" : "text-gray-700 hover:bg-teal-100 hover:text-teal-800"}`}
          >
            <Calendar className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" />
            Lịch tiêm chủng
          </Link>

          <Link
            to="/manager/payment-accounts"
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-md
              ${location.pathname === "/manager/payment-accounts" ? "bg-teal-100 text-teal-800 font-semibold" : "text-gray-700 hover:bg-teal-100 hover:text-teal-800"}`}
          >
            <DollarSign className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" />
            Tài khoản thanh toán
          </Link>

           <Link
            to="/manager/order"
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-md
              ${location.pathname === "/manager/order" ? "bg-teal-100 text-teal-800 font-semibold" : "text-gray-700 hover:bg-teal-100 hover:text-teal-800"}`}
          >
            <ScrollText className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" />
            Order
          </Link>
        </nav>
      </aside>

      <main className="flex-1 p-6 overflow-y-auto animate-fadeIn">
        <div className="flex justify-between items-center mb-6">
          <div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600 text-lg">Xin chào, <b>{userInfo?.accountName}</b></span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:cursor-pointer text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all duration-300 transform hover:scale-105"
            >
              Đăng xuất
            </button>
          </div>
        </div>

        <Outlet />
      </main>
    </div>
  );
}