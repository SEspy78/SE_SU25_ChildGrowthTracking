import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import vaccineImage from "../assets/vaccine-illustration.png";

const HeroSection: React.FC = () => (
  <section className="relative py-20 overflow-hidden md:py-24">
    <div className="flex flex-col items-center px-4 mx-auto md:flex-row max-w-7xl sm:px-6 lg:px-8">
      <div className="mb-12 text-center md:w-1/2 md:text-left md:mb-0">
        <h1 className="mb-6 text-3xl font-bold leading-tight text-gray-800 md:text-4xl lg:text-5xl">
          Hệ thống quản lý cơ sở tiêm chủng <br />
          <span className="text-blue-600">KID TRACK </span>
        </h1>
        <p className="max-w-lg mb-8 text-sm text-gray-600 md:text-base">
          Quản lý lịch tiêm, chỉ định mũi tiêm và theo dõi sức khoẻ trẻ em một cách dễ dàng và chính xác.
        </p>
        <Link to="/register">
          <Button
            className="px-4 py-2 md:px-6 md:py-3 md:text-sm"
          >
            Đăng kí ngay
          </Button>
        </Link>
      </div>
      <div className="flex justify-center md:w-1/2">
        <div className="relative">
            <img
            src={vaccineImage} 
            alt="Vaccine illustration"
            className="w-7xl h-auto "
          />
          <div className="absolute top-0 left-0 w-12 h-12 rounded-full md:w-16 md:h-16 bg-blue-400/20 animate-pulse" />
          <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full md:w-12 md:h-12 bg-blue-200/20 animate-pulse" />
          <div className="absolute w-8 h-8 rounded-full md:w-10 md:h-10 top-1/3 right-1/3 bg-white/10 animate-pulse" />
        </div>
      </div>
    </div>
  </section>
);

export default HeroSection;


