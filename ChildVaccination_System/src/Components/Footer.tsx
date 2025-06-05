import { Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => {
  return (
    <footer className="bg-cyan-400 border-t border-blue-100">
      <div className="px-6 py-12 mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* Logo & About */}
          <div className="mr-10">
            <h2 className="mb-4 text-2xl font-bold text-black">Vaccination System</h2>
            <p className="text-sm leading-relaxed font-bold text-gray-600">
             Phần mềm quản lý tiêm chủng SMED quản lý tổng thể, toàn diện quy trình tiêm chủng dịch vụ tại các cơ sở tiêm, đáp ứng nhu cầu quản trị vận hành, đồng thời tăng hiệu suất kinh doanh và chăm sóc khách hàng tại cơ sở.
            </p>
          </div>

          {/* Quick Links */}
          <div className="ml-20">
            <h3 className="mb-4 text-lg font-semibold text-black">Liên kết nhanh</h3>
            <ul className="space-y-2 text-md text-gray-600">
              <li>
                <Link to="/login" className="transition-colors hover:text-blue-600">
                  Đăng nhập
                </Link>
              </li>
              <li>
                <Link to="/register" className="transition-colors hover:text-blue-600">
                  Đăng ký
                </Link>
              </li>
              <li>
                <Link to="/forgot-password" className="transition-colors hover:text-blue-600">
                  Quên mật khẩu
                </Link>
              </li>
              <li>
                <Link to="/contact" className="transition-colors hover:text-blue-600">
                  Liên hệ hỗ trợ
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-blue-700">Liên hệ</h3>
            <ul className="space-y-3 text-md text-gray-600">
              <li className="flex items-start gap-2">
                <Mail className="text-black" size={16} />
                <span>jsdjzxhcjas@support.com</span>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="text-black" size={16} />
                <span>+84 81 862 1315</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="text-black" size={16} />
                <span>TP Ho Chi Minh, Vietnam</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 mt-12 text-sm font-bold text-center text-gray-500 border-t border-gray-200">
          © 2025 VaccinationSystem. Bảo mật – Chính xác – Chuyên nghiệp.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
