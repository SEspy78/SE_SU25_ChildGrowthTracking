import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserInfo } from "@/lib/storage";
import { ProfileApi, type StaffResponse, type UpdateStaffPayload } from "@/api/profileAPI";
import { Form, Input, Switch, message } from "antd";
import { User, Phone, Mail, IdCard } from "lucide-react";

const DoctorProfile: React.FC = () => {
  const navigate = useNavigate();
  const user = getUserInfo();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.staffId) {
        setError("Không tìm thấy thông tin bác sĩ.");
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
      message.error("Không tìm thấy thông tin bác sĩ.");
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
    navigate("/doctor/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-teal-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white shadow-md rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-indigo-600" />
            <h2 className="text-2xl font-bold text-indigo-900">Hồ sơ bác sĩ</h2>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-indigo-600"></div>
            <span className="mt-3 text-base text-gray-600 font-medium">Đang tải...</span>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg flex items-center gap-3">
            <svg
              className="w-6 h-6"
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
              />
            </svg>
            <span className="text-base font-semibold">{error}</span>
          </div>
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="space-y-4"
          >
            <Form.Item
              label={<span className="text-gray-700 font-medium text-sm">Họ và tên</span>}
              name="fullName"
              rules={[{ required: true, message: "Vui lòng nhập họ và tên!" }]}
            >
              <Input
                prefix={<User className="w-5 h-5 text-gray-400" />}
                placeholder="Nhập họ và tên"
                className="rounded-lg border-gray-300 py-2 text-base focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
              />
            </Form.Item>
            <Form.Item
              label={<span className="text-gray-700 font-medium text-sm">Số điện thoại</span>}
              name="phone"
              rules={[
                { required: true, message: "Vui lòng nhập số điện thoại!" },
                { pattern: /^[0-9\s-]+$/, message: "Số điện thoại không hợp lệ!" },
              ]}
            >
              <Input
                prefix={<Phone className="w-5 h-5 text-gray-400" />}
                placeholder="Nhập số điện thoại"
                className="rounded-lg border-gray-300 py-2 text-base focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
              />
            </Form.Item>
            <Form.Item
              label={<span className="text-gray-700 font-medium text-sm">Email</span>}
              name="email"
              rules={[
                { required: true, message: "Vui lòng nhập email!" },
                { type: "email", message: "Email không hợp lệ!" },
              ]}
            >
              <Input
                prefix={<Mail className="w-5 h-5 text-gray-400" />}
                placeholder="Nhập email"
                className="rounded-lg border-gray-300 py-2 text-base focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
              />
            </Form.Item>
            <Form.Item
              label={<span className="text-gray-700 font-medium text-sm">Chức vụ</span>}
              name="position"
            >
              <Input
                prefix={<IdCard className="w-5 h-5 text-gray-400" />}
                placeholder="Nhập chức vụ"
                className="rounded-lg border-gray-300 py-2 text-base focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
              />
            </Form.Item>
            <Form.Item
              label={<span className="text-gray-700 font-medium text-sm">Mô tả</span>}
              name="description"
            >
              <Input.TextArea
                rows={3}
                placeholder="Nhập mô tả (nếu có)"
                className="rounded-lg border-gray-300 py-2 text-base focus:ring-2 focus:ring-indigo-500 resize-none transition-colors duration-200"
              />
            </Form.Item>
            <Form.Item
              label={<span className="text-gray-700 font-medium text-sm">Trạng thái</span>}
              name="status"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="Kích hoạt"
                unCheckedChildren="Vô hiệu"
                className="bg-gray-300"
              />
            </Form.Item>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleBack}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-medium transition-colors duration-200 ${submitting ? "opacity-50 cursor-not-allowed" : ""}`}
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

export default DoctorProfile;