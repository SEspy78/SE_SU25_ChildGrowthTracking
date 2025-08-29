import React, { useEffect, useState } from "react";
import { Modal } from "antd";
import { Package, Search, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { vaccinePackageApi, type VaccinePackage } from "@/api/vaccinePackageApi";
import { facilityVaccineApi, type FacilityVaccine, vaccineApi, type Vaccine } from "@/api/vaccineApi";
import { getUserInfo } from "@/lib/storage";

// Custom hook for debouncing
const useDebounce = (value: string, delay: number): string => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const VaccinePackageViewer: React.FC = () => {
  const [packages, setPackages] = useState<VaccinePackage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [selectedPackage, setSelectedPackage] = useState<VaccinePackage | null>(null);
  const [facilityVaccines, setFacilityVaccines] = useState<FacilityVaccine[]>([]);
  const [vaccineInfoMap, setVaccineInfoMap] = useState<Record<number, Vaccine>>({});
  const [searchTerm, setSearchTerm] = useState<string>("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  useEffect(() => {
    const fetchData = async () => {
      const userInfo = getUserInfo();
      if (!userInfo?.facilityId) {
        setError("Không tìm thấy mã cơ sở.");
        return;
      }
      setLoading(true);
      try {
        const res = await vaccinePackageApi.getAll(userInfo.facilityId);
        setPackages(res.data);
        const vacRes = await facilityVaccineApi.getAll(userInfo.facilityId);
        setFacilityVaccines(vacRes.data);
      } catch (err: any) {
        setError(err.message || "Không thể tải dữ liệu.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedPackage?.packageId) {
      selectedPackage.packageVaccines.forEach(async (pv) => {
        const vaccineId = pv.facilityVaccine?.vaccine?.vaccineId;
        if (vaccineId && !vaccineInfoMap[vaccineId]) {
          try {
            const data = await vaccineApi.getById(vaccineId);
            setVaccineInfoMap((prev) => ({ ...prev, [vaccineId]: data }));
          } catch {
            // Handle error silently
          }
        }
      });
    }
  }, [selectedPackage, vaccineInfoMap]);

  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch =
      pkg.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      pkg.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "true" && pkg.status === "true") ||
      (filterStatus === "false" && pkg.status === "false");
    return matchesSearch && matchesStatus;
  });

  const getCurrentPageData = (data: VaccinePackage[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredPackages.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, filterStatus]);

  const handleViewPackage = (pkg: VaccinePackage) => {
    setSelectedPackage(pkg);
    setShowViewModal(true);
  };

  const currentPackages = getCurrentPageData(filteredPackages);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
          <span className="text-lg text-gray-700 font-medium">Đang tải dữ liệu...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-50">
        <div className="bg-red-50 text-red-700 p-6 rounded-xl shadow-lg flex items-center space-x-3 max-w-md">
          <AlertCircle className="w-8 h-8 flex-shrink-0" />
          <span className="text-lg font-semibold">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg text-white font-semibold transition-all duration-300 ease-in-out ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* View Package Modal */}
      <Modal
        title={`Chi tiết gói vaccine: ${selectedPackage?.name || ""}`}
        open={showViewModal}
        onCancel={() => {
          setShowViewModal(false);
          setSelectedPackage(null);
        }}
        footer={null}
        width={800}
        centered
        className="rounded-xl"
      >
        {selectedPackage && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-600">Tên gói</label>
                <p className="text-gray-800">{selectedPackage.name}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Thời hạn (tháng)</label>
                <p className="text-gray-800">{selectedPackage.duration}</p>
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-semibold text-gray-600">Mô tả</label>
                <p className="text-gray-800">{selectedPackage.description || "Không có mô tả"}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Trạng thái</label>
                <p
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedPackage.status === "true"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {selectedPackage.status === "true" ? "Đang sử dụng" : "Ngừng sử dụng"}
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Giá</label>
                <p className="text-gray-800 font-semibold">{selectedPackage.price.toLocaleString("vi-VN")}₫</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Danh sách vaccine</label>
              <div className="overflow-x-auto mt-2">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Tên vaccine
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Giá
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Số lượng
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedPackage.packageVaccines.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-4 text-center text-gray-600">
                          Không có vaccine nào trong gói này.
                        </td>
                      </tr>
                    ) : (
                      selectedPackage.packageVaccines.map((pv, i) => {
                        const fv = facilityVaccines.find(
                          (fv: FacilityVaccine) => fv.facilityVaccineId === pv.facilityVaccineId
                        );
                        return (
                          <tr key={pv.packageVaccineId || i} className="hover:bg-blue-50">
                            <td className="px-4 py-2 text-gray-800">{fv?.vaccine?.name || "-"}</td>
                            <td className="px-4 py-2 text-green-600">{fv?.price?.toLocaleString("vi-VN")}₫</td>
                            <td className="px-4 py-2 text-gray-800">{pv.quantity}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedPackage(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Header */}
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Quản lý gói vaccine</h1>
              <p className="text-gray-600 text-sm mt-1">Xem danh sách gói vaccine và thông tin chi tiết</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 mt-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên gói hoặc mô tả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="true">Đang sử dụng</option>
            <option value="false">Ngừng sử dụng</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-full">
                <div className="w-6 h-6 bg-blue-600 rounded-full"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Tổng số gói</p>
                <p className="text-2xl font-bold text-blue-800">{packages.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-full">
                <div className="w-6 h-6 bg-green-600 rounded-full"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Đang sử dụng</p>
                <p className="text-2xl font-bold text-green-800">{packages.filter((p) => p.status === "true").length}</p>
              </div>
            </div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-full">
                <div className="w-6 h-6 bg-orange-600 rounded-full"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-600">Ngừng sử dụng</p>
                <p className="text-2xl font-bold text-orange-800">{packages.filter((p) => p.status === "false").length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Package Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">
              Danh sách gói vaccine ({filteredPackages.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tên gói
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Mô tả
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Thời hạn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentPackages.map((pkg: VaccinePackage) => (
                  <React.Fragment key={pkg.packageId}>
                    <tr
                      className="hover:bg-blue-50 transition-colors cursor-pointer"
                      onClick={() => handleViewPackage(pkg)}
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-800">{pkg.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs truncate" title={pkg.description}>
                          {pkg.description}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {pkg.duration} tháng
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-green-600">{pkg.price.toLocaleString("vi-VN")}₫</div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                            pkg.status === "true"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-red-100 text-red-800 border-red-200"
                          }`}
                        >
                          {pkg.status === "true" ? "Đang sử dụng" : "Ngừng sử dụng"}
                        </span>
                      </td>
                    </tr>
                    {selectedPackage?.packageId === pkg.packageId && (
                      <tr>
                        <td colSpan={5} className="bg-gray-50 border-b p-0">
                          <div className="p-4">
                            <h3 className="font-semibold text-blue-700 mb-2">Danh sách vaccine trong gói</h3>
                            <div className="space-y-2">
                              {pkg.packageVaccines.length === 0 ? (
                                <p className="text-gray-600">Không có vaccine nào trong gói này.</p>
                              ) : (
                                pkg.packageVaccines.map((pv, i) => {
                                  const fv = facilityVaccines.find(
                                    (fv: FacilityVaccine) => fv.facilityVaccineId === pv.facilityVaccineId
                                  );
                                  return (
                                    <div key={pv.packageVaccineId || i} className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg">
                                      <span className="flex-1 font-medium text-blue-700">{fv?.vaccine?.name || "-"}</span>
                                      <span className="text-green-600">Giá: {fv?.price?.toLocaleString("vi-VN")}₫</span>
                                      <span className="text-gray-800">Số lượng: {pv.quantity}</span>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          {filteredPackages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg font-medium">Không tìm thấy gói vaccine nào.</p>
            </div>
          )}
          {filteredPackages.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between">
              <div className="text-sm text-gray-600 mb-4 sm:mb-0">
                Hiển thị {(currentPage - 1) * itemsPerPage + 1} đến{" "}
                {Math.min(currentPage * itemsPerPage, filteredPackages.length)} trong tổng số {filteredPackages.length} kết quả
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-full hover:bg-gray-100 transition-colors duration-200"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${
                      currentPage === page ? "bg-blue-600 text-white" : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-full hover:bg-gray-100 transition-colors duration-200"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VaccinePackageViewer;