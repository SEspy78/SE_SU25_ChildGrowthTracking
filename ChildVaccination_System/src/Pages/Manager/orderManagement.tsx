import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { orderApi, type Order, type OrderDetail } from "@/api/appointmentAPI";
import { facilityVaccineApi, type FacilityVaccine } from "@/api/vaccineApi";
import { vaccinePackageApi, type VaccinePackage } from "@/api/vaccinePackageApi";
import { diseaseApi, type Disease } from "@/api/diseaseApi";
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

// Extend OrderDetail for modal to include optional facilityVaccine and disease
type ExtendedOrderDetail = OrderDetail & {
  facilityVaccine?: FacilityVaccine;
  disease?: Disease;
};

// Extend Order for modal to include ExtendedOrderDetail and optional vaccinePackage
type ExtendedOrderModal = Order & {
  orderDetails: ExtendedOrderDetail[];
  vaccinePackage?: VaccinePackage;
};

// Extend Order for main table to include optional vaccinePackage
type ExtendedOrder = Order & {
  vaccinePackage?: VaccinePackage;
};

const OrderManagement: React.FC = () => {
  // Memoize user to prevent new object references on each render
  const user = useMemo(() => getUserInfo(), []);
  const [orders, setOrders] = useState<ExtendedOrder[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ExtendedOrderModal | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const popupRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const packageCache = useRef<Map<number, VaccinePackage>>(new Map());
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Paid">("All");

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const facilityId = user?.facilityId;
        if (!facilityId) {
          setError("Không có cơ sở y tế được liên kết với tài khoản này.");
          setOrders([]);
          setTotalCount(0);
          return;
        }

        let response;
        if (statusFilter === "Pending") {
          response = await orderApi.getAllOrderPending(facilityId, "Pending", pageIndex, pageSize);
        } else if (statusFilter === "Paid") {
          response = await orderApi.getAllOrderPaid(facilityId, "Paid", pageIndex, pageSize);
        } else {
          response = await orderApi.getAllOrder(facilityId, "", pageIndex, pageSize);
        }

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
              }
            }
            return { ...order, vaccinePackage };
          })
        );

        setOrders(extendedOrders);
        setTotalCount(typeof response.totalCount === "number" ? response.totalCount : 0);
      } catch (err) {
        setError("Không thể tải danh sách đơn hàng.");
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [pageIndex, pageSize, user?.facilityId, debouncedSearchTerm, statusFilter]);

  // Reset pageIndex to 1 when searchTerm or statusFilter changes
  useEffect(() => {
    setPageIndex(1);
  }, [statusFilter, debouncedSearchTerm]);

  const handleViewDetails = async (orderId: number) => {
    try {
      const order = await orderApi.getOrderById(orderId);
      // Fetch FacilityVaccine and Disease for each orderDetail
      const updatedOrderDetails = await Promise.all(
        order.orderDetails.map(async (detail: OrderDetail) => {
          let facilityVaccine: FacilityVaccine | undefined;
          let disease: Disease | undefined;
          try {
            facilityVaccine = await facilityVaccineApi.getById(detail.facilityVaccineId);
          } catch (err) {
            console.error(`Error fetching FacilityVaccine ${detail.facilityVaccineId}:`, err);
          }
          try {
            disease = await diseaseApi.getById(detail.diseaseId);
          } catch (err) {
            console.error(`Error fetching Disease ${detail.diseaseId}:`, err);
          }
          return { ...detail, facilityVaccine, disease } as ExtendedOrderDetail;
        })
      );
      // Fetch VaccinePackage if packageId is not null
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
      if (isDetailsModalOpen) {
        closeButtonRef.current?.focus();
      }
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDetailsModalOpen, closeDetailsModal]);

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100">
      <div className="p-4 sm:p-8">
        <div className={`transition-all duration-300 ${isDetailsModalOpen ? "blur-sm" : ""}`}>
          <h2 className="text-2xl font-bold mb-6">Quản lý Đơn hàng</h2>
          <div className="mb-4 grid space-y-5">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo tên khách hàng..."
              className="w-full sm:w-1/2 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              aria-label="Tìm kiếm đơn hàng theo tên khách hàng"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "All" | "Pending" | "Paid")}
              className="w-full sm:w-1/4 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="All">Tất cả</option>
              <option value="Pending">Chờ xử lý</option>
              <option value="Paid">Đã thanh toán</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-teal-600 mr-2"></div>
              <span>Đang tải...</span>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center">{error}</div>
          ) : (
            <table className="min-w-full bg-white rounded-xl shadow overflow-hidden mb-8">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-4 text-left">No</th>
                  <th className="p-4 text-left">Tên Khách hàng</th>
                  <th className="p-4 text-left">Ngày Đặt</th>
                  <th className="p-4 text-left">Tổng Tiền</th>
                  <th className="p-4 text-left">Trạng thái</th>
                  <th className="p-4 text-left">Tên Gói Vắc xin</th>
                  <th className="p-4 text-left">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8">
                      {searchTerm ? "Không tìm thấy đơn hàng nào phù hợp" : "Hiện chưa có đơn hàng nào"}
                    </td>
                  </tr>
                ) : (
                  orders.map((order, index) => (
                    <tr key={order.orderId} className="border-t hover:bg-gray-50">
                      <td className="p-4 font-semibold">{(pageIndex - 1) * pageSize + index + 1}</td>
                      <td className="p-4">{order.member?.fullName || "-"}</td>
                      <td className="p-4">{new Date(order.orderDate).toLocaleDateString("vi-VN")}</td>
                      <td className="p-4">{order.totalAmount.toLocaleString("vi-VN")} VNĐ</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            order.status === "Paid"
                              ? "bg-green-100 text-green-700"
                              : order.status === "Pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="p-4">{order.vaccinePackage?.name || "-"}</td>
                      <td className="p-4">
                        <button
                          className="bg-teal-500 hover:bg-teal-600 text-white px-3 py-1 rounded transition-colors duration-200 cursor-pointer"
                          onClick={() => handleViewDetails(order.orderId)}
                        >
                          Xem Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
          <div className="mt-6 flex items-center justify-center space-x-2">
            <button
              onClick={() => setPageIndex(pageIndex - 1)}
              disabled={pageIndex === 1 || loading}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.ceil(totalCount / pageSize) }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => setPageIndex(num)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    num === pageIndex ? "bg-teal-500 text-white" : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPageIndex(pageIndex + 1)}
              disabled={pageIndex * pageSize >= totalCount || loading}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>

        {isDetailsModalOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" role="dialog" aria-modal="true" aria-describedby="order-details">
            <div
              ref={popupRef}
              className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-5 w-full max-w-2xl mx-auto min-h-[300px]"
              style={{
                animation: isDetailsModalOpen ? "slideIn 0.3s ease-out" : "none",
              }}
            >
              <style>
                {`
                @keyframes slideIn {
                  from { transform: translateY(-20px); opacity: 0; }
                  to { transform: translateY(0); opacity: 1; }
                }
              `}
              </style>
              <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-3">
                <h3 id="order-details" className="text-2xl font-bold text-gray-900">
                  Chi tiết Đơn hàng #{selectedOrder.orderId}
                </h3>
                <button
                  ref={closeButtonRef}
                  className="text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors duration-200"
                  onClick={closeDetailsModal}
                  aria-label="Đóng chi tiết đơn hàng"
                >
                  <span className="text-xl">×</span>
                </button>
              </div>
              <dl id="order-details" className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <dt className="font-semibold text-gray-700">Khách hàng</dt>
                  <dd className="text-gray-900">{selectedOrder.member?.fullName || "-"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-700">Tên Gói Vắc xin</dt>
                  <dd className="text-gray-900">{selectedOrder.vaccinePackage?.name || "-"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-700">Ngày đặt</dt>
                  <dd className="text-gray-900">{new Date(selectedOrder.orderDate).toLocaleDateString("vi-VN")}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-700">Tổng tiền</dt>
                  <dd className="text-gray-900">{selectedOrder.totalAmount.toLocaleString("vi-VN")} VNĐ</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-700">Trạng thái</dt>
                  <dd>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedOrder.status === "Paid"
                          ? "bg-green-100 text-green-700"
                          : selectedOrder.status === "Pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {selectedOrder.status}
                    </span>
                  </dd>
                </div>
              </dl>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Chi tiết Vắc xin</h4>
              <div className="overflow-x-auto overflow-y-auto max-h-[50vh] rounded-lg border border-gray-200">
                <table className="min-w-full table-auto">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="p-2 text-left text-sm font-semibold text-gray-700">Tên Vắc xin</th>
                      <th className="p-2 text-left text-sm font-semibold text-gray-700">Tên Bệnh</th>
                      <th className="p-2 text-left text-sm font-semibold text-gray-700">Số lượng Còn lại</th>
                      <th className="p-2 text-left text-sm font-semibold text-gray-700">Giá</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedOrder.orderDetails.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-2 text-center text-sm text-gray-600">
                          Không có chi tiết vắc xin
                        </td>
                      </tr>
                    ) : (
                      selectedOrder.orderDetails.map((detail: ExtendedOrderDetail) => (
                        <tr key={detail.orderDetailId} className="hover:bg-gray-50 transition-opacity duration-200">
                          <td className="p-2 text-sm truncate max-w-[200px]" title={detail.facilityVaccine?.vaccine?.name || `ID: ${detail.facilityVaccineId}`}>
                            {detail.facilityVaccine?.vaccine?.name || `ID: ${detail.facilityVaccineId}`}
                          </td>
                          <td className="p-2 text-sm truncate max-w-[200px]" title={detail.disease?.name || `ID: ${detail.diseaseId}`}>
                            {detail.disease?.name || `ID: ${detail.diseaseId}`}
                          </td>
                          <td className="p-2 text-sm">{detail.remainingQuantity}</td>
                          <td className="p-2 text-sm">{detail.price.toLocaleString("vi-VN")} VNĐ</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="sticky bottom-0 mt-4 pt-3 bg-white/95 border-t border-gray-200">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={closeDetailsModal}
                    className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderManagement;