import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { appointmentApi, type Appointment } from "@/api/appointmentAPI";
import { vaccinePackageApi, type VaccinePackage } from "@/api/vaccinePackageApi";
import { FacilityPaymentAccountApi, type PaymentResponse } from "@/api/facilityPaymentAPI";
import { getUserInfo } from "@/lib/storage";
import { Button as AntButton, message, Modal } from "antd";
import VaccinationSteps from "@/Components/VaccinationStep";
import { Button } from "@/Components/ui/button";

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
  const isPaidStatus = appointment?.status === "Paid" || appointment?.order?.status === "Paid" || appointment?.status === "Completed";
  const showPaymentSection = appointment && appointment.status === "Approval" && (!appointment.order || (appointment.order && appointment.order.status === "Pending")) && user?.position !== "Doctor";

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
        const appointmentData = (res as any).data || res;
        setAppointment(appointmentData);
      } catch {
        setError("Không thể tải thông tin thanh toán.");
        setAppointment(null);
        message.error("Không thể tải thông tin thanh toán.");
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

  useEffect(() => {
    const initiatePayment = async () => {
      if (selectedPaymentMethod === "bank" && showPaymentSection && !isPaidStatus) {
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
  }, [selectedPaymentMethod, id, showPaymentSection, isPaidStatus]);

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
    if (user?.position === "Doctor") {
      navigate("/doctor/appointments");
    } else {
      navigate("/staff/appointments");
    }
  };

  const handleConfirmPayment = async () => {
    if (selectedPaymentMethod === "cash") {
      setSubmitting(true);
      setSubmitMessage("");
      try {
        await appointmentApi.updateAppointmentStatus(Number(id), {
          status: "Paid",
          note: "Thanh toán bằng tiền mặt",
        });
        setAppointment({ ...appointment!, status: "Paid" });
        setFinishMessage("Xác nhận thanh toán tiền mặt thành công!");
        setShowFinishModal(true);
        navigate(`/payment/${id}/complete`);
      } catch {
        setFinishMessage("Có lỗi khi xác nhận thanh toán tiền mặt.");
        setShowFinishModal(true);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleContinue = () => {
    if (!id) return;
    if (user?.position === "Doctor") {
      navigate(`/doctor/appointments/${id}/step-4`);
    } else {
      navigate(`/staff/appointments/${id}/step-4`);
    }
  };

  const handlePaymentMethodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedPaymentMethod(event.target.value as "cash" | "bank");
    setSubmitMessage("");
  };

  if (loading || loadingPackage) return (
    <div className="p-8 text-gray-700 text-center flex justify-center items-center bg-gray-50 rounded-lg">
      <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-indigo-600 mr-2"></div>
      Đang tải thông tin...
    </div>
  );
  if (error || errorPackage) return (
    <div className="p-8 text-rose-600 text-center bg-rose-50 rounded-lg">
      {error || errorPackage}
    </div>
  );
  if (!appointment) return (
    <div className="p-8 text-gray-600 text-center bg-gray-50 rounded-lg">
      Không có dữ liệu lịch hẹn.
    </div>
  );

  const child = appointment.child;
  const vaccineDisplay = appointment.order?.packageName || "Không có gói vắc xin";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-teal-50 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl p-6">
        <Button
          type="button"
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-full transition-colors mb-6"
          onClick={handleBackByPosition}
        >
          Quay lại
        </Button>
        <h2 className="text-3xl font-bold text-indigo-900 mb-6">Quy trình tiêm chủng</h2>
        <div className="mb-8">
          <VaccinationSteps currentStep={2} />
        </div>

        {appointment.status === "Cancelled" && (
          <div className="mb-8 p-4 bg-rose-100 text-rose-700 rounded-lg flex items-center">
            <svg
              className="w-6 h-6 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-semibold">Lịch tiêm đã bị hủy</span>
          </div>
        )}

        <Modal
          title={finishMessage.includes("thành công") ? "Thành công" : "Lỗi"}
          open={showFinishModal}
          onCancel={() => setShowFinishModal(false)}
          footer={[<AntButton
            key="continue"
            type="primary"
            onClick={handleContinue}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-full transition-colors"
          >
            Tiếp tục
          </AntButton>]}
          centered
        >
          <div className={`flex items-center gap-3 p-4 ${finishMessage.includes("thành công") ? "text-emerald-600" : "text-rose-600"}`}>
            {finishMessage.includes("thành công") ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <p className="font-medium">{finishMessage}</p>
          </div>
        </Modal>

        {isApprovalOrPendingStatus && !isPaidStatus && appointment.status !== "Cancelled" && user?.position === "Doctor" && (
          <div className="mb-8 p-4 bg-rose-100 text-rose-700 rounded-lg flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold">Vui lòng đợi nhân viên xác nhận thanh toán.</span>
          </div>
        )}

        {isApprovalOrPendingStatus && !isPaidStatus && appointment.status !== "Cancelled" && user?.position === "Staff" && (
          <div className="mb-8 p-4 bg-rose-100 text-rose-700 rounded-lg flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold">Vui lòng đợi bác sĩ hoàn thành thăm khám.</span>
          </div>
        )}

        {isPaidStatus && (
          <div className="mb-8 p-4 bg-emerald-100 text-emerald-800 rounded-lg flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-semibold">Thanh toán đã được xác nhận thành công!</span>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border-l-4 border-indigo-600">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Chi tiết thanh toán</h3>
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
            </div>
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Tên gói vắc xin:</span>
                <span className="text-gray-800">{vaccineDisplay}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Tổng chi phí:</span>
                <span className="text-gray-800">
                  {typeof appointment.estimatedCost === "number"
                    ? appointment.estimatedCost.toLocaleString() + " VND"
                    : "-"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {showPaymentSection && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8 border-l-4 border-teal-500">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Phương thức thanh toán</h3>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={selectedPaymentMethod === "cash"}
                  onChange={handlePaymentMethodChange}
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-gray-700">Tiền mặt</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bank"
                  checked={selectedPaymentMethod === "bank"}
                  onChange={handlePaymentMethodChange}
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-gray-700">Chuyển khoản qua mã QR</span>
              </label>
            </div>
            {selectedPaymentMethod === "bank" && submitting && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-t-4 border-indigo-600 mr-2"></div>
                <p className="text-gray-700">Đang chuyển hướng đến trang thanh toán...</p>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-4 mt-8 items-center">
          <AntButton
            type="default"
            onClick={() => window.history.back()}
            disabled={submitting}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-full transition-colors"
          >
            Trở lại
          </AntButton>
          {showPaymentSection && !isPaidStatus && selectedPaymentMethod === "cash" && (
            <AntButton
              type="primary"
              onClick={handleConfirmPayment}
              loading={submitting}
              disabled={submitting}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-full transition-colors"
            >
              {submitting ? "Đang xử lý..." : "Xác nhận thanh toán"}
            </AntButton>
          )}
          {isPaidStatus && (
            <AntButton
              type="primary"
              onClick={handleContinue}
              disabled={submitting}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-full transition-colors"
            >
              Tiếp tục
            </AntButton>
          )}
          {submitMessage && (
            <span
              className={`ml-4 font-medium ${submitMessage.includes("thành công") ? "text-emerald-600" : "text-rose-500"}`}
            >
              {submitMessage}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}