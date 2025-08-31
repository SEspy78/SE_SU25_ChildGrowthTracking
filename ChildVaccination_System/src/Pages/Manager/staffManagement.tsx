import React, { useEffect, useState } from "react";
import { Button, Card, Col, Row, Input, Select, Table, Modal, Form, InputNumber, message } from "antd";
import { Search, Users, AlertCircle, Pencil, Trash2, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { FacilityStaffAPI, type Staff, type CreateStaffPayload, type UpdateStaffPayload } from "@/api/staffAPI";
import { getUserInfo } from "@/lib/storage";

const { Option } = Select;

const StaffManagement: React.FC = () => {
  const [staffData, setStaffData] = useState<Staff[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterPosition, setFilterPosition] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [form] = Form.useForm();

  const fetchStaffData = async () => {
    const userInfo = getUserInfo();
    if (!userInfo?.facilityId) {
      setError("Không tìm thấy mã cơ sở.");
      setTimeout(() => setError(null), 2500);
      return;
    }
    setLoading(true);
    try {
      const res = await FacilityStaffAPI.getAllStaff(
        userInfo.facilityId,
        filterPosition === "all" ? "" : filterPosition,
        currentPage,
        pageSize
      );
      console.log("API Response:", res);
      setStaffData(res.data || []);
      setTotalCount(res.totalCount || 0);
    } catch (err: any) {
      console.error("API Error:", err);
      setError(err.message || "Không thể tải dữ liệu nhân viên.");
      setTimeout(() => setError(null), 2500);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, [currentPage, filterPosition]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchStaffData();
  };

  const handleCreateStaff = async (values: CreateStaffPayload) => {
    setModalLoading(true);
    try {
      const res = await FacilityStaffAPI.createStaff(values);
      message.success(res.message || `Đã thêm nhân viên ${values.fullName} thành công!`);
      console.log("Create Response:", res.message);
      setShowCreateModal(false);
      form.resetFields();
      fetchStaffData();
    } catch (err: any) {
      message.error(err.response?.data?.message || `Thêm nhân viên thất bại: Lỗi không xác định`);
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateStaff = async (values: UpdateStaffPayload) => {
    if (!selectedStaff) return;
    setModalLoading(true);
    try {
      const payload: UpdateStaffPayload = {
        staffId: selectedStaff.staffId,
        fullName: values.fullName,
        phone: values.phone,
        email: values.email,
        position: values.position,
        description: values.description,
        status: values.status,
        age: values.age,
        specialization: values.specialization,
        certifications: values.certifications,
        university: values.university,
        bio: values.bio,
      };
      const res = await FacilityStaffAPI.updateStaff(payload);
      message.success(res.message || `Đã cập nhật nhân viên ${values.fullName} thành công!`);
      console.log("Update Response:", res.message);
      setShowEditModal(false);
      form.resetFields();
      fetchStaffData();
    } catch (err: any) {
      message.error(err.response?.data?.message || `Cập nhật nhân viên thất bại: Lỗi không xác định`);
    } finally {
      setModalLoading(false);
    }
  };

  const filteredStaff = staffData.filter(
    (staff) =>
      staff.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      title: "Tên",
      dataIndex: "fullName",
      key: "fullName",
      render: (text: string) => <span className="font-medium text-gray-900">{text}</span>,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (text: string) => <span className="text-gray-500">{text}</span>,
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
      render: (text: string) => <span className="text-gray-500">{text}</span>,
    },
    {
      title: "Vị trí",
      dataIndex: "position",
      key: "position",
      render: (text: string) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            text === "Manager"
              ? "bg-pink-100 text-pink-800"
              : text === "Doctor"
              ? "bg-cyan-100 text-cyan-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {text}
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: boolean) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            status ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {status ? "Đang hoạt động" : "Ngừng hoạt động"}
        </span>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text: string) => new Date(text).toLocaleDateString("vi-VN"),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: Staff) => (
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setSelectedStaff(record);
              setShowEditModal(true);
              form.setFieldsValue({
                fullName: record.fullName,
                email: record.email,
                phone: record.phone,
                position: record.position,
                description: record.description,
                status: record.status,
              });
            }}
            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
            title="Chỉnh sửa"
          >
            <Pencil className="w-4 h-4" />
          </button>
          
        </div>
      ),
    },
  ];

  const totalPages = Math.ceil(totalCount / pageSize);

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
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, idx) => (
              <div key={idx} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
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
      {/* Header */}
      <div className="p-6 max-w-6xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Quản lý nhân viên</h1>
              <p className="text-gray-600 mt-1">Quản lý danh sách nhân viên và thông tin chi tiết</p>
            </div>
          </div>
          <Button
            type="primary"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            <Plus className="w-4 h-4" />
            Thêm nhân viên
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="p-6 max-w-6xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onPressEnter={handleSearch}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <Select
            value={filterPosition}
            onChange={(value) => {
              setFilterPosition(value);
              setCurrentPage(1);
            }}
            className="w-40"
          >
            <Option value="all">Tất cả vị trí</Option>
            <Option value="Manager">Manager</Option>
            <Option value="Doctor">Doctor</Option>
            <Option value="Staff">Staff</Option>
          </Select>
          <Button
            type="primary"
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Tìm kiếm
          </Button>
        </div>

        {/* Stats Cards */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} md={6}>
            <Card className="bg-blue-50 border-blue-200">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <div className="w-6 h-6 bg-blue-600 rounded-full"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-600">Tổng nhân viên</p>
                  <p className="text-2xl font-bold text-blue-900">{totalCount}</p>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="bg-pink-50 border-pink-200">
              <div className="flex items-center">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <div className="w-6 h-6 bg-pink-600 rounded-full"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-pink-600">Quản lý</p>
                  <p className="text-2xl font-bold text-pink-900">
                    {staffData.filter((s) => s.position === "Manager").length}
                  </p>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="bg-cyan-50 border-cyan-200">
              <div className="flex items-center">
                <div className="p-2 bg-cyan-100 rounded-lg">
                  <div className="w-6 h-6 bg-cyan-600 rounded-full"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-cyan-600">Bác sĩ</p>
                  <p className="text-2xl font-bold text-cyan-900">
                    {staffData.filter((s) => s.position === "Doctor").length}
                  </p>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="bg-green-50 border-green-200">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <div className="w-6 h-6 bg-green-600 rounded-full"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-600">Nhân viên</p>
                  <p className="text-2xl font-bold text-green-900">
                    {staffData.filter((s) => s.position === "Staff").length}
                  </p>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Staff Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Danh sách nhân viên ({filteredStaff.length})
            </h3>
          </div>
          <Table
            dataSource={filteredStaff}
            columns={columns}
            pagination={false}
            rowKey="staffId"
            className="overflow-x-auto"
          />
          {filteredStaff.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Không tìm thấy nhân viên nào.</p>
            </div>
          )}
          {totalCount > 0 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Hiển thị {(currentPage - 1) * pageSize + 1} đến{" "}
                  {Math.min(currentPage * pageSize, totalCount)} trong tổng số {totalCount} kết quả
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        currentPage === page ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
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

      {/* Delete Confirmation Modal */}
      <Modal
        title="Xác nhận xóa"
        open={showDeleteModal}
        onCancel={() => {
          setShowDeleteModal(false);
          setSelectedStaff(null);
        }}
        footer={null}
        centered
      >
        <p className="text-gray-600 mb-4">
          Bạn có chắc chắn muốn xóa nhân viên <strong>{selectedStaff?.fullName}</strong> không?
        </p>
        <div className="flex justify-end gap-3">
          <Button
            onClick={() => {
              setShowDeleteModal(false);
              setSelectedStaff(null);
            }}
            className="rounded-lg"
          >
            Hủy
          </Button>
          <Button
            type="primary"
            danger
            // onClick={handleDeleteStaff}
            className="rounded-lg"
          >
            Xóa
          </Button>
        </div>
      </Modal>

      {/* Create Staff Modal */}
      <Modal
        title="Thêm nhân viên mới"
        open={showCreateModal}
        onCancel={() => {
          setShowCreateModal(false);
          form.resetFields();
        }}
        footer={null}
        centered
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateStaff}
          initialValues={{ position: "Staff" }}
        >
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item
                name="accountName"
                label="Tên tài khoản"
                rules={[{ required: true, message: "Vui lòng nhập tên tài khoản!" }]}
              >
                <Input placeholder="Nhập tên tài khoản" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Vui lòng nhập email!" },
                  { type: "email", message: "Email không hợp lệ!" },
                ]}
              >
                <Input placeholder="Nhập email" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="password"
                label="Mật khẩu"
                rules={[
                  { required: true, message: "Vui lòng nhập mật khẩu!" },
                  { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" },
                ]}
              >
                <Input.Password placeholder="Nhập mật khẩu" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="fullName"
                label="Họ tên"
                rules={[{ required: true, message: "Vui lòng nhập họ tên!" }]}
              >
                <Input placeholder="Nhập họ tên" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[
                  { required: true, message: "Vui lòng nhập số điện thoại!" },
                  { pattern: /^[0-9]{10}$/, message: "Số điện thoại phải có 10 chữ số!" },
                ]}
              >
                <Input placeholder="Nhập số điện thoại" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="position"
                label="Vị trí"
                rules={[{ required: true, message: "Vui lòng chọn vị trí!" }]}
              >
                <Select placeholder="Chọn vị trí">
                  <Option value="Staff">Nhân viên</Option>
                  <Option value="Doctor">Bác sĩ</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="age"
                label="Tuổi"
                rules={[
                  { required: true, message: "Vui lòng nhập tuổi!" },
                  { type: "number", min: 18, message: "Tuổi phải từ 18 trở lên!" },
                ]}
              >
                <InputNumber className="w-full" placeholder="Nhập tuổi" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="specialization" label="Chuyên môn">
                <Input placeholder="Nhập chuyên môn (nếu có)" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="certifications" label="Chứng chỉ">
                <Input placeholder="Nhập chứng chỉ (nếu có)" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="university" label="Trường đại học">
                <Input placeholder="Nhập trường đại học (nếu có)" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="description" label="Mô tả">
                <Input.TextArea rows={3} placeholder="Nhập mô tả (nếu có)" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="bio" label="Tiểu sử">
                <Input.TextArea rows={3} placeholder="Nhập tiểu sử (nếu có)" />
              </Form.Item>
            </Col>
          </Row>
          <div className="flex justify-end gap-3">
            <Button
              onClick={() => {
                setShowCreateModal(false);
                form.resetFields();
              }}
              className="rounded-lg"
            >
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={modalLoading}
              className="rounded-lg"
            >
              Thêm
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Edit Staff Modal */}
      <Modal
        title="Chỉnh sửa nhân viên"
        open={showEditModal}
        onCancel={() => {
          setShowEditModal(false);
          setSelectedStaff(null);
          form.resetFields();
        }}
        footer={null}
        centered
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateStaff}
          initialValues={{ status: true }}
        >
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item
                name="fullName"
                label="Họ tên"
                rules={[{ required: true, message: "Vui lòng nhập họ tên!" }]}
              >
                <Input placeholder="Nhập họ tên" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Vui lòng nhập email!" },
                  { type: "email", message: "Email không hợp lệ!" },
                ]}
              >
                <Input placeholder="Nhập email" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[
                  { required: true, message: "Vui lòng nhập số điện thoại!" },
                  { pattern: /^[0-9]{10}$/, message: "Số điện thoại phải có 10 chữ số!" },
                ]}
              >
                <Input placeholder="Nhập số điện thoại" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="position"
                label="Vị trí"
                rules={[{ required: true, message: "Vui lòng chọn vị trí!" }]}
              >
                <Select placeholder="Chọn vị trí">
                  <Option value="Staff">Nhân viên</Option>
                  <Option value="Doctor">Bác sĩ</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="age"
                label="Tuổi"
                rules={[
                  { required: true, message: "Vui lòng nhập tuổi!" },
                  { type: "number", min: 18, message: "Tuổi phải từ 18 trở lên!" },
                ]}
              >
                <InputNumber className="w-full" placeholder="Nhập tuổi" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Trạng thái"
                rules={[{ required: true, message: "Vui lòng chọn trạng thái!" }]}
              >
                <Select placeholder="Chọn trạng thái">
                  <Option value={true}>Đang hoạt động</Option>
                  <Option value={false}>Ngừng hoạt động</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="specialization" label="Chuyên môn">
                <Input placeholder="Nhập chuyên môn (nếu có)" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="certifications" label="Chứng chỉ">
                <Input placeholder="Nhập chứng chỉ (nếu có)" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="university" label="Trường đại học">
                <Input placeholder="Nhập trường đại học (nếu có)" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="description" label="Mô tả">
                <Input.TextArea rows={3} placeholder="Nhập mô tả (nếu có)" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="bio" label="Tiểu sử">
                <Input.TextArea rows={3} placeholder="Nhập tiểu sử (nếu có)" />
              </Form.Item>
            </Col>
          </Row>
          <div className="flex justify-end gap-3">
            <Button
              onClick={() => {
                setShowEditModal(false);
                setSelectedStaff(null);
                form.resetFields();
              }}
              className="rounded-lg"
            >
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={modalLoading}
              className="rounded-lg"
            >
              Cập nhật
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default StaffManagement;