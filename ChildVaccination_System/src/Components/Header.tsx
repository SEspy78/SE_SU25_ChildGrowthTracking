import { Syringe } from "lucide-react";
import { Link,useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useEffect, useState } from "react"
import { getItemWithExpiry, removeItem } from "@/lib/storage"


const Header: React.FC = () => {
  const [user, setUser] = useState<{ accountName: string } | null>(null)
  const navigate = useNavigate();

   useEffect(() => {
    const stored = getItemWithExpiry("userInfo")
    if (stored) {
      const parsed = typeof stored === "string" ? JSON.parse(stored) : stored
      setUser(parsed)
    }
  }, [])

  const handleLogout = () => {
    removeItem("userInfo")
    removeItem("accessToken")
    setUser(null)
    navigate("/")
  }

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
            <Syringe size={24} className="text-white" />
          </div>
          <Link to="/">
          <span className="text-2xl font-bold text-gray-800">KidTrack</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex space-x-8">
          <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">
            Dịch vụ
          </a>
          <a href="#about" className="text-gray-600 hover:text-blue-600 transition-colors">
            Về chúng tôi
          </a>
          <a href="#contact" className="text-gray-600 hover:text-blue-600 transition-colors">
            Liên hệ
          </a>
        </nav>

        {/* Actions */}
       <div className="flex items-center justify-end p-4 space-x-4">
      {user ? (
        <div className="flex items-center space-x-4">
          <span className="text-gray-700 font-medium">
            Chào, <strong>{user.accountName}</strong>
          </span>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="border-gray-300 hover:bg-red-50"
          >
            Đăng xuất
          </Button>
        </div>
      ) : (
        <div className="flex items-center space-x-4">
          <Link
            to="/login"
            className="text-blue-600 font-semibold hover:text-blue-800 transition-colors"
          >
            Đăng nhập
          </Link>
          <Link to="/register">
            <Button className="bg-blue-600 border-none hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all">
              Đăng ký ngay
            </Button>
          </Link>
        </div>
      )}
    </div>
      </div>
    </header>
  );
};

export default Header;