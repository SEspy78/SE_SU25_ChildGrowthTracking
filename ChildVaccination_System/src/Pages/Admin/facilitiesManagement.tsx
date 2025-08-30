import React, { useEffect, useState } from "react";
import { facilityApi } from "@/api/vaccinationFacilitiesApi";
import type { Facility, UpdateFacilityRequest } from "@/api/vaccinationFacilitiesApi";
import { Search, MapPin, Phone, Mail, Building2, Edit } from "lucide-react";
import { Form, Modal, Upload, Input, Switch, Button, Spin, message } from "antd";
import type { RcFile, UploadFile } from "antd/es/upload/interface";
import { getUserInfo } from "@/lib/storage";

const FacilityManagement: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedFacilityId, setSelectedFacilityId] = useState<number | null>(null);
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [currentLicenseFile, setCurrentLicenseFile] = useState<string | null>(null);
  const user = getUserInfo();
  const [form] = Form.useForm();

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

  const handleEdit = async (facilityId: number) => {
    setSelectedFacilityId(facilityId);
    setFormLoading(true);
    try {
      const res = await facilityApi.getById(facilityId);
      if (res.success && res.data) {
        form.setFieldsValue({
          facilityName: res.data.facilityName,
          licenseNumber: res.data.licenseNumber.toString(),
          address: res.data.address,
          phone: res.data.phone,
          email: res.data.email,
          description: res.data.description,
          status: res.data.status === 1,
          licenseFile: [], // Always initialize as empty array
        });
        setCurrentLicenseFile(res.data.licenseFile);
        setFormError(null);
        setIsModalOpen(true);
      } else {
        setFormError(res.message || "Không tìm thấy thông tin cơ sở.");
      }
    } catch {
      setFormError("Không thể tải thông tin cơ sở.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (values: any) => {
    console.log("handleUpdate called with values:", values);
    if (!selectedFacilityId) {
      Modal.confirm({
        title: "Cập nhật thất bại",
        content: "Không xác định được cơ sở để cập nhật.",
        okText: "Đóng",
        cancelButtonProps: { style: { display: "none" } },
      });
      return;
    }
    if (!user?.accountId) {
      Modal.confirm({
        title: "Cập nhật thất bại",
        content: "Không tìm thấy thông tin tài khoản người dùng.",
        okText: "Đóng",
        cancelButtonProps: { style: { display: "none" } },
      });
      return;
    }
    setFormLoading(true);
    try {
      const payload: UpdateFacilityRequest = {
        facilityId: selectedFacilityId,
        facilityName: values.facilityName,
        licenseNumber: Number(values.licenseNumber),
        address: values.address,
        phone: values.phone,
        email: values.email,
        description: values.description || "",
        status: values.status,
        licenseFile: Array.isArray(values.licenseFile) && values.licenseFile.length > 0
          ? (values.licenseFile[0].originFileObj as RcFile)
          : null,
      };
      console.log("Sending update request with payload:", payload, "accountId:", user.accountId);
      const res = await facilityApi.update( user.accountId, payload);
      Modal.confirm({
        title: res.success ? "Cập nhật thành công" : "Cập nhật thất bại",
        content: res.success
          ? "Thông tin cơ sở đã được cập nhật thành công."
          : res.message || "Đã xảy ra lỗi khi cập nhật cơ sở.",
        okText: "Đóng",
        cancelButtonProps: { style: { display: "none" } },
        onOk: () => {
          if (res.success && res.data) {
            const updatedFacilities = facilities.map((f) =>
              f.facilityId === selectedFacilityId ? res.data : f
            );
            setFacilities(updatedFacilities);
            setIsModalOpen(false);
            form.resetFields(); // Reset form after successful update
          }
        },
      });
    } catch (err: any) {
      console.error("Update error:", err);
      Modal.confirm({
        title: "Cập nhật thất bại",
        content: err?.message || "Đã xảy ra lỗi khi cập nhật cơ sở. Vui lòng thử lại.",
        okText: "Đóng",
        cancelButtonProps: { style: { display: "none" } },
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setSelectedFacilityId(null);
    setCurrentLicenseFile(null);
    form.resetFields(); // Reset form to clear licenseFile
    setFormError(null);
  };

  const handleFinishFailed = ({ errorFields }: any) => {
    console.log("Form validation failed:", errorFields);
    message.error("Vui lòng kiểm tra và điền đầy đủ các trường bắt buộc!");
  };

  const handleUploadChange = (info: { fileList: UploadFile[] }) => {
    console.log("Upload onChange:", info.fileList); // Debug fileList
    form.setFieldsValue({ licenseFile: info.fileList }); // Ensure fileList is updated
  };

  const filteredFacilities = facilities.filter((facility) => {
    const matchesSearch =
      facility.facilityName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      facility.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (facility.licenseNumber !== undefined &&
        facility.licenseNumber !== null &&
        facility.licenseNumber.toString().toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && facility.status === 1) ||
      (filterStatus === "inactive" && facility.status === 0);
    return matchesSearch && matchesStatus;
  });

  const activeFacilities = facilities.filter((f) => f.status === 1).length;
  const inactiveFacilities = facilities.filter((f) => f.status === 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Quản lý cơ sở</h1>
            <p className="text-gray-600 mt-1">Quản lý danh sách cơ sở tiêm chủng</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Tổng số cơ sở</p>
              <p className="text-2xl font-bold text-blue-900">{facilities.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <div className="w-6 h-6 bg-green-600 rounded-full"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Đang hoạt động</p>
              <p className="text-2xl font-bold text-green-900">{activeFacilities}</p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <div className="w-6 h-6 bg-red-600 rounded-full"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-red-600">Ngừng hoạt động</p>
              <p className="text-2xl font-bold text-red-900">{inactiveFacilities}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên cơ sở, địa chỉ hoặc số giấy phép..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border hover:cursor-pointer border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Ngừng hoạt động</option>
            </select>
          </div>
        </div>

        {/* Loading and Error States */}
        {loading && (
          <Spin tip="Đang tải dữ liệu..." size="large">
            <div className="py-12" />
          </Spin>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Facilities Table */}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Danh sách cơ sở ({filteredFacilities.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thông tin cơ sở
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Địa chỉ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Liên hệ
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
                    {filteredFacilities.map((facility) => (
                      <tr key={facility.facilityId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{facility.facilityName}</div>
                            <div className="text-sm text-gray-500">Số GP: {facility.licenseNumber}</div>
                            <div className="text-sm text-gray-500">
                              Giấy phép:{" "}
                              {facility.licenseFile ? (
                                <a
                                  href={facility.licenseFile}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 underline"
                                >
                                  Xem
                                </a>
                              ) : (
                                "Chưa có"
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-start">
                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                            <span className="text-sm text-gray-900 max-w-xs">{facility.address}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-gray-900">
                              <Phone className="w-4 h-4 text-gray-400 mr-2" />
                              {facility.phone}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <Mail className="w-4 h-4 text-gray-400 mr-2" />
                              {facility.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full
                              ${facility.status === 1 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                              justify-center items-center`}
                          >
                            {facility.status === 1 ? "Hoạt động" : "Ngừng hoạt động"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(facility.facilityId)}
                              className="text-green-600 hover:cursor-pointer hover:text-green-800 p-1 rounded hover:bg-green-50 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredFacilities.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">Không tìm thấy cơ sở nào.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Update Modal */}
      <Modal
        title="Cập nhật thông tin cơ sở"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        className="rounded-lg"
      >
        {formLoading ? (
          <Spin tip="Đang tải dữ liệu..." size="large">
            <div className="py-12" />
          </Spin>
        ) : formError ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{formError}</p>
          </div>
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleUpdate}
            onFinishFailed={handleFinishFailed}
            className="space-y-4"
          >
            <Form.Item
              label="Tên cơ sở"
              name="facilityName"
              rules={[{ required: true, message: "Vui lòng nhập tên cơ sở!" }]}
            >
              <Input placeholder="Nhập tên cơ sở" className="rounded-lg" />
            </Form.Item>
            <Form.Item
              label="Số giấy phép"
              name="licenseNumber"
              rules={[
                { required: true, message: "Vui lòng nhập số giấy phép!" },
                { pattern: /^\d+$/, message: "Số giấy phép phải là số!" },
              ]}
            >
              <Input placeholder="Nhập số giấy phép" type="number" className="rounded-lg" />
            </Form.Item>
            <Form.Item
              label="Địa chỉ"
              name="address"
              rules={[{ required: true, message: "Vui lòng nhập địa chỉ!" }]}
            >
              <Input placeholder="Nhập địa chỉ" className="rounded-lg" />
            </Form.Item>
            <Form.Item
              label="Số điện thoại"
              name="phone"
              rules={[
                { required: true, message: "Vui lòng nhập số điện thoại!" },
                { pattern: /^[0-9\s-]+$/, message: "Số điện thoại không hợp lệ!" },
              ]}
            >
              <Input placeholder="Nhập số điện thoại" className="rounded-lg" />
            </Form.Item>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Vui lòng nhập email!" },
                { type: "email", message: "Email không hợp lệ!" },
              ]}
            >
              <Input placeholder="Nhập email" className="rounded-lg" />
            </Form.Item>
            <Form.Item label="Mô tả" name="description">
              <Input.TextArea rows={4} placeholder="Nhập mô tả (nếu có)" className="rounded-lg" />
            </Form.Item>
            <Form.Item label="Trạng thái" name="status" valuePropName="checked">
              <Switch checkedChildren="Hoạt động" unCheckedChildren="Ngừng hoạt động" />
            </Form.Item>
            <Form.Item
              label="Cập nhật giấy phép"
              name="licenseFile"
              valuePropName="fileList"
            >
              <Upload
                beforeUpload={() => false}
                maxCount={1}
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleUploadChange}
              >
                <Button className="rounded-lg">Chọn tệp</Button>
              </Upload>
            </Form.Item>
            <div className="flex justify-end space-x-4">
              <Button
                onClick={handleCancel}
                className="rounded-lg border-gray-300 hover:bg-gray-100"
              >
                Hủy
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={formLoading}
                className="rounded-lg bg-blue-600 hover:bg-blue-700"
              >
                Lưu
              </Button>
            </div>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default FacilityManagement;