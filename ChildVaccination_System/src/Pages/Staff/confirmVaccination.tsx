import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import VaccinationSteps from "@/Components/VaccinationStep";
import { Button as AntButton, message, Modal } from "antd";
import { appointmentApi, type Appointment } from "@/api/appointmentAPI";
import { getUserInfo } from "@/lib/storage";
import { Button } from "@/Components/ui/button";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

type ExtendedAppointment = Appointment & {
  vaccinesToInject?: { vaccineName: string; doseNumber: number; diseaseName: string }[];
};

export default function ConfirmVaccination() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<ExtendedAppointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const user = getUserInfo();

  const fetchAppointment = async () => {
    try {
      setLoading(true);
      if (!id) {
        setError("Không có ID lịch hẹn trong URL.");
        setAppointment(null);
        return;
      }
      const res = await appointmentApi.getAppointmentById(Number(id));
      const appointmentData: ExtendedAppointment = (res as any).data || res;
      setAppointment(appointmentData);
    } catch {
      setError("Không thể tải thông tin lịch hẹn.");
      setAppointment(null);
      message.error("Không thể tải thông tin lịch hẹn.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointment();
  }, [id]);

  useEffect(() => {
    if (appointment?.status === "Paid" && user?.position === "Staff") {
      const interval = setInterval(() => {
        fetchAppointment();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [appointment?.status, user?.position]);

  const calculateAge = (birthDate: string): string => {
    if (!birthDate) return "Không có";
    const birth = new Date(birthDate);
    const today = new Date();
    if (isNaN(birth.getTime())) return "Không có";

    const diffMs = today.getTime() - birth.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30.436875);
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffMonths >= 12) {
      const years = Math.floor(diffMonths / 12);
      return `${years} tuổi`;
    } else if (diffMonths > 0) {
      return `${diffMonths} tháng tuổi`;
    } else {
      return `${diffWeeks} tuần tuổi`;
    }
  };

  const handleComplete = () => {
    const basePath = user?.position === "Doctor" ? "/doctor" : "/staff";
    navigate(`${basePath}/appointments`);
  };

  const handleBack = () => {
    if (!id) return;
    const basePath = user?.position === "Doctor" ? "/doctor" : "/staff";
    navigate(`${basePath}/appointments/${id}/step-3`);
  };

  const handleConfirmVaccination = async () => {
    if (!id) {
      message.error("Không có ID lịch hẹn.");
      return;
    }
    setSubmitting(true);
    try {
      await appointmentApi.updateAppointmentStatus(Number(id), {
        status: "Completed",
        note: "",
      });
      setShowCompleteModal(true);
      setAppointment((prev) => (prev ? { ...prev, status: "Completed" } : null));
    } catch {
      message.error("Không thể xác nhận hoàn tất tiêm chủng.");
    } finally {
      setSubmitting(false);
    }
  };

  const vaccinesToInjectDisplay = appointment?.vaccinesToInject?.length
    ? appointment.vaccinesToInject
        .map((vaccine) => `${vaccine.vaccineName} (Liều ${vaccine.doseNumber}, ${vaccine.diseaseName})`)
        .join(", ")
    : "Không có vắc xin cần tiêm";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
          <span className="text-lg text-gray-600 font-medium">Đang tải thông tin...</span>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-100 text-red-700 p-6 rounded-xl shadow-lg flex items-center space-x-3">
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
      </div>
    );
  }
  if (!appointment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-gray-100 text-gray-600 p-6 rounded-xl shadow-lg flex items-center space-x-3">
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
              d="M13 16h-1v-4h-1m1-4h.01M12 3C7.029 3 3 7.029 3 12s4.029 9 9 9 9-4.029 9-9-4.029-9-9-9z"
            ></path>
          </svg>
          <span className="text-lg font-semibold">Không có dữ liệu lịch hẹn.</span>
        </div>
      </div>
    );
  }

  const child = appointment.child;
  const isCompletedStatus = appointment.status === "Completed";
  const isPaidStatus = appointment.status === "Paid";
  const isApprovalOrPending = appointment.status === "Approval" || appointment.status === "Pending";
  const vaccineDisplay = appointment.order?.packageName || "Không có gói vắc xin";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto bg-white shadow-2xl rounded-2xl p-8">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={handleComplete}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-full font-medium transition-colors duration-200"
          >
            Quay lại
          </button>
          <h2 className="text-3xl font-bold text-gray-800">Tiêm chủng</h2>
          <div className="w-24"></div>
        </div>
        <div className="mb-10">
          <VaccinationSteps currentStep={isCompletedStatus ? 5 : 3} />
        </div>

        <Modal
          title={<span className="text-xl font-semibold text-gray-800">Thành công</span>}
          open={showCompleteModal}
          onCancel={() => setShowCompleteModal(false)}
          footer={[
            <button
              key="close"
              onClick={() => setShowCompleteModal(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-full font-medium transition-colors duration-200"
            >
              Đóng
            </button>,
            <button
              key="continue"
              onClick={() => {
                setShowCompleteModal(false);
                handleComplete();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium transition-colors duration-200"
            >
              Tiếp tục
            </button>,
          ]}
          centered
          className="rounded-xl"
        >
          <p className="text-gray-600">Đã hoàn tất lịch tiêm chủng!</p>
        </Modal>

        {isApprovalOrPending && (
          <div className="mb-8 p-6 bg-red-50 text-red-700 rounded-xl flex items-center space-x-3 shadow-sm">
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
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span className="text-lg font-semibold">
              Vui lòng hoàn thành khảo sát trước khi tiêm và thanh toán để tiếp tục.
            </span>
          </div>
        )}
        {!isCompletedStatus && isPaidStatus && (
          <div className="mb-8 p-6 bg-yellow-50 text-yellow-700 rounded-xl flex items-center space-x-3 shadow-sm">
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
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span className="text-lg font-semibold">Đang chờ bác sĩ thực hiện tiêm chủng...</span>
          </div>
        )}
        {isCompletedStatus && (
          <div className="mb-8 p-6 bg-green-50 text-green-700 rounded-xl flex items-center space-x-3 shadow-sm">
            <CheckCircleIcon className="w-8 h-8" />
            <span className="text-lg font-semibold">
              Đã tiêm xong! Bệnh nhân đã hoàn thành quá trình tiêm chủng.
            </span>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border-l-4 border-blue-600">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 border-b border-gray-200 pb-4">Thông tin cuộc hẹn</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Tên bệnh nhân:</span>
                <span className="text-gray-800">{child?.fullName || "-"}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Tuổi:</span>
                <span className="text-gray-800">{child?.birthDate ? calculateAge(child.birthDate) : "-"}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Tên phụ huynh:</span>
                <span className="text-gray-800">{appointment.memberName || "-"}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Liên hệ:</span>
                <span className="text-gray-800">{appointment.memberPhone || "-"}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Ngày tiêm chủng:</span>
                <span className="text-gray-800">
                  {appointment.appointmentDate
                    ? new Date(appointment.appointmentDate).toLocaleDateString("vi-VN")
                    : "-"}
                </span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Gói vắc xin:</span>
                <span className="text-gray-800">{vaccineDisplay}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Vắc xin cần tiêm:</span>
                <span className="text-gray-800">{vaccinesToInjectDisplay}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Nhóm máu:</span>
                <span className="text-gray-800">{child?.bloodType || "-"}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Dị ứng:</span>
                <span className="text-gray-800">{child?.allergiesNotes || "Không có"}</span>
              </div>
            </div>
          </div>
        </div>

        {isCompletedStatus && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border-l-4 border-yellow-500">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 border-b border-gray-200 pb-4 flex items-center">
              <svg
                className="w-6 h-6 mr-3 text-yellow-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              Ghi chú sau tiêm
            </h3>
            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
              <p className="text-gray-800 whitespace-pre-wrap">
                {appointment.note || "Không có ghi chú sau tiêm."}
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-4 mt-10 items-center">
          <button
            onClick={handleBack}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-full font-medium transition-colors duration-200"
          >
            Trở lại
          </button>
          {(isPaidStatus || appointment.status === "Approval") && user?.position === "Doctor" && (
            <button
              onClick={handleConfirmVaccination}
              disabled={submitting}
              className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium transition-colors duration-200 ${submitting ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {submitting ? "Đang xử lý..." : "Xác nhận tiêm chủng"}
            </button>
          )}
          {isCompletedStatus && (
            <button
              onClick={handleComplete}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium transition-colors duration-200"
            >
              Hoàn thành
            </button>
          )}
        </div>
      </div>
    </div>
  );
}