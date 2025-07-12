import React, { useEffect, useState } from "react";
import { facilityApi } from "@/api/vaccinationFacilitiesApi";
import type { Facility } from "@/api/vaccinationFacilitiesApi";
import { getUserInfo } from "@/lib/storage";
 import { Pencil,  Building2 } from "lucide-react";
const FacilityDetail: React.FC = () => {
  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = getUserInfo();


  useEffect(() => {
  const fetchFacility = async () => {
     if (!user?.facilityId) return;
    try {
      setLoading(true);
      const response = await facilityApi.getById(user.facilityId);
      setFacility(response.data); 

      console.log(response.message);
    } catch (err: any) {
      setError(err.message || "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  };
  fetchFacility(); 
}, [user?.facilityId]);


  const handleUpdate = () => {
    alert("Chuyển sang trang cập nhật cơ sở!");
    // TODO: Redirect đến form cập nhật
  };

  const handleDelete = () => {
    if (confirm("Bạn có chắc chắn muốn xoá cơ sở này?")) {
      alert("Đã xoá (mô phỏng)");
      // TODO: Gọi API xoá ở đây nếu có
    }
  };

  if (loading) return <p className="p-4">Đang tải dữ liệu...</p>;
  if (error) return <p className="p-4 text-red-600">{error}</p>;
  if (!facility) return <p className="p-4"> Không tìm thấy thông tin cơ sở.</p>;

  return (
<div className="p-6 max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100">
  <div className="flex justify-between items-center mb-6">
    <div className="flex items-center gap-3">
      <Building2 className="w-8 h-8 text-blue-600" />
      <h1 className="text-2xl font-bold text-gray-800">Thông tin cơ sở tiêm chủng</h1>
    </div>
    <div className="space-x-2">
    </div>
  </div>

  <table className="w-full text-sm text-left table-auto border border-gray-200 rounded-lg overflow-hidden">
    <tbody className="text-gray-700">
      {[
        { label: "Tên cơ sở", value: facility.facilityName },
        { label: "Giấy phép", value: facility.licenseNumber },
        { label: "Địa chỉ", value: facility.address },
        { label: "Số điện thoại", value: facility.phone },
        { label: "Email", value: facility.email },
        { label: "Mô tả", value: facility.description },
      ].map((row, idx) => (
        <tr
          key={idx}
          className="border-b hover:bg-gray-100 transition group"
        >
          <td className="font-semibold px-4 py-3 w-48 bg-gray-100">{row.label}</td>
          <td className="px-4 py-3 flex justify-between items-center">
            <span>{row.value}</span>
            <button
              className="text-blue-500 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition"
              title={`Cập nhật ${row.label.toLowerCase()}`}
            >
              <Pencil className="w-4 h-4" />
            </button>
          </td>
        </tr>
      ))}

      <tr className="hover:bg-gray-100 transition">
        <td className="font-semibold px-4 py-3 bg-gray-100">Trạng thái</td>
        <td className="px-4 py-3 flex justify-between items-center">
          {facility.status === 1 ? (
            <span className="text-green-600 font-medium">● Hoạt động</span>
          ) : (
            <span className="text-gray-500 font-medium">● Ngừng hoạt động</span>
          )}
          <button
            className="text-blue-500 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition"
            title="Cập nhật trạng thái"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</div>


  );
};

export default FacilityDetail;
