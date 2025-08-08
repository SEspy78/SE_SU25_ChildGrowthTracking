import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { getItemWithExpiry, removeItem } from "@/lib/storage";
import { useEffect, useState } from "react";
import {
  Users,
  Building2,
  Syringe,
  BarChart2,
  NotebookPen,
} from "lucide-react";


export default function AdminLayout() {
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
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
   <aside className="w-64 bg-white shadow-lg p-6 space-y-6 transition-all duration-300 ease-in-out">
  <h2 className="text-xl font-bold text-blue-700 mb-4 tracking-wide">
    Admin Dashboard
  </h2>

  <nav className="space-y-2">
    <Link
      to="/admin/members"
      className={`flex items-center gap-3 px-4 py-2 rounded-md transition-all duration-200
        ${location.pathname.startsWith('/admin/accounts') ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-blue-100 hover:text-blue-700'}`}
    >
      <Users className="w-5 h-5" />
      Quản lí người dùng 
    </Link>

    <Link
      to="/admin/facilities"
      className={`flex items-center gap-3 px-4 py-2 rounded-md transition-all duration-200
        ${location.pathname.startsWith('/admin/facilities') ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-blue-100 hover:text-blue-700'}`}
    >
      <Building2 className="w-5 h-5" />
      Quản lý cơ sở
    </Link>

    <Link
      to="/admin/vaccines"
      className={`flex items-center gap-3 px-4 py-2 rounded-md transition-all duration-200
        ${location.pathname.startsWith('/admin/vaccines') ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-blue-100 hover:text-blue-700'}`}
    >
      <Syringe className="w-5 h-5" />
      Quản lý vaccine
    </Link>

    <Link
      to="/admin/statistics"
      className={`flex items-center gap-3 px-4 py-2 rounded-md transition-all duration-200
        ${location.pathname.startsWith('/admin/statistics') ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-blue-100 hover:text-blue-700'}`}
    >
      <BarChart2 className="w-5 h-5" />
      Thống kê
    </Link>
    <Link
      to="/admin/blogs"
      className={`flex items-center gap-3 px-4 py-2 rounded-md transition-all duration-200
        ${location.pathname.startsWith('/admin/blogs') ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-blue-100 hover:text-blue-700'}`}
    >
      <NotebookPen className="w-5 h-5" />
      Quản lý Blog
    </Link>
  </nav>
</aside>

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600 text-2xl font-normal">Welcome, <b >{userInfo?.accountName}</b></span>
            <button
              onClick={handleLogout}
              className="bg-red-500 shadow-md rounded-md hover:cursor-pointer text-white px-4 py-2  hover:bg-red-600"
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
