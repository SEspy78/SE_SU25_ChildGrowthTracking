import { Outlet, Link, useNavigate } from "react-router-dom";
import { getItemWithExpiry, removeItem } from "@/lib/storage";
import { useEffect, useState } from "react";
import { 
  Users, 
  Building2, 
  Syringe, 
  BarChart2 
} from "lucide-react";

export default function ManagerLayout() {
  const navigate = useNavigate();
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
      to="/manger/staff-management"
      className="flex items-center gap-3 px-4 py-2 rounded-md text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition-all duration-200"
    >
      <Users className="w-5 h-5" />
      Quản lý nhân viên
    </Link>

    <Link
      to="/manager/facility-management"
      className="flex items-center gap-3 px-4 py-2 rounded-md text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition-all duration-200"
    >
      <Building2 className="w-5 h-5" />
      Quản lý cơ sở
    </Link>

    <Link
      to="/manager/vaccines"
      className="flex items-center gap-3 px-4 py-2 rounded-md text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition-all duration-200"
    >
      <Syringe className="w-5 h-5" />
      Quản lý vaccine cơ sở 
    </Link>
    
  </nav>
</aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Header */}
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

        {/* Render nội dung page */}
        <Outlet />
      </main>
    </div>
  );
}
