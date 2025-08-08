import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { orderApi, type Order, type OrderDetail } from "@/api/appointmentAPI";
import { facilityVaccineApi } from "@/api/vaccineApi";
import { vaccineApi, type Vaccine } from "@/api/vaccineApi";
import { vaccinePackageApi, type VaccinePackage } from "@/api/vaccinePackageApi";
import { diseaseApi, type Disease } from "@/api/diseaseApi";
import { Eye, X } from "lucide-react";

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
  const vaccineCache = useRef<Map<number, Vaccine>>(new Map());
  const diseaseCache = useRef<Map<number, Disease>>(new Map());

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const response = await orderApi.getAllOrderAdmin( debouncedSearchTerm, pageIndex, pageSize);
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
        setOrders(extendedOrders);
        const total = typeof response.totalCount === 'number' ? response.totalCount : 0;
        setTotalCount(total);
        if (total > 0 && pageIndex * pageSize > total && pageIndex !== Math.ceil(total / pageSize)) {
          setPageIndex(Math.ceil(total / pageSize));
          return;
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
  }, [pageIndex, pageSize, debouncedSearchTerm]);

  useEffect(() => {
    setPageIndex(1);
  }, [debouncedSearchTerm]);

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
    <div className="p-6">
      <main className="flex-1 p-8 bg-gray-50 overflow-y-auto shadow-lg border rounded-md">
        <h1 className="text-3xl font-semibold mb-8">Quản lý Đơn hàng</h1>
        <div className="mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm theo tên khách hàng..."
            className="w-full max-w-md px-4 py-3 border border-black rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition bg-white"
            aria-label="Tìm kiếm đơn hàng theo tên khách hàng"
          />
        </div>

        {loading && (
          <div className="text-blue-600 text-sm">Đang tải dữ liệu...</div>
        )}
        {error && <p className="text-red-500 font-semibold">{error}</p>}

        {!loading && !error && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full border-1 border-black shadow-sm">
                <thead className="bg-blue-100 text-blue-800">
                  <tr>
                    <th className="px-4 py-2 text-left border">Số Thứ Tự</th>
                    <th className="px-4 py-2 text-left border">Tên Khách hàng</th>
                    <th className="px-4 py-2 text-left border">Ngày Đặt</th>
                    <th className="px-4 py-2 text-right border">Tổng Tiền</th>
                    <th className="px-4 py-2 text-center border">Trạng thái</th>
                    <th className="px-4 py-2 text-left border">Tên Gói Vắc xin</th>
                    <th className="px-4 py-2 text-center border"></th>
                  </tr>
                </thead>
                <tbody className="bg-white border-1 border-black text-gray-800">
                  {orders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-4 text-gray-500 italic"
                      >
                        {searchTerm ? "Không tìm thấy đơn hàng nào phù hợp" : "Không có dữ liệu đơn hàng"}
                      </td>
                    </tr>
                  ) : (
                    orders.map((order, index) => (
                      <tr
                        key={order.orderId}
                        className="hover:bg-blue-50 transition-colors"
                      >
                        <td className="px-4 py-2 border">
                          {(pageIndex - 1) * pageSize + index + 1}
                        </td>
                        <td className="px-4 py-2 border">
                          {order.member?.fullName || '-'}
                        </td>
                        <td className="px-4 py-2 border">
                          {new Date(order.orderDate).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-2 text-right border">
                          {order.totalAmount.toLocaleString('vi-VN')}₫
                        </td>
                        <td
                          className={`px-4 py-2 text-center border font-medium ${
                            order.status === 'Completed'
                              ? 'text-green-600'
                              : order.status === 'Cancelled'
                              ? 'text-red-600'
                              : 'text-blue-600'
                          }`}
                        >
                          {order.status}
                        </td>
                        <td className="px-4 py-2 border">
                          {order.vaccinePackage?.name || '-'}
                        </td>
                        <td className="px-4 py-2 text-center border">
                          <button
                            onClick={() => handleViewDetails(order.orderId)}
                            className="text-blue-600 hover:cursor-pointer hover:text-blue-800"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4 inline" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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
          </>
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
      </main>
    </div>
  );
};

export default OrderManagementStyled;