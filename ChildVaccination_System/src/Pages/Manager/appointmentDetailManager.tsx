import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { appointmentApi, type Appointment } from "../../api/appointmentAPI";
import { Button } from "antd";
import dayjs from "dayjs";

const statusStyle: Record<string, string> = {
  Scheduled: "bg-teal-100 text-teal-800 border-teal-200",
  Confirmed: "bg-green-100 text-green-800 border-green-200",
  Completed: "bg-green-100 text-green-800 border-green-200",
  Cancelled: "bg-red-100 text-red-800 border-red-200",
  Pending: "bg-gray-100 text-gray-800 border-gray-200",
  Approval: "bg-amber-100 text-amber-800 border-amber-200",
  Paid: "bg-yellow-100 text-yellow-800 border-yellow-200",
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
  if (diffDays < 28) return `${weeks} tuần`;
  else if (months < 24) return `${months || 1} tháng`;
  else return `${adjustedYears} tuổi`;
};

export default function AppointmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Fetch appointment details
  const fetchAppointment = useCallback(async () => {
    if (!id || isNaN(Number(id))) {
      setError("ID lịch hẹn không hợp lệ.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      console.log("Fetching appointment for ID:", id);
      const res = await appointmentApi.getAppointmentById(Number(id));
      console.log("API Response:", res);
      if (!res) {
        setError("Không tìm thấy lịch hẹn.");
        setAppointment(null);
      } else {
        setAppointment(res);
        setError("");
      }
    } catch (err: any) {
      console.error("API Error:", err.message || err);
      setError(`Không thể tải thông tin lịch hẹn: ${err.message || "Lỗi không xác định"}`);
      setAppointment(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAppointment();
  }, [fetchAppointment]);

  // Handle back navigation
  const handleBack = () => {
    navigate("/manager/appointments");
  };

  // Format date for display
  const formatDate = (date: string | undefined): string => {
    if (!date) return "Không có";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "Không có";
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  };

  // Get vaccine or package display
  const getVaccineDisplay = () => {
    if (!appointment) return "Không có vắc xin";
    if (appointment.order?.packageName) {
      return `${appointment.order.packageName} (ID Gói: ${appointment.order.packageId || "N/A"})`;
    } else if (Array.isArray(appointment.facilityVaccines) && appointment.facilityVaccines.length > 0) {
      const vaccine = appointment.facilityVaccines[0];
      return `${vaccine.vaccine?.name || `ID: ${vaccine.vaccineId}`} (ID Vắc xin Cơ sở: ${vaccine.facilityVaccineId || "N/A"})`;
    }
    return "Không có vắc xin";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-4xl font-bold text-gray-800 tracking-tight">Chi tiết Lịch hẹn</h2>
          <Button
            onClick={handleBack}
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-6 py-2.5 font-semibold transition-all duration-200 flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Quay lại
          </Button>
        </div>

        {/* Loading / Error / Details */}
        {loading ? (
          <div className="flex justify-center items-center py-12 bg-white rounded-xl shadow-lg">
            <svg
              className="animate-spin h-12 w-12 text-teal-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="ml-4 text-gray-600 text-xl font-medium">Đang tải...</span>
          </div>
        ) : error ? (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 rounded-xl shadow-lg text-center">
            <p className="text-lg font-semibold">{error}</p>
            <Button
              onClick={fetchAppointment}
              className="mt-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-6 py-2 font-medium"
            >
              Thử lại
            </Button>
          </div>
        ) : !appointment ? (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 rounded-xl shadow-lg text-center">
            <p className="text-lg font-semibold">Không tìm thấy lịch hẹn.</p>
            <Button
              onClick={fetchAppointment}
              className="mt-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-6 py-2 font-medium"
            >
              Thử lại
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Appointment Details */}
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">Thông tin Lịch hẹn</h3>
              <div className="space-y-3">
                <p className="text-gray-600">
                  <span className="font-medium text-gray-800">ID Lịch hẹn:</span>{" "}
                  {appointment.appointmentId}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium text-gray-800">Ngày:</span>{" "}
                  {formatDate(appointment.appointmentDate)}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium text-gray-800">Giờ:</span>{" "}
                  {appointment.appointmentTime || "Không có"}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium text-gray-800">Trạng thái:</span>{" "}
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${statusStyle[appointment.status] || "bg-gray-100 text-gray-800 border-gray-200"}`}
                  >
                    {appointment.status}
                  </span>
                </p>
                <p className="text-gray-600">
                  <span className="font-medium text-gray-800">Ngày tạo:</span>{" "}
                  {formatDate(appointment.createdAt)}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium text-gray-800">Ngày cập nhật:</span>{" "}
                  {formatDate(appointment.updatedAt)}
                </p>
              </div>
            </div>

            {/* Child Information */}
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">Thông tin Trẻ</h3>
              <div className="space-y-3">
                <p className="text-gray-600">
                  <span className="font-medium text-gray-800">ID Trẻ:</span>{" "}
                  {appointment.child.childId || "N/A"}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium text-gray-800">Tên Trẻ:</span>{" "}
                  {appointment.child.fullName || "N/A"}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium text-gray-800">Ngày sinh:</span>{" "}
                  {formatDate(appointment.child.birthDate)}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium text-gray-800">Tuổi:</span>{" "}
                  {calculateAge(appointment.child.birthDate)}
                </p>
              </div>
            </div>

            {/* Parent Information */}
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">Thông tin Phụ huynh</h3>
              <div className="space-y-3">
                <p className="text-gray-600">
                  <span className="font-medium text-gray-800">Tên Phụ huynh:</span>{" "}
                  {appointment.memberName || "N/A"}
                </p>
              </div>
            </div>

            {/* Vaccine/Package Details */}
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">Thông tin Vắc xin/Gói</h3>
              <div className="space-y-3">
                <p className="text-gray-600">
                  <span className="font-medium text-gray-800">Vắc xin/Gói:</span>{" "}
                  {getVaccineDisplay()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}