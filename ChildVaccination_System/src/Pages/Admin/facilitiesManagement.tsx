import React, { useEffect, useState } from "react";
import { facilityApi } from "@/api/vaccinationFacilitiesApi";
import type { Facility } from "@/api/vaccinationFacilitiesApi";

const FacilityManagement: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  
useEffect(() => {
  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const res = await facilityApi.getAll();
      setFacilities(res.data); 
    } catch (err: any) {
      setError(err?.message || "Đã xảy ra lỗi khi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  fetchFacilities();
}, []);
  return (
    <div className="p-6">
         <main className="flex-1 p-8 bg-gray-50 overflow-y-auto shadow-lg border rounded-md">
      <h1 className="text-3xl font-semibold mb-8">Quản lý cơ sở</h1>

      {loading && <p className="text-gray-500">Đang tải dữ liệu...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto rounded shadow">
          <table className="min-w-full border rounded-lg overflow-hidden border-black shadow-sm">
            <thead className="bg-blue-100 text-blue-800">
              <tr>
                <th className="p-3 border">Tên cơ sở</th>
                <th className="p-3 border">Số giấy phép</th>
                <th className="p-3 border">Địa chỉ</th>
                <th className="p-3 border">Số điện thoại</th>
                <th className="p-3 border">Email</th>
                <th className="p-3 border">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {facilities.map((facility) => (
                <tr key={facility.facilityId} className="hover:bg-gray-50">
                  <td className="p-3 border">{facility.facilityName}</td>
                  <td className="p-3 border">{facility.licenseNumber}</td>
                  <td className="p-3 border">{facility.address}</td>
                  <td className="p-3 border">{facility.phone}</td>
                  <td className="p-3 border">{facility.email}</td>
                  <td className="p-3 border">
                    {facility.status === 1 ? "Hoạt động" : "Ngừng hoạt động"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </main>
    </div>
  );
};

export default FacilityManagement;
