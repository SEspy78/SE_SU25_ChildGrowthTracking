import React, { useEffect, useState, useCallback, useRef } from "react";
import { facilityVaccineApi, type CreateFacilityVaccineRequest, type FacilityVaccine } from "@/api/vaccineApi";
import { vaccineApi, type Vaccine } from "@/api/vaccineApi";
import { Loader2, Plus, Pencil, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Modal, Form, Input, Button, InputNumber, Select } from "antd";
import { getUserInfo } from "@/lib/storage";

const { Option } = Select;

// Custom debounce hook
const useDebounce = (callback: (value: string) => void, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (value: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(value);
      }, delay);
    },
    [callback, delay]
  );
};

const VaccineManagement: React.FC = () => {
  const user = getUserInfo();
  const [vaccines, setVaccines] = useState<FacilityVaccine[]>([]);
  const [allVaccines, setAllVaccines] = useState<Vaccine[]>([]);
  const [filteredVaccines, setFilteredVaccines] = useState<FacilityVaccine[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedVaccine, setSelectedVaccine] = useState<FacilityVaccine | null>(null);
  const [formData, setFormData] = useState<CreateFacilityVaccineRequest>({
    facilityId: user?.facilityId ?? 1,
    vaccineId: 0,
    price: 0,
    availableQuantity: 0,
    batchNumber: 0,
    expiryDate: "",
    importDate: "",
    status: "Approved",
  });
  const [addForm] = Form.useForm();
  const [updateForm] = Form.useForm();

  // Debounced search function
  const debouncedSearch = useDebounce((value: string) => {
    setSearchQuery(value.trim());
    setCurrentPage(1); // Reset to first page on new search
  }, 300);

  const fetchVaccines = async () => {
    if (!user?.facilityId) {
      setError("Không tìm thấy ID cơ sở. Vui lòng đăng nhập lại.");
      setFilteredVaccines([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [facilityVaccineResponse, allVaccinesResponse] = await Promise.all([
        facilityVaccineApi.getAll(user.facilityId),
        vaccineApi.getAll(),
      ]);
      const facilityVaccines = facilityVaccineResponse.data || [];
      let filtered = facilityVaccines;

      // Apply status filter
      if (filterStatus !== "all") {
        filtered = filtered.filter(v => v.status.toLowerCase() === filterStatus.toLowerCase());
      }

      // Apply category filter
      if (filterCategory !== "all") {
        filtered = filtered.filter(v => v.vaccine?.category === filterCategory);
      }

      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          v =>
            (v.vaccine?.name && v.vaccine.name.toLowerCase().includes(query)) ||
            (v.vaccine?.manufacturer && v.vaccine.manufacturer.toLowerCase().includes(query))
        );
      }

      setFilteredVaccines(filtered);
      setVaccines(facilityVaccines);
      setAllVaccines(allVaccinesResponse);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Lỗi không xác định");
      setFilteredVaccines([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVaccines();
  }, [filterStatus, filterCategory, searchQuery]);

  const handleCreateVaccine = async () => {
    if (formData.price < 0 || formData.availableQuantity < 0 || formData.batchNumber < 0) {
      setErrorMessage("Giá, số lượng hoặc số lô không được nhỏ hơn 0");
      setShowErrorModal(true);
      return;
    }
    if (!formData.facilityId || !formData.vaccineId) {
      setErrorMessage("ID cơ sở hoặc ID vaccine không hợp lệ");
      setShowErrorModal(true);
      return;
    }
    try {
      const newVaccine = await facilityVaccineApi.create(formData);
      setVaccines((prev) => [...prev, newVaccine]);
      setShowAddModal(false);
      setFormData({
        facilityId: user?.facilityId ?? 1,
        vaccineId: 0,
        price: 0,
        availableQuantity: 0,
        batchNumber: 0,
        expiryDate: "",
        importDate: "",
        status: "Approved",
      });
      addForm.resetFields();
      setSuccessMessage("Thêm vaccine cơ sở thành công");
      setShowSuccessModal(true);
    } catch (err: any) {
      setErrorMessage(err.message || "Lỗi khi tạo vaccine cơ sở");
      setShowErrorModal(true);
    }
  };

  const handleUpdateVaccine = async () => {
    if (!selectedVaccine) return;
    if (formData.price < 0 || formData.availableQuantity < 0 || formData.batchNumber < 0) {
      setErrorMessage("Giá, số lượng hoặc số lô không được nhỏ hơn 0");
      setShowErrorModal(true);
      return;
    }
    if (!formData.facilityId || !formData.vaccineId) {
      setErrorMessage("ID cơ sở hoặc ID vaccine không hợp lệ");
      setShowErrorModal(true);
      return;
    }
    try {
      const updatedVaccine = await facilityVaccineApi.update(selectedVaccine.facilityVaccineId, formData);
      setVaccines((prev) =>
        prev.map((v) =>
          v.facilityVaccineId === selectedVaccine.facilityVaccineId
            ? { ...v, ...updatedVaccine }
            : v
        )
      );
      setShowUpdateModal(false);
      setSelectedVaccine(null);
      updateForm.resetFields();
      setSuccessMessage("Cập nhật vaccine cơ sở thành công");
      setShowSuccessModal(true);
    } catch (err: any) {
      setErrorMessage(err.message || "Lỗi khi cập nhật vaccine cơ sở");
      setShowErrorModal(true);
    }
  };

  const openUpdateModal = (vaccine: FacilityVaccine) => {
    setSelectedVaccine(vaccine);
    const updateData: CreateFacilityVaccineRequest = {
      facilityId: vaccine.facilityId,
      vaccineId: vaccine.vaccineId,
      price: vaccine.price,
      availableQuantity: vaccine.availableQuantity,
      batchNumber: vaccine.batchNumber,
      expiryDate: vaccine.expiryDate,
      importDate: vaccine.importDate,
      status: vaccine.status,
    };
    setFormData(updateData);
    updateForm.setFieldsValue(updateData);
    setShowUpdateModal(true);
  };

  const openAddModal = () => {
    const initialFormData: CreateFacilityVaccineRequest = {
      facilityId: user?.facilityId ?? 1,
      vaccineId: 0 ,
      price: 0,
      availableQuantity: 0,
      batchNumber: 0,
      expiryDate: "",
      importDate: "",
      status: "Approved",
    };
    setFormData(initialFormData);
    addForm.setFieldsValue(initialFormData);
    setShowAddModal(true);
  };

  const categories = [...new Set(vaccines.map((v) => v.vaccine?.category).filter((c): c is string => !!c))];

  const getCurrentPageData = (data: FacilityVaccine[]) => {
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
              Quản lý Vaccine Cơ sở
            </h1>
            <p className="text-gray-600 mt-1">
              Quản lý danh sách vaccine tại cơ sở và thông tin chi tiết
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="primary"
              onClick={openAddModal}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 rounded-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Vaccine Cơ sở</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Add Facility Vaccine Modal */}
      <Modal
        title="Thêm Vaccine Cơ sở mới"
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
              label="Vaccine"
              name="vaccineId"
              rules={[{ required: true, message: "Vui lòng chọn vaccine" }]}
            >
              <Select
                showSearch
                placeholder="Tìm kiếm và chọn vaccine"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                }
                className="w-full rounded-lg"
              >
                {allVaccines.map((vaccine) => (
                  <Option key={vaccine.vaccineId} value={vaccine.vaccineId}>
                    {vaccine.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Giá (VNĐ)"
              name="price"
              rules={[{ required: true, message: "Vui lòng nhập giá" }]}
            >
              <InputNumber min={0} className="w-full rounded-lg" />
            </Form.Item>

            <Form.Item
              label="Số lượng có sẵn"
              name="availableQuantity"
              rules={[{ required: true, message: "Vui lòng nhập số lượng" }]}
            >
              <InputNumber min={0} className="w-full rounded-lg" />
            </Form.Item>

            <Form.Item
              label="Số lô"
              name="batchNumber"
              rules={[{ required: true, message: "Vui lòng nhập số lô" }]}
            >
              <InputNumber min={0} className="w-full rounded-lg" />
            </Form.Item>

            <Form.Item
              label="Ngày hết hạn"
              name="expiryDate"
              rules={[{ required: true, message: "Vui lòng nhập ngày hết hạn" }]}
            >
              <Input type="date" className="rounded-lg" />
            </Form.Item>

            <Form.Item
              label="Ngày nhập"
              name="importDate"
              rules={[{ required: true, message: "Vui lòng nhập ngày nhập" }]}
            >
              <Input type="date" className="rounded-lg" />
            </Form.Item>

            <Form.Item
              label="Trạng thái"
              name="status"
              rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
            >
              <Select className="rounded-lg">
                <Option value="active">Hoạt động</Option>
                <Option value="unactive">Không hoạt động</Option>
              </Select>
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

      {/* Update Facility Vaccine Modal */}
      <Modal
        title="Cập nhật Vaccine Cơ sở"
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
              label="Vaccine"
              name="vaccineId"
              rules={[{ required: true, message: "Vui lòng chọn vaccine" }]}
            >
              <Select
                showSearch
                placeholder="Tìm kiếm và chọn vaccine"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                }
                className="w-full rounded-lg"
              >
                {allVaccines.map((vaccine) => (
                  <Option key={vaccine.vaccineId} value={vaccine.vaccineId}>
                    {vaccine.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Giá (VNĐ)"
              name="price"
              rules={[{ required: true, message: "Vui lòng nhập giá" }]}
            >
              <InputNumber min={0} className="w-full rounded-lg" />
            </Form.Item>

            <Form.Item
              label="Số lượng có sẵn"
              name="availableQuantity"
              rules={[{ required: true, message: "Vui lòng nhập số lượng" }]}
            >
              <InputNumber min={0} className="w-full rounded-lg" />
            </Form.Item>

            <Form.Item
              label="Số lô"
              name="batchNumber"
              rules={[{ required: true, message: "Vui lòng nhập số lô" }]}
            >
              <InputNumber min={0} className="w-full rounded-lg" />
            </Form.Item>

            <Form.Item
              label="Ngày hết hạn"
              name="expiryDate"
              rules={[{ required: true, message: "Vui lòng nhập ngày hết hạn" }]}
            >
              <Input type="date" className="rounded-lg" />
            </Form.Item>

            <Form.Item
              label="Ngày nhập"
              name="importDate"
              rules={[{ required: true, message: "Vui lòng nhập ngày nhập" }]}
            >
              <Input type="date" className="rounded-lg" />
            </Form.Item>

            <Form.Item
              label="Trạng thái"
              name="status"
              rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
            >
              <Select className="rounded-lg">
                <Option value="active">Hoạt động</Option>
                <Option value="unactive">Không hoạt động</Option>
              </Select>
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

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Tìm kiếm theo tên vaccine hoặc hãng sản xuất"
              prefix={<Search className="w-4 h-4 text-gray-500" />}
              onChange={(e) => debouncedSearch(e.target.value)}
              className="w-full"
              allowClear
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Select
              value={filterCategory}
              onChange={(value) => {
                setFilterCategory(value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-40"
            >
              <Option value="all">Tất cả loại</Option>
              {categories.map((category) => (
                <Option key={category} value={category}>
                  {category}
                </Option>
              ))}
            </Select>

            <Select
              value={filterStatus}
              onChange={(value) => {
                setFilterStatus(value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-40"
            >
              <Option value="all">Tất cả trạng thái</Option>
              <Option value="active">Hoạt động</Option>
              <Option value="unactive">Không hoạt động</Option>
            </Select>
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
                  Tổng số vaccine cơ sở
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
                  {vaccines.filter((v) => v.status === "Approved").length}
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
            <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
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
                  Danh sách vaccine cơ sở ({filteredVaccines.length})
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
                        Độ tuổi & Loại
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số lượng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Giá
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày hết hạn
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
                        key={vaccine.facilityVaccineId}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-md font-medium text-gray-900">
                              {vaccine.vaccine?.name || "N/A"}
                            </div>
                            <div
                              className="text-md text-blue-500 max-w-xs truncate"
                              title={vaccine.vaccine?.diseases?.map((d) => d.name).join(", ") || ""}
                            >
                              {vaccine.vaccine?.diseases?.map((d) => d.name).join(", ") || "N/A"}
                            </div>
                            <div className="text-sm mt-2 text-gray-900">
                              Nhà sản xuất: <h4 className="font-bold text-amber-600">
                                {vaccine.vaccine?.manufacturer || "N/A"}
                              </h4>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            <div className="font-medium">
                              {vaccine.vaccine?.ageGroup || "N/A"}
                            </div>
                            <div className="text-gray-500">
                              {vaccine.vaccine?.category || "N/A"}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {vaccine.availableQuantity}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-green-600">
                            {vaccine.price.toLocaleString("vi-VN")}₫
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {new Date(vaccine.expiryDate).toLocaleDateString("vi-VN")}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              vaccine.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {vaccine.status === "active"
                              ? "Hoạt động"
                              : "Không hoạt động"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <Button
                              type="link"
                              onClick={() => openUpdateModal(vaccine)}
                              className="text-blue-600 hover:text-blue-800"
                              icon={<Pencil className="w-4 h-4" />}
                            >
                              Cập nhật
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredVaccines.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">Không tìm thấy vaccine cơ sở nào.</p>
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
                      <Button
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                        className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100"
                        icon={<ChevronLeft className="w-4 h-4" />}
                      >
                        Trước
                      </Button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <Button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                              currentPage === page
                                ? "bg-blue-600 text-white"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            {page}
                          </Button>
                        )
                      )}
                      <Button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100"
                        icon={<ChevronRight className="w-4 h-4" />}
                      >
                        Sau
                      </Button>
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