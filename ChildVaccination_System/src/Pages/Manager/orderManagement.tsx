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
  // Cache for VaccinePackage to avoid redundant API calls
  const packageCache = useRef<Map<number, VaccinePackage>>(new Map());

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        // Check if facilityId exists
        const facilityId = user?.facilityId;
        if (!facilityId) {
          setError("Không có cơ sở y tế được liên kết với tài khoản này.");
          setOrders([]);
          setTotalCount(0);
          return;
        }
        const response = await orderApi.getAllOrder(facilityId, debouncedSearchTerm, pageIndex, pageSize);
        // Ensure response.data is an array, fallback to empty array if invalid
        const ordersArray = Array.isArray(response.data) ? response.data : [];
        // Fetch VaccinePackage for each order
        const extendedOrders: ExtendedOrder[] = await Promise.all(
          ordersArray.map(async (order: Order) => {
            let vaccinePackage: VaccinePackage | undefined;
            if (order.packageId !== null) {
              try {
                // Check cache first
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
        setOrders(extendedOrders);
        // Set totalCount, fallback to 0 if undefined
        const total = typeof response.totalCount === 'number' ? response.totalCount : 0;
        setTotalCount(total);
        // Reset pageIndex if it exceeds total pages
        if (total > 0 && pageIndex * pageSize > total && pageIndex !== Math.ceil(total / pageSize)) {
          setPageIndex(Math.ceil(total / pageSize));
          return; // Avoid further state updates in this cycle
        }
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
  }, [pageIndex, pageSize, user?.facilityId, debouncedSearchTerm]);

  // Reset pageIndex to 1 when searchTerm changes
  useEffect(() => {
    setPageIndex(1);
  }, [debouncedSearchTerm]);

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
          // Check cache first
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
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
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
      <div
        className={`transition-all duration-300 ${
          isDetailsModalOpen ? "blur-sm" : ""
        }`}
      >
        <h2 className="text-2xl font-bold mb-6">Quản lý Đơn hàng</h2>
        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm theo tên khách hàng..."
            className="w-full sm:w-1/2 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            aria-label="Tìm kiếm đơn hàng theo tên khách hàng"
          />
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
                <th className="p-4 text-left">Số Thứ Tự</th>
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
                    <td className="p-4">{order.member?.fullName || '-'}</td>
                    <td className="p-4">
                      {new Date(order.orderDate).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="p-4">{order.totalAmount.toLocaleString('vi-VN')} VNĐ</td>
                    <td className="p-4">
                      <span
                        className={
                          order.status === 'Completed'
                            ? "text-green-600 font-medium"
                            : order.status === 'Cancelled'
                            ? "text-red-600 font-medium"
                            : "text-blue-600 font-medium"
                        }
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4">{order.vaccinePackage?.name || '-'}</td>
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
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setPageIndex(pageIndex - 1)}
            disabled={pageIndex === 1 || loading}
            className="px-4 py-2 bg-gray-300 rounded-md mr-2 disabled:opacity-50"
          >
            Trang trước
          </button>
          <span className="px-4 py-2">Trang {pageIndex}</span>
          <button
            onClick={() => setPageIndex(pageIndex + 1)}
            disabled={pageIndex * pageSize >= totalCount || loading}
            className="px-4 py-2 bg-gray-300 rounded-md ml-2 disabled:opacity-50"
          >
            Trang sau
          </button>
        </div>
      </div>

      {isDetailsModalOpen && selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          role="dialog"
          aria-modal="true"
        >
          <div
            ref={popupRef}
            role="dialog"
            aria-labelledby="details-title"
            className="bg-white rounded-xl shadow-lg p-4 sm:p-6 w-full max-w-2xl mx-auto mt-4 transition-all duration-300 transform translate-y-0 opacity-100 z-10 relative border border-gray-200"
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
            <div className="flex justify-between items-center mb-4">
              <h3
                id="details-title"
                className="text-xl sm:text-2xl font-semibold text-gray-800"
              >
                Chi tiết Đơn hàng #{selectedOrder.orderId}
              </h3>
              <button
                ref={closeButtonRef}
                className="text-gray-400 hover:text-gray-600 text-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer"
                onClick={closeDetailsModal}
                aria-label="Close details modal"
              >
                ×
              </button>
            </div>
            <div className="mb-4">
              <p><strong>Khách hàng:</strong> {selectedOrder.member?.fullName || '-'}</p>
              <p><strong>Tên Gói Vắc xin:</strong> {selectedOrder.vaccinePackage?.name || '-'}</p>
              <p><strong>Ngày đặt:</strong> {new Date(selectedOrder.orderDate).toLocaleDateString('vi-VN')}</p>
              <p><strong>Tổng tiền:</strong> {selectedOrder.totalAmount.toLocaleString('vi-VN')} VNĐ</p>
              <p><strong>Trạng thái:</strong> {selectedOrder.status}</p>
            </div>
            <h4 className="text-lg font-semibold text-gray-800 mb-2">Chi tiết Vắc xin</h4>
            <table className="min-w-full bg-white rounded-lg border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Tên Vắc xin</th>
                  <th className="p-3 text-left">Tên Bệnh</th>
                  <th className="p-3 text-left">Số lượng Còn lại</th>
                  <th className="p-3 text-left">Giá</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.orderDetails.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4">
                      Không có chi tiết vắc xin
                    </td>
                  </tr>
                ) : (
                  selectedOrder.orderDetails.map((detail: ExtendedOrderDetail) => (
                    <tr key={detail.orderDetailId} className="border-t">
                      <td className="p-3">{detail.facilityVaccine?.vaccine?.name || `ID: ${detail.facilityVaccineId}`}</td>
                      <td className="p-3">{detail.disease?.name || `ID: ${detail.diseaseId}`}</td>
                      <td className="p-3">{detail.remainingQuantity}</td>
                      <td className="p-3">{detail.price.toLocaleString('vi-VN')} VNĐ</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={closeDetailsModal}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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

export default OrderManagement;