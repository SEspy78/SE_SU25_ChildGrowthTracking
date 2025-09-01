/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { facilityApi, type Facility, type UpdateFacilityRequest } from "@/api/vaccinationFacilitiesApi";
import { getUserInfo } from "@/lib/storage";
import { Pencil, Building2, AlertCircle } from "lucide-react";
import { Table, Spin, Button, Modal, Form, Input, Switch, Upload } from "antd";
import type { UploadFile, RcFile } from "antd/es/upload/interface";

const FacilityDetail: React.FC = () => {
  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [currentLicenseFile, setCurrentLicenseFile] = useState<string | null>(null);
  const [form] = Form.useForm();
  const user = getUserInfo();

  useEffect(() => {
    const fetchFacility = async () => {
      if (!user?.accountId) {
        setError("Chưa có thông tin tài khoản, vui lòng đăng nhập lại.");
        return;
      }
      try {
        setLoading(true);
        const response = await facilityApi.getById(user.facilityId);
        if (response.success && response.data) {
          setFacility(response.data);
          setCurrentLicenseFile(response.data.licenseFile || null);
        } else {
          setError(response.message || "Không tìm thấy thông tin cơ sở.");
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Lỗi không xác định");
      } finally {
        setLoading(false);
      }
    };
    fetchFacility();
  }, [user?.accountId]);

  const handleCreateFacility = () => {
    // Example: window.location.href = "/facility/create";
  };

  const handleOpenUpdateModal = () => {
    if (!facility) return;
    form.setFieldsValue({
      facilityName: facility.facilityName,
      licenseNumber: facility.licenseNumber.toString(),
      address: facility.address,
      phone: facility.phone.toString(),
      email: facility.email,
      description: facility.description,
      status: facility.status === 1,
      licenseFile: undefined, // Không set giá trị mặc định cho licenseFile
    });
    setCurrentLicenseFile(facility.licenseFile || null);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleUpdate = async (values: any) => {
    if (!facility?.facilityId || !user?.accountId) {
      Modal.error({
        title: "Cập nhật thất bại",
        content: "Không tìm thấy thông tin cơ sở hoặc tài khoản.",
        okText: "Đóng",
      });
      return;
    }
    setFormLoading(true);
    try {
      // Kiểm tra xem có file mới được chọn không
      const hasNewFile = values.licenseFile && Array.isArray(values.licenseFile) && values.licenseFile.length > 0 && values.licenseFile[0].originFileObj;
      
      // Nếu không có file mới và có file cũ, tạo một file giả để giữ file cũ
      let licenseFileToSend: File | null = null;
      if (hasNewFile) {
        licenseFileToSend = values.licenseFile[0].originFileObj as RcFile;
      } else if (currentLicenseFile) {
        // Tạo một file giả từ URL hiện tại để giữ file cũ
        licenseFileToSend = await createFileFromUrl(currentLicenseFile, "license.pdf");
      }
      
      const payload: UpdateFacilityRequest = {
        facilityId: facility.facilityId,
        facilityName: values.facilityName,
        licenseNumber: Number(values.licenseNumber),
        address: values.address,
        phone: Number(values.phone),
        email: values.email,
        description: values.description || "",
        status: values.status,
        licenseFile: licenseFileToSend,
      };
      const res = await facilityApi.update(user.accountId, payload);
      if (res.success && res.data) {
        setFacility(res.data);
        setCurrentLicenseFile(res.data.licenseFile || null);
        setIsModalOpen(false);
        // Không reset form để tránh mất dữ liệu
        Modal.success({
          title: "Cập nhật thành công",
          content: res.message || "Thông tin cơ sở đã được cập nhật thành công.",
          okText: "Đóng",
        });
      } else {
        setFormError(res.message || "Cập nhật thất bại.");
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Đã xảy ra lỗi khi cập nhật cơ sở.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setFormError(null);
    setCurrentLicenseFile(null);
    // Không reset form để tránh mất dữ liệu đã nhập
    form.setFieldsValue({
      facilityName: "",
      licenseNumber: "",
      address: "",
      phone: "",
      email: "",
      description: "",
      status: false,
      licenseFile: undefined,
    });
  };

  const handleUploadChange = (info: { fileList: UploadFile[] }) => {
    form.setFieldsValue({ licenseFile: info.fileList });
  };

  // Hàm tạo File object từ URL để giữ file cũ
  const createFileFromUrl = async (url: string, filename: string): Promise<File> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new File([blob], filename, { type: blob.type });
    } catch {
      // Tạo file rỗng nếu có lỗi
      return new File([""], filename, { type: "application/pdf" });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Spin size="large" className="text-blue-600" />
        <span className="mt-4 text-gray-600 text-lg font-medium">Đang tải dữ liệu...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-red-100 text-red-700 p-6 rounded-lg flex items-center gap-3 max-w-md">
          <AlertCircle className="w-6 h-6" />
          <span className="text-lg font-medium">{error}</span>
          {error === "Chưa có thông tin tài khoản, vui lòng đăng nhập lại." && (
            <Button
              className="ml-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              onClick={handleCreateFacility}
            >
              Nhập thông tin cơ sở
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-red-100 text-red-700 p-6 rounded-lg flex items-center gap-3 max-w-md">
          <AlertCircle className="w-6 h-6" />
          <span className="text-lg font-medium">Không tìm thấy thông tin cơ sở.</span>
          <Button
            className="ml-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            onClick={handleCreateFacility}
          >
            Nhập thông tin cơ sở
          </Button>
        </div>
      </div>
    );
  }

  const columns = [
    {
      title: "Thông tin",
      dataIndex: "label",
      key: "label",
      width: "30%",
      render: (text: string) => <span className="font-semibold text-gray-900">{text}</span>,
    },
    {
      title: "Chi tiết",
      dataIndex: "value",
      key: "value",
      render: (value: string, record: { label: string }) => (
        <div className="flex justify-between items-center">
          {record.label === "Trạng thái" ? (
            <span
              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                value === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
              }`}
            >
              {value}
            </span>
          ) : record.label === "Tệp giấy phép" ? (
            value ? (
              <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                Xem
              </a>
            ) : (
              "Chưa có"
            )
          ) : (
            <span className="text-gray-700">{value}</span>
          )}
          <Button
            type="text"
            className="text-blue-600 hover:text-blue-700"
            icon={<Pencil className="w-4 h-4" />}
            title={`Cập nhật ${record.label.toLowerCase()}`}
            onClick={handleOpenUpdateModal}
          />
        </div>
      ),
    },
  ];

  const dataSource = [
    { key: "1", label: "Tên cơ sở", value: facility.facilityName || "" },
    { key: "2", label: "Địa chỉ", value: facility.address || "" },
    { key: "3", label: "Số điện thoại", value: facility.phone?.toString() || "" },
    { key: "4", label: "Email", value: facility.email || "" },
    { key: "5", label: "Mô tả", value: facility.description || "" },
    { key: "6", label: "Trạng thái", value: facility.status === 1 ? "Active" : "Inactive" },
    { key: "7", label: "Tệp giấy phép", value: facility.licenseFile || "" },
    {
      key: "8",
      label: "Ngày tạo",
      value: facility.createdAt
        ? new Date(facility.createdAt).toLocaleDateString("vi-VN")
        : "",
    },
   
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">Thông tin cơ sở tiêm chủng</h1>
          </div>
        </div>
        <Table
          dataSource={dataSource}
          columns={columns}
          pagination={false}
          rowClassName="hover:bg-gray-50 transition"
          bordered
          className="text-gray-700"
        />
      </div>

      {/* Update Modal */}
      <Modal
        title="Cập nhật thông tin cơ sở"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        centered
      >
        {formLoading ? (
          <div className="flex items-center justify-center py-6">
            <Spin size="large" className="text-blue-600" />
            <span className="ml-2">Đang xử lý...</span>
          </div>
        ) : formError ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-6 h-6" />
            <span>{formError}</span>
          </div>
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleUpdate}
            onFinishFailed={() => {
              Modal.error({
                title: "Lỗi",
                content: "Vui lòng kiểm tra và điền đầy đủ các trường bắt buộc!",
                okText: "Đóng",
              });
            }}
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
                { pattern: /^\d+$/, message: "Số điện thoại phải là số!" },
              ]}
            >
              <Input placeholder="Nhập số điện thoại" type="number" className="rounded-lg" />
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
              label="Tệp giấy phép"
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
            {currentLicenseFile && (
              <div className="text-sm text-gray-600">
                <span>Tệp giấy phép hiện tại: </span>
                <a
                  href={currentLicenseFile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  {currentLicenseFile}
                </a>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button onClick={handleCancel} className="rounded-lg">
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

export default FacilityDetail;