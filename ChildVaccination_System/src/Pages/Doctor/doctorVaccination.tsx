import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import VaccinationSteps from "@/Components/VaccinationStep";
import { Button as AntButton, message, DatePicker, Modal } from "antd";
import { appointmentApi, type Appointment, type finishVaccinationPayload } from "@/api/appointmentAPI";
import { vaccinePackageApi, type VaccinePackage } from "@/api/vaccinePackageApi";
import { getUserInfo } from "@/lib/storage";
import { Button } from "@/Components/ui/button";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import dayjs from "dayjs";

type ExtendedAppointment = Appointment & {
  vaccinesToInject?: { facilityVaccineId: number; vaccineName: string; doseNumber: string; diseaseName: string }[];
};

export default function DoctorConfirmVaccination() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<ExtendedAppointment | null>(null);
  const [vaccinePackage, setVaccinePackage] = useState<VaccinePackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPackage, setLoadingPackage] = useState(true);
  const [error, setError] = useState("");
  const [errorPackage, setErrorPackage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [postVaccinationNotes, setPostVaccinationNotes] = useState("");
  const [facilityVaccineId, setFacilityVaccineId] = useState<number | null>(null);
  const [doseNum, setDoseNum] = useState<number>(1);
  const [expectedDateForNextDose, setExpectedDateForNextDose] = useState<string>(dayjs().format("YYYY-MM-DD"));
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [vaccinationConfirmed, setVaccinationConfirmed] = useState(false);
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
        const appointmentRes = await appointmentApi.getAppointmentById(Number(id));
        const appointmentData: ExtendedAppointment = appointmentRes || appointmentRes;
        setAppointment(appointmentData);

        if (appointmentData.vaccinesToInject?.length) {
          const firstVaccine = appointmentData.vaccinesToInject[0];
          setFacilityVaccineId(firstVaccine.facilityVaccineId);
          setDoseNum(Number(firstVaccine.doseNumber));
        }
      } catch (err) {
        console.error("Error fetching appointment:", err);
        setError("Không thể tải thông tin lịch hẹn.");
        setAppointment(null);
        message.error("Không thể tải thông tin lịch hẹn.");
      } finally {
        setLoading(false);
      }
    };
    fetchAppointment();
  }, [id]);

  useEffect(() => {
    if (appointment?.order?.packageId) {
      const fetchVaccinePackage = async () => {
        setLoadingPackage(true);
        setErrorPackage("");
        try {
          const response = await vaccinePackageApi.getById(appointment.order!.packageId);
          setVaccinePackage(response);
        } catch {
          setErrorPackage("Không thể tải thông tin gói vắc xin.");
        } finally {
          setLoadingPackage(false);
        }
      };
      fetchVaccinePackage();
    } else {
      setLoadingPackage(false);
      setVaccinePackage(null);
    }
  }, [appointment]);

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

  const handleBackByPosition = () => {
    if (!id) return;
    const basePath = user?.position === "Doctor" ? "/doctor" : "/staff";
    navigate(`${basePath}/appointments/${id}/step-3`);
  };

  const handleVaccineSelect = (vaccineId: number, doseNumber: string) => {
    setFacilityVaccineId(vaccineId);
    setDoseNum(Number(doseNumber));
  };

  const handleConfirmVaccination = async () => {
    if (!id || !appointment || !facilityVaccineId || !expectedDateForNextDose || doseNum < 1) {
      setSubmitMessage("Vui lòng nhập đầy đủ thông tin hợp lệ.");
      message.error("Vui lòng nhập đầy đủ thông tin hợp lệ.");
      return;
    }
    if (!postVaccinationNotes.trim()) {
      setSubmitMessage("Vui lòng nhập ghi chú sau tiêm.");
      message.error("Vui lòng nhập ghi chú sau tiêm.");
      return;
    }
    setSubmitting(true);
    setSubmitMessage("");
    try {
      const payload: finishVaccinationPayload = {
        appointmentId: Number(id),
        facilityVaccineId,
        note: postVaccinationNotes,
        doseNumber: doseNum,
        expectedDateForNextDose,
      };
      await appointmentApi.completeVaccination(payload);
      setSubmitMessage("Đã hoàn thành lịch tiêm.");
      setVaccinationConfirmed(true);
      setAppointment({ ...appointment, status: "Completed" });
      message.success("Đã hoàn thành lịch tiêm.");
      setTimeout(() => {
        navigate(user?.position === "Doctor" ? "/doctor/appointments" : "/staff/appointments");
      }, 1200);
    } catch {
      setSubmitMessage("Có lỗi khi xác nhận tiêm chủng.");
      message.error("Có lỗi khi xác nhận tiêm chủng.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!id || !appointment) return;
    if (!cancelReason.trim()) {
      message.error("Vui lòng nhập lý do hủy lịch hẹn.");
      return;
    }
    setSubmitting(true);
    setSubmitMessage("");
    try {
      await appointmentApi.updateAppointmentStatus(appointment.appointmentId, { status: "Cancelled", note: cancelReason });
      setAppointment({ ...appointment, status: "Cancelled" });
      setSubmitMessage("Hủy lịch hẹn thành công!");
      message.success("Hủy lịch hẹn thành công!");
      setIsCancelModalVisible(false);
      setCancelReason("");
      setTimeout(() => {
        navigate(user?.position === "Doctor" ? "/doctor/appointments" : "/staff/appointments");
      }, 1200);
    } catch {
      setSubmitMessage("Có lỗi khi hủy lịch hẹn.");
      message.error("Có lỗi khi hủy lịch hẹn.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = () => {
    if (!id) return;
    const basePath = user?.position === "Doctor" ? "/doctor" : "/staff";
    navigate(`${basePath}/appointments`);
  };

  const vaccinesToInjectDisplay = appointment?.vaccinesToInject?.length
    ? appointment.vaccinesToInject
        .map((vaccine) => `${vaccine.vaccineName} (Liều ${vaccine.doseNumber}, ${vaccine.diseaseName})`)
        .join(", ")
    : "Không có vắc xin cần tiêm";

  if (loading || loadingPackage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
          <span className="text-lg text-gray-600 font-medium">Đang tải thông tin...</span>
        </div>
      </div>
    );
  }
  if (error || errorPackage) {
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
          <span className="text-lg font-semibold">{error || errorPackage}</span>
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
  const isCancelledStatus = appointment.status === "Cancelled";
  const hasAvailableVaccines = appointment.vaccinesToInject?.length > 0;

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
          open={vaccinationConfirmed}
          onCancel={() => setVaccinationConfirmed(false)}
          footer={[
            <button
              key="close"
              onClick={() => setVaccinationConfirmed(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-full font-medium transition-colors duration-200"
            >
              Đóng
            </button>,
            <button
              key="continue"
              onClick={() => {
                setVaccinationConfirmed(false);
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
        {!isCompletedStatus && isPaidStatus && !vaccinationConfirmed && !isCancelledStatus && (
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
        {(isCompletedStatus || vaccinationConfirmed) && (
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
                <span className="text-gray-800">{appointment.order?.packageName || "Không có gói vắc xin"}</span>
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

        {!isCompletedStatus && !vaccinationConfirmed && !isCancelledStatus && isPaidStatus && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border-l-4 border-blue-500">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 border-b border-gray-200 pb-4">Chi tiết tiêm chủng</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Vắc xin:</label>
                {appointment.vaccinesToInject?.length > 0 ? (
                  <div className="flex flex-wrap gap-4">
                    {appointment.vaccinesToInject.map(vaccine => (
                      <button
                        key={vaccine.facilityVaccineId}
                        type="button"
                        onClick={() => handleVaccineSelect(vaccine.facilityVaccineId, vaccine.doseNumber)}
                        disabled={submitting}
                        className={`px-5 py-2 border rounded-lg font-medium transition-colors duration-200 ${
                          facilityVaccineId === vaccine.facilityVaccineId
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-800 border-gray-300 hover:bg-blue-100 hover:border-blue-500"
                        }`}
                      >
                        {`${vaccine.vaccineName} (${vaccine.diseaseName})`}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">Không có vắc xin nào cần tiêm.</p>
                )}
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Mũi số:</label>
                <input
                  type="number"
                  className="w-full p-4 border border-gray-200 rounded-lg bg-gray-100 cursor-not-allowed text-gray-600"
                  value={doseNum}
                  disabled
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Ngày dự kiến liều tiếp theo:</label>
                <DatePicker
                  className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={expectedDateForNextDose ? dayjs(expectedDateForNextDose) : null}
                  onChange={(date) => setExpectedDateForNextDose(date ? date.format("YYYY-MM-DD") : "")}
                  format="DD/MM/YYYY"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Ghi chú sau tiêm: <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none transition-colors duration-200"
                  value={postVaccinationNotes}
                  onChange={(e) => setPostVaccinationNotes(e.target.value)}
                  rows={4}
                  placeholder="Nhập ghi chú về phản ứng sau tiêm..."
                  disabled={submitting}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-4 mt-10 items-center">
          <button
            onClick={handleBackByPosition}
            disabled={submitting}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-full font-medium transition-colors duration-200"
          >
            Trở lại
          </button>
          {!isCompletedStatus && !vaccinationConfirmed && !isCancelledStatus && isPaidStatus && (
            <>
              <button
                onClick={() => setIsCancelModalVisible(true)}
                disabled={submitting}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full font-medium transition-colors duration-200"
              >
                Hủy lịch hẹn
              </button>
              <button
                onClick={handleConfirmVaccination}
                disabled={submitting || !hasAvailableVaccines || !facilityVaccineId || !expectedDateForNextDose || doseNum < 1}
                className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium transition-colors duration-200 ${submitting || !hasAvailableVaccines || !facilityVaccineId || !expectedDateForNextDose || doseNum < 1 ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {submitting ? "Đang xử lý..." : "Xác nhận tiêm chủng"}
              </button>
            </>
          )}
          {(isCompletedStatus || vaccinationConfirmed || isCancelledStatus || (!isPaidStatus && !isCompletedStatus && !isCancelledStatus)) && (
            <button
              onClick={handleComplete}
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium transition-colors duration-200"
            >
              Hoàn thành
            </button>
          )}
          {submitMessage && !vaccinationConfirmed && (
            <span
              className={`ml-4 font-medium ${submitMessage.includes("thành công") || submitMessage.includes("hoàn thành") ? "text-green-600" : "text-red-500"}`}
            >
              {submitMessage}
            </span>
          )}
        </div>

        <Modal
          title={<span className="text-xl font-semibold text-gray-800">Hủy lịch hẹn</span>}
          open={isCancelModalVisible}
          onOk={handleCancelAppointment}
          onCancel={() => {
            setIsCancelModalVisible(false);
            setCancelReason("");
          }}
          okText="Xác nhận hủy"
          cancelText="Đóng"
          okButtonProps={{ disabled: submitting || !cancelReason.trim(), className: "bg-red-500 hover:bg-red-600" }}
          cancelButtonProps={{ disabled: submitting, className: "bg-gray-200 hover:bg-gray-300" }}
          centered
          className="rounded-xl"
        >
          <div className="space-y-4">
            <label className="block text-gray-700 font-medium mb-2">
              Lý do hủy lịch hẹn: <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none resize-none transition-colors duration-200"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={4}
              placeholder="Nhập lý do hủy lịch hẹn..."
              disabled={submitting}
            />
          </div>
        </Modal>
      </div>
    </div>
  );
}