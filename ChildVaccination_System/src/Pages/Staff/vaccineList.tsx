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

      if (statusFilter !== "all") {
        filteredVaccines = filteredVaccines.filter(v => v.status === statusFilter);
      }

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
      render: (text: string) => <span className="font-medium text-gray-800">{text}</span>,
    },
    {
      title: "Hãng SX",
      dataIndex: ["vaccine", "manufacturer"],
      key: "manufacturer",
      render: (text: string) => <span className="text-gray-600">{text}</span>,
    },
    {
      title: "Số lô",
      dataIndex: "batchNumber",
      key: "batchNumber",
      render: (text: string) => <span className="text-gray-600">{text}</span>,
    },
    {
      title: "SL còn",
      dataIndex: "availableQuantity",
      key: "availableQuantity",
      render: (text: number) => <span className="text-gray-600">{text}</span>,
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
          className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
            status === "active" ? "bg-green-100 text-green-800 border border-green-200" : "bg-gray-100 text-gray-800 border border-gray-200"
          }`}
        >
          {status === "active" ? "Đang sử dụng" : "Ngừng sử dụng"}
        </span>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: FacilityVaccine) => (
        <button
          onClick={() => handleViewDetails(record.vaccine.vaccineId)}
          className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
        >
          Xem chi tiết
        </button>
      ),
    },
  ];

  const totalPages = Math.ceil(totalCount / pageSize);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
          <span className="text-lg text-gray-600 font-medium">Đang tải danh sách vaccine...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-50 text-red-700 p-6 rounded-xl shadow-lg flex items-center space-x-3">
          <AlertCircle className="w-8 h-8" />
          <span className="text-lg font-semibold">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 py-8 px-4 sm:px-6 lg:px-8">
      <Modal
        title={<span className="text-xl font-semibold text-gray-800">{notificationModal.type === "success" ? "Thành công" : "Lỗi"}</span>}
        open={notificationModal.show}
        onCancel={() => setNotificationModal({ show: false, message: "", type: "success" })}
        footer={[
          <button
            key="ok"
            onClick={() => setNotificationModal({ show: false, message: "", type: "success" })}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium transition-colors duration-200"
          >
            OK
          </button>,
        ]}
        centered
        className="rounded-xl"
      >
        <div className={`flex items-center gap-3 p-4 ${notificationModal.type === "success" ? "text-green-600" : "text-red-600"}`}>
          {notificationModal.type === "success" ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <AlertCircle className="w-6 h-6" />
          )}
          <p className="text-base font-medium">{notificationModal.message}</p>
        </div>
      </Modal>

      <div className="max-w-6xl mx-auto bg-white shadow-2xl rounded-2xl p-8 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Syringe className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Danh sách vaccine tại cơ sở</h1>
              <p className="text-gray-600 mt-1">Xem và quản lý danh sách vaccine hiện có</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="text-sm text-gray-600 font-medium">
              Tổng số vaccine: {totalCount}
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative w-full sm:w-64">
                <Input
                  placeholder="Tìm kiếm theo tên hoặc hãng sản xuất"
                  prefix={<Search className="w-4 h-4 text-gray-400" />}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-full border-gray-200 focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                />
              </div>
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
                <Option value="inactive">Ngừng sử dụng</Option>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table
              dataSource={vaccines}
              columns={columns}
              rowKey="facilityVaccineId"
              pagination={false}
              className="min-w-full"
              rowClassName={(record, index) => index % 2 === 0 ? "bg-white" : "bg-gray-50"}
            />
          </div>
          {vaccines.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg font-medium">Không tìm thấy vaccine nào.</p>
            </div>
          )}
          {totalCount > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600 mb-4 sm:mb-0">
                Hiển thị {(currentPage - 1) * pageSize + 1} đến{" "}
                {Math.min(currentPage * pageSize, totalCount)} trong tổng số {totalCount} kết quả
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      currentPage === page ? "bg-blue-600 text-white" : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        title={<span className="text-xl font-semibold text-gray-800">Chi tiết vaccine</span>}
        open={!!selectedVaccine}
        onCancel={() => setSelectedVaccine(null)}
        footer={null}
        centered
        className="rounded-xl"
      >
        {detailLoading ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600 mr-3"></div>
            <span className="text-gray-600">Đang tải chi tiết vaccine...</span>
          </div>
        ) : detailError ? (
          <div className="text-red-600 text-center py-6 font-medium">{detailError}</div>
        ) : (
          selectedVaccine && (
            <div className="space-y-4 text-gray-800">
              <div className="flex items-center">
                <span className="font-medium w-32">Tên vaccine:</span>
                <span>{selectedVaccine.name}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium w-32">Hãng SX:</span>
                <span>{selectedVaccine.manufacturer}</span>
              </div>
              <div className="flex items-start">
                <span className="font-medium w-32">Mô tả:</span>
                <span className="flex-1">{selectedVaccine.description}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium w-32">Nhóm tuổi:</span>
                <span>{selectedVaccine.ageGroup}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium w-32">Số mũi:</span>
                <span>{selectedVaccine.numberOfDoses}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium w-32">Khoảng cách tối thiểu:</span>
                <span>{selectedVaccine.minIntervalBetweenDoses}</span>
              </div>
              <div className="flex items-start">
                <span className="font-medium w-32">Tác dụng phụ:</span>
                <span className="flex-1">{selectedVaccine.sideEffects}</span>
              </div>
              <div className="flex items-start">
                <span className="font-medium w-32">Chống chỉ định:</span>
                <span className="flex-1">{selectedVaccine.contraindications}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium w-32">Trạng thái:</span>
                <span>{selectedVaccine.status === "Approved" ? "Đã duyệt" : "Chưa duyệt"}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium w-32">Ngày tạo:</span>
                <span>{new Date(selectedVaccine.createdAt).toLocaleDateString("vi-VN")}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium w-32">Ngày cập nhật:</span>
                <span>{new Date(selectedVaccine.updatedAt).toLocaleDateString("vi-VN")}</span>
              </div>
            </div>
          )
        )}
      </Modal>
    </div>
  );
};

export default VaccineListPage;