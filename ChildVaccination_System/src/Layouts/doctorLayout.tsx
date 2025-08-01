import { Outlet, NavLink } from "react-router-dom"
import { useNavigate } from "react-router-dom"
import { removeItem } from "@/lib/storage"

export default function DoctorLayout() {
  const navigate = useNavigate();
  const handleLogout = () => {
    removeItem("accessToken");
    removeItem("userInfo");
    navigate("/login");
  };
  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}

      {/* Main Content */}
      <main className="flex-1 p-6">
        {/* Top Navbar */}
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-semibold">Welcome, Doctor 👨‍⚕️</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">Dr. Nguyễn Văn Toàn </span>
            <button className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600" onClick={handleLogout}>
              Đăng xuất
            </button>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  )
}
