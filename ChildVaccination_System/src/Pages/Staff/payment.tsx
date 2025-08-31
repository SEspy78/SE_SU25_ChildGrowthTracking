import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { appointmentApi, type Appointment } from "@/api/appointmentAPI";
import { vaccinePackageApi, type VaccinePackage } from "@/api/vaccinePackageApi";
import { FacilityPaymentAccountApi, type PaymentResponse } from "@/api/facilityPaymentAPI";
import { getUserInfo } from "@/lib/storage";
import { Button } from "@/Components/ui/button";
import { message, Modal } from "antd";
import VaccinationSteps from "@/Components/VaccinationStep";

export default function Payment() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [vaccinePackage, setVaccinePackage] = useState<VaccinePackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPackage, setLoadingPackage] = useState(true);
  const [error, setError] = useState("");
  const [errorPackage, setErrorPackage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [finishMessage, setFinishMessage] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"cash" | "bank">("cash");
  const user = getUserInfo();

  const isApprovalOrPendingStatus = appointment?.status === "Approval" || appointment?.status === "Pending";
  const isAppointmentPaid = appointment?.status === "Paid" || appointment?.status === "Completed";
  const isOrderPaid = appointment?.order?.status === "Paid" && !isAppointmentPaid;
  const showPaymentSection = appointment && appointment.status === "Approval" && (!appointment.order || (appointment.order && appointment.order.status === "Pending")) && user?.position !== "Doctor";

  const fetchAppointment = async () => {
    try {
      setLoading(true);
      if (!id) {
        setError("Không có ID lịch hẹn trong URL.");
        setAppointment(null);
        message.error("Không có ID lịch hẹn trong URL.");
        return;
      }
      const res = await appointmentApi.getAppointmentById(Number(id));
      setAppointment(res);
    } catch {
      setError("Không thể tải thông tin thanh toán.");
      setAppointment(null);
      message.error("Không thể tải thông tin thanh toán.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointment();
  }, [id]);

  useEffect(() => {
    if (appointment?.status === "Approval" && user?.position === "Doctor") {
      const interval = setInterval(() => {
        fetchAppointment();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [appointment?.status, user?.position]);

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

  useEffect(() => {
    const initiatePayment = async () => {
      if (selectedPaymentMethod === "bank" && showPaymentSection && !isAppointmentPaid && !isOrderPaid) {
        setSubmitting(true);
        setSubmitMessage("");
        try {
          const response: PaymentResponse = await FacilityPaymentAccountApi.payment({ appointmentId: Number(id) });
          if (response.success) {
            setSubmitMessage("Đang chuyển hướng đến trang thanh toán...");
            message.success("Khởi tạo thanh toán thành công!");
            setTimeout(() => {
              window.location.href = response.data.paymentUrl;
            }, 1000);
          } else {
            setSubmitMessage(response.message || "Khởi tạo thanh toán thất bại.");
            message.error(response.message || "Khởi tạo thanh toán thất bại.");
          }
        } catch {
          setSubmitMessage("Có lỗi khi khởi tạo thanh toán.");
          message.error("Có lỗi khi khởi tạo thanh toán.");
        } finally {
          setSubmitting(false);
        }
      }
    };
    initiatePayment();
  }, [selectedPaymentMethod, id, showPaymentSection, isAppointmentPaid, isOrderPaid]);

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
    navigate(`${basePath}/appointments/${id}/step-2`); // Navigate to Pre-vaccination health assessment step
  };

  const handleConfirmPayment = async () => {
    if (!id) {
      setSubmitMessage("Không có ID lịch hẹn.");
      message.error("Không có ID lịch hẹn.");
      return;
    }
    setSubmitting(true);
    setSubmitMessage("");
    setFinishMessage("");
    try {
      await appointmentApi.updateAppointmentStatus(Number(id), {
        status: "Paid",
        note: isOrderPaid ? "Thanh toán bằng chuyển khoản" : "Thanh toán bằng tiền mặt",
      });
      setAppointment({ ...appointment!, status: "Paid" });
      setFinishMessage("Xác nhận thanh toán thành công!");
      setSubmitMessage("Xác nhận thanh toán thành công!");
      setShowFinishModal(true);
      setTimeout(() => {
        setShowFinishModal(false);
        navigate(user?.position === "Doctor" ? `/doctor/appointments/${id}/step-4` : `/staff/appointments/${id}/step-4`);
      }, 1200);
    } catch {
      setFinishMessage("Có lỗi khi xác nhận thanh toán.");
      setSubmitMessage("Có lỗi khi xác nhận thanh toán.");
      setShowFinishModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (!id || !appointment || !appointment.order || appointment.order.status !== "Paid" || appointment.status !== "Approval") return;
    setSubmitting(true);
    try {
      await appointmentApi.updateAppointmentStatus(Number(id), {
        status: "Paid",
        note: "Gói đã thanh toán",
      });
      setAppointment({ ...appointment, status: "Paid" });
      navigate(user?.position === "Doctor" ? `/doctor/appointments/${id}/step-4` : `/staff/appointments/${id}/step-4`);
    } catch {
      // Silent failure, no message displayed
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = () => {
    if (!id || !isAppointmentPaid) return;
    navigate(user?.position === "Doctor" ? `/doctor/appointments/${id}/step-4` : `/staff/appointments/${id}/step-4`);
  };

  const handlePaymentMethodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedPaymentMethod(event.target.value as "cash" | "bank");
    setSubmitMessage("");
  };

  if (loading || loadingPackage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <svg className="animate-spin h-10 w-10 text-teal-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-gray-600 text-lg font-medium">Đang tải thông tin...</span>
        <div className="w-full max-w-xs bg-gray-200 rounded-full h-2 mt-3">
          <div className="bg-teal-600 h-2 rounded-full animate-pulse" style={{ width: "50%" }}></div>
        </div>
      </div>
    );
  }

  if (error || errorPackage) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-xl shadow-lg flex items-center justify-center max-w-4xl mx-auto mt-8">
        <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M12 17h.01M12 3C7.029 3 3 7.029 3 12s4.029 9 9 9 9-4.029 9-9-4.029-9-9-9z"></path>
        </svg>
        {error || errorPackage}
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="bg-gray-50 text-gray-600 p-6 rounded-xl shadow-lg flex items-center justify-center max-w-4xl mx-auto mt-8">
        <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M12 3C7.029 3 3 7.029 3 12s4.029 9 9 9 9-4.029 9-9-4.029-9-9-9z"></path>
        </svg>
        Không có dữ liệu lịch hẹn.
      </div>
    );
  }

  const child = appointment.child;
  // Use packageId to display vaccine name if order exists
  const vaccineDisplay = appointment.order?.packageId && vaccinePackage?.name
    ? vaccinePackage.name
    : appointment.order?.packageName
    ? appointment.order.packageName
    : appointment.vaccinesToInject?.length
    ? `Vắc xin ${appointment.vaccinesToInject.map(v => v.vaccineName).join(", ")}`
    : "Không có vắc xin";

  return (
    <div className="min-h-screen bg-gray-100 p-6 md:p-8">
      <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-2xl p-8">
        {/* Header and Back Button */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Thanh toán</h2>
          <Button
            type="button"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-full transition duration-300"
            onClick={handleBackByPosition}
            disabled={submitting}
          >
            Trở lại
          </Button>
        </div>

        {/* Vaccination Steps */}
        <div className="mb-10">
          <VaccinationSteps currentStep={2} />
        </div>

        {/* Success/Error Modal */}
        <Modal
          title={<span className="text-xl font-semibold text-gray-800">{finishMessage.includes("thành công") ? "Thành công" : "Lỗi"}</span>}
          open={showFinishModal}
          onCancel={() => setShowFinishModal(false)}
          footer={null}
          centered
          className="rounded-xl"
        >
          <div className={`flex items-center gap-3 p-4 ${finishMessage.includes("thành công") ? "text-teal-600 bg-teal-50" : "text-red-600 bg-red-50"} rounded-lg`}>
            {finishMessage.includes("thành công") ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <p className="font-medium text-lg">{finishMessage}</p>
          </div>
        </Modal>

        {/* Cancelled Appointment Message */}
        {appointment.status === "Cancelled" && (
          <div className="mb-8 p-6 bg-red-50 text-red-600 rounded-xl shadow-lg flex items-center">
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold text-lg">Lịch tiêm đã bị hủy</span>
          </div>
        )}

        {/* Doctor Waiting Message */}
        {isApprovalOrPendingStatus && !isAppointmentPaid && !isOrderPaid && appointment.status !== "Cancelled" && user?.position === "Doctor" && (
          <div className="mb-8 p-6 bg-yellow-50 text-yellow-700 rounded-xl shadow-lg flex items-center">
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold text-lg">Vui lòng đợi nhân viên xác nhận thanh toán.</span>
          </div>
        )}

        {/* Paid Status Message */}
        {(isAppointmentPaid || isOrderPaid) && (
          <div className="mb-8 p-6 bg-teal-50 text-teal-700 rounded-xl shadow-lg flex items-center">
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-semibold text-lg">Gói này đã được thanh toán!</span>
          </div>
        )}

        {/* Payment Details Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border-l-4 border-teal-500">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">Chi tiết thanh toán</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>
            <div className="space-y-4">
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Sản phẩm:</span>
                <span className="text-gray-800">{vaccineDisplay}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Tổng chi phí:</span>
                <span className="text-gray-800 font-semibold">
                  {typeof appointment.estimatedCost === "number"
                    ? appointment.estimatedCost.toLocaleString() + " VND"
                    : "-"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method Section */}
        {showPaymentSection && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8 border-l-4 border-teal-500">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">Phương thức thanh toán</h3>
            <div className="flex flex-col gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={selectedPaymentMethod === "cash"}
                  onChange={handlePaymentMethodChange}
                  className="h-5 w-5 text-teal-600 focus:ring-2 focus:ring-teal-500 border-gray-300"
                />
                <span className="text-gray-700 text-lg">Tiền mặt</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bank"
                  checked={selectedPaymentMethod === "bank"}
                  onChange={handlePaymentMethodChange}
                  className="h-5 w-5 text-teal-600 focus:ring-2 focus:ring-teal-500 border-gray-300"
                />
                <span className="text-gray-700 text-lg">Chuyển khoản qua mã QR</span>
              </label>
            </div>
            {selectedPaymentMethod === "bank" && submitting && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center">
                <svg className="animate-spin h-6 w-6 text-teal-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-700 text-lg">Đang chuyển hướng đến trang thanh toán...</p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons and Message */}
        <div className="flex justify-end space-x-4 mt-8 items-center">
          <Button
            type="button"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-full transition duration-300"
            onClick={handleBackByPosition}
            disabled={submitting}
          >
            Trở lại
          </Button>
          {showPaymentSection && !isAppointmentPaid && !isOrderPaid && selectedPaymentMethod === "cash" && (
            <Button
              type="button"
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-full transition duration-300"
              onClick={handleConfirmPayment}
              disabled={submitting}
            >
              {submitting ? "Đang xử lý..." : "Xác nhận thanh toán"}
            </Button>
          )}
          {appointment?.order && appointment.order.status === "Paid" && appointment.status === "Approval" && (
            <Button
              type="button"
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-full transition duration-300"
              onClick={handleNext}
              disabled={submitting}
            >
              {submitting ? "Đang xử lý..." : "Tiếp theo"}
            </Button>
          )}
          {isAppointmentPaid && (
            <Button
              type="button"
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-full transition duration-300"
              onClick={handleContinue}
              disabled={submitting}
            >
              Tiếp tục
            </Button>
          )}
          {submitMessage && (
            <span className={`ml-4 font-medium ${submitMessage.includes("thành công") ? "text-teal-600" : "text-red-500"}`}>
              {submitMessage}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}