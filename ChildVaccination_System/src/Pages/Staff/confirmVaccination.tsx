import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import VaccinationSteps from "@/Components/VaccinationStep";
import { Button as AntButton, message, Modal } from "antd";
import { appointmentApi, type Appointment } from "@/api/appointmentAPI";
import { getUserInfo } from "@/lib/storage";
import { Button } from "@/Components/ui/button";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

export default function ConfirmVaccination() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const user = getUserInfo();

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        setLoading(true);
        if (!id) {
          setError("Không có ID lịch hẹn trong URL.");
          setAppointment(null);
          return;
        }
        const res = await appointmentApi.getAppointmentById(Number(id));
        const appointmentData: Appointment = res.appointments?.[0] || res;
        setAppointment(appointmentData);
      } catch {
        setError("Không thể tải thông tin lịch hẹn.");
        setAppointment(null);
        message.error("Không thể tải thông tin lịch hẹn.");
      } finally {
        setLoading(false);
      }
    };
    fetchAppointment();
  }, [id]);

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
      setAppointment((prev) => prev ? { ...prev, status: "Completed" } : null);
    } catch {
      message.error("Không thể xác nhận hoàn tất tiêm chủng.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="p-6 bg-gray-50 rounded-lg max-w-4xl mx-auto flex justify-center items-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-indigo-600 mr-2"></div>
      <span className="text-gray-600">Đang tải thông tin...</span>
    </div>
  );
  if (error) return (
    <div className="p-6 bg-rose-50 text-rose-600 rounded-lg max-w-4xl mx-auto text-center">
      {error}
    </div>
  );
  if (!appointment) return (
    <div className="p-6 bg-gray-50 text-gray-600 rounded-lg max-w-4xl mx-auto text-center">
      Không có dữ liệu lịch hẹn.
    </div>
  );

  const child = appointment.child;
  const isCompletedStatus = appointment.status === "Completed";
  const isPaidStatus = appointment.status === "Paid";
  const isApprovalOrPending = appointment.status === "Approval" || appointment.status === "Pending";
  const vaccineDisplay = appointment.order?.packageName || "Không có gói vắc xin";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-teal-50 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl p-6">
        <Button
          type="button"
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-full transition-colors mb-6"
          onClick={handleComplete}
        >
          Quay lại
        </Button>
        <h2 className="text-3xl font-bold text-indigo-900 mb-6">Quy trình tiêm chủng</h2>
        <div className="mb-8">
          <VaccinationSteps currentStep={isCompletedStatus ? 5 : 3} />
        </div>

        <Modal
          title="Thành công"
          open={showCompleteModal}
          onCancel={() => setShowCompleteModal(false)}
          footer={[
            <AntButton
              key="close"
              onClick={() => setShowCompleteModal(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-full transition-colors"
            >
              Đóng
            </AntButton>,
            <AntButton
              key="continue"
              type="primary"
              onClick={() => {
                setShowCompleteModal(false);
                handleComplete();
              }}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-full transition-colors"
            >
              Tiếp tục
            </AntButton>,
          ]}
          centered
        >
          <p className="text-gray-700">Đã hoàn tất lịch tiêm chủng!</p>
        </Modal>

        {isApprovalOrPending && (
          <div className="mb-8 p-4 bg-rose-100 text-rose-700 rounded-lg flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span className="font-semibold">Vui lòng hoàn thành khảo sát trước khi tiêm và thanh toán để tiếp tục.</span>
          </div>
        )}
        {!isCompletedStatus && isPaidStatus && (
          <div className="mb-8 p-4 bg-rose-100 text-rose-700 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span className="font-semibold">Đang chờ bác sĩ thực hiện tiêm chủng...</span>
          </div>
        )}
        {isCompletedStatus && (
          <div className="mb-8 p-4 bg-emerald-100 text-emerald-800 rounded-lg flex items-center justify-center">
            <CheckCircleIcon className="w-6 h-6 mr-2" />
            <span className="font-semibold">Đã tiêm xong! Bệnh nhân đã hoàn thành quá trình tiêm chủng.</span>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border-l-4 border-indigo-600">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Thông tin bệnh nhân</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
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
                  {appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString("vi-VN") : "-"}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Vắc xin:</span>
                <span className="text-gray-800">{vaccineDisplay}</span>
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
          <div className="bg-white rounded-xl shadow-md p-6 mb-8 border-l-4 border-yellow-400">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center">
              <svg className="w-6 h-6 mr-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Ghi chú sau tiêm
            </h3>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-gray-800 whitespace-pre-wrap">{appointment.note || "Không có ghi chú sau tiêm."}</p>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-4 mt-8 items-center">
          <AntButton
            type="default"
            onClick={handleBack}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-full transition-colors"
          >
            Trở lại
          </AntButton>
          {(isPaidStatus || appointment.status === "Approval") && user?.position === "Doctor" && (
            <AntButton
              type="primary"
              onClick={handleConfirmVaccination}
              disabled={submitting}
              className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full transition-colors ${
                submitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {submitting ? "Đang xử lý..." : "Xác nhận tiêm chủng"}
            </AntButton>
          )}
          {isCompletedStatus && (
            <AntButton
              type="primary"
              onClick={handleComplete}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-full transition-colors"
            >
              Hoàn thành
            </AntButton>
          )}
        </div>
      </div>
    </div>
  );
}