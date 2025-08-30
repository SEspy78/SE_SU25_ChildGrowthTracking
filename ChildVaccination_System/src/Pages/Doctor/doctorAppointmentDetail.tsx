import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getUserInfo } from "@/lib/storage";
import { appointmentApi, type AppointmentResponse, type Appointment } from "../../api/appointmentAPI";
import Pagination from "@/Components/Pagination";
import { DatePicker, Radio, Button, message } from "antd";
import dayjs from "dayjs";
import { vaccinePackageApi, type VaccinePackage } from "../../api/vaccinePackageApi";

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

const statusStyle: Record<string, string> = {
  Scheduled: "bg-indigo-500 text-white",
  Confirmed: "bg-teal-500 text-white",
  Completed: "bg-green-500 text-white",
  Cancelled: "bg-red-500 text-white",
  Pending: "bg-gray-500 text-white",
  Approval: "bg-amber-500 text-white",
  Paid: "bg-yellow-400 text-gray-900",
};

export default function DoctorAppointment() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [vaccinePackages, setVaccinePackages] = useState<Record<number, VaccinePackage>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingPackages, setLoadingPackages] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const [pageIndex, setPageIndex] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<"date" | "week">("date");
  const [isFilterApplied, setIsFilterApplied] = useState<boolean>(false);
  const user = getUserInfo();

  const fetchData = useCallback(async () => {
    if (!user?.accountId) {
      setError("Chưa có thông tin tài khoản, vui lòng đăng nhập lại.");
      setAppointments([]);
      setPendingCount(0);
      setCompletedCount(0);
      setHasNextPage(false);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      let res: AppointmentResponse;
      if (isFilterApplied && selectedDate) {
        const formattedDate = dayjs(selectedDate).format("YYYY/MM/DD");
        if (filterMode === "date") {
          res = await appointmentApi.getAppointmentByDate(formattedDate, pageIndex, pageSize);
        } else {
          res = await appointmentApi.getAppointmentByWeek(formattedDate, pageIndex, pageSize);
        }
      } else {
        res = await appointmentApi.getAllAppointments(pageIndex, pageSize, debouncedSearch);
      }
      const filteredAppointments = (res.appointments || []).filter(
        (item) => item.status === "Paid" || item.status === "Completed" || item.status === "Pending"
      ).sort((a, b) => b.appointmentId - a.appointmentId);
      setAppointments(filteredAppointments);
      setPendingCount(res.pendingCount || 0);
      setCompletedCount(res.completedCount || 0);
      setHasNextPage((res.appointments?.length || 0) === pageSize);
      setError("");
      setToast({ show: false, message: "", type: "success" });
    } catch {
      setError("Không thể tải danh sách cuộc hẹn.");
      setAppointments([]);
      setPendingCount(0);
      setCompletedCount(0);
      setHasNextPage(false);
      setToast({ show: true, message: "Không thể tải danh sách cuộc hẹn", type: "error" });
      setTimeout(() => setToast({ show: false, message: "", type: "success" }), 2500);
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, debouncedSearch, isFilterApplied, selectedDate, filterMode, user?.accountId]);

  const fetchVaccinePackages = useCallback(async (appointmentIdsWithOrders: number[]) => {
    setLoadingPackages(true);
    try {
      const packagePromises = appointmentIdsWithOrders.map(async (appointmentId) => {
        const appointment = appointments.find((a) => a.appointmentId === appointmentId);
        if (appointment?.order?.packageId) {
          const packageData = await vaccinePackageApi.getById(appointment.order.packageId);
          return { appointmentId, packageData };
        }
        return null;
      });
      const results = await Promise.all(packagePromises);
      const newPackages = results.reduce((acc, result) => {
        if (result) {
          acc[result.appointmentId] = result.packageData;
        }
        return acc;
      }, {} as Record<number, VaccinePackage>);
      setVaccinePackages((prev) => ({ ...prev, ...newPackages }));
    } catch {
      // Handle error silently or log it
    } finally {
      setLoadingPackages(false);
    }
  }, [appointments]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPageIndex(1); // Reset to first page when search or filter changes
  }, [debouncedSearch, isFilterApplied, filterMode, selectedDate]);

  useEffect(() => {
    const appointmentIdsWithOrders = appointments
      .filter((a) => a.order?.packageId)
      .map((a) => a.appointmentId);
    if (appointmentIdsWithOrders.length > 0) {
      fetchVaccinePackages(appointmentIdsWithOrders);
    }
  }, [appointments, fetchVaccinePackages]);

  const handleFilter = () => {
    if (!selectedDate) {
      message.error("Vui lòng chọn ngày để lọc.");
      return;
    }
    setPageIndex(1); // Reset to first page
    setIsFilterApplied(true);
    fetchData();
  };

  const handleClearFilter = () => {
    setSelectedDate(null);
    setIsFilterApplied(false);
    setPageIndex(1); // Reset to first page
    fetchData();
  };

  const handleNavigateByRoleAndStatus = (appointmentId: number, status: string) => {
    let stepIndex = 0;
    switch (status) {
      case "Pending": stepIndex = 1; break;
      case "Paid": stepIndex = 2; break;
      case "Completed": stepIndex = 3; break;
      default: stepIndex = 0;
    }
    const basePath = user?.position === "Doctor" ? "/doctor/appointments" : "/staff/appointments";
    navigate(`${basePath}/${appointmentId}/step-${stepIndex + 1}`);
  };

  const calculateAge = (birthDate: string): string => {
    if (!birthDate) return "Không có";
    const birth = new Date(birthDate);
    const today = new Date();
    if (isNaN(birth.getTime())) return "Không có";
    const diffTime = today.getTime() - birth.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(diffDays / 7);
    const months = Math.floor(diffDays / 30.42);
    const years = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    const dayDiff = today.getDate() - birth.getDate();
    let adjustedYears = years;
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) adjustedYears--;
    if (diffDays <= 90) return `${weeks} tuần`;
    else if (months < 24) return `${months} tháng`;
    else return `${adjustedYears} tuổi`;
  };

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

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Tất cả lịch hẹn</h2>
          <button
            onClick={fetchData}
            className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium transition-colors duration-200 flex items-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              ></path>
            </svg>
            Làm mới
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-gray-500 transform hover:scale-105 transition duration-300">
            <h3 className="text-lg font-semibold text-gray-700">Lịch hẹn đang chờ</h3>
            <p className="text-3xl font-bold text-gray-900">{pendingCount}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500 transform hover:scale-105 transition duration-300">
            <h3 className="text-lg font-semibold text-gray-700">Lịch hẹn đã hoàn thành</h3>
            <p className="text-3xl font-bold text-gray-900">{completedCount}</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-6 items-center">
            <div className="relative w-full md:w-1/3">
              <input
                type="text"
                placeholder="Tìm kiếm theo tên trẻ"
                className="w-full px-4 py-3 pl-10 border border-gray-200 rounded-full shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors duration-200 bg-white"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                ></path>
              </svg>
            </div>
            <div className="flex flex-col md:flex-row md:space-x-4 items-center w-full md:w-auto">
              <Radio.Group
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value)}
                className="mb-4 md:mb-0"
              >
                <Radio value="date" className="text-gray-700">Theo ngày</Radio>
                <Radio value="week" className="text-gray-700">Theo tuần</Radio>
              </Radio.Group>
              <DatePicker
                value={selectedDate ? dayjs(selectedDate) : null}
                onChange={(date) => setSelectedDate(date ? date.format("YYYY-MM-DD") : null)}
                format="DD/MM/YYYY"
                placeholder="Chọn ngày"
                className="w-full md:w-auto rounded-lg border-gray-200 shadow-sm focus:ring-blue-500"
              />
              <div className="flex space-x-3">
                <Button
                  type="primary"
                  onClick={handleFilter}
                  disabled={loading || !selectedDate}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-2"
                >
                  Lọc
                </Button>
                {isFilterApplied && (
                  <Button
                    type="default"
                    onClick={handleClearFilter}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg px-6 py-2"
                  >
                    Xóa bộ lọc
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {loading || loadingPackages ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
            <span className="mt-4 text-lg text-gray-600 font-medium">Đang tải...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-6 rounded-xl shadow-lg flex items-center justify-center space-x-3">
            <svg
              className="w-8 h-8"
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
              ></path>
            </svg>
            <span className="text-lg font-semibold">{error}</span>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                  <thead className="bg-blue-600 text-white">
                    <tr>
                      <th className="p-4 text-left font-semibold text-sm uppercase tracking-wider">Giờ</th>
                      <th className="p-4 text-left font-semibold text-sm uppercase tracking-wider">Ngày</th>
                      <th className="p-4 text-left font-semibold text-sm uppercase tracking-wider">Tên trẻ</th>
                      <th className="p-4 text-left font-semibold text-sm uppercase tracking-wider">Tuổi</th>
                      <th className="p-4 text-left font-semibold text-sm uppercase tracking-wider">Vắc xin/Gói</th>
                      <th className="p-4 text-left font-semibold text-sm uppercase tracking-wider">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-500 font-medium">
                          Không tìm thấy lịch hẹn
                        </td>
                      </tr>
                    ) : (
                      appointments.map((item, index) => {
                        let vaccineDisplay = "Không có vắc xin";
                        if (!item.order) {
                          vaccineDisplay = item.vaccinesToInject?.length
                            ? item.vaccinesToInject.map(v => `Vắc xin ${v.vaccineName}`).join(", ")
                            : "Không có vắc xin";
                        } else if (item.order?.packageId && vaccinePackages[item.appointmentId]) {
                          vaccineDisplay = vaccinePackages[item.appointmentId].name;
                        }

                        let date = "";
                        if (item.appointmentDate) {
                          const d = new Date(item.appointmentDate);
                          date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
                        }

                        return (
                          <tr
                            key={item.appointmentId}
                            className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 cursor-pointer transition-colors duration-200`}
                            onClick={() => handleNavigateByRoleAndStatus(item.appointmentId, item.status)}
                          >
                            <td className="p-4 text-gray-700">{item.appointmentTime}</td>
                            <td className="p-4 text-gray-700">{date}</td>
                            <td className="p-4 text-gray-800 font-medium">{item.child.fullName}</td>
                            <td className="p-4 text-gray-700">{calculateAge(item.child.birthDate)}</td>
                            <td className="p-4 text-gray-700">{vaccineDisplay}</td>
                            <td className="p-4">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusStyle[item.status] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6">
              <Pagination
                pageIndex={pageIndex}
                pageSize={pageSize}
                setPageIndex={setPageIndex}
                hasNextPage={hasNextPage}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}