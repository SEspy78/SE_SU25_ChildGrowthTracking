import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import vaccineImage from "../assets/vaccine-illustration.png";

const HeroSection: React.FC = () => (
  <section className="relative py-20 overflow-hidden md:py-24">
    <div className="flex flex-col items-center px-4 mx-auto md:flex-row max-w-7xl sm:px-6 lg:px-8">
      <div className="mb-12 text-center md:w-1/2 md:text-left md:mb-0">
        <h1 className="mb-6 text-3xl font-bold leading-tight text-gray-800 md:text-4xl lg:text-5xl">
          Hệ thống quản lý cơ sở tiêm chủng <br />
          <span className="text-blue-600">Vaccination System</span>
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

// export default function HeroSection() {
//   return (
//     <section className="bg-gradient-to-r from-blue-50 to-blue-100 py-16 px-6 md:px-20">
//       <div className="max-w-6xl mx-auto flex flex-col-reverse md:flex-row items-center justify-between gap-10">
        
//         {/* PHẦN VĂN BẢN BÊN TRÁI */}
//         <div className="md:w-1/2 text-center md:text-left">
//           <h1 className="text-4xl md:text-5xl font-bold text-blue-800 leading-tight">
//             Hệ thống quản lý cơ sở tiêm chủng
//           </h1>
//           <p className="mt-4 text-lg text-gray-700">
//             Theo dõi lịch tiêm, quản lý mũi tiêm và hồ sơ sức khoẻ trẻ em một cách dễ dàng và chính xác.
//           </p>
//           <div className="mt-8 flex justify-center md:justify-start gap-4">
//             <a
//               href="/login"
//               className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition"
//             >
//               Đăng nhập hệ thống
//             </a>
//             <a
//               href="/about"
//               className="text-blue-700 hover:underline font-medium py-3 px-6"
//             >
//               Tìm hiểu thêm
//             </a>
//           </div>
//         </div>

//         {/* PHẦN HÌNH ẢNH BÊN PHẢI */}
//         <div className="md:w-1/2 flex justify-center">
//           <img
//             src={vaccineImage} 
//             alt="Vaccine illustration"
//             className="w-max h-auto "
//           />
//         </div>
//       </div>
//     </section>
//   )
// }


