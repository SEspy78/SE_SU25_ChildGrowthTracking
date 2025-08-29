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
  PlusCircle,
  MinusCircle,
} from "lucide-react";
import { vaccinePackageApi, type CreateVaccinePackageRequest, type VaccinePackage, type updatePackageRequest } from "@/api/vaccinePackageApi";
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

interface VaccineEntry {
  facilityVaccineId: number;
  quantity: number;
}

interface StrictCreateVaccinePackageRequest extends Omit<CreateVaccinePackageRequest, 'vaccines'> {
  vaccines: VaccineEntry[];
}

interface VaccineEditState {
  facilityVaccineId: number;
  quantity: number;
  loading: boolean;
  error: string | null;
}

const VaccinePackageManagement: React.FC = () => {
  const [packages, setPackages] = useState<VaccinePackage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
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
  const [vaccineEditStates, setVaccineEditStates] = useState<Record<number, VaccineEditState>>({});
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
  const [editForm] = Form.useForm();

  useEffect(() => {
    const fetchData = async () => {
      const userInfo = getUserInfo();
      if (!userInfo?.facilityId) {
        setError("Không tìm thấy mã cơ sở.");
        return;
      }
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

  const handleFormChange = (values: Partial<StrictCreateVaccinePackageRequest>, isEdit: boolean) => {
    const updatedFormData = {
      ...formData,
      ...values,
      vaccines: Array.isArray(values.vaccines) ? values.vaccines : formData.vaccines || [],
    };
    setFormData(updatedFormData);
    if (isEdit) {
      editForm.setFieldsValue(updatedFormData);
    } else {
      addForm.setFieldsValue(updatedFormData);
    }
  };

  const handleVaccineChange = (idx: number, field: string, value: any) => {
    setFormData((prev) => {
      const vaccines = Array.isArray(prev.vaccines) ? [...prev.vaccines] : [];
      vaccines[idx] = { ...vaccines[idx], [field]: field === "facilityVaccineId" ? Number(value) : Number(value) };
      const updatedFormData = { ...prev, vaccines };
      addForm.setFieldsValue({ vaccines });
      return updatedFormData;
    });
  };

  const handleAddVaccine = () => {
    const newVaccine: VaccineEntry = { facilityVaccineId: 0, quantity: 1 };
    setFormData((prev) => {
      const vaccines = Array.isArray(prev.vaccines) ? [...prev.vaccines, newVaccine] : [newVaccine];
      const updatedFormData = { ...prev, vaccines };
      addForm.setFieldsValue({ vaccines });
      return updatedFormData;
    });
  };

  const handleRemoveVaccine = (idx: number) => {
    setFormData((prev) => {
      const vaccines = Array.isArray(prev.vaccines) ? [...prev.vaccines] : [];
      vaccines.splice(idx, 1);
      const updatedFormData = { ...prev, vaccines };
      addForm.setFieldsValue({ vaccines });
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

  const handleEditPackage = async () => {
    const userInfo = getUserInfo();
    if (!userInfo?.facilityId || !selectedPackage) {
      setToast({ show: true, message: "Không tìm thấy mã cơ sở hoặc gói vaccine.", type: "error" });
      setTimeout(() => setToast({ show: false, message: "", type: "success" }), 2500);
      return;
    }

    try {
      await editForm.validateFields();
      setLoading(true);
      await vaccinePackageApi.updateVaccinePackage(selectedPackage.packageId, {
        name: formData.name,
        description: formData.description,
        duration: formData.duration,
        status: formData.status,
        facilityId: userInfo.facilityId,
      } as updatePackageRequest);
      const res = await vaccinePackageApi.getAll(userInfo.facilityId);
      setPackages(res.data);
      setShowEditModal(false);
      editForm.resetFields();
      setFormData({ name: "", description: "", duration: 1, status: "true", vaccines: [] });
      setSelectedPackage(null);
      setToast({ show: true, message: `Cập nhật gói ${selectedPackage.name} thành công`, type: "success" });
      setTimeout(() => setToast({ show: false, message: "", type: "success" }), 2500);
    } catch (err: any) {
      setToast({ show: true, message: err.message || `Cập nhật gói ${selectedPackage.name} thất bại`, type: "error" });
      setTimeout(() => setToast({ show: false, message: "", type: "success" }), 2500);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = async (pkg: VaccinePackage) => {
    setLoading(true);
    try {
      const packageData = await vaccinePackageApi.getById(pkg.packageId);
      setSelectedPackage(pkg);
      setFormData({
        name: packageData.name,
        description: packageData.description,
        duration: packageData.duration,
        status: packageData.status,
        vaccines: [],
      });
      editForm.setFieldsValue({
        name: packageData.name,
        description: packageData.description,
        duration: packageData.duration,
        status: packageData.status,
      });
      setShowEditModal(true);
    } catch (err: any) {
      setToast({ show: true, message: err.message || "Không thể tải thông tin gói vaccine.", type: "error" });
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

  const handleUpdateVaccineQuantity = async (packageId: number, facilityVaccineId: number, quantity: number) => {
    setVaccineEditStates((prev) => ({
      ...prev,
      [facilityVaccineId]: { ...prev[facilityVaccineId], loading: true, error: null },
    }));
    try {
      await vaccinePackageApi.updateVaccineQuantity(packageId, facilityVaccineId, quantity);
      const userInfo = getUserInfo();
      if (userInfo?.facilityId) {
        const res = await vaccinePackageApi.getAll(userInfo.facilityId);
        setPackages(res.data);
      }
      setVaccineEditStates((prev) => ({
        ...prev,
        [facilityVaccineId]: { ...prev[facilityVaccineId], loading: false },
      }));
      setToast({ show: true, message: "Cập nhật số lượng vaccine thành công", type: "success" });
      setTimeout(() => setToast({ show: false, message: "", type: "success" }), 2500);
    } catch (err: any) {
      setVaccineEditStates((prev) => ({
        ...prev,
        [facilityVaccineId]: { ...prev[facilityVaccineId], loading: false, error: err.message || "Cập nhật số lượng vaccine thất bại" },
      }));
      setToast({ show: true, message: err.message || "Cập nhật số lượng vaccine thất bại", type: "error" });
      setTimeout(() => setToast({ show: false, message: "", type: "success" }), 2500);
    }
  };

  const handleRemoveVaccineFromPackage = async (packageId: number, facilityVaccineId: number) => {
    setVaccineEditStates((prev) => ({
      ...prev,
      [facilityVaccineId]: { ...prev[facilityVaccineId], loading: true, error: null },
    }));
    try {
      await vaccinePackageApi.removeVaccineFromPackage(packageId, facilityVaccineId);
      const userInfo = getUserInfo();
      if (userInfo?.facilityId) {
        const res = await vaccinePackageApi.getAll(userInfo.facilityId);
        setPackages(res.data);
      }
      setVaccineEditStates((prev) => {
        const newState = { ...prev };
        delete newState[facilityVaccineId];
        return newState;
      });
      setToast({ show: true, message: "Xóa vaccine khỏi gói thành công", type: "success" });
      setTimeout(() => setToast({ show: false, message: "", type: "success" }), 2500);
    } catch (err: any) {
      setVaccineEditStates((prev) => ({
        ...prev,
        [facilityVaccineId]: { ...prev[facilityVaccineId], loading: false, error: err.message || "Xóa vaccine thất bại" },
      }));
      setToast({ show: true, message: err.message || "Xóa vaccine thất bại", type: "error" });
      setTimeout(() => setToast({ show: false, message: "", type: "success" }), 2500);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
          <span className="text-lg text-gray-700 font-medium">Đang tải dữ liệu...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-50">
        <div className="bg-red-50 text-red-700 p-6 rounded-xl shadow-lg flex items-center space-x-3 max-w-md">
          <AlertCircle className="w-8 h-8 flex-shrink-0" />
          <span className="text-lg font-semibold">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg text-white font-semibold transition-all duration-300 ease-in-out ${
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
        className="rounded-xl"
      >
        <Form
          form={addForm}
          layout="vertical"
          onFinish={handleCreatePackage}
          initialValues={formData}
          onValuesChange={(values) => handleFormChange(values, false)}
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
                  onClick={() => handleAddVaccine()}
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

      {/* Edit Package Modal */}
      <Modal
        title="Chỉnh sửa gói vaccine"
        open={showEditModal}
        onCancel={() => {
          setShowEditModal(false);
          editForm.resetFields();
          setFormData({ name: "", description: "", duration: 1, status: "true", vaccines: [] });
          setSelectedPackage(null);
        }}
        footer={null}
        width={600}
        centered
        className="rounded-xl"
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditPackage}
          initialValues={formData}
          onValuesChange={(values) => handleFormChange(values, true)}
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
                setShowEditModal(false);
                editForm.resetFields();
                setFormData({ name: "", description: "", duration: 1, status: "true", vaccines: [] });
                setSelectedPackage(null);
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
        className="rounded-xl"
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
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Quản lý gói vaccine</h1>
              <p className="text-gray-600 text-sm mt-1">Quản lý danh sách gói vaccine và thông tin chi tiết</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Thêm gói vaccine</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên gói hoặc mô tả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="true">Đang sử dụng</option>
            <option value="false">Ngừng sử dụng</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-full">
                <div className="w-6 h-6 bg-blue-600 rounded-full"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Tổng số gói</p>
                <p className="text-2xl font-bold text-blue-800">{packages.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-full">
                <div className="w-6 h-6 bg-green-600 rounded-full"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Đang sử dụng</p>
                <p className="text-2xl font-bold text-green-800">{packages.filter((p) => p.status === "true").length}</p>
              </div>
            </div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-full">
                <div className="w-6 h-6 bg-orange-600 rounded-full"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-600">Ngừng sử dụng</p>
                <p className="text-2xl font-bold text-orange-800">{packages.filter((p) => p.status === "false").length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Package Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">
              Danh sách gói vaccine ({filteredPackages.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tên gói
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Mô tả
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Thời hạn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentPackages.map((pkg: VaccinePackage) => (
                  <React.Fragment key={pkg.packageId}>
                    <tr
                      className="hover:bg-blue-50 transition-colors cursor-pointer"
                      onClick={() => {
                        setAddVaccineState((prev) =>
                          prev?.packageId === pkg.packageId
                            ? null
                            : { packageId: pkg.packageId, show: false, facilityVaccineId: "", quantity: 1, loading: false, error: null }
                        );
                        setVaccineEditStates((prev) => {
                          const newState = { ...prev };
                          pkg.packageVaccines.forEach((pv) => {
                            if (!newState[pv.facilityVaccineId]) {
                              newState[pv.facilityVaccineId] = {
                                facilityVaccineId: pv.facilityVaccineId,
                                quantity: pv.quantity,
                                loading: false,
                                error: null,
                              };
                            }
                          });
                          return newState;
                        });
                      }}
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-800">{pkg.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs truncate" title={pkg.description}>
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
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                            pkg.status === "true"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-red-100 text-red-800 border-red-200"
                          }`}
                        >
                          {pkg.status === "true" ? "Đang sử dụng" : "Ngừng sử dụng"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(pkg);
                            }}
                            className="text-blue-500 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors duration-200"
                            title="Cập nhật"
                          >
                            <Pencil className="w-5 h-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPackage(pkg);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-500 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors duration-200"
                            title="Xóa"
                          >
                            <Trash2 className="w-5 h-5" />
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
                                className="px-3 py-1 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors duration-200"
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
                                className="flex gap-2 mb-4 items-center bg-gray-100 p-2 rounded-lg"
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
                                  className="bg-blue-600 hover:bg-blue-700 rounded-lg"
                                  disabled={addVaccineState.loading}
                                >
                                  {addVaccineState.loading ? "Đang thêm..." : "Xác nhận"}
                                </Button>
                                <Button
                                  onClick={() => setAddVaccineState(null)}
                                  disabled={addVaccineState.loading}
                                  className="rounded-lg"
                                >
                                  Hủy
                                </Button>
                                {addVaccineState.error && <span className="text-red-600 ml-2">{addVaccineState.error}</span>}
                              </form>
                            )}
                            <div className="space-y-2">
                              {pkg.packageVaccines.length === 0 ? (
                                <p className="text-gray-600">Không có vaccine nào trong gói này.</p>
                              ) : (
                                pkg.packageVaccines.map((pv: any, i: number) => {
                                  const fv = facilityVaccines.find((fv: FacilityVaccine) => fv.facilityVaccineId === pv.facilityVaccineId);
                                  const editState = vaccineEditStates[pv.facilityVaccineId] || {
                                    facilityVaccineId: pv.facilityVaccineId,
                                    quantity: pv.quantity,
                                    loading: false,
                                    error: null,
                                  };
                                  return (
                                    <div key={pv.packageVaccineId || i} className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg">
                                      <span className="flex-1 font-medium text-blue-700">{fv?.vaccine?.name || "-"}</span>
                                      <span className="text-green-600">Giá: {fv?.price?.toLocaleString("vi-VN")}₫</span>
                                      <div className="flex items-center gap-1">
                                        <Button
                                          icon={<MinusCircle className="w-4 h-4" />}
                                          onClick={() =>
                                            handleUpdateVaccineQuantity(pkg.packageId, pv.facilityVaccineId, Math.max(1, editState.quantity - 1))
                                          }
                                          disabled={editState.loading || editState.quantity <= 1}
                                          className="p-1"
                                        />
                                        <InputNumber
                                          min={1}
                                          value={editState.quantity}
                                          onChange={(value) =>
                                            handleUpdateVaccineQuantity(pkg.packageId, pv.facilityVaccineId, value !== null ? value : 1)
                                          }
                                          className="w-16"
                                          disabled={editState.loading}
                                        />
                                        <Button
                                          icon={<PlusCircle className="w-4 h-4" />}
                                          onClick={() =>
                                            handleUpdateVaccineQuantity(pkg.packageId, pv.facilityVaccineId, editState.quantity + 1)
                                          }
                                          disabled={editState.loading}
                                          className="p-1"
                                        />
                                      </div>
                                      <Button
                                        type="link"
                                        danger
                                        onClick={() => handleRemoveVaccineFromPackage(pkg.packageId, pv.facilityVaccineId)}
                                        icon={<Trash2 className="w-4 h-4" />}
                                        disabled={editState.loading}
                                      />
                                      {editState.error && <span className="text-red-600 text-sm">{editState.error}</span>}
                                    </div>
                                  );
                                })
                              )}
                            </div>
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
              <p className="text-gray-600 text-lg font-medium">Không tìm thấy gói vaccine nào.</p>
            </div>
          )}
          {filteredPackages.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between">
              <div className="text-sm text-gray-600 mb-4 sm:mb-0">
                Hiển thị {(currentPage - 1) * itemsPerPage + 1} đến{" "}
                {Math.min(currentPage * itemsPerPage, filteredPackages.length)} trong tổng số {filteredPackages.length} kết quả
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-full hover:bg-gray-100 transition-colors duration-200"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${
                      currentPage === page ? "bg-blue-600 text-white" : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-full hover:bg-gray-100 transition-colors duration-200"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VaccinePackageManagement;