import { Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-indigo-50 to-blue-100 border-t border-white/20">
      <div className="px-6 py-12 mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* Logo & About */}
          <div className="pr-6">
            <h2 className="mb-4 text-3xl font-bold text-gray-800 tracking-tight">
              KidTrack
            </h2>
            <p className="text-sm leading-relaxed text-gray-600">
              Phần mềm quản lý tiêm chủng KidTrack cung cấp giải pháp quản lý toàn diện quy trình tiêm chủng tại các cơ sở, tối ưu hóa vận hành, nâng cao hiệu suất kinh doanh và cải thiện trải nghiệm chăm sóc khách hàng.
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:ml-10">
            <h3 className="mb-4 text-lg font-semibold text-indigo-700">
              Liên kết nhanh
            </h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li>
                <Link
                  to="/login"
                  className="transition-all duration-200 hover:text-indigo-600 hover:scale-105 inline-block"
                >
                  Đăng nhập
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="transition-all duration-200 hover:text-indigo-600 hover:scale-105 inline-block"
                >
                  Đăng ký
                </Link>
              </li>
              <li>
                <Link
                  to="/forgot-password"
                  className="transition-all duration-200 hover:text-indigo-600 hover:scale-105 inline-block"
                >
                  Quên mật khẩu
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="transition-all duration-200 hover:text-indigo-600 hover:scale-105 inline-block"
                >
                  Liên hệ hỗ trợ
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-indigo-700">
              Liên hệ
            </h3>
            <ul className="space-y-4 text-sm text-gray-600">
              <li className="flex items-center gap-3">
                <Mail className="text-indigo-600" size={18} />
                <span>support@kidtrack.com</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="text-indigo-600" size={18} />
                <span>+84 81 862 1315</span>
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="text-indigo-600" size={18} />
                <span>TP Hồ Chí Minh, Việt Nam</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 mt-12 text-sm font-medium text-center text-gray-500 border-t border-gray-200/50">
          © 2025 KidTrack. Bảo mật – Chính xác – Chuyên nghiệp.
        </div>
      </div>
    </footer>
  );
};

export default Footer;