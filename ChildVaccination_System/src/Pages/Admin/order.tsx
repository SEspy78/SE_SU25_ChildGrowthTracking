import React, { useState, useEffect, useRef, useCallback } from "react";
import { orderApi, type Order, type OrderDetail } from "@/api/appointmentAPI";
import { facilityVaccineApi } from "@/api/vaccineApi";
import { vaccineApi, type Vaccine } from "@/api/vaccineApi";
import { vaccinePackageApi, type VaccinePackage } from "@/api/vaccinePackageApi";
import { diseaseApi, type Disease } from "@/api/diseaseApi";
import { Eye, X, Search, BarChart3, Calendar, Package, ChevronLeft, ChevronRight } from "lucide-react";

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

type ExtendedOrderDetail = OrderDetail & {
  vaccine?: Vaccine;
  disease?: Disease;
};

type ExtendedOrderModal = Order & {
  orderDetails: ExtendedOrderDetail[];
  vaccinePackage?: VaccinePackage;
};

type ExtendedOrder = Order & {
  vaccinePackage?: VaccinePackage;
};

const OrderManagementStyled: React.FC = () => {
  const [orders, setOrders] = useState<ExtendedOrder[]>([]);
  const [allOrders, setAllOrders] = useState<ExtendedOrder[]>([]);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ExtendedOrderModal | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPackage, setFilterPackage] = useState<string>("all");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const popupRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const packageCache = useRef<Map<number, VaccinePackage>>(new Map());
  const vaccineCache = useRef<Map<number, Vaccine>>(new Map());
  const diseaseCache = useRef<Map<number, Disease>>(new Map());

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        // Fetch all orders without pagination for filtering
        const response = await orderApi.getAllOrderAdmin("", 1, 1000);
        const ordersArray = Array.isArray(response.data) ? response.data : [];
        const extendedOrders: ExtendedOrder[] = await Promise.all(
          ordersArray.map(async (order: Order) => {
            let vaccinePackage: VaccinePackage | undefined;
            if (order.packageId !== null) {
              try {
                if (packageCache.current.has(order.packageId)) {
                  vaccinePackage = packageCache.current.get(order.packageId);
                } else {
                  vaccinePackage = await vaccinePackageApi.getById(order.packageId);
                  packageCache.current.set(order.packageId, vaccinePackage);
                }
              } catch (err) {
                console.error(`Error fetching VaccinePackage ${order.packageId}:`, err);
                vaccinePackage = undefined;
              }
            }
            return { ...order, vaccinePackage };
          })
        );
        setAllOrders(extendedOrders);
        setOrders(extendedOrders);
        if (!Array.isArray(response.data)) {
          console.warn("Unexpected response.data from getAllOrder:", response.data);
        }
      } catch (err) {
        setError("Không thể tải danh sách đơn hàng.");
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let filtered = allOrders;

    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(order => order.status === filterStatus);
    }

    // Apply package filter
    if (filterPackage !== "all") {
      filtered = filtered.filter(order => order.packageName === filterPackage);
    }

    // Apply search filter
    if (debouncedSearchTerm.trim() !== "") {
      filtered = filtered.filter(order => 
        order.member?.fullName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        order.member?.accountName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    setOrders(filtered);
    setPageIndex(1); // Reset to page 1 when filters change
  }, [allOrders, filterStatus, filterPackage, debouncedSearchTerm]);

  // Get unique package names for filter
  const packageNames = [...new Set(allOrders.map(order => order.packageName).filter(Boolean))];

  // Pagination logic
  const totalPages = Math.ceil(orders.length / pageSize);

  const handlePageChange = (page: number) => {
    setPageIndex(page);
  };

  const handlePreviousPage = () => {
    if (pageIndex > 1) {
      setPageIndex(pageIndex - 1);
    }
  };

  const handleNextPage = () => {
    if (pageIndex < totalPages) {
      setPageIndex(pageIndex + 1);
    }
  };

  // Get current page data
  const getCurrentPageData = (data: ExtendedOrder[]) => {
    const startIndex = (pageIndex - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
  };

  const currentOrders = getCurrentPageData(orders);

  const handleViewDetails = async (orderId: number) => {
    try {
      const order = await orderApi.getOrderById(orderId);
      const updatedOrderDetails = await Promise.all(
        order.orderDetails.map(async (detail: OrderDetail) => {
          let vaccine: Vaccine | undefined;
          let disease: Disease | undefined;
          try {
            const facilityVaccine = await facilityVaccineApi.getById(detail.facilityVaccineId);
            if (facilityVaccine.vaccineId) {
              if (vaccineCache.current.has(facilityVaccine.vaccineId)) {
                vaccine = vaccineCache.current.get(facilityVaccine.vaccineId);
              } else {
                vaccine = await vaccineApi.getById(facilityVaccine.vaccineId);
                vaccineCache.current.set(facilityVaccine.vaccineId, vaccine);
              }
            }
          } catch (err) {
            console.error(`Error fetching Vaccine for FacilityVaccine ${detail.facilityVaccineId}:`, err);
          }
          try {
            if (diseaseCache.current.has(detail.diseaseId)) {
              disease = diseaseCache.current.get(detail.diseaseId);
            } else {
              disease = await diseaseApi.getById(detail.diseaseId);
              diseaseCache.current.set(detail.diseaseId, disease);
            }
          } catch (err) {
            console.error(`Error fetching Disease ${detail.diseaseId}:`, err);
          }
          return { ...detail, vaccine, disease } as ExtendedOrderDetail;
        })
      );
      let vaccinePackage: VaccinePackage | undefined;
      if (order.packageId !== null) {
        try {
          if (packageCache.current.has(order.packageId)) {
            vaccinePackage = packageCache.current.get(order.packageId);
          } else {
            vaccinePackage = await vaccinePackageApi.getById(order.packageId);
            packageCache.current.set(order.packageId, vaccinePackage);
          }
        } catch (err) {
          console.error(`Error fetching VaccinePackage ${order.packageId}:`, err);
          vaccinePackage = undefined;
        }
      }
      setSelectedOrder({ ...order, orderDetails: updatedOrderDetails, vaccinePackage });
      setIsDetailsModalOpen(true);
    } catch (err) {
      setError("Không thể tải chi tiết đơn hàng.");
      console.error("Error fetching order details:", err);
    }
  };

  const closeDetailsModal = useCallback(() => {
    setIsDetailsModalOpen(false);
    setSelectedOrder(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isDetailsModalOpen) {
        closeDetailsModal();
        closeButtonRef.current?.focus();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        if (isDetailsModalOpen) closeDetailsModal();
      }
    };

    if (isDetailsModalOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
      closeButtonRef.current?.focus();
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDetailsModalOpen, closeDetailsModal]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Quản lý đơn hàng</h1>
            <p className="text-gray-600 mt-1">Quản lý và theo dõi tất cả đơn hàng vaccine</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Có thể thêm các action khác ở đây */}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Tổng đơn hàng</p>
              <p className="text-2xl font-bold text-blue-900">{allOrders.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <div className="w-6 h-6 bg-green-600 rounded-full"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Hoàn thành</p>
              <p className="text-2xl font-bold text-green-900">
                {allOrders.filter(o => o.status === 'Completed').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-orange-600">Đang xử lý</p>
              <p className="text-2xl font-bold text-orange-900">
                {allOrders.filter(o => o.status === 'Pending').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <div className="w-6 h-6 bg-red-600 rounded-full"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-red-600">Đã hủy</p>
              <p className="text-2xl font-bold text-red-900">
                {allOrders.filter(o => o.status === 'Cancelled').length}
              </p>
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo tên khách hàng..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Tìm kiếm đơn hàng theo tên khách hàng"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="Paid">Hoàn thành</option>
              <option value="Pending">Đang xử lý</option>
            </select>
            
            <select
              value={filterPackage}
              onChange={(e) => setFilterPackage(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tất cả gói vaccine</option>
              {packageNames.map(packageName => (
                <option key={packageName} value={packageName}>{packageName}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading and Error States */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 font-semibold">{error}</p>
          </div>
        )}

        {/* Orders Table */}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Danh sách đơn hàng ({orders.length})
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        STT
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Khách hàng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày đặt
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tổng tiền
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gói vaccine
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentOrders.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="text-center py-12 text-gray-500"
                        >
                          {searchTerm || filterStatus !== "all" || filterPackage !== "all" ? "Không tìm thấy đơn hàng nào phù hợp" : "Không có dữ liệu đơn hàng"}
                        </td>
                      </tr>
                    ) : (
                      currentOrders.map((order, index) => (
                        <tr
                          key={order.orderId}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {(pageIndex - 1) * pageSize + index + 1}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {order.member?.fullName || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {new Date(order.orderDate).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: '2-digit',
                            })}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-green-600">
                              {order.totalAmount.toLocaleString('vi-VN')}₫
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              order.status === 'Completed'
                                ? 'bg-green-100 text-green-800'
                                : order.status === 'Cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {order.status === 'Paid' ? 'Hoàn thành' : 
                               order.status === 'Pending' ? 'Đang xử lý' : 'Đã hủy'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <Package className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-900">
                                {order.vaccinePackage?.name || '-'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleViewDetails(order.orderId)}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {currentOrders.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">Không tìm thấy đơn hàng nào.</p>
                </div>
              )}

              {/* Pagination */}
              {orders.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Hiển thị {((pageIndex - 1) * pageSize) + 1} đến {Math.min(pageIndex * pageSize, orders.length)} trong tổng số {orders.length} kết quả
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handlePreviousPage}
                        disabled={pageIndex === 1}
                        className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                            pageIndex === page
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      
                      <button
                        onClick={handleNextPage}
                        disabled={pageIndex === totalPages}
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
        )}

        {isDetailsModalOpen && selectedOrder && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
            role="dialog"
            aria-modal="true"
          >
            <div
              ref={popupRef}
              className="bg-white rounded-md shadow-lg p-6 w-full max-w-2xl mx-auto border-1 border-black"
              role="dialog"
              aria-labelledby="details-title"
            >
              <div className="flex justify-between items-center mb-4">
                <h3
                  id="details-title"
                  className="text-xl font-semibold text-gray-800"
                >
                  Chi tiết Đơn hàng #{selectedOrder.orderId}
                </h3>
                <button
                  ref={closeButtonRef}
                  onClick={closeDetailsModal}
                  className="text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-600 rounded-full w-8 h-8 flex items-center justify-center"
                  aria-label="Đóng"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="mb-4">
                <p><strong>Khách hàng:</strong> {selectedOrder.member?.fullName || '-'}</p>
                <p><strong>Tên Gói Vắc xin:</strong> {selectedOrder.vaccinePackage?.name || '-'}</p>
                <p><strong>Ngày đặt:</strong> {new Date(selectedOrder.orderDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit' })}</p>
                <p><strong>Tổng tiền:</strong> {selectedOrder.totalAmount.toLocaleString('vi-VN')}₫</p>
                <p><strong>Trạng thái:</strong> {selectedOrder.status}</p>
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Chi tiết Vắc xin</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full border-1 border-black shadow-sm">
                  <thead className="bg-blue-100 text-blue-800">
                    <tr>
                      <th className="px-4 py-2 text-left border">Tên Vắc xin</th>
                      <th className="px-4 py-2 text-left border">Tên Bệnh</th>
                      <th className="px-4 py-2 text-center border">Số lượng Còn lại</th>
                      <th className="px-4 py-2 text-right border">Giá</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white text-gray-800">
                    {selectedOrder.orderDetails.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-4 text-gray-500 italic">
                          Không có chi tiết vắc xin
                        </td>
                      </tr>
                    ) : (
                      selectedOrder.orderDetails.map((detail: ExtendedOrderDetail) => (
                        <tr
                          key={detail.orderDetailId}
                          className="hover:bg-blue-50 transition-colors"
                        >
                          <td className="px-4 py-2 border">
                            {detail.vaccine?.name || `ID: ${detail.facilityVaccineId}`}
                          </td>
                          <td className="px-4 py-2 border">
                            {detail.disease?.name || `ID: ${detail.diseaseId}`}
                          </td>
                          <td className="px-4 py-2 text-center border">
                            {detail.remainingQuantity}
                          </td>
                          <td className="px-4 py-2 text-right border">
                            {detail.price.toLocaleString('vi-VN')}₫
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={closeDetailsModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderManagementStyled;