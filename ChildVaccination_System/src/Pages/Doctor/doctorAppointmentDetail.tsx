import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserInfo } from "@/lib/storage";
import { appointmentApi, type AppointmentResponse, type Appointment } from "../../api/appointmentAPI";
import Pagination from "@/Components/Pagination";

const statusStyle: Record<string, string> = {
  Paid: "bg-yellow-400 text-gray-900",
  Completed: "bg-emerald-500 text-white",
  Pending: "bg-gray-600 text-white",
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

  useEffect(() => {
    const fetchData = async () => {
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
    };
    fetchData();
  }, [pageIndex, pageSize]);

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
    const dayDiff = today.getDate() - birth.getDate();
    let adjustedYears = years;
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) adjustedYears--;
    if (diffDays <= 90) return `${weeks} tuần`;
    else if (months < 24) return `${months} tháng`;
    else return `${adjustedYears} tuổi`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-teal-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-indigo-900 mb-6">Tất cả lịch hẹn</h2>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên trẻ"
            className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 transition bg-white"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Loading / Error / Table */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600"></div>
            <span className="ml-4 text-gray-700 text-lg">Đang tải...</span>
          </div>
        ) : error ? (
          <div className="bg-rose-100 text-rose-700 p-6 rounded-lg text-center">
            {error}
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <table className="w-full table-auto border-collapse">
                <thead className="bg-indigo-700 text-white">
                  <tr>
                    <th className="p-4 text-left font-semibold">Giờ</th>
                    <th className="p-4 text-left font-semibold">Ngày</th>
                    <th className="p-4 text-left font-semibold">Tên trẻ</th>
                    <th className="p-4 text-left font-semibold">Tuổi</th>
                    <th className="p-4 text-left font-semibold">Vắc xin/Gói</th>
                    <th className="p-4 text-left font-semibold">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-600">
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
                          className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-indigo-100 cursor-pointer transition-colors duration-200`}
                          onClick={() => handleNavigateByRoleAndStatus(item.appointmentId, item.status)}
                        >
                          <td className="p-4 text-gray-800">{item.appointmentTime}</td>
                          <td className="p-4 text-gray-800">{date}</td>
                          <td className="p-4 text-gray-800 font-medium">{item.child.fullName}</td>
                          <td className="p-4 text-gray-800">{calculateAge(item.child.birthDate)}</td>
                          <td className="p-4 text-gray-800">{vaccineDisplay}</td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium shadow-sm ${statusStyle[item.status] || 'bg-gray-600 text-white'}`}>
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