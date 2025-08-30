import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getUserInfo } from "@/lib/storage";
import { appointmentApi, type AppointmentResponse, type Appointment } from "../../api/appointmentAPI";
import Pagination from "@/Components/Pagination";
import { DatePicker, Radio, Button, message } from "antd";
import dayjs from "dayjs";

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
  Scheduled: "bg-teal-500 text-white",
  Confirmed: "bg-green-500 text-white",
  Completed: "bg-green-600 text-white",
  Cancelled: "bg-red-500 text-white",
  Pending: "bg-gray-500 text-white",
  Approval: "bg-amber-500 text-white",
  Paid: "bg-yellow-400 text-gray-900",
};

export default function DashboardManager() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [pageIndex, setPageIndex] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<"date" | "week">("date");
  const [isFilterApplied, setIsFilterApplied] = useState<boolean>(false);
  const user = getUserInfo();

  // Fetch data based on filter or all appointments for the facility
  const fetchData = useCallback(async () => {
    if (!user?.facilityId) {
      setError("Chưa có thông tin cơ sở, vui lòng đăng nhập lại.");
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
      setAppointments(res.appointments || []);
      setPendingCount(res.pendingCount || 0);
      setCompletedCount(res.completedCount || 0);
      setHasNextPage((res.appointments?.length || 0) === pageSize);
      setError("");
    } catch {
      setError("Không thể tải danh sách cuộc hẹn.");
      setAppointments([]);
      setPendingCount(0);
      setCompletedCount(0);
      setHasNextPage(false);
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, isFilterApplied, selectedDate, filterMode, user?.facilityId, debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset pageIndex to 1 when search or filter changes
  useEffect(() => {
    setPageIndex(1);
  }, [debouncedSearch, isFilterApplied, filterMode, selectedDate]);

  // Handle filter action
  const handleFilter = () => {
    if (!selectedDate) {
      message.error("Vui lòng chọn ngày để lọc.");
      return;
    }
    setPageIndex(1); // Reset to first page
    setIsFilterApplied(true);
    fetchData();
  };

  // Clear filter and reset to all appointments
  const handleClearFilter = () => {
    setSelectedDate(null);
    setIsFilterApplied(false);
    setPageIndex(1); // Reset to first page
    fetchData();
  };

  const handleNavigateByRoleAndStatus = (appointmentId: number) => {

    navigate(`/manager/appointment/${appointmentId}`);
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
    <div className="min-h-screen bg-gray-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Quản lý Lịch hẹn Cơ sở</h2>
          <button
            onClick={fetchData}
            className="mt-4 sm:mt-0 bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-full font-medium transition-colors duration-200 flex items-center"
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
        <div className="mb-8 bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-6 items-center">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên trẻ..."
              className="w-full md:w-1/3 px-4 py-3 border border-gray-200 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
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
                className="w-full md:w-auto rounded-lg border-gray-200 shadow-sm focus:ring-teal-500"
              />
              <div className="flex space-x-3">
                <Button
                  type="primary"
                  onClick={handleFilter}
                  disabled={loading || !selectedDate}
                  className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-6 py-2"
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

        {/* Loading / Error / Table */}
        {loading ? (
          <div className="flex justify-center items-center py-12 bg-white rounded-xl shadow-lg">
            <svg className="animate-spin h-10 w-10 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="ml-4 text-gray-600 text-lg font-medium">Đang tải...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-6 rounded-xl shadow-lg text-center">
            {error}
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                  <thead className="bg-teal-600 text-white">
                    <tr>
                      <th className="p-4 text-left font-semibold text-sm uppercase tracking-wider">ID Lịch hẹn</th>
                      <th className="p-4 text-left font-semibold text-sm uppercase tracking-wider">ID Liên quan</th>
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
                        <td colSpan={8} className="text-center py-12 text-gray-500 text-lg">
                          Không tìm thấy lịch hẹn
                        </td>
                      </tr>
                    ) : (
                      appointments.map((item, index) => {
                        let vaccineDisplay = "Không có vắc xin";
                        let relatedId = item.child.childId ? `Child: ${item.child.childId}` : "N/A";
                        if (item.order?.packageName) {
                          vaccineDisplay = item.order.packageName;
                          relatedId = item.order.packageId ? `Package: ${item.order.packageId}` : relatedId;
                        } else if (Array.isArray(item.facilityVaccines) && item.facilityVaccines.length > 0) {
                          vaccineDisplay = item.facilityVaccines[0].vaccine?.name || `ID: ${item.facilityVaccines[0].vaccineId}`;
                          relatedId = item.facilityVaccines[0].facilityVaccineId ? `Vaccine: ${item.facilityVaccines[0].facilityVaccineId}` : relatedId;
                        }

                        let date = "";
                        if (item.appointmentDate) {
                          const d = new Date(item.appointmentDate);
                          date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
                        }

                        return (
                          <tr
                            key={item.appointmentId}
                            className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-teal-50 transition duration-200 cursor-pointer`}
                            onClick={() => handleNavigateByRoleAndStatus(item.appointmentId)}
                          >
                            <td className="p-4 text-gray-700 font-medium">{item.appointmentId}</td>
                            <td className="p-4 text-gray-700">{relatedId}</td>
                            <td className="p-4 text-gray-700">{item.appointmentTime}</td>
                            <td className="p-4 text-gray-700">{date}</td>
                            <td className="p-4 text-gray-800 font-semibold">{item.child.fullName}</td>
                            <td className="p-4 text-gray-700">{calculateAge(item.child.birthDate)}</td>
                            <td className="p-4 text-gray-700">{vaccineDisplay}</td>
                            <td className="p-4">
                              <span className={`px-4 py-1 rounded-full text-sm font-medium shadow-sm ${statusStyle[item.status] || 'bg-gray-500 text-white'}`}>
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

            <Pagination
              pageIndex={pageIndex}
              pageSize={pageSize}
              setPageIndex={setPageIndex}
              hasNextPage={hasNextPage}
            />
          </>
        )}
      </div>
    </div>
  );
}