import React, { useEffect, useState } from "react";
import { facilityVaccineApi, vaccineApi, type FacilityVaccine, type Vaccine, type CreateFacilityVaccineRequest } from "@/api/vaccineApi";
import { getUserInfo } from "@/lib/storage";
import { Loader2 } from "lucide-react";


const FacilityVaccinePage: React.FC = () => {

    const [selectedVaccine, setSelectedVaccine] = useState<Vaccine | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const handleRowClick = async (vaccineId: number) => {
    // Nếu đang mở dropdown cho vaccine này thì đóng lại
    if (selectedVaccine && selectedVaccine.vaccineId === vaccineId) {
      setSelectedVaccine(null);
      setDetailError(null);
      return;
    }
    setDetailError(null);
    setDetailLoading(true);
    setSelectedVaccine(null);
    try {
      const data = await vaccineApi.getById(vaccineId);
      setSelectedVaccine(data);
    } catch (err) {
      setDetailError("Không thể tải chi tiết vaccine.");
    } finally {
      setDetailLoading(false);
    }
  };
  const [vaccines, setVaccines] = useState<FacilityVaccine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [allVaccines, setAllVaccines] = useState<Vaccine[]>([]);
  const [form, setForm] = useState<Partial<CreateFacilityVaccineRequest>>({
    vaccineId: undefined,
    price: 0,
    availableQuantity: 0,
    expiryDate: "",
    importDate: "",
    status: "true",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const user = getUserInfo();

  useEffect(() => {
    const fetchVaccines = async () => {
      if (!user?.facilityId) {
        setError("Không tìm thấy mã cơ sở.");
        return;
      }
      try {
        setLoading(true);
        const res = await facilityVaccineApi.getAll(user.facilityId);
        setVaccines(res.data);
      } catch (err: any) {
        setError("Không thể tải danh sách vaccine.");
      } finally {
        setLoading(false);
      }
    };
    fetchVaccines();
  }, [user?.facilityId]);

  useEffect(() => {
    // Lấy danh sách tất cả vaccine để chọn khi thêm mới
    const fetchAllVaccines = async () => {
      try {
        const res = await vaccineApi.getAll();
        setAllVaccines(res);
      } catch (err) {
        // ignore
      }
    };
    fetchAllVaccines();
  }, []);
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "vaccineId" || name === "availableQuantity" || name === "price" ? Number(value) : value,
    }));
  };

  // Hàm sinh số lô ngẫu nhiên 6 chữ số
  const generateRandomBatchNumber = () => {
    return Math.floor(100000 + Math.random() * 900000);
  };

  const handleAddVaccine = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!user?.facilityId) {
      setFormError("Không tìm thấy mã cơ sở.");
      return;
    }
    if (!form.vaccineId || !form.expiryDate || !form.importDate) {
      setFormError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    setFormLoading(true);
    try {
      await facilityVaccineApi.create({
        ...form,
        facilityId: user.facilityId,
        status: form.status || "true",
        price: form.price || 0,
        availableQuantity: form.availableQuantity || 0,
        batchNumber: generateRandomBatchNumber(),
        expiryDate: form.expiryDate!,
        importDate: form.importDate!,
      } as any);
      setShowForm(false);
      setForm({ vaccineId: undefined, price: 0, availableQuantity: 0, expiryDate: "", importDate: "", status: "true" });
      // reload list
      const res = await facilityVaccineApi.getAll(user.facilityId);
      setVaccines(res.data);
    } catch (err: any) {
      setFormError("Thêm vaccine thất bại.");
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin w-6 h-6 text-blue-500" />
        <span className="ml-2">Đang tải dữ liệu...</span>
      </div>
    );
  }

  if (error) return <p className="text-red-600 p-4">{error}</p>;

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white rounded-xl shadow border border-gray-100">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Quản lý vaccine tại cơ sở</h1>
      <button
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:cursor-pointer hover:bg-blue-700"
        onClick={() => setShowForm((v) => !v)}
      >
        {showForm ? "Đóng" : "Thêm vaccine cho cơ sở"}
      </button>
      {showForm && (
        <form className="mb-6 p-4 bg-gray-50 rounded border" onSubmit={handleAddVaccine}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block mb-1 font-medium">Vaccine</label>
              <select
                name="vaccineId"
                value={form.vaccineId || ""}
                onChange={handleFormChange}
                className="w-full border px-2 py-1 rounded"
                required
              >
                <option value="">-- Chọn vaccine --</option>
                {allVaccines.map((v) => (
                  <option key={v.vaccineId} value={v.vaccineId}>{v.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium">Số lượng</label>
              <input
                type="number"
                name="availableQuantity"
                value={form.availableQuantity || 0}
                onChange={handleFormChange}
                className="w-full border px-2 py-1 rounded"
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Giá (VNĐ)</label>
              <input
                type="number"
                name="price"
                value={form.price || 0}
                onChange={handleFormChange}
                className="w-full border px-2 py-1 rounded"
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Ngày nhập</label>
              <input
                type="date"
                name="importDate"
                value={form.importDate || ""}
                onChange={handleFormChange}
                className="w-full border px-2 py-1 rounded"
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">HSD</label>
              <input
                type="date"
                name="expiryDate"
                value={form.expiryDate || ""}
                onChange={handleFormChange}
                className="w-full border px-2 py-1 rounded"
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Trạng thái</label>
              <select
                name="status"
                value={form.status || "true"}
                onChange={handleFormChange}
                className="w-full border px-2 py-1 rounded"
              >
                <option value="true">Đang sử dụng</option>
                <option value="false">Ngừng SD</option>
              </select>
            </div>
          </div>
          {formError && <div className="text-red-600 mt-2">{formError}</div>}
          <button
            type="submit"
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            disabled={formLoading}
          >
            {formLoading ? "Đang thêm..." : "Thêm vaccine"}
          </button>
        </form>
      )}
      <div className="overflow-x-auto">
        <table className="w-full table-auto border border-gray-200 text-sm text-left">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="px-4 py-3">Tên vaccine</th>
              <th className="px-4 py-3">Hãng SX</th>
              <th className="px-4 py-3">Số lô</th>
              <th className="px-4 py-3">SL còn</th>
              <th className="px-4 py-3">Ngày nhập</th>
              <th className="px-4 py-3">HSD</th>
              <th className="px-4 py-3">Giá (VNĐ)</th>
              <th className="px-4 py-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {vaccines.map((item) => (
              <React.Fragment key={item.facilityVaccineId}>
                <tr
                  className="border-t hover:bg-gray-50 hover:cursor-pointer"
                  onClick={() => handleRowClick(item.vaccine.vaccineId)}
                  title="Xem chi tiết vaccine"
                >
                  <td className="px-4 py-3">{item.vaccine.name}</td>
                  <td className="px-4 py-3">{item.vaccine.manufacturer}</td>
                  <td className="px-4 py-3">{item.batchNumber}</td>
                  <td className="px-4 py-3">{item.availableQuantity}</td>
                  <td className="px-4 py-3">{new Date(item.importDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{new Date(item.expiryDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{item.price.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {item.status === "true" ? (
                      <span className="text-green-600 font-medium">Đang sử dụng</span>
                    ) : (
                      <span className="text-gray-500">Ngừng SD</span>
                    )}
                  </td>
                </tr>
                {/* Dropdown chi tiết vaccine */}
                {selectedVaccine && selectedVaccine.vaccineId === item.vaccine.vaccineId && (
                  <tr>
                    <td colSpan={8} className="bg-gray-50 border-b p-0">
                      <div className="p-4">
                        {detailLoading ? (
                          <div className="flex items-center text-blue-600"><Loader2 className="animate-spin w-5 h-5 mr-2" />Đang tải chi tiết vaccine...</div>
                        ) : detailError ? (
                          <div className="text-red-600">{detailError}</div>
                        ) : (
                          <>
                            <div className="flex justify-between items-center mb-2">
                              <h2 className="text-base font-semibold text-blue-700">Thông tin chi tiết vaccine</h2>
                              <button className="text-gray-500 hover:text-red-500 text-lg font-bold" onClick={() => setSelectedVaccine(null)} aria-label="Đóng">×</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <div><span className="font-medium">Tên vaccine:</span> {selectedVaccine.name}</div>
                              <div><span className="font-medium">Hãng SX:</span> {selectedVaccine.manufacturer}</div>
                              <div><span className="font-medium">Mô tả:</span> {selectedVaccine.description}</div>
                              <div><span className="font-medium">Nhóm tuổi:</span> {selectedVaccine.ageGroup}</div>
                              <div><span className="font-medium">Số mũi:</span> {selectedVaccine.numberOfDoses}</div>
                              <div><span className="font-medium">Khoảng cách tối thiểu giữa các mũi:</span> {selectedVaccine.minIntervalBetweenDoses}</div>
                              <div><span className="font-medium">Tác dụng phụ:</span> {selectedVaccine.sideEffects}</div>
                              <div><span className="font-medium">Chống chỉ định:</span> {selectedVaccine.contraindications}</div>
                              <div><span className="font-medium">Giá:</span> {selectedVaccine.price?.toLocaleString()} VNĐ</div>
                              <div><span className="font-medium">Trạng thái:</span> {selectedVaccine.status === "true" ? "Đang sử dụng" : "Ngừng SD"}</div>
                              <div><span className="font-medium">Ngày tạo:</span> {new Date(selectedVaccine.createdAt).toLocaleDateString()}</div>
                              <div><span className="font-medium">Ngày cập nhật:</span> {new Date(selectedVaccine.updatedAt).toLocaleDateString()}</div>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FacilityVaccinePage;
