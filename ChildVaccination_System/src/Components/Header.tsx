import { Syringe } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { getItemWithExpiry, removeItem } from "@/lib/storage";

const Header = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = getItemWithExpiry("userInfo");
    if (stored) {
      const parsed = typeof stored === "string" ? JSON.parse(stored) : stored;
      setUser(parsed);
    }
  }, []);

  const handleLogout = () => {
    removeItem("userInfo");
    removeItem("accessToken");
    setUser(null);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-white/30 backdrop-blur-lg border-b border-white/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-3 transform transition-all duration-300 hover:scale-105">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-md">
            <Syringe size={28} className="text-white" />
          </div>
          <Link to="/">
            <span className="text-2xl font-bold text-gray-800 tracking-tight">
              KidTrack
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex space-x-10">
          <a
            href="#features"
            className="text-gray-600 font-medium hover:text-indigo-600 transition-all duration-200 hover:scale-110"
          >
            Dịch vụ
          </a>
          <a
            href="#about"
            className="text-gray-600 font-medium hover:text-indigo-600 transition-all duration-200 hover:scale-110"
          >
            Về chúng tôi
          </a>
          <a
            href="#contact"
            className="text-gray-600 font-medium hover:text-indigo-600 transition-all duration-200 hover:scale-110"
          >
            Liên hệ
          </a>
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 font-medium">
                 <strong>Welcome</strong>
              </span>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="border-indigo-300 bg-white/50 hover:bg-red-100 text-indigo-700 font-semibold rounded-lg px-4 py-2 transition-all duration-300 hover:shadow-md"
              >
                Đăng xuất
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
             
              <Link to="/login">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg px-6 py-2 shadow-md hover:shadow-lg transition-all duration-300">
                 Đăng nhập
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