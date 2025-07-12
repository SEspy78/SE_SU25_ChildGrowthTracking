import React, { useEffect, useState } from "react";
import { vaccinePackageApi, type CreateVaccinePackageRequest, type VaccinePackage } from "@/api/vaccinePackageApi";
import { facilityVaccineApi, type FacilityVaccine } from "@/api/vaccineApi";
import { getUserInfo } from "@/lib/storage";
 import { X } from "lucide-react";
const VaccinePackageManagement: React.FC = () => {
  // Không lưu user vào state, luôn lấy mới từ localStorage khi cần
  const [packages, setPackages] = useState<VaccinePackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<CreateVaccinePackageRequest>>({
    name: "",
    description: "",
    duration: 1,
    status: "true",
    vaccines: [],
  });
  const [showForm, setShowForm] = useState(false);
  const [facilityVaccines, setFacilityVaccines] = useState<FacilityVaccine[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const userInfo = getUserInfo();
      if (!userInfo?.facilityId) return;
      setLoading(true);
      try {
        const res = await vaccinePackageApi.getAll(userInfo.facilityId);
        setPackages(res.data);
        const vacRes = await facilityVaccineApi.getAll(userInfo.facilityId);
        setFacilityVaccines(vacRes.data);
      } catch (err) {
        setError("Không thể tải dữ liệu.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === "duration" ? Number(value) : value }));
  };

  const handleVaccineChange = (idx: number, field: string, value: any) => {
    setForm((prev) => {
      const vaccines = prev.vaccines ? [...prev.vaccines] : [];
      vaccines[idx] = { ...vaccines[idx], [field]: field === "facilityVaccineId" ? Number(value) : Number(value) };
      return { ...prev, vaccines };
    });
  };

  const handleAddVaccine = () => {
    setForm((prev) => ({ ...prev, vaccines: [...(prev.vaccines || []), { facilityVaccineId: 0, quantity: 1 }] }));
  };

  const handleRemoveVaccine = (idx: number) => {
    setForm((prev) => {
      const vaccines = prev.vaccines ? [...prev.vaccines] : [];
      vaccines.splice(idx, 1);
      return { ...prev, vaccines };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const userInfo = getUserInfo();
    if (!userInfo?.facilityId) {
      setFormError("Không tìm thấy mã cơ sở.");
      return;
    }
    if (!form.name || !form.duration || !form.vaccines || form.vaccines.length === 0) {
      setFormError("Vui lòng nhập đầy đủ thông tin và chọn ít nhất 1 vaccine.");
      return;
    }
    setFormLoading(true);
    try {
      await vaccinePackageApi.create({
        ...form,
        facilityId: userInfo.facilityId,
        vaccines: form.vaccines,
        status: form.status || "true",
      } as any);
      setForm({ name: "", description: "", duration: 1, status: "true", vaccines: [] });
      setShowForm(false);
      // reload list
      const res = await vaccinePackageApi.getAll(userInfo.facilityId);
      setPackages(res.data);
    } catch (err) {
      setFormError("Tạo gói vaccine thất bại.");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-blue-700">Quản lý gói vaccine</h1>
      {!showForm && (
        <button
          className="mb-6 px-4 py-2 bg-blue-600 hover:cursor-pointer text-white rounded hover:bg-blue-700"
          onClick={() => setShowForm(true)}
        >
          + Tạo gói vaccine mới
        </button>
      )}
      {showForm && (
        <form className="bg-white rounded shadow p-4 mb-8" onSubmit={handleSubmit}>
          <h2 className="text-lg font-semibold mb-4">Tạo gói vaccine mới</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-medium">Tên gói</label>
              <input name="name" value={form.name || ""} onChange={handleFormChange} className="w-full border px-2 py-1 rounded" required />
            </div>
            <div>
              <label className="block mb-1 font-medium">Thời hạn (tháng)</label>
              <input name="duration" type="number" value={form.duration} onChange={handleFormChange} className="w-full border px-2 py-1 rounded" required min={1} />
            </div>
            <div className="md:col-span-2">
              <label className="block mb-1 font-medium">Mô tả</label>
              <textarea name="description" value={form.description || ""} onChange={handleFormChange} className="w-full border px-2 py-1 rounded" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block mb-1 font-medium">Danh sách vaccine trong gói</label>
            {(form.vaccines || []).map((v, idx) => (
              <div key={idx} className="flex gap-2 mb-2 items-center">
                <select
                  value={v.facilityVaccineId}
                  onChange={e => handleVaccineChange(idx, "facilityVaccineId", e.target.value)}
                  className="border px-2 py-1 rounded"
                  required
                >
                  <option value="">-- Chọn vaccine --</option>
                  {facilityVaccines.map(fv => (
                    <option key={fv.facilityVaccineId} value={fv.facilityVaccineId}>{fv.vaccine.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={v.quantity}
                  onChange={e => handleVaccineChange(idx, "quantity", e.target.value)}
                  className="border px-2 py-1 rounded w-24"
                  required
                />
                <button type="button" className="text-red-500 hover:cursor-pointer px-2" onClick={() => handleRemoveVaccine(idx)}><X/></button>
              </div>
            ))}
            <button type="button" className="mt-2 px-3 py-1 hover:cursor-pointer hover:bg-blue-800 bg-blue-500 text-white rounded" onClick={handleAddVaccine}>+ Thêm vaccine</button>
          </div>
          <div className="mt-4">
            <label className="block mb-1  font-medium">Trạng thái</label>
            <select name="status" value={form.status || "true"} onChange={handleFormChange} className="border hover:cursor-pointer px-2 py-1 rounded">
              <option value="true">Đang sử dụng</option>
              <option value="false">Ngừng SD</option>
            </select>
          </div>
          {formError && <div className="text-red-600 mt-2">{formError}</div>}
          <div className="flex gap-2 mt-4">
            <button type="submit" className="px-4 py-2 bg-green-600 hover:cursor-pointer text-white rounded hover:bg-green-700" disabled={formLoading}>
              {formLoading ? "Đang tạo..." : "Tạo gói vaccine"}
            </button>
            <button type="button" className="px-4 py-2 bg-gray-400 hover:cursor-pointer text-white rounded hover:bg-gray-500" onClick={() => { setShowForm(false); setForm({ name: "", description: "", duration: 1, status: "true", vaccines: [] }); setFormError(null); }}>
              Hủy
            </button>
          </div>
        </form>
      )}

      <h2 className="text-lg font-semibold mb-2">Danh sách gói vaccine</h2>
      {loading ? (
        <div>Đang tải...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto border border-gray-200 text-sm text-left">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-4 py-2">Tên gói</th>
                <th className="px-4 py-2">Mô tả</th>
                <th className="px-4 py-2">Thời hạn</th>
                <th className="px-4 py-2">Giá</th>
                <th className="px-4 py-2">Trạng thái</th>
                <th className="px-4 py-2">Vaccine</th>
              </tr>
            </thead>
            <tbody>
              {packages.map(pkg => (
                <tr key={pkg.packageId} className="border-t">
                  <td className="px-4 py-2 font-semibold text-blue-700">{pkg.name}</td>
                  <td className="px-4 py-2">{pkg.description}</td>
                  <td className="px-4 py-2">{pkg.duration} tháng</td>
                  <td className="px-4 py-2">{pkg.price?.toLocaleString()} VNĐ</td>
                  <td className="px-4 py-2">{pkg.status === "true" ? "Đang sử dụng" : "Ngừng SD"}</td>
                  <td className="px-4 py-2">
                    <ul className="list-disc ml-4">
                      {pkg.packageVaccines.map((pv, i) => (
                        <li key={pv.packageVaccineId || i}>
                          {pv.facilityVaccine?.vaccine?.name || "-"} (SL: {pv.quantity})
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default VaccinePackageManagement;
