import React, { useEffect, useState } from "react";
import { vaccineApi, type CreateVaccineRequest } from "@/api/vaccineApi";
import type { Vaccine } from "@/api/vaccineApi";
import { diseaseApi, type Disease } from "@/api/diseaseApi";
import {
  Pencil,
  Trash2,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Modal, Form, Input, Button, InputNumber, Select } from "antd";

const { TextArea } = Input;

const VaccineManagement: React.FC = () => {
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedVaccine, setSelectedVaccine] = useState<Vaccine | null>(null);
  const [formData, setFormData] = useState<CreateVaccineRequest>({
    name: "",
    description: "",
    manufacturer: "",
    category: "",
    ageGroup: "",
    numberOfDoses: 1,
    minIntervalBetweenDoses: 0,
    sideEffects: "",
    contraindications: "",
    price: 0,
    status: "Approved",
    diseaseIds: [],
  });
  const [addForm] = Form.useForm();
  const [updateForm] = Form.useForm();
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [diseasesLoading, setDiseasesLoading] = useState(false);

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

  const fetchDiseases = async () => {
    try {
      setDiseasesLoading(true);
      const response = await diseaseApi.getAll();
      setDiseases(response);
    } catch (err: any) {
      setErrorMessage("Lỗi khi tải danh sách bệnh");
      setShowErrorModal(true);
    } finally {
      setDiseasesLoading(false);
    }
  };

  useEffect(() => {
    fetchVaccines();
  }, []);

  useEffect(() => {
    if (showAddModal || showUpdateModal) {
      fetchDiseases();
    }
  }, [showAddModal, showUpdateModal]);

  const handleCreateVaccine = async () => {
    if (formData.price < 0) {
      setErrorMessage("Giá vaccine không được nhỏ hơn 0");
      setShowErrorModal(true);
      return;
    }
    try {
      const newVaccine = await vaccineApi.create(formData);
      setVaccines((prev) => [...prev, newVaccine]);
      setShowAddModal(false);
      setFormData({
        name: "",
        description: "",
        manufacturer: "",
        category: "",
        ageGroup: "",
        numberOfDoses: 1,
        minIntervalBetweenDoses: 0,
        sideEffects: "",
        contraindications: "",
        price: 0,
        status: "Approved",
        diseaseIds: [],
      });
      addForm.resetFields();
      setSuccessMessage("Thêm vaccine thành công");
      setShowSuccessModal(true);
    } catch (err: any) {
      setErrorMessage(err.message || "Lỗi khi tạo vaccine");
      setShowErrorModal(true);
    }
  };

  const handleUpdateVaccine = async () => {
    if (!selectedVaccine) return;
    if (formData.price < 0) {
      setErrorMessage("Giá vaccine không được nhỏ hơn 0");
      setShowErrorModal(true);
      return;
    }
    try {
      await vaccineApi.update(selectedVaccine.vaccineId, formData);
      setVaccines((prev) =>
        prev.map((v) =>
          v.vaccineId === selectedVaccine.vaccineId
            ? { ...v, ...formData, diseases: diseases.filter((d) => formData.diseaseIds.includes(d.diseaseId)) }
            : v
        )
      );
      setShowUpdateModal(false);
      setSelectedVaccine(null);
      updateForm.resetFields();
      setSuccessMessage("Cập nhật vaccine thành công");
      setShowSuccessModal(true);
    } catch (err: any) {
      setErrorMessage(err.message || "Lỗi khi cập nhật vaccine");
      setShowErrorModal(true);
    }
  };

  const handleDelete = async () => {
    if (!selectedVaccine) return;
    try {
      await vaccineApi.delete(selectedVaccine.vaccineId);
      setVaccines((prev) => prev.filter((v) => v.vaccineId !== selectedVaccine.vaccineId));
      setShowDeleteModal(false);
      setSelectedVaccine(null);
      setSuccessMessage("Xóa vaccine thành công");
      setShowSuccessModal(true);
    } catch (err: any) {
      setErrorMessage(err.message || "Lỗi khi xóa vaccine");
      setShowErrorModal(true);
    }
  };

  const openUpdateModal = (vaccine: Vaccine) => {
    setSelectedVaccine(vaccine);
    const updateData: CreateVaccineRequest = {
      name: vaccine.name,
      description: vaccine.description,
      manufacturer: vaccine.manufacturer,
      category: vaccine.category,
      ageGroup: vaccine.ageGroup,
      numberOfDoses: vaccine.numberOfDoses,
      minIntervalBetweenDoses: vaccine.minIntervalBetweenDoses,
      sideEffects: vaccine.sideEffects,
      contraindications: vaccine.contraindications,
      price: vaccine.price,
      status: vaccine.status,
      diseaseIds: vaccine.diseases.map((d: any) => d.diseaseId),
    };
    setFormData(updateData);
    updateForm.setFieldsValue(updateData);
    setShowUpdateModal(true);
  };

  const openAddModal = () => {
    const initialFormData: CreateVaccineRequest = {
      name: "",
      description: "",
      manufacturer: "",
      category: "",
      ageGroup: "",
      numberOfDoses: 1,
      minIntervalBetweenDoses: 0,
      sideEffects: "",
      contraindications: "",
      price: 0,
      status: "Approved",
      diseaseIds: [],
    };
    setFormData(initialFormData);
    addForm.setFieldsValue(initialFormData);
    setShowAddModal(true);
  };

  const filteredVaccines = vaccines.filter((vaccine) => {
    const matchesSearch =
      vaccine.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vaccine.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || vaccine.category === filterCategory;
    const matchesStatus =
      filterStatus === "all" || vaccine.status.toLowerCase() === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = [...new Set(vaccines.map((v) => v.category))];

  const getCurrentPageData = (data: Vaccine[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredVaccines.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, filterStatus]);

  const currentVaccines = getCurrentPageData(filteredVaccines);

  return (
    <div className="space-y-6">
      {/* Error Modal */}
      <Modal
        title="Lỗi"
        open={showErrorModal}
        onCancel={() => setShowErrorModal(false)}
        footer={[
          <Button
            key="close"
            onClick={() => setShowErrorModal(false)}
            className="rounded-lg"
          >
            Đóng
          </Button>,
        ]}
        centered
      >
        <p className="text-red-500">{errorMessage}</p>
      </Modal>

      {/* Success Modal */}
      <Modal
        title="Thành công"
        open={showSuccessModal}
        onCancel={() => setShowSuccessModal(false)}
        footer={[
          <Button
            key="close"
            onClick={() => setShowSuccessModal(false)}
            className="rounded-lg"
          >
            Đóng
          </Button>,
        ]}
        centered
      >
        <p className="text-green-500">{successMessage}</p>
      </Modal>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              Quản lý Vaccine
            </h1>
            <p className="text-gray-600 mt-1">
              Quản lý danh sách vaccine và thông tin chi tiết
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 hover:cursor-pointer bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Thêm Vaccine</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add Vaccine Modal */}
      <Modal
        title="Thêm Vaccine mới"
        open={showAddModal}
        onCancel={() => {
          setShowAddModal(false);
          addForm.resetFields();
        }}
        footer={null}
        width={800}
        centered
      >
        <Form
          form={addForm}
          layout="vertical"
          onFinish={handleCreateVaccine}
          initialValues={formData}
          onValuesChange={(_, values) => setFormData({ ...formData, ...values })}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Form.Item
              label="Tên Vaccine"
              name="name"
              rules={[{ required: true, message: "Vui lòng nhập tên vaccine" }]}
            >
              <Input className="rounded-lg" />
            </Form.Item>

            <Form.Item
              label="Nhà sản xuất"
              name="manufacturer"
              rules={[{ required: true, message: "Vui lòng nhập nhà sản xuất" }]}
            >
              <Input className="rounded-lg" />
            </Form.Item>

            <Form.Item
              label="Loại Vaccine"
              name="category"
              rules={[{ required: true, message: "Vui lòng nhập loại vaccine" }]}
            >
              <Input className="rounded-lg" />
            </Form.Item>

            <Form.Item
              label="Nhóm tuổi"
              name="ageGroup"
              rules={[{ required: true, message: "Vui lòng nhập nhóm tuổi" }]}
            >
              <Input className="rounded-lg" />
            </Form.Item>

            <Form.Item
              label="Số liều"
              name="numberOfDoses"
              rules={[{ required: true, message: "Vui lòng nhập số liều" }]}
            >
              <InputNumber min={1} className="w-full rounded-lg" />
            </Form.Item>

            <Form.Item
              label="Khoảng cách tối thiểu giữa các liều (tháng)"
              name="minIntervalBetweenDoses"
              rules={[{ required: true, message: "Vui lòng nhập khoảng cách tối thiểu" }]}
            >
              <InputNumber min={0} className="w-full rounded-lg" />
            </Form.Item>

            <Form.Item
              label="Giá (VNĐ)"
              name="price"
              rules={[{ required: true, message: "Vui lòng nhập giá" }]}
            >
              <InputNumber min={0} className="w-full rounded-lg" />
            </Form.Item>

            <Form.Item
              label="Trạng thái"
              name="status"
              rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
            >
              <Select className="rounded-lg">
                <Select.Option value="Approved">Hoạt động</Select.Option>
                <Select.Option value="Unaproved">Không hoạt động</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Bệnh liên quan"
              name="diseaseIds"
              className="sm:col-span-2"
              rules={[{ required: true, message: "Vui lòng chọn ít nhất một bệnh" }]}
            >
              <Select
                mode="multiple"
                allowClear
                showSearch
                placeholder="Tìm kiếm và chọn bệnh"
                loading={diseasesLoading}
                className="rounded-lg"
                filterOption={(input, option) =>
                  (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
                options={diseases.map((disease) => ({
                  label: disease.name,
                  value: disease.diseaseId,
                }))}
              />
            </Form.Item>

            <Form.Item
              label="Mô tả"
              name="description"
              className="sm:col-span-2"
            >
              <TextArea rows={4} className="rounded-lg" />
            </Form.Item>

            <Form.Item
              label="Tác dụng phụ"
              name="sideEffects"
              className="sm:col-span-2"
            >
              <TextArea rows={4} className="rounded-lg" />
            </Form.Item>

            <Form.Item
              label="Chống chỉ định"
              name="contraindications"
              className="sm:col-span-2"
            >
              <TextArea rows={4} className="rounded-lg" />
            </Form.Item>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              onClick={() => {
                setShowAddModal(false);
                addForm.resetFields();
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

      {/* Update Vaccine Modal */}
      <Modal
        title="Cập nhật Vaccine"
        open={showUpdateModal}
        onCancel={() => {
          setShowUpdateModal(false);
          updateForm.resetFields();
          setSelectedVaccine(null);
        }}
        footer={null}
        width={800}
        centered
      >
        <Form
          form={updateForm}
          layout="vertical"
          onFinish={handleUpdateVaccine}
          initialValues={formData}
          onValuesChange={(_, values) => setFormData({ ...formData, ...values })}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Form.Item
              label="Tên Vaccine"
              name="name"
              rules={[{ required: true, message: "Vui lòng nhập tên vaccine" }]}
            >
              <Input className="rounded-lg" />
            </Form.Item>

            <Form.Item
              label="Nhà sản xuất"
              name="manufacturer"
              rules={[{ required: true, message: "Vui lòng nhập nhà sản xuất" }]}
            >
              <Input className="rounded-lg" />
            </Form.Item>

            <Form.Item
              label="Loại Vaccine"
              name="category"
              rules={[{ required: true, message: "Vui lòng nhập loại vaccine" }]}
            >
              <Input className="rounded-lg" />
            </Form.Item>

            <Form.Item
              label="Nhóm tuổi"
              name="ageGroup"
              rules={[{ required: true, message: "Vui lòng nhập nhóm tuổi" }]}
            >
              <Input className="rounded-lg" />
            </Form.Item>

            <Form.Item
              label="Số liều"
              name="numberOfDoses"
              rules={[{ required: true, message: "Vui lòng nhập số liều" }]}
            >
              <InputNumber min={1} className="w-full rounded-lg" />
            </Form.Item>

            <Form.Item
              label="Khoảng cách tối thiểu giữa các liều (tháng)"
              name="minIntervalBetweenDoses"
              rules={[{ required: true, message: "Vui lòng nhập khoảng cách tối thiểu" }]}
            >
              <InputNumber min={0} className="w-full rounded-lg" />
            </Form.Item>

            <Form.Item
              label="Giá (VNĐ)"
              name="price"
              rules={[{ required: true, message: "Vui lòng nhập giá" }]}
            >
              <InputNumber min={0} className="w-full rounded-lg" />
            </Form.Item>

            <Form.Item
              label="Trạng thái"
              name="status"
              rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
            >
              <Select className="rounded-lg">
                <Select.Option value="Approved">Hoạt động</Select.Option>
                <Select.Option value="Unaproved">Không hoạt động</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Bệnh liên quan"
              name="diseaseIds"
              className="sm:col-span-2"
              rules={[{ required: true, message: "Vui lòng chọn ít nhất một bệnh" }]}
            >
              <Select
                mode="multiple"
                allowClear
                showSearch
                placeholder="Tìm kiếm và chọn bệnh"
                loading={diseasesLoading}
                className="rounded-lg"
                filterOption={(input, option) =>
                  (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
                options={diseases.map((disease) => ({
                  label: disease.name,
                  value: disease.diseaseId,
                }))}
              />
            </Form.Item>

            <Form.Item
              label="Mô tả"
              name="description"
              className="sm:col-span-2"
            >
              <TextArea rows={4} className="rounded-lg" />
            </Form.Item>

            <Form.Item
              label="Tác dụng phụ"
              name="sideEffects"
              className="sm:col-span-2"
            >
              <TextArea rows={4} className="rounded-lg" />
            </Form.Item>

            <Form.Item
              label="Chống chỉ định"
              name="contraindications"
              className="sm:col-span-2"
            >
              <TextArea rows={4} className="rounded-lg" />
            </Form.Item>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              onClick={() => {
                setShowUpdateModal(false);
                updateForm.resetFields();
                setSelectedVaccine(null);
              }}
              className="rounded-lg"
            >
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              className="bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Cập nhật
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
          setSelectedVaccine(null);
        }}
        footer={null}
        centered
      >
        <p className="text-gray-600 mb-4">
          Bạn có chắc chắn muốn xóa vaccine <strong>{selectedVaccine?.name}</strong> không?
        </p>
        <div className="flex justify-end gap-3">
          <Button
            onClick={() => {
              setShowDeleteModal(false);
              setSelectedVaccine(null);
            }}
            className="rounded-lg"
          >
            Hủy
          </Button>
          <Button
            type="primary"
            danger
            onClick={handleDelete}
            className="rounded-lg"
          >
            Xóa
          </Button>
        </div>
      </Modal>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên vaccine hoặc nhà sản xuất..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border cursor-pointer border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tất cả loại</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border hover:cursor-pointer border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="Approved">Hoạt động</option>
              <option value="Unaproved">Không hoạt động</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <div className="w-6 h-6 bg-blue-600 rounded-full"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">
                  Tổng số vaccine
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {vaccines.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <div className="w-6 h-6 bg-green-600 rounded-full"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">
                  Đang hoạt động
                </p>
                <p className="text-2xl font-bold text-green-900">
                  {
                    vaccines.filter(
                      (v) => v.status === "Approved"
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>


          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <div className="w-6 h-6 bg-orange-600 rounded-full"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-600">
                  Loại vaccine
                </p>
                <p className="text-2xl font-bold text-orange-900">
                  {categories.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading and Error States */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 font-semibold">{error}</p>
          </div>
        )}

        {/* Vaccine Table */}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Danh sách vaccine ({filteredVaccines.length})
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thông tin vaccine
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nhà sản xuất
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Độ tuổi & Loại
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số liều
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
                    {currentVaccines.map((vaccine) => (
                      <tr
                        key={vaccine.vaccineId}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {vaccine.name}
                            </div>
                            <div
                              className="text-sm text-gray-500 max-w-xs truncate"
                              title={vaccine.diseases.map((d) => d.name).join(", ")}
                            >
                              {vaccine.diseases.map((d) => d.name).join(", ")}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {vaccine.manufacturer}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            <div className="font-medium">
                              {vaccine.ageGroup}
                            </div>
                            <div className="text-gray-500">
                              {vaccine.category}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {vaccine.numberOfDoses}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-green-600">
                            {vaccine.price.toLocaleString("vi-VN")}₫
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              vaccine.status === "Approved"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {vaccine.status === "Approved"
                              ? "Hoạt động"
                              : "Không hoạt động"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openUpdateModal(vaccine)}
                              className="text-blue-600 hover:cursor-pointer hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                              title="Cập nhật"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredVaccines.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">Không tìm thấy vaccine nào.</p>
                </div>
              )}

              {/* Pagination */}
              {filteredVaccines.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Hiển thị {(currentPage - 1) * itemsPerPage + 1} đến{" "}
                      {Math.min(
                        currentPage * itemsPerPage,
                        filteredVaccines.length
                      )}{" "}
                      trong tổng số {filteredVaccines.length} kết quả
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                        className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                              currentPage === page
                                ? "bg-blue-600 text-white"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            {page}
                          </button>
                        )
                      )}

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
        )}
      </div>
    </div>
  );
};

export default VaccineManagement;