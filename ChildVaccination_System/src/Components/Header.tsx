import { Syringe } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
            <Syringe size={24} className="text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-800">KidTrack</span>
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
        <div className="flex items-center space-x-4">
          <Link
            to="/login"
            className="text-blue-600 font-semibold hover:text-blue-800 transition-colors"
          >
            Đăng nhập
          </Link>
          <Link to="/register">
            <Button
              className="bg-blue-600 border-none hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all"
            >
              Đăng ký ngay
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;