import React, { useEffect, useState } from "react";
import { vaccineApi } from "@/api/vaccineApi";
import type { Vaccine } from "@/api/vaccineApi";
import { Pencil, Trash2 } from "lucide-react";
const VaccineManagement: React.FC = () => {
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVaccines = async () => {
      try {
        setLoading(true);
        const data = await vaccineApi.getAll();
        setVaccines(data);
      } catch (err: any) {
        setError(err.message || "Lỗi không xác định");
      } finally {
        setLoading(false);
      }
    };

    fetchVaccines();
  }, []);

  const handleDelete = (id: number) => {
    if (confirm("Bạn có chắc muốn xoá vaccine này không?")) {
      setVaccines((prev) => prev.filter((v) => v.vaccineId !== id));
    }
  };

  const handleUpdate = (id: number) => {
    
    alert(`Cập nhật vaccine với ID: ${id}`);
  };

  return (
    <div className="p-6">
      <main className="flex-1 p-8 bg-gray-50 overflow-y-auto shadow-lg border rounded-md">
        <h1 className="text-3xl font-semibold mb-8">Quản lý Vaccine</h1>

        {loading && (
          <div className="text-blue-600 text-sm">Đang tải dữ liệu...</div>
        )}
        {error && <p className="text-red-500 font-semibold">{error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full border-1 border-black shadow-sm">
              <thead className="bg-blue-100  text-blue-800">
                <tr>
                  <th className="px-4 py-2 text-left border">Tên vaccine</th>
                  <th className="px-4 py-2 text-left border">Nhà sản xuất</th>
                  <th className="px-4 py-2 text-left border">Độ tuổi</th>
                   <th className="px-4 py-2 text-left border">Loại</th>
                  <th className="px-4 py-2 text-center border">Số liều</th>
                  <th className="px-4 py-2 text-center border">Tác dụng phụ</th>
                  <th className="px-4 py-2 text-right border">Giá (₫)</th>
                  <th className="px-4 py-2 text-center border">Trạng thái</th>
                  <th className="px-9 py-2 text-center border"></th>
                </tr>
              </thead>
              <tbody className="bg-white border-1 border-black text-gray-800">
                {vaccines.map((vaccine) => (
                  <tr
                    key={vaccine.vaccineId}
                    className="hover:bg-blue-50 transition-colors"
                  >
                    <td className="px-4 py-2 border">{vaccine.name}</td>
                    <td className="px-4 py-2 border">{vaccine.manufacturer}</td>
                    <td className="px-4 py-2 border">{vaccine.ageGroup}</td>
                     <td className="px-4 py-2 border">{vaccine.category}</td>
                    <td className="px-4 py-2 text-center border">
                      {vaccine.numberOfDoses}
                    </td>
                    <td className="px-4 py-2 text-center border">
                      {vaccine.sideEffects}
                    </td>
                    <td className="px-4 py-2 text-right border">
                      {vaccine.price.toLocaleString("vi-VN")}₫
                    </td>
                    <td
                      className={`px-4 py-2 text-center border font-medium ${
                        vaccine.status.toLowerCase() === "active"
                          ? "text-green-600"
                          : "text-gray-500"
                      }`}
                    >
                      {vaccine.status}
                    </td>
                    <td className="px-4 py-2 text-center border space-x-2">
                      <button
                        onClick={() => handleUpdate(vaccine.vaccineId)}
                        className="text-blue-600 hover:cursor-pointer hover:text-blue-800"
                        title="Cập nhật"
                      >
                        <Pencil className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => handleDelete(vaccine.vaccineId)}
                        className="text-red-600 hover:cursor-pointer hover:text-red-800"
                        title="Xoá"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
                {vaccines.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-4 text-gray-500 italic"
                    >
                      Không có dữ liệu vaccine.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default VaccineManagement;
