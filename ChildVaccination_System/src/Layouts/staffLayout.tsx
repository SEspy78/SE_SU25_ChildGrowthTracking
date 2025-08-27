import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Syringe } from "lucide-react";
import { useState, useEffect } from "react";
import { removeItem } from "@/lib/storage";

export default function StaffLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [active, setActive] = useState("schedule");

  // Define sidebar items with their corresponding routes
  const sidebarItems = [
    { label: "Lịch hôm nay", route: "/staff/appointments", key: "schedule" },
    { label: "Vắc xin cơ sở", route: "/staff/facility-vaccines", key: "facility-vaccines" },
    { label: "Gói vắc xin cơ sở", route: "/staff/vaccine-packages", key: "vaccine-packages" },
    { label: "Quản lý tài khoản", route: "/staff/account-management", key: "account-management" },
  ];

  // Update active state based on current route
  useEffect(() => {
    const currentItem = sidebarItems.find((item) => item.route === location.pathname);
    if (currentItem) {
      setActive(currentItem.key);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    removeItem("accessToken");
    removeItem("userInfo");
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen">
      <aside
        className="w-64 bg-blue-800 text-white px-6 py-8 flex flex-col justify-between"
        style={{ position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 20 }}
      >
        <div>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <Syringe size={24} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-white">KidTrack</span>
          </div>

          <nav className="space-y-3">
            {sidebarItems.map((item) => (
              <SidebarItem
                key={item.key}
                label={item.label}
                active={active === item.key}
                onClick={() => {
                  setActive(item.key);
                  navigate(item.route);
                }}
              />
            ))}
          </nav>
        </div>
        <button
          onClick={handleLogout}
          className="w-full mb-2 bg-red-500 hover:bg-red-600 hover:cursor-pointer text-white py-2 rounded-lg transition-all duration-300"
        >
          Đăng xuất
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 overflow-y-auto" style={{ marginLeft: "16rem" }}>
        <Outlet />
      </main>
    </div>
  );
}

function SidebarItem({
  label,
  active = false,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer px-3 py-2 rounded-md transition ${
        active ? "bg-white text-blue-800 font-semibold" : "hover:bg-blue-700 text-white"
      }`}
    >
      {label}
    </div>
  );
}