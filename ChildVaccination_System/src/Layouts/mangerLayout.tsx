import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { getItemWithExpiry, removeItem } from "@/lib/storage";
import { useEffect, useState } from "react";
import { 
  Users, 
  Building2, 
  Syringe, 
  Package,
  Calendar
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
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
   <aside className="w-64 bg-white shadow-lg p-6 space-y-6 transition-all duration-300 ease-in-out">
  <h2 className="text-xl font-bold text-blue-700 mb-4 tracking-wide">
    Manager DashBoard
  </h2>

  <nav className="space-y-2">
    <Link
      to="/manager/staffs-management"
      className={`flex items-center gap-3 px-4 py-2 rounded-md transition-all duration-200
        ${location.pathname === "/manager/staffs-management" ? "bg-blue-100 text-blue-700 font-semibold" : "text-gray-700 hover:bg-blue-100 hover:text-blue-700"}`}
    >
      <Users className="w-5 h-5" />
      Quản lý nhân viên
    </Link>

    <Link
      to="/manager/facility-management"
      className={`flex items-center gap-3 px-4 py-2 rounded-md transition-all duration-200
        ${location.pathname === "/manager/facility-management" ? "bg-blue-100 text-blue-700 font-semibold" : "text-gray-700 hover:bg-blue-100 hover:text-blue-700"}`}
    >
      <Building2 className="w-5 h-5" />
       Cơ sở 
    </Link>

    <Link
      to="/manager/vaccines-management"
      className={`flex items-center gap-3 px-4 py-2 rounded-md transition-all duration-200
        ${location.pathname === "/manager/vaccines-management" ? "bg-blue-100 text-blue-700 font-semibold" : "text-gray-700 hover:bg-blue-100 hover:text-blue-700"}`}
    >
      <Syringe className="w-5 h-5" />
      Quản lý vaccine cơ sở 
    </Link>
    
    <Link
      to="/manager/vaccine-packages"
      className={`flex items-center gap-3 px-4 py-2 rounded-md transition-all duration-200
        ${location.pathname === "/manager/vaccine-packages" ? "bg-blue-100 text-blue-700 font-semibold" : "text-gray-700 hover:bg-blue-100 hover:text-blue-700"}`}
    >
      <Package className="w-5 h-5" />
      Gói vaccines
    </Link>

     <Link
      to="/manager/schedule-slots"
      className={`flex items-center gap-3 px-4 py-2 rounded-md transition-all duration-200
        ${location.pathname === "/manager/schedule-slots" ? "bg-blue-100 text-blue-700 font-semibold" : "text-gray-700 hover:bg-blue-100 hover:text-blue-700"}`}
    >
      <Calendar className="w-5 h-5" />
       Lịch khám
    </Link>
    
  </nav>
</aside>

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Xin chào, <b>{userInfo?.accountName}</b></span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:cursor-pointer text-white px-4 py-2 rounded hover:bg-red-600"
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
