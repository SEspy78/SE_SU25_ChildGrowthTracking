import { Lock, Rocket, ShieldCheck, Users } from "lucide-react";
import type { Feature } from "../Components/types/type";

const features: Feature[] = [
  {
    icon: ShieldCheck,
     title: "Đầy đủ quy trình ",
    description:
      "Đáp ứng đầy đủ quy trình tiêm của cơ sở, giảm thiểu thao tác người dùng.",
  },
  {
    icon: Lock,
    title: "Quản lí và phân quyền ",
    description: "Quản lí và phân quyền chi tiết theo vai trò từng bộ phận, giúp cơ sở hoạt động hiệu quả.",
  },
  {
    icon: Rocket,
    title: "Báo cáo thống kê ",
    description: "Tổng hợp đầy đủ các báo cáo doanh thu, kho lưu trữ vaccine,...",
  },
  {
    icon: Users,
    title: "Hỗ trợ chuyên gia",
    description: "Đội ngũ tư vấn 24/7, giải đáp mọi thắc mắc về quá trình tiêm.",
  },
];

const FeaturesSection: React.FC = () => (
  <section id="features" className="py-16 md:py-20 bg-white">
    <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
      <h2 className="mb-8 text-2xl md:text-4xl font-bold text-center text-gray-800">
        Lợi ích của Phần mềm quản lý tiêm chủng Vaccination system.
      </h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {features.map((feature, index) => (
          <div
            key={index}
            className="p-6 text-center transition-shadow border border-blue-200 rounded-lg shadow-md bg-blue-50 hover:shadow-lg"
          >
            <feature.icon size={40} className="mx-auto mb-4 text-blue-600" />
            <h3 className="mb-2 text-lg md:text-xl font-semibold text-gray-800">
              {feature.title}
            </h3>
            <p className="text-sm md:text-base text-gray-600">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
