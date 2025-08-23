import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { appointmentApi, type Appointment } from "@/api/appointmentAPI";
import { vaccinePackageApi, type VaccinePackage } from "@/api/vaccinePackageApi";
import { FacilityPaymentAccountApi, type FinishPaymentResponse } from "@/api/facilityPaymentAPI";
import { getUserInfo } from "@/lib/storage";
import { Button as AntButton, message, Modal } from "antd";
import { Button } from "@/Components/ui/button";
import VaccinationSteps from "@/Components/VaccinationStep";

export default function PaymentComplete() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [vaccinePackage, setVaccinePackage] = useState<VaccinePackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPackage, setLoadingPackage] = useState(true);
  const [loadingPayment, setLoadingPayment] = useState(true);
  const [error, setError] = useState("");
  const [errorPackage, setErrorPackage] = useState("");
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [finishMessage, setFinishMessage] = useState("");
  const user = getUserInfo();

  // Kiểm tra trạng thái thanh toán khi vào trang
  useEffect(() => {
    const checkPaymentStatus = async () => {
      const query = new URLSearchParams(location.search);
      const orderCode = query.get("orderCode");
      setLoadingPayment(true);
      if (orderCode) {
        try {
          const response: FinishPaymentResponse = await FacilityPaymentAccountApi.finishPayment(orderCode);
          if (response.success && response.data.status === "paid") {
            setFinishMessage("Thanh toán đã được xác nhận thành công!");
            setShowFinishModal(true);
            setAppointment((prev) => (prev ? { ...prev, status: "Paid" } : null)); // Cập nhật trạng thái cục bộ
          } else {
            setFinishMessage(response.data.message || "Thanh toán chưa hoàn tất.");
            setShowFinishModal(true);
          }
        } catch {
          setFinishMessage("Có lỗi khi kiểm tra trạng thái thanh toán.");
          setShowFinishModal(true);
        } finally {
          setLoadingPayment(false);
        }
      } else {
        // Kiểm tra trạng thái lịch hẹn cho trường hợp thanh toán tiền mặt
        if (appointment?.status === "Paid") {
          setFinishMessage("Thanh toán đã được xác nhận thành công!");
          setShowFinishModal(true);
        } else {
          setFinishMessage("Không tìm thấy mã giao dịch. Vui lòng kiểm tra lại.");
          setShowFinishModal(true);
        }
        setLoadingPayment(false);
      }
    };

    // Chỉ gọi checkPaymentStatus sau khi appointment được tải
    if (appointment !== null) {
      checkPaymentStatus();
    }
  }, [appointment, location.search]);

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
        setError("Không thể tải thông tin lịch hẹn.");
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
    if (user?.position === "Doctor") {
      navigate("/doctor/appointments");
    } else {
      navigate("/staff/appointments");
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

  // Hiển thị loading khi đang gọi API finishPayment hoặc tải dữ liệu
  if (loadingPayment || loading || loadingPackage) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-teal-50 p-6 flex justify-center items-center">
      <div className="p-8 text-gray-700 text-center flex justify-center items-center bg-white shadow-lg rounded-xl">
        <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-indigo-600 mr-2"></div>
        {loadingPayment ? "Đang kiểm tra trạng thái thanh toán..." : "Đang tải thông tin..."}
      </div>
    </div>
  );

  // Hiển thị lỗi nếu có
  if (error || errorPackage) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-teal-50 p-6">
      <div className="max-w-4xl mx-auto p-8 text-rose-600 text-center bg-rose-50 rounded-lg">
        {error || errorPackage}
      </div>
    </div>
  );

  // Hiển thị thông báo nếu không có dữ liệu lịch hẹn
  if (!appointment) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-teal-50 p-6">
      <div className="max-w-4xl mx-auto p-8 text-gray-600 text-center bg-gray-50 rounded-lg">
        Không có dữ liệu lịch hẹn.
      </div>
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

        {/* Notification Modal for Payment Status */}
        <Modal
          title={finishMessage.includes("thành công") ? "Thành công" : "Lỗi"}
          open={showFinishModal}
          onCancel={() => setShowFinishModal(false)}
          footer={[
            <AntButton
              key="continue"
              type="primary"
              onClick={handleContinue}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-full transition-colors"
            >
              Tiếp tục
            </AntButton>,
          ]}
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

        <div className="mb-8 p-4 bg-emerald-100 text-emerald-800 rounded-lg flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span className="font-semibold">Thanh toán đã được xác nhận thành công!</span>
        </div>

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

        <div className="flex justify-end space-x-4 mt-8">
          <AntButton
            type="default"
            onClick={handleBackByPosition}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-full transition-colors"
          >
            Quay lại
          </AntButton>
          <AntButton
            type="primary"
            onClick={handleContinue}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-full transition-colors"
          >
            Tiếp tục
          </AntButton>
        </div>
      </div>
    </div>
  );
}