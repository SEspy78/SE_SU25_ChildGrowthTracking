import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getUserInfo } from "@/lib/storage";
import { appointmentApi, type AppointmentResponse, type Appointment } from "../../api/appointmentAPI";
import Pagination from "@/Components/Pagination";

const statusStyle: Record<string, string> = {
  Paid: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Completed: "bg-green-100 text-green-800 border-green-300",
  Pending: "bg-gray-100 text-gray-800 border-gray-300",
};

export default function DoctorAppointment() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [pageIndex, setPageIndex] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res: AppointmentResponse = await appointmentApi.getAllAppointments(pageIndex, pageSize);
      const filteredAppointments = (res.appointments || []).filter(
        (item) => item.status === "Paid" || item.status === "Completed" || item.status === "Pending"
      );
      setAppointments(filteredAppointments);
      setHasNextPage((res.appointments?.length || 0) === pageSize);
    } catch {
      setError("Không thể tải danh sách cuộc hẹn.");
      setAppointments([]);
      setHasNextPage(false);
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredAppointments = appointments
    .filter(item => item.child.fullName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.appointmentId - a.appointmentId);

  const handleNavigateByRoleAndStatus = (appointmentId: number, status: string) => {
    const user = getUserInfo();
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
    const dayDiff = today.getDate() - birth.getDay();
    let adjustedYears = years;
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) adjustedYears--;
    if (diffDays <= 90) return `${weeks} tuần`;
    else if (months < 24) return `${months} tháng`;
    else return `${adjustedYears} tuổi`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
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

        <div className="mb-8">
          <div className="relative max-w-md">
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
        </div>

        {loading ? (
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
                    {filteredAppointments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-500 font-medium">
                          Không tìm thấy lịch hẹn
                        </td>
                      </tr>
                    ) : (
                      filteredAppointments.map((item, index) => {
                        let vaccineDisplay = "Không có vắc xin";
                        if (item.order?.packageName) {
                          vaccineDisplay = item.order.packageName;
                        } else if (Array.isArray(item.facilityVaccines) && item.facilityVaccines.length > 0) {
                          vaccineDisplay = item.facilityVaccines.map(fv => fv.vaccine?.name || `ID: ${fv.vaccineId}`).join(", ");
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