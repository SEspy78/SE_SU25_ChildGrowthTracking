import React, { useState, useRef, useEffect } from "react";
import { facilityApi, type CreateFacilityRequest } from "@/api/vaccinationFacilitiesApi";
import { Input, Button, Spin, type InputRef } from "antd";
import { UserPlus } from "lucide-react";

const { TextArea } = Input;

const CreateFacility: React.FC = () => {
  const [formData, setFormData] = useState<CreateFacilityRequest>({
    accountName: "",
    password: "",
    managerEmail: "",
    managerFullName: "",
    managerPhone: "",
    managerDescription: "",
    facilityName: "",
    licenseNumber: 0,
    facilityAddress: "",
    facilityPhone: 0,
    facilityEmail: "",
    facilityDescription: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CreateFacilityRequest, string>>>({});
  const accountNameRef = useRef<InputRef>(null);

  useEffect(() => {
    accountNameRef.current?.focus();
  }, []);

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof CreateFacilityRequest, string>> = {};
    if (!formData.accountName.trim()) errors.accountName = "Tên tài khoản là bắt buộc";
    if (!formData.password.trim()) errors.password = "Mật khẩu là bắt buộc";
    if (!formData.managerEmail.trim()) {
      errors.managerEmail = "Email quản lý là bắt buộc";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.managerEmail)) {
      errors.managerEmail = "Email quản lý không hợp lệ";
    }
    if (!formData.managerFullName.trim()) errors.managerFullName = "Họ tên quản lý là bắt buộc";
    if (!formData.managerPhone.trim()) {
      errors.managerPhone = "Số điện thoại quản lý là bắt buộc";
    } else if (!/^\d{10,15}$/.test(formData.managerPhone)) {
      errors.managerPhone = "Số điện thoại quản lý phải là 10-15 chữ số";
    }
    if (!formData.facilityName.trim()) errors.facilityName = "Tên cơ sở là bắt buộc";
    if (!formData.licenseNumber) errors.licenseNumber = "Số giấy phép là bắt buộc";
    if (!formData.facilityAddress.trim()) errors.facilityAddress = "Địa chỉ cơ sở là bắt buộc";
    if (!formData.facilityPhone) {
      errors.facilityPhone = "Số điện thoại cơ sở là bắt buộc";
    } else if (!/^\d{10,15}$/.test(String(formData.facilityPhone))) {
      errors.facilityPhone = "Số điện thoại cơ sở phải là 10-15 chữ số";
    }
    if (!formData.facilityEmail.trim()) {
      errors.facilityEmail = "Email cơ sở là bắt buộc";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.facilityEmail)) {
      errors.facilityEmail = "Email cơ sở không hợp lệ";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      accountNameRef.current?.focus();
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await facilityApi.createFacility(formData);
      if (response.success) {
        setSuccess("Tạo cơ sở và tài khoản quản lý thành công!");
        setFormData({
          accountName: "",
          password: "",
          managerEmail: "",
          managerFullName: "",
          managerPhone: "",
          managerDescription: "",
          facilityName: "",
          licenseNumber: 0,
          facilityAddress: "",
          facilityPhone: 0,
          facilityEmail: "",
          facilityDescription: "",
        });
        setFormErrors({});
        accountNameRef.current?.focus();
      } else {
        setError(response.message || "Tạo cơ sở thất bại");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      accountName: "",
      password: "",
      managerEmail: "",
      managerFullName: "",
      managerPhone: "",
      managerDescription: "",
      facilityName: "",
      licenseNumber: 0,
      facilityAddress: "",
      facilityPhone: 0,
      facilityEmail: "",
      facilityDescription: "",
    });
    setFormErrors({});
    setError(null);
    setSuccess(null);
    accountNameRef.current?.focus();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Spin size="large" className="text-blue-600" />
        <span className="mt-4 text-gray-600 text-lg font-medium">Đang xử lý...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <UserPlus className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Tạo cơ sở và tài khoản quản lý</h1>
        </div>

        <div className="space-y-6">
          {/* Form Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Manager Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Thông tin quản lý</h3>
              {/* Account Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên tài khoản</label>
                <Input
                  ref={accountNameRef}
                  className={`w-full border-gray-200 rounded-lg ${
                    formErrors.accountName ? "border-red-500" : ""
                  }`}
                  placeholder="Nhập tên tài khoản"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  disabled={loading}
                />
                {formErrors.accountName && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.accountName}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                <Input.Password
                  className={`w-full border-gray-200 rounded-lg ${
                    formErrors.password ? "border-red-500" : ""
                  }`}
                  placeholder="Nhập mật khẩu"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={loading}
                />
                {formErrors.password && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>
                )}
              </div>

              {/* Manager Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email quản lý</label>
                <Input
                  className={`w-full border-gray-200 rounded-lg ${
                    formErrors.managerEmail ? "border-red-500" : ""
                  }`}
                  placeholder="Nhập email quản lý"
                  value={formData.managerEmail}
                  onChange={(e) => setFormData({ ...formData, managerEmail: e.target.value })}
                  disabled={loading}
                />
                {formErrors.managerEmail && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.managerEmail}</p>
                )}
              </div>

              {/* Manager Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên quản lý</label>
                <Input
                  className={`w-full border-gray-200 rounded-lg ${
                    formErrors.managerFullName ? "border-red-500" : ""
                  }`}
                  placeholder="Nhập họ tên quản lý"
                  value={formData.managerFullName}
                  onChange={(e) => setFormData({ ...formData, managerFullName: e.target.value })}
                  disabled={loading}
                />
                {formErrors.managerFullName && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.managerFullName}</p>
                )}
              </div>

              {/* Manager Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại quản lý</label>
                <Input
                  className={`w-full border-gray-200 rounded-lg ${
                    formErrors.managerPhone ? "border-red-500" : ""
                  }`}
                  placeholder="Nhập số điện thoại quản lý"
                  value={formData.managerPhone}
                  onChange={(e) => setFormData({ ...formData, managerPhone: e.target.value })}
                  disabled={loading}
                />
                {formErrors.managerPhone && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.managerPhone}</p>
                )}
              </div>

              {/* Manager Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả quản lý</label>
                <TextArea
                  className="w-full border-gray-200 rounded-lg"
                  placeholder="Nhập mô tả quản lý (tùy chọn)"
                  value={formData.managerDescription}
                  onChange={(e) => setFormData({ ...formData, managerDescription: e.target.value })}
                  disabled={loading}
                  rows={4}
                />
              </div>
            </div>

            {/* Facility Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Thông tin cơ sở</h3>
              {/* Facility Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên cơ sở</label>
                <Input
                  className={`w-full border-gray-200 rounded-lg ${
                    formErrors.facilityName ? "border-red-500" : ""
                  }`}
                  placeholder="Nhập tên cơ sở"
                  value={formData.facilityName}
                  onChange={(e) => setFormData({ ...formData, facilityName: e.target.value })}
                  disabled={loading}
                />
                {formErrors.facilityName && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.facilityName}</p>
                )}
              </div>

              {/* License Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số giấy phép</label>
                <Input
                  type="number"
                  className={`w-full border-gray-200 rounded-lg ${
                    formErrors.licenseNumber ? "border-red-500" : ""
                  }`}
                  placeholder="Nhập số giấy phép"
                  value={formData.licenseNumber || ""}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: Number(e.target.value) })}
                  disabled={loading}
                />
                {formErrors.licenseNumber && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.licenseNumber}</p>
                )}
              </div>

              {/* Facility Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ cơ sở</label>
                <Input
                  className={`w-full border-gray-200 rounded-lg ${
                    formErrors.facilityAddress ? "border-red-500" : ""
                  }`}
                  placeholder="Nhập địa chỉ cơ sở"
                  value={formData.facilityAddress}
                  onChange={(e) => setFormData({ ...formData, facilityAddress: e.target.value })}
                  disabled={loading}
                />
                {formErrors.facilityAddress && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.facilityAddress}</p>
                )}
              </div>

              {/* Facility Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại cơ sở</label>
                <Input
                  className={`w-full border-gray-200 rounded-lg ${
                    formErrors.facilityPhone ? "border-red-500" : ""
                  }`}
                  placeholder="Nhập số điện thoại cơ sở"
                  value={formData.facilityPhone || ""}
                  onChange={(e) => setFormData({ ...formData, facilityPhone: Number(e.target.value) })}
                  disabled={loading}
                />
                {formErrors.facilityPhone && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.facilityPhone}</p>
                )}
              </div>

              {/* Facility Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email cơ sở</label>
                <Input
                  className={`w-full border-gray-200 rounded-lg ${
                    formErrors.facilityEmail ? "border-red-500" : ""
                  }`}
                  placeholder="Nhập email cơ sở"
                  value={formData.facilityEmail}
                  onChange={(e) => setFormData({ ...formData, facilityEmail: e.target.value })}
                  disabled={loading}
                />
                {formErrors.facilityEmail && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.facilityEmail}</p>
                )}
              </div>

              {/* Facility Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả cơ sở</label>
                <TextArea
                  className="w-full border-gray-200 rounded-lg"
                  placeholder="Nhập mô tả cơ sở (tùy chọn)"
                  value={formData.facilityDescription}
                  onChange={(e) => setFormData({ ...formData, facilityDescription: e.target.value })}
                  disabled={loading}
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg flex items-center gap-3">
              <svg
                className="w-5 h-5"
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
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-100 text-green-700 p-4 rounded-lg flex items-center gap-3">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-sm">{success}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg"
              onClick={handleCancel}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              className={`bg-blue-600 hover:bg-blue-700 text-white rounded-lg ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Đang tạo..." : "Tạo cơ sở"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateFacility;