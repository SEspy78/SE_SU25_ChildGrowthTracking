import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getUserInfo } from "@/lib/storage";
import { appointmentApi, type AppointmentResponse, type Appointment } from "../../api/appointmentAPI";
import Pagination from "@/Components/Pagination";
import { DatePicker, Radio, Button, message } from "antd";
import dayjs from "dayjs";

const statusStyle: Record<string, string> = {
  Scheduled: "bg-indigo-500 text-white",
  Confirmed: "bg-teal-500 text-white",
  Completed: "bg-green-500 text-white",
  Cancelled: "bg-red-500 text-white",
  Pending: "bg-gray-500 text-white",
  Approval: "bg-amber-500 text-white",
  Paid: "bg-yellow-400 text-gray-900",
};

export default function DashboardStaff() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [pageIndex, setPageIndex] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<"date" | "week">("date");
  const [isFilterApplied, setIsFilterApplied] = useState<boolean>(false);
  const user = getUserInfo();

  // Fetch data based on filter or all appointments
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
        res = await appointmentApi.getAllAppointments(pageIndex, pageSize);
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
  }, [pageIndex, pageSize, isFilterApplied, selectedDate, filterMode, user?.accountId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const filteredAppointments = appointments
    .filter(item => item.child.fullName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.appointmentId - a.appointmentId);

  const handleNavigateByRoleAndStatus = (appointmentId: number, status: string) => {
    let stepIndex = 0;
    switch (status) {
      case "Pending": stepIndex = 0; break;
      case "Approval": stepIndex = 1; break;
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
    <div className="min-h-screen bg-gray-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Quản lý lịch hẹn</h2>
          <button
            onClick={fetchData}
            className="mt-4 sm:mt-0 px-6 py-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition duration-300 ease-in-out"
          >
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
            <input
              type="text"
              placeholder="Tìm kiếm theo tên trẻ..."
              className="w-full md:w-1/3 px-4 py-3 border border-gray-200 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
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
                className="w-full md:w-auto rounded-lg border-gray-200 shadow-sm focus:ring-indigo-500"
              />
              <div className="flex space-x-3">
                <Button
                  type="primary"
                  onClick={handleFilter}
                  disabled={loading || !selectedDate}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-6 py-2"
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
            <svg className="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                  <thead className="bg-indigo-600 text-white">
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
                    {filteredAppointments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-gray-500 text-lg">
                          Không tìm thấy lịch hẹn
                        </td>
                      </tr>
                    ) : (
                      filteredAppointments.map((item, index) => {
                        const vaccineDisplay = item.order?.packageName
                          ? item.order.packageName
                          : Array.isArray(item.vaccinesToInject) && item.vaccinesToInject.length > 0
                          ? item.vaccinesToInject.map(v => v.vaccineName).join(", ")
                          : "Không có vắc xin";

                        let date = "";
                        if (item.appointmentDate) {
                          const d = new Date(item.appointmentDate);
                          date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
                        }

                        return (
                          <tr
                            key={item.appointmentId}
                            className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-indigo-50 transition duration-200 cursor-pointer`}
                            onClick={() => handleNavigateByRoleAndStatus(item.appointmentId, item.status)}
                          >
                            <td className="p-4 text-gray-700 font-medium">{item.appointmentTime}</td>
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