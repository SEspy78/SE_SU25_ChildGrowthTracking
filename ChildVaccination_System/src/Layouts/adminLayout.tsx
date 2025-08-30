import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { getItemWithExpiry, removeItem } from "@/lib/storage";
import { useEffect, useState } from "react";
import {
  Users,
  Building2,
  Syringe,
  BarChart2,
  NotebookPen,
  Menu,
  X,
  LogOut,
  User,
  ClipboardList,
  UserPlus,
} from "lucide-react";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userInfo, setUserInfo] = useState<{ accountName: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const navItems = [
    {
      to: "/admin/dashBoard",
      icon: ClipboardList,
      label: "Dashboard",
      path: "/admin/dashBoard"
    },
    {
      to: "/admin/members",
      icon: Users,
      label: "Quản lí người dùng",
      path: "/admin/members"
    },
    {
      to: "/admin/facilities",
      icon: Building2,
      label: "Quản lý cơ sở",
      path: "/admin/facilities"
    },
    {
      to: "/admin/vaccines",
      icon: Syringe,
      label: "Quản lý vaccine",
      path: "/admin/vaccines"
    },
    {
      to: "/admin/order",
      icon: BarChart2,
      label: "Order",
      path: "/admin/order"
    },
    {
      to: "/admin/blogs",
      icon: NotebookPen,
      label: "Quản lý Blog",
      path: "/admin/blogs"
    },
    {
      to: "/admin/create-account",
      icon: UserPlus,
      label: "Tạo tài khoản cho cơ sở ",
      path: "/admin/create-account"
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile menu overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-blue-700 tracking-wide">
            Admin Dashboard
          </h2>
          <button
            onClick={closeSidebar}
            className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-6 space-y-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={closeSidebar}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium
                  ${isActive 
                    ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500' 
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User info in sidebar for mobile */}
        <div className="lg:hidden p-6 border-t border-gray-200 mt-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{userInfo?.accountName}</p>
              <p className="text-sm text-gray-500">Administrator</p>
            </div>
          </div>
         
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="hidden lg:flex items-center space-x-4">
                <span className="text-gray-600">
                  Welcome, <span className="font-semibold text-gray-900">{userInfo?.accountName}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="flex hover:cursor-pointer items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Đăng xuất</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
