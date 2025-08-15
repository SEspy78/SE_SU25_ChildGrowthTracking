import React, { useEffect, useState } from "react";
import { facilityApi } from "@/api/vaccinationFacilitiesApi";
import type { Facility } from "@/api/vaccinationFacilitiesApi";
import { getUserInfo } from "@/lib/storage";
import { Pencil, Building2 } from "lucide-react";
import { Table, Spin, Button } from "antd";

const FacilityDetail: React.FC = () => {
  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = getUserInfo();

  useEffect(() => {
    const fetchFacility = async () => {
      if (!user?.facilityId) {
        setError("Chưa có thông tin, vui lòng nhập thông tin cơ sở");
        return;
      }
      try {
        setLoading(true);
        const response = await facilityApi.getById(user.facilityId);
        setFacility(response.data);
        console.log(response.message);
      } catch (err: any) {
        setError(err.response?.data?.message || "Lỗi không xác định");
      } finally {
        setLoading(false);
      }
    };
    fetchFacility();
  }, [user?.facilityId]);

  const handleCreateFacility = () => {
    // Placeholder: Navigate to a form to create facility
    console.log("Navigate to /facility/create");
    // Example: window.location.href = "/facility/create";
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
          <span className="text-lg font-medium">{error}</span>
          {error === "Chưa có thông tin, vui lòng nhập thông tin cơ sở" && (
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
          <span className="text-lg font-medium">Không tìm thấy thông tin cơ sở.</span>
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
          ) : (
            <span className="text-gray-700">{value}</span>
          )}
          <Button
            type="text"
            className="text-blue-600 hover:text-blue-700"
            icon={<Pencil className="w-4 h-4" />}
            title={`Cập nhật ${record.label.toLowerCase()}`}
          />
        </div>
      ),
    },
  ];

  const dataSource = [
    { key: "1", label: "Tên cơ sở", value: facility.facilityName || "" },
    { key: "2", label: "Giấy phép", value: facility.licenseNumber?.toString() || "" },
    { key: "3", label: "Địa chỉ", value: facility.address || "" },
    { key: "4", label: "Số điện thoại", value: facility.phone?.toString() || "" },
    { key: "5", label: "Email", value: facility.email || "" },
    { key: "6", label: "Mô tả", value: facility.description || "" },
    { key: "7", label: "Trạng thái", value: facility.status === 1 ? "Active" : "Inactive" },
    {
      key: "8",
      label: "Ngày tạo",
      value: facility.createdAt
        ? new Date(facility.createdAt).toLocaleDateString("vi-VN")
        : "",
    },
    {
      key: "9",
      label: "Ngày cập nhật",
      value: facility.updatedAt
        ? new Date(facility.updatedAt).toLocaleDateString("vi-VN")
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
    </div>
  );
};

export default FacilityDetail;