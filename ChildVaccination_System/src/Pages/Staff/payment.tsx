import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { appointmentApi, type Appointment } from "@/api/appointmentAPI";
import { vaccinePackageApi, type VaccinePackage } from "@/api/vaccinePackageApi";
import { FacilityPaymentAccountApi, type AllPaymentAccountResponse, type PaymentAccount } from "@/api/facilityPaymentAPI";
import { getUserInfo } from "@/lib/storage";
import { Button as AntButton, message } from "antd";
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
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [errorAccounts, setErrorAccounts] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("cash");
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
    if (user?.facilityId) {
      const fetchAccounts = async () => {
        setLoadingAccounts(true);
        setErrorAccounts("");
        try {
          const response: AllPaymentAccountResponse = await FacilityPaymentAccountApi.getTrueAccount(user.facilityId);
          setAccounts(response.data);
        } catch {
          setErrorAccounts("Không thể tải thông tin tài khoản thanh toán.");
        } finally {
          setLoadingAccounts(false);
        }
      };
      fetchAccounts();
    }
  }, [user?.facilityId]);

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
    if (!id || !appointment) return;
    setSubmitting(true);
    setSubmitMessage("");
    try {
      await appointmentApi.updateAppointmentStatus(Number(id), {
        status: "Paid",
        note: "Thanh toán hoàn tất",
      });
      setSubmitMessage("Thanh toán thành công!");
      setAppointment({ ...appointment, status: "Paid" });
      message.success("Thanh toán thành công!");
      setTimeout(() => {
        if (user?.position === "Doctor") {
          navigate(`/doctor/appointments/${id}/step-4`);
        } else {
          navigate(`/staff/appointments/${id}/step-4`);
        }
      }, 1200);
    } catch {
      setSubmitMessage("Có lỗi khi xác nhận thanh toán.");
      message.error("Có lỗi khi xác nhận thanh toán.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinueWithPayment = async () => {
    if (!id || !appointment) return;
    setSubmitting(true);
    setSubmitMessage("");
    try {
      await appointmentApi.updateAppointmentStatus(Number(id), {
        status: "Paid",
        note: "Xác nhận thanh toán từ order",
      });
      setSubmitMessage("Xác nhận thanh toán thành công!");
      setAppointment({ ...appointment, status: "Paid" });
      message.success("Xác nhận thanh toán thành công!");
      setTimeout(() => {
        if (user?.position === "Doctor") {
          navigate(`/doctor/appointments/${id}/step-4`);
        } else {
          navigate(`/staff/appointments/${id}/step-4`);
        }
      }, 1200);
    } catch {
      setSubmitMessage("Có lỗi khi xác nhận thanh toán.");
      message.error("Có lỗi khi xác nhận thanh toán.");
    } finally {
      setSubmitting(false);
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

  if (loading || loadingPackage || loadingAccounts) return (
    <div className="p-8 text-gray-700 text-center flex justify-center items-center bg-gray-50 rounded-lg">
      <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-indigo-600 mr-2"></div>
      Đang tải thông tin...
    </div>
  );
  if (error || errorPackage || errorAccounts) return (
    <div className="p-8 text-rose-600 text-center bg-rose-50 rounded-lg">
      {error || errorPackage || errorAccounts}
    </div>
  );
  if (!appointment) return (
    <div className="p-8 text-gray-600 text-center bg-gray-50 rounded-lg">
      Không có dữ liệu lịch hẹn.
    </div>
  );

  const child = appointment.child;
  const isApprovalStatus = appointment.status === "Approval";
  const isPendingStatus = appointment.status === "Pending";
  const isPaidOrCompletedStatus = appointment.status === "Paid" || appointment.status === "Completed";
  const showPaidNotification = isApprovalStatus && appointment.order && appointment.order.status === "Paid";
  const showContinueWithPayment = isApprovalStatus && appointment.order && appointment.order.status === "Paid" && appointment.status !== "Paid";
  const showPaymentMethod = isApprovalStatus && (!appointment.order || (appointment.order && appointment.order.status === "Pending"));

  const vaccineNames = Array.isArray(appointment.facilityVaccines)
    ? appointment.facilityVaccines.map((fv) => fv.vaccine?.name || `ID: ${fv.vaccineId}`)
    : [];
  const packageName = vaccinePackage?.name;
  const packageVaccineNames = vaccinePackage?.packageVaccines
    ? vaccinePackage.packageVaccines.map((pv) => pv.facilityVaccine.vaccine?.name || `ID: ${pv.facilityVaccine.vaccineId}`)
    : [];

  const vaccineDisplayParts: string[] = [];
  if (appointment.order && packageName) {
    const packageDisplay = packageVaccineNames.length > 0
      ? `${packageName} (${packageVaccineNames.join(", ")})`
      : packageName;
    vaccineDisplayParts.push(packageDisplay);
  } else if (vaccineNames.length > 0) {
    vaccineDisplayParts.push(vaccineNames.join(", "));
  }
  const vaccineDisplay = vaccineDisplayParts.length > 0
    ? vaccineDisplayParts.join(", ")
    : "Không có vắc xin";

  const handlePaymentMethodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedPaymentMethod(event.target.value);
  };

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

        {user?.position === "Doctor" && (
          <div className="mb-8 p-4 bg-yellow-100 text-yellow-700 rounded-lg flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M12 17h.01M12 3C7.029 3 3 7.029 3 12s4.029 9 9 9 9-4.029 9-9-4.029-9-9-9z"></path>
            </svg>
            <span className="font-semibold">Bác sĩ không có quyền xác nhận thanh toán.</span>
          </div>
        )}

        {isPendingStatus && (
          <div className="mb-8 p-4 bg-rose-100 text-rose-700 rounded-lg flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span className="font-semibold">Vui lòng hoàn thiện khảo sát trước khi tiêm để thanh toán.</span>
          </div>
        )}

        {!isPendingStatus && (
          <>
            {isPaidOrCompletedStatus && (
              <div className="mb-8 p-4 bg-emerald-100 text-emerald-800 rounded-lg flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="font-semibold">Thanh toán đã được xác nhận thành công!</span>
              </div>
            )}
            {showPaidNotification && (
              <div className="mb-8 p-4 bg-emerald-100 text-emerald-800 rounded-lg flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="font-semibold">Đã thanh toán. Vui lòng tiếp tục quy trình.</span>
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
                    <span className="font-medium text-gray-600 w-32">Vắc xin:</span>
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

            {showPaymentMethod && user?.position !== "Doctor" && (
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
                  {selectedPaymentMethod === "bank" && accounts.length === 0 && (
                    <div className="ml-6 text-rose-600 text-sm">
                      Chưa có thông tin tài khoản, vui lòng thêm tài khoản thanh toán.
                    </div>
                  )}
                  {selectedPaymentMethod === "bank" && accounts.length > 0 && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="text-md font-semibold text-gray-800 mb-2">Tài khoản thanh toán:</h4>
                      {accounts.map((account) => (
                        <div key={account.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                          <div>
                            <p className="text-gray-700">Ngân hàng: {account.bankName}</p>
                            <p className="text-gray-700">Số TK: {account.accountNumber}</p>
                            <p className="text-gray-700">Chủ TK: {account.accountHolder}</p>
                          </div>
                          <a
                            href={account.qrcodeImageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-600 hover:underline"
                          >
                            Xem QR
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
              {showPaymentMethod && !isPaidOrCompletedStatus && isApprovalStatus && user?.position !== "Doctor" && (
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
              {showContinueWithPayment && user?.position !== "Doctor" && (
                <AntButton
                  type="primary"
                  onClick={handleContinueWithPayment}
                  loading={submitting}
                  disabled={submitting}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-full transition-colors"
                >
                  {submitting ? "Đang xử lý..." : "Tiếp tục"}
                </AntButton>
              )}
              {(isPaidOrCompletedStatus || (!isApprovalStatus && !isPendingStatus)) && (
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
                  className={`ml-4 font-medium ${
                    submitMessage.includes("thành công")
                      ? "text-emerald-600"
                      : "text-rose-500"
                  }`}
                >
                  {submitMessage}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}