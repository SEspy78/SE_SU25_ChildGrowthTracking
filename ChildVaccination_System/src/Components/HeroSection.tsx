import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import vaccineImage from "../assets/download.png";

const HeroSection = () => (
  <section className="relative py-16 md:py-24 overflow-hidden bg-gradient-to-br from-indigo-50 via-blue-100 to-purple-100">
    <div className="flex flex-col items-center px-4 mx-auto max-w-7xl sm:px-6 lg:px-8 md:flex-row">
      <div className="mb-12 text-center md:w-1/2 md:text-left md:mb-0">
        <h1 className="mb-6 text-3xl font-bold leading-tight text-gray-800 md:text-4xl lg:text-5xl tracking-tight">
          Hệ thống quản lý cơ sở tiêm chủng <br />
          <span className="text-indigo-600">KID TRACK</span>
        </h1>
        <p className="max-w-lg mx-auto mb-8 text-sm text-gray-600 md:text-base md:mx-0 leading-relaxed">
          Quản lý lịch tiêm, chỉ định mũi tiêm và theo dõi sức khỏe trẻ em một cách dễ dàng, chính xác và chuyên nghiệp.
        </p>
        <Link to="/register">
          <Button className="px-6 py-3 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
            Đăng ký ngay
          </Button>
        </Link>
      </div>
      <div className="flex justify-center md:w-1/2 relative">
        <div className="relative transform transition-all duration-500 scale-130 hover:scale-135">
          <img
            src={vaccineImage}
            alt="Vaccine illustration"
            className="w-full h-auto max-w-md"
          />
          <div className="absolute top-0 left-0 w-16 h-16 rounded-full bg-indigo-400/20 animate-pulse" />
          <div className="absolute bottom-0 right-0 w-12 h-12 rounded-full bg-blue-200/20 animate-pulse" />
          <div className="absolute w-10 h-10 rounded-full top-1/3 right-1/4 bg-white/10 animate-pulse" />
          <div className="absolute -inset-4 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50 animate-shimmer" />
        </div>
      </div>
    </div>
  </section>
);

export default HeroSection;