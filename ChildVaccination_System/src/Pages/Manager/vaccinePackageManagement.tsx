import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Button, InputNumber, Select } from "antd";
import {
  Package,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Pencil,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { vaccinePackageApi, type CreateVaccinePackageRequest, type VaccinePackage } from "@/api/vaccinePackageApi";
import { facilityVaccineApi, vaccineApi, type FacilityVaccine, type Vaccine } from "@/api/vaccineApi";
import { getUserInfo } from "@/lib/storage";

const { TextArea } = Input;

interface AddVaccineState {
  packageId: number;
  show: boolean;
  facilityVaccineId: string;
  quantity: number;
  loading: boolean;
  error: string | null;
}

// Define a stricter type for VaccineEntry to ensure type safety
interface VaccineEntry {
  facilityVaccineId: number;
  quantity: number;
}

interface StrictCreateVaccinePackageRequest extends Omit<CreateVaccinePackageRequest, 'vaccines'> {
  vaccines: VaccineEntry[];
}

const VaccinePackageManagement: React.FC = () => {
  const [packages, setPackages] = useState<VaccinePackage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [selectedPackage, setSelectedPackage] = useState<VaccinePackage | null>(null);
  const [formData, setFormData] = useState<Partial<StrictCreateVaccinePackageRequest>>({
    name: "",
    description: "",
    duration: 1,
    status: "true",
    vaccines: [],
  });
  const [facilityVaccines, setFacilityVaccines] = useState<FacilityVaccine[]>([]);
  const [vaccineInfoMap, setVaccineInfoMap] = useState<Record<number, Vaccine>>({});
  const [addVaccineState, setAddVaccineState] = useState<AddVaccineState | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });
  const [addForm] = Form.useForm();

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
      } catch (err: any) {
        setError(err.message || "Không thể tải dữ liệu.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (addVaccineState?.packageId) {
      const pkg = packages.find((p) => p.packageId === addVaccineState.packageId);
      if (pkg) {
        pkg.packageVaccines.forEach(async (pv) => {
          const vaccineId = pv.facilityVaccine?.vaccine?.vaccineId;
          if (vaccineId && !vaccineInfoMap[vaccineId]) {
            try {
              const data = await vaccineApi.getById(vaccineId);
              setVaccineInfoMap((prev) => ({ ...prev, [vaccineId]: data }));
            } catch {
              // Handle error silently
            }
          }
        });
      }
    }
  }, [addVaccineState, packages, vaccineInfoMap]);

  const handleFormChange = (values: Partial<StrictCreateVaccinePackageRequest>) => {
    // Ensure vaccines is always an array
    const updatedFormData = {
      ...formData,
      ...values,
      vaccines: Array.isArray(values.vaccines) ? values.vaccines : formData.vaccines || [],
    };
    setFormData(updatedFormData);
    console.log("Updated formData:", updatedFormData); // Debugging
  };

  const handleVaccineChange = (idx: number, field: string, value: any) => {
    setFormData((prev) => {
      const vaccines = Array.isArray(prev.vaccines) ? [...prev.vaccines] : [];
      vaccines[idx] = { ...vaccines[idx], [field]: field === "facilityVaccineId" ? Number(value) : Number(value) };
      const updatedFormData = { ...prev, vaccines };
      addForm.setFieldsValue({ vaccines });
      console.log("Updated vaccines after change:", vaccines); // Debugging
      return updatedFormData;
    });
  };

  const handleAddVaccine = () => {
    const newVaccine: VaccineEntry = { facilityVaccineId: 0, quantity: 1 };
    setFormData((prev) => {
      const vaccines = Array.isArray(prev.vaccines) ? [...prev.vaccines, newVaccine] : [newVaccine];
      const updatedFormData = { ...prev, vaccines };
      addForm.setFieldsValue({ vaccines });
      console.log("Updated vaccines after add:", vaccines); // Debugging
      return updatedFormData;
    });
  };

  const handleRemoveVaccine = (idx: number) => {
    setFormData((prev) => {
      const vaccines = Array.isArray(prev.vaccines) ? [...prev.vaccines] : [];
      vaccines.splice(idx, 1);
      const updatedFormData = { ...prev, vaccines };
      addForm.setFieldsValue({ vaccines });
      console.log("Updated vaccines after remove:", vaccines); // Debugging
      return updatedFormData;
    });
  };

  const handleCreatePackage = async () => {
    const userInfo = getUserInfo();
    if (!userInfo?.facilityId) {
      setToast({ show: true, message: "Không tìm thấy mã cơ sở.", type: "error" });
      setTimeout(() => setToast({ show: false, message: "", type: "success" }), 2500);
      return;
    }

    try {
      await addForm.validateFields();
      const validVaccines = (formData.vaccines || []).filter((v) => v.facilityVaccineId !== 0);
      if (validVaccines.length === 0) {
        setToast({ show: true, message: "Vui lòng chọn ít nhất một vaccine hợp lệ.", type: "error" });
        setTimeout(() => setToast({ show: false, message: "", type: "success" }), 2500);
        return;
      }

      setLoading(true);
      await vaccinePackageApi.create({
        ...formData,
        facilityId: userInfo.facilityId,
        vaccines: validVaccines,
        status: formData.status || "true",
      } as CreateVaccinePackageRequest);
      const res = await vaccinePackageApi.getAll(userInfo.facilityId);
      setPackages(res.data);
      setShowAddModal(false);
      addForm.resetFields();
      setFormData({ name: "", description: "", duration: 1, status: "true", vaccines: [] });
      setToast({ show: true, message: "Tạo gói vaccine thành công", type: "success" });
      setTimeout(() => setToast({ show: false, message: "", type: "success" }), 2500);
    } catch (err: any) {
      setToast({ show: true, message: err.message || "Tạo gói vaccine thất bại.", type: "error" });
      setTimeout(() => setToast({ show: false, message: "", type: "success" }), 2500);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePackage = async () => {
    if (!selectedPackage) return;
    setLoading(true);
    try {
      await vaccinePackageApi.deleteVaccinePackage(selectedPackage.packageId);
      const userInfo = getUserInfo();
      if (userInfo?.facilityId) {
        const res = await vaccinePackageApi.getAll(userInfo.facilityId);
        setPackages(res.data);
      }
      setShowDeleteModal(false);
      setSelectedPackage(null);
      setToast({ show: true, message: `Đã xóa gói ${selectedPackage.name} thành công!`, type: "success" });
      setTimeout(() => setToast({ show: false, message: "", type: "success" }), 2500);
    } catch (err: any) {
      setToast({ show: true, message: `Xóa gói ${selectedPackage.name} thất bại!`, type: "error" });
      setTimeout(() => setToast({ show: false, message: "", type: "success" }), 2500);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVaccineToPackage = async (packageId: number, data: { facilityVaccineId: number; quantity: number }) => {
    setLoading(true);
    try {
      await vaccinePackageApi.addVaccineToPackage(packageId, data);
      const userInfo = getUserInfo();
      if (userInfo?.facilityId) {
        const res = await vaccinePackageApi.getAll(userInfo.facilityId);
        setPackages(res.data);
      }
      setAddVaccineState(null);
      setToast({ show: true, message: "Thêm vaccine vào gói thành công", type: "success" });
      setTimeout(() => setToast({ show: false, message: "", type: "success" }), 2500);
    } catch (err: any) {
      setAddVaccineState((s) => (s ? { ...s, error: err.message || "Thêm vaccine thất bại", loading: false } : s));
    } finally {
      setLoading(false);
    }
  };

  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch =
      pkg.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "true" && pkg.status === "true") ||
      (filterStatus === "false" && pkg.status === "false");
    return matchesSearch && matchesStatus;
  });

  const getCurrentPageData = (data: VaccinePackage[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredPackages.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  const currentPackages = getCurrentPageData(filteredPackages);

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="animate-pulse space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="flex gap-4">
            <div className="h-10 bg-gray-200 rounded flex-1"></div>
            <div className="h-10 bg-gray-200 rounded w-1/6"></div>
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="h-10 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded w-1/6"></div>
                <div className="h-10 bg-gray-200 rounded w-1/6"></div>
                <div className="h-10 bg-gray-200 rounded w-1/6"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded shadow-lg text-white font-semibold transition ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Add Package Modal */}
      <Modal
        title="Thêm gói vaccine mới"
        open={showAddModal}
        onCancel={() => {
          setShowAddModal(false);
          addForm.resetFields();
          setFormData({ name: "", description: "", duration: 1, status: "true", vaccines: [] });
        }}
        footer={null}
        width={800}
        centered
      >
        <Form
          form={addForm}
          layout="vertical"
          onFinish={handleCreatePackage}
          initialValues={formData}
          onValuesChange={handleFormChange}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Form.Item
              label="Tên gói"
              name="name"
              rules={[{ required: true, message: "Vui lòng nhập tên gói" }]}
            >
              <Input className="rounded-lg" />
            </Form.Item>

            <Form.Item
              label="Thời hạn (tháng)"
              name="duration"
              rules={[{ required: true, message: "Vui lòng nhập thời hạn" }]}
            >
              <InputNumber min={1} className="w-full rounded-lg" />
            </Form.Item>

            <Form.Item
              label="Mô tả"
              name="description"
              className="sm:col-span-2"
            >
              <TextArea rows={4} className="rounded-lg" />
            </Form.Item>

            <Form.Item
              label="Danh sách vaccine trong gói"
              name="vaccines"
              className="sm:col-span-2"
              rules={[
                {
                  validator: (_, value) => {
                    const validVaccines = (Array.isArray(value) ? value : []).filter((v: { facilityVaccineId: number }) => v.facilityVaccineId !== 0);
                    return validVaccines.length > 0
                      ? Promise.resolve()
                      : Promise.reject("Vui lòng chọn ít nhất một vaccine hợp lệ");
                  },
                },
              ]}
            >
              <div className="space-y-2">
                {(Array.isArray(formData.vaccines) ? formData.vaccines : []).map((v: VaccineEntry, idx: number) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Select
                      showSearch
                      value={v.facilityVaccineId || undefined}
                      onChange={(value) => handleVaccineChange(idx, "facilityVaccineId", value)}
                      className="w-full"
                      placeholder="Tìm kiếm và chọn vaccine"
                      filterOption={(input, option) =>
                        (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {facilityVaccines.map((fv: FacilityVaccine) => (
                        <Select.Option key={fv.facilityVaccineId} value={fv.facilityVaccineId}>
                          {fv.vaccine.name}
                        </Select.Option>
                      ))}
                    </Select>
                    <InputNumber
                      min={1}
                      value={v.quantity}
                      onChange={(value) => handleVaccineChange(idx, "quantity", value !== null ? value : 1)}
                      className="w-24"
                    />
                    <Button
                      type="link"
                      danger
                      onClick={() => handleRemoveVaccine(idx)}
                      icon={<X className="w-4 h-4" />}
                    />
                  </div>
                ))}
                <Button
                  type="dashed"
                  onClick={handleAddVaccine}
                  className="w-full mt-2"
                  icon={<Plus className="w-4 h-4" />}
                >
                  Thêm vaccine
                </Button>
              </div>
            </Form.Item>

            <Form.Item
              label="Trạng thái"
              name="status"
              rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
            >
              <Select className="rounded-lg">
                <Select.Option value="true">Đang sử dụng</Select.Option>
                <Select.Option value="false">Ngừng sử dụng</Select.Option>
              </Select>
            </Form.Item>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              onClick={() => {
                setShowAddModal(false);
                addForm.resetFields();
                setFormData({ name: "", description: "", duration: 1, status: "true", vaccines: [] });
              }}
              className="rounded-lg"
            >
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              className="bg-green-600 hover:bg-green-700 rounded-lg"
            >
              Lưu
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Xác nhận xóa"
        open={showDeleteModal}
        onCancel={() => {
          setShowDeleteModal(false);
          setSelectedPackage(null);
        }}
        footer={null}
        centered
      >
        <p className="text-gray-600 mb-4">
          Bạn có chắc chắn muốn xóa gói <strong>{selectedPackage?.name}</strong> không?
        </p>
        <div className="flex justify-end gap-3">
          <Button
            onClick={() => {
              setShowDeleteModal(false);
              setSelectedPackage(null);
            }}
            className="rounded-lg"
          >
            Hủy
          </Button>
          <Button
            type="primary"
            danger
            onClick={handleDeletePackage}
            className="rounded-lg"
          >
            Xóa
          </Button>
        </div>
      </Modal>

      {/* Header */}
      <div className="p-6 max-w-6xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Quản lý gói vaccine</h1>
              <p className="text-gray-600 mt-1">Quản lý danh sách gói vaccine và thông tin chi tiết</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Thêm gói vaccine</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="p-6 max-w-6xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên gói hoặc mô tả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="true">Đang sử dụng</option>
            <option value="false">Ngừng sử dụng</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <div className="w-6 h-6 bg-blue-600 rounded-full"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Tổng số gói</p>
                <p className="text-2xl font-bold text-blue-900">{packages.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <div className="w-6 h-6 bg-green-600 rounded-full"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Đang sử dụng</p>
                <p className="text-2xl font-bold text-green-900">{packages.filter((p) => p.status === "true").length}</p>
              </div>
            </div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <div className="w-6 h-6 bg-orange-600 rounded-full"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-600">Ngừng sử dụng</p>
                <p className="text-2xl font-bold text-orange-900">{packages.filter((p) => p.status === "false").length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Package Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Danh sách gói vaccine ({filteredPackages.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên gói
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mô tả
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thời hạn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentPackages.map((pkg: VaccinePackage) => (
                  <React.Fragment key={pkg.packageId}>
                    <tr
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() =>
                        setAddVaccineState((prev) =>
                          prev?.packageId === pkg.packageId
                            ? null
                            : { packageId: pkg.packageId, show: false, facilityVaccineId: "", quantity: 1, loading: false, error: null }
                        )
                      }
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{pkg.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 max-w-xs truncate" title={pkg.description}>
                          {pkg.description}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {pkg.duration} tháng
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-green-600">{pkg.price.toLocaleString("vi-VN")}₫</div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            pkg.status === "true" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {pkg.status === "true" ? "Đang sử dụng" : "Ngừng sử dụng"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                            title="Cập nhật"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPackage(pkg);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {addVaccineState?.packageId === pkg.packageId && (
                      <tr>
                        <td colSpan={6} className="bg-gray-50 border-b p-0">
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-blue-700">Danh sách vaccine trong gói</h3>
                              <button
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAddVaccineState((prev) => ({ ...prev!, show: true }));
                                }}
                              >
                                + Thêm vaccine
                              </button>
                            </div>
                            {addVaccineState?.show && (
                              <form
                                className="flex gap-2 mb-4 items-center bg-gray-100 p-2 rounded"
                                onClick={(e) => e.stopPropagation()}
                                onSubmit={async (e) => {
                                  e.preventDefault();
                                  if (!addVaccineState?.facilityVaccineId || addVaccineState.facilityVaccineId === "") {
                                    setAddVaccineState((s) => (s ? { ...s, error: "Vui lòng chọn vaccine", loading: false } : s));
                                    return;
                                  }
                                  setAddVaccineState((s) => (s ? { ...s, loading: true, error: null } : s));
                                  await handleAddVaccineToPackage(pkg.packageId, {
                                    facilityVaccineId: Number(addVaccineState.facilityVaccineId),
                                    quantity: addVaccineState.quantity,
                                  });
                                }}
                              >
                                <Select
                                  showSearch
                                  className="w-full"
                                  value={addVaccineState.facilityVaccineId}
                                  onChange={(value) => setAddVaccineState((s) => (s ? { ...s, facilityVaccineId: value } : s))}
                                  placeholder="Tìm kiếm và chọn vaccine"
                                  filterOption={(input, option) =>
                                    (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                                  }
                                >
                                  {facilityVaccines.map((fv: FacilityVaccine) => (
                                    <Select.Option key={fv.facilityVaccineId} value={fv.facilityVaccineId}>
                                      {fv.vaccine.name}
                                    </Select.Option>
                                  ))}
                                </Select>
                                <InputNumber
                                  min={1}
                                  value={addVaccineState.quantity}
                                  onChange={(value) =>
                                    setAddVaccineState((s) => (s ? { ...s, quantity: value !== null ? value : 1 } : s))
                                  }
                                  className="w-24"
                                />
                                <Button
                                  type="primary"
                                  htmlType="submit"
                                  className="bg-blue-600 hover:bg-blue-700"
                                  disabled={addVaccineState.loading}
                                >
                                  {addVaccineState.loading ? "Đang thêm..." : "Xác nhận"}
                                </Button>
                                <Button
                                  onClick={() => setAddVaccineState(null)}
                                  disabled={addVaccineState.loading}
                                >
                                  Hủy
                                </Button>
                                {addVaccineState.error && <span className="text-red-600 ml-2">{addVaccineState.error}</span>}
                              </form>
                            )}
                            <ul className="list-disc ml-6 mb-4">
                              {pkg.packageVaccines.length === 0 ? (
                                <li>Không có vaccine nào trong gói này.</li>
                              ) : (
                                pkg.packageVaccines.map((pv: any, i: number) => {
                                  const fv = facilityVaccines.find((fv: FacilityVaccine) => fv.facilityVaccineId === pv.facilityVaccineId);
                                  return (
                                    <li key={pv.packageVaccineId || i}>
                                      <span className="font-medium text-blue-700">{fv?.vaccine?.name || "-"}</span>
                                      {" - Giá: "}
                                      <span className="text-green-700">{fv?.price?.toLocaleString("vi-VN")}₫</span>
                                      {" - Số lượng: "}
                                      <span className="text-gray-800">{pv.quantity}</span>
                                    </li>
                                  );
                                })
                              )}
                            </ul>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          {filteredPackages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Không tìm thấy gói vaccine nào.</p>
            </div>
          )}
          {filteredPackages.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Hiển thị {(currentPage - 1) * itemsPerPage + 1} đến{" "}
                  {Math.min(currentPage * itemsPerPage, filteredPackages.length)} trong tổng số {filteredPackages.length} kết quả
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        currentPage === page ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VaccinePackageManagement;