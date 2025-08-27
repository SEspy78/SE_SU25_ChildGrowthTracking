import React, { useEffect, useState } from "react";
import {
  facilityVaccineApi,
  vaccineApi,
  type FacilityVaccine,
  type Vaccine,
} from "@/api/vaccineApi";
import { getUserInfo } from "@/lib/storage";
import { Syringe, AlertCircle, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button, Input, Select, Table, Modal } from "antd";

const { Option } = Select;

interface FacilityVaccineResponse {
  totalCount: number;
  data: FacilityVaccine[];
}

const VaccineListPage: React.FC = () => {
  const [vaccines, setVaccines] = useState<FacilityVaccine[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notificationModal, setNotificationModal] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });
  const [selectedVaccine, setSelectedVaccine] = useState<Vaccine | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const user = getUserInfo();

  const fetchVaccines = async () => {
    if (!user?.facilityId) {
      setError("Không tìm thấy mã cơ sở.");
      setNotificationModal({ show: true, message: "Không tìm thấy mã cơ sở.", type: "error" });
      return;
    }
    try {
      setLoading(true);
      const res: FacilityVaccineResponse = await facilityVaccineApi.getAll(user.facilityId);
      let filteredVaccines = res.data || [];

      // Apply status filter
      if (statusFilter !== "all") {
        filteredVaccines = filteredVaccines.filter(v => v.status === statusFilter);
      }

      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredVaccines = filteredVaccines.filter(
          v => v.vaccine.name.toLowerCase().includes(query) || 
              v.vaccine.manufacturer.toLowerCase().includes(query)
        );
      }

      setTotalCount(filteredVaccines.length);
      setVaccines(filteredVaccines.slice((currentPage - 1) * pageSize, currentPage * pageSize));
    } catch {
      setError("Không thể tải danh sách vaccine.");
      setNotificationModal({ show: true, message: "Tải danh sách vaccine thất bại", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVaccines();
  }, [user?.facilityId, currentPage, pageSize, statusFilter, searchQuery]);

  const handleViewDetails = async (vaccineId: number) => {
    if (selectedVaccine && selectedVaccine.vaccineId === vaccineId) {
      setSelectedVaccine(null);
      setDetailError(null);
      return;
    }
    setDetailError(null);
    setDetailLoading(true);
    setSelectedVaccine(null);
    try {
      const data = await vaccineApi.getById(vaccineId);
      setSelectedVaccine(data);
    } catch {
      setDetailError("Không thể tải chi tiết vaccine.");
      setNotificationModal({ show: true, message: "Không thể tải chi tiết vaccine", type: "error" });
    } finally {
      setDetailLoading(false);
    }
  };

  const columns = [
    {
      title: "Tên vaccine",
      dataIndex: ["vaccine", "name"],
      key: "name",
      render: (text: string) => <span className="font-medium text-gray-900">{text}</span>,
    },
    {
      title: "Hãng SX",
      dataIndex: ["vaccine", "manufacturer"],
      key: "manufacturer",
      render: (text: string) => <span className="text-gray-500">{text}</span>,
    },
    {
      title: "Số lô",
      dataIndex: "batchNumber",
      key: "batchNumber",
      render: (text: string) => <span className="text-gray-500">{text}</span>,
    },
    {
      title: "SL còn",
      dataIndex: "availableQuantity",
      key: "availableQuantity",
      render: (text: number) => <span className="text-gray-500">{text}</span>,
    },
    {
      title: "Ngày nhập",
      dataIndex: "importDate",
      key: "importDate",
      render: (text: string) => new Date(text).toLocaleDateString("vi-VN"),
    },
    {
      title: "HSD",
      dataIndex: "expiryDate",
      key: "expiryDate",
      render: (text: string) => new Date(text).toLocaleDateString("vi-VN"),
    },
    {
      title: "Giá (VNĐ)",
      dataIndex: "price",
      key: "price",
      render: (text: number) => text.toLocaleString("vi-VN"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
          }`}
        >
          {status === "active" ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: FacilityVaccine) => (
        <div className="flex space-x-2">
          <Button
            type="link"
            onClick={() => handleViewDetails(record.vaccine.vaccineId)}
            className="text-blue-600 hover:text-blue-800"
          >
            Xem chi tiết
          </Button>
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
      {/* Notification Modal */}
      <Modal
        title={notificationModal.type === "success" ? "Thành công" : "Lỗi"}
        open={notificationModal.show}
        onCancel={() => setNotificationModal({ show: false, message: "", type: "success" })}
        footer={[
          <Button
            key="ok"
            type="primary"
            onClick={() => setNotificationModal({ show: false, message: "", type: "success" })}
            className="rounded-lg"
          >
            OK
          </Button>,
        ]}
        centered
      >
        <div className={`flex items-center gap-3 p-4 ${notificationModal.type === "success" ? "text-green-600" : "text-red-600"}`}>
          {notificationModal.type === "success" ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <AlertCircle className="w-6 h-6" />
          )}
          <p className="font-medium">{notificationModal.message}</p>
        </div>
      </Modal>

      {/* Header */}
      <div className="p-6 max-w-6xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Syringe className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Danh sách vaccine tại cơ sở</h1>
              <p className="text-gray-600 mt-1">Xem danh sách vaccine và thông tin chi tiết</p>
            </div>
          </div>
        </div>
      </div>

      {/* Vaccine Table */}
      <div className="p-6 max-w-6xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Danh sách vaccine ({totalCount})
          </h3>
        </div>
        <div className="px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-sm text-gray-700">
              Tổng số vaccine: {totalCount}
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="Tìm kiếm theo tên hoặc hãng sản xuất"
                prefix={<Search className="w-4 h-4 text-gray-500" />}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-64"
              />
              <Select
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-40"
              >
                <Option value="all">Tất cả trạng thái</Option>
                <Option value="active">Đang sử dụng</Option>
                <Option value="inactive">Ngừng SD</Option>
              </Select>
            </div>
          </div>
        </div>
        <Table
          dataSource={vaccines}
          columns={columns}
          rowKey="facilityVaccineId"
          pagination={false}
          className="overflow-x-auto"
        />
        {vaccines.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Không tìm thấy vaccine nào.</p>
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

      {/* Vaccine Details Modal */}
      <Modal
        title="Chi tiết vaccine"
        open={!!selectedVaccine}
        onCancel={() => setSelectedVaccine(null)}
        footer={null}
        centered
      >
        {detailLoading ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin w-6 h-6 text-blue-600 mr-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            </div>
            <span>Đang tải chi tiết vaccine...</span>
          </div>
        ) : detailError ? (
          <div className="text-red-600 text-center py-6">{detailError}</div>
        ) : (
          selectedVaccine && (
            <div className="space-y-4">
              <div>
                <span className="font-medium">Tên vaccine:</span>{" "}
                {selectedVaccine.name}
              </div>
              <div>
                <span className="font-medium">Hãng SX:</span>{" "}
                {selectedVaccine.manufacturer}
              </div>
              <div>
                <span className="font-medium">Mô tả:</span>{" "}
                {selectedVaccine.description}
              </div>
              <div>
                <span className="font-medium">Nhóm tuổi:</span>{" "}
                {selectedVaccine.ageGroup}
              </div>
              <div>
                <span className="font-medium">Số mũi:</span>{" "}
                {selectedVaccine.numberOfDoses}
              </div>
              <div>
                <span className="font-medium">Khoảng cách tối thiểu giữa các mũi:</span>{" "}
                {selectedVaccine.minIntervalBetweenDoses}
              </div>
              <div>
                <span className="font-medium">Tác dụng phụ:</span>{" "}
                {selectedVaccine.sideEffects}
              </div>
              <div>
                <span className="font-medium">Chống chỉ định:</span>{" "}
                {selectedVaccine.contraindications}
              </div>
              <div>
                <span className="font-medium">Trạng thái:</span>{" "}
                {selectedVaccine.status === "Approved" ? "Approved" : "UnApproved"}
              </div>
              <div>
                <span className="font-medium">Ngày tạo:</span>{" "}
                {new Date(selectedVaccine.createdAt).toLocaleDateString("vi-VN")}
              </div>
              <div>
                <span className="font-medium">Ngày cập nhật:</span>{" "}
                {new Date(selectedVaccine.updatedAt).toLocaleDateString("vi-VN")}
              </div>
            </div>
          )
        )}
      </Modal>
    </div>
  );
};

export default VaccineListPage;