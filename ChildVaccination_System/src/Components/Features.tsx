import { Lock, Rocket, ShieldCheck, Users } from "lucide-react";
import type { Feature } from "../Components/types/type";

const features: Feature[] = [
  {
    icon: ShieldCheck,
    title: "Đầy đủ quy trình",
    description:
      "Đáp ứng đầy đủ quy trình tiêm của cơ sở, giảm thiểu thao tác người dùng.",
  },
  {
    icon: Lock,
    title: "Quản lý và phân quyền",
    description: "Quản lý và phân quyền chi tiết theo vai trò từng bộ phận, giúp cơ sở hoạt động hiệu quả.",
  },
  {
    icon: Rocket,
    title: "Báo cáo thống kê",
    description: "Tổng hợp đầy đủ các báo cáo doanh thu, kho lưu trữ vaccine,...",
  },
  {
    icon: Users,
    title: "Hỗ trợ chuyên gia",
    description: "Đội ngũ tư vấn 24/7, giải đáp mọi thắc mắc về quá trình tiêm.",
  },
];

const FeaturesSection = () => (
  <section id="features" className="py-16 md:py-24 bg-gradient-to-br from-indigo-50 via-blue-100 to-purple-100">
    <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
      <h2 className="mb-10 text-3xl md:text-4xl font-bold text-center text-gray-800 tracking-tight">
        Lợi ích của Phần mềm quản lý tiêm chủng KidTrack
      </h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {features.map((feature, index) => (
          <div
            key={index}
            className="relative p-6 text-center bg-white/30 backdrop-blur-lg border border-white/20 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50 animate-shimmer" />
            <feature.icon size={48} className="mx-auto mb-4 text-indigo-600" />
            <h3 className="mb-3 text-lg md:text-xl font-semibold text-gray-800">
              {feature.title}
            </h3>
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;