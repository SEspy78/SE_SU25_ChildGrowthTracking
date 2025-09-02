import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserInfo } from "@/lib/storage";
import { ProfileApi, type StaffResponse, type UpdateStaffPayload } from "@/api/profileAPI";
import { Form, Input, Switch, message } from "antd";
import { UserOutlined, PhoneOutlined, MailOutlined, IdcardOutlined } from "@ant-design/icons";

const StaffProfile: React.FC = () => {
  const navigate = useNavigate();
  const user = getUserInfo();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.staffId) {
        setError("Không tìm thấy thông tin người dùng.");
        setLoading(false);
        return;
      }
      try {
        const response = await ProfileApi.getStaffById(user.staffId);
        form.setFieldsValue({
          fullName: response.fullName,
          phone: response.phone,
          email: response.email,
          position: response.position,
          description: response.description,
          status: response.status,
        });
        setError("");
      } catch {
        setError("Không thể tải thông tin hồ sơ.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user?.staffId, form]);

  const handleSubmit = async (values: UpdateStaffPayload) => {
    if (!user?.staffId) {
      message.error("Không tìm thấy thông tin người dùng.");
      return;
    }
    setSubmitting(true);
    try {
      const payload: UpdateStaffPayload = {
        fullName: values.fullName,
        phone: values.phone,
        email: values.email,
        position: values.position,
        description: values.description,
        status: values.status,
      };
      await ProfileApi.updateStaff(user.staffId, payload);
      message.success("Cập nhật hồ sơ thành công!");
    } catch {
      message.error("Cập nhật hồ sơ thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    const basePath = user?.position === "Doctor" ? "/doctor/dashboard" : "/staff/dashboard";
    navigate(basePath);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-2xl p-8">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <UserOutlined className="text-3xl text-blue-600" />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Profile Staff</h2>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
            <span className="mt-4 text-lg text-gray-600 font-medium">Đang tải...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-6 rounded-xl shadow-lg flex items-center space-x-3">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01M12 17h.01M12 3C7.029 3 3 7.029 3 12s4.029 9 9 9 9-4.029 9-9-4.029-9-9-9z"
              ></path>
            </svg>
            <span className="text-lg font-semibold">{error}</span>
          </div>
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Form.Item
                label={<span className="text-gray-700 font-medium">Họ và tên</span>}
                name="fullName"
                rules={[{ required: true, message: "Vui lòng nhập họ và tên!" }]}
              >
                <Input
                  prefix={<UserOutlined className="text-gray-400" />}
                  placeholder="Nhập họ và tên"
                  className="rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                />
              </Form.Item>
              <Form.Item
                label={<span className="text-gray-700 font-medium">Số điện thoại</span>}
                name="phone"
                rules={[
                  { required: true, message: "Vui lòng nhập số điện thoại!" },
                  { pattern: /^[0-9\s-]+$/, message: "Số điện thoại không hợp lệ!" },
                ]}
              >
                <Input
                  prefix={<PhoneOutlined className="text-gray-400" />}
                  placeholder="Nhập số điện thoại"
                  className="rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                />
              </Form.Item>
              <Form.Item
                label={<span className="text-gray-700 font-medium">Email</span>}
                name="email"
                rules={[
                  { required: true, message: "Vui lòng nhập email!" },
                  { type: "email", message: "Email không hợp lệ!" },
                ]}
              >
                <Input
                  prefix={<MailOutlined className="text-gray-400" />}
                  placeholder="Nhập email"
                  className="rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                />
              </Form.Item>
              <Form.Item
              hidden
                label={<span className="text-gray-700 font-medium">Chức vụ</span>}
                name="position"
              >
                <Input
                  prefix={<IdcardOutlined className="text-gray-400" />}
                  placeholder="Nhập chức vụ"
                  className="rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                />
              </Form.Item>
            </div>
            <Form.Item
              label={<span className="text-gray-700 font-medium">Mô tả</span>}
              name="description"
            >
              <Input.TextArea
                rows={4}
                placeholder="Nhập mô tả (nếu có)"
                className="rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-500 resize-none transition-colors duration-200"
              />
            </Form.Item>
           
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleBack}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-full font-medium transition-colors duration-200"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium transition-colors duration-200 ${submitting ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {submitting ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </Form>
        )}
      </div>
    </div>
  );
};

export default StaffProfile;