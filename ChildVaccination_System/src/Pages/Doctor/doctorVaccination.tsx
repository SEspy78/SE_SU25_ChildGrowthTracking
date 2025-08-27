import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import VaccinationSteps from "@/Components/VaccinationStep";
import { Button as AntButton, message, DatePicker, Modal, Tooltip } from "antd";
import { appointmentApi, type Appointment, type finishVaccinationPayload, orderApi } from "@/api/appointmentAPI";
import { vaccinePackageApi, type VaccinePackage } from "@/api/vaccinePackageApi";
import { facilityVaccineApi, type FacilityVaccine } from "@/api/vaccineApi";
import { getUserInfo } from "@/lib/storage";
import { Button } from "@/Components/ui/button";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import dayjs from "dayjs";

type ExtendedAppointment = Appointment & {
  vaccinesToInject?: { vaccineName: string; doseNumber: string; diseaseName: string }[];
};

export default function DoctorConfirmVaccination() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<ExtendedAppointment | null>(null);
  const [vaccinePackage, setVaccinePackage] = useState<VaccinePackage | null>(null);
  const [facilityVaccines, setFacilityVaccines] = useState<FacilityVaccine[]>([]);
  const [vaccineQuantities, setVaccineQuantities] = useState<Map<number, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadingPackage, setLoadingPackage] = useState(true);
  const [loadingFacilityVaccines, setLoadingFacilityVaccines] = useState(true);
  const [error, setError] = useState("");
  const [errorPackage, setErrorPackage] = useState("");
  const [errorFacilityVaccines, setErrorFacilityVaccines] = useState("");
  const [vaccineStatusMessage, setVaccineStatusMessage] = useState("");
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
        setLoadingFacilityVaccines(true);
        if (!id) {
          setError("Không có ID lịch hẹn trong URL.");
          setAppointment(null);
          return;
        }
        const appointmentRes = await appointmentApi.getAppointmentById(Number(id));
        console.log("Appointment Response:", appointmentRes);
        const appointmentData: ExtendedAppointment = appointmentRes || appointmentRes;
        console.log("Appointment Data:", appointmentData);
        console.log("Order:", appointmentData.order);
        console.log("Facility Vaccines:", appointmentData.facilityVaccines);
        setAppointment(appointmentData);

        let facilityVaccineIds: number[] = [];
        if (appointmentData.order && Array.isArray(appointmentData.order.orderDetails) && appointmentData.order.orderDetails.length > 0) {
          console.log("Order Details:", appointmentData.order.orderDetails);
          facilityVaccineIds = appointmentData.order.orderDetails
            .filter(detail => detail && typeof detail.facilityVaccineId === "number" && detail.facilityVaccineId > 0)
            .map(detail => detail.facilityVaccineId);
          console.log("Facility Vaccine IDs from Order Details:", facilityVaccineIds);
        } else if (Array.isArray(appointmentData.facilityVaccines) && appointmentData.facilityVaccines.length > 0) {
          console.log("Facility Vaccines:", appointmentData.facilityVaccines);
          facilityVaccineIds = appointmentData.facilityVaccines
            .filter(fv => fv && typeof fv.facilityVaccineId === "number" && fv.facilityVaccineId > 0)
            .map(fv => fv.facilityVaccineId);
          console.log("Facility Vaccine IDs from Facility Vaccines:", facilityVaccineIds);
        }
        console.log("Final Facility Vaccine IDs:", facilityVaccineIds);

        if (facilityVaccineIds.length > 0) {
          const vaccinePromises = facilityVaccineIds.map(id => facilityVaccineApi.getById(id));
          const vaccineResults = await Promise.allSettled(vaccinePromises);
          let vaccines: FacilityVaccine[] = [];
          vaccineResults.forEach((result, index) => {
            if (result.status === "fulfilled") {
              const vaccine = result.value;
              if (vaccine && typeof vaccine.facilityVaccineId === "number" && vaccine.vaccine) {
                vaccines.push(vaccine);
              } else {
                console.warn(`Invalid FacilityVaccine data for ID ${facilityVaccineIds[index]}:`, vaccine);
              }
            } else {
              console.error(`Failed to fetch facility vaccine ${facilityVaccineIds[index]}:`, result.reason);
            }
          });
          console.log("Fetched Vaccines:", vaccines);

          const quantities = new Map<number, number>();
          if (appointmentData.order?.orderId) {
            try {
              const order = await orderApi.getOrderById(appointmentData.order.orderId);
              console.log("Fetched Order:", order);
              console.log("Order Details:", order.orderDetails);
              vaccines.forEach(vaccine => {
                const orderDetail = order.orderDetails.find(detail => detail.facilityVaccineId === vaccine.facilityVaccineId);
                const remainingQuantity = orderDetail?.remainingQuantity ?? 1;
                console.log(`Vaccine ID ${vaccine.facilityVaccineId} Remaining Quantity:`, remainingQuantity);
                quantities.set(vaccine.facilityVaccineId, remainingQuantity);
              });
            } catch (err) {
              console.error("Error fetching order for remaining quantity:", err);
              vaccines.forEach(vaccine => quantities.set(vaccine.facilityVaccineId, 1));
            }
          } else {
            vaccines.forEach(vaccine => quantities.set(vaccine.facilityVaccineId, 1));
          }

          console.log("Vaccine Quantities:", quantities);
          setFacilityVaccines(vaccines);
          setVaccineQuantities(quantities);

          const firstAvailableVaccine = vaccines.find(vaccine => (quantities.get(vaccine.facilityVaccineId) ?? 1) > 0);
          if (firstAvailableVaccine) {
            setFacilityVaccineId(firstAvailableVaccine.facilityVaccineId);
            await handleVaccineSelect(firstAvailableVaccine.facilityVaccineId);
          } else {
            setVaccineStatusMessage("Tất cả vắc xin đã được tiêm hết.");
          }
        } else {
          setFacilityVaccines([]);
          setErrorFacilityVaccines("Không có vắc xin nào được liên kết với lịch hẹn.");
        }
      } catch (err) {
        console.error("Error fetching appointment:", err);
        setError("Không thể tải thông tin lịch hẹn.");
        setAppointment(null);
        message.error("Không thể tải thông tin lịch hẹn.");
      } finally {
        setLoading(false);
        setLoadingFacilityVaccines(false);
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

  const handleDoseNumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || Number(value) < 1) {
      setDoseNum(1);
    } else {
      setDoseNum(Number(value));
    }
  };

  const handleVaccineSelect = async (facilityVaccineId: number) => {
    const remainingQuantity = vaccineQuantities.get(facilityVaccineId) ?? 1;
    if (remainingQuantity === 0) {
      message.error("Vắc xin này đã được tiêm hết, vui lòng chọn vắc xin khác.");
      return;
    }

    setFacilityVaccineId(facilityVaccineId);
    console.log("Selected Facility Vaccine ID:", facilityVaccineId);

    try {
      const facilityVaccine = await facilityVaccineApi.getById(facilityVaccineId);
      const numberOfDoses = facilityVaccine.vaccine?.numberOfDoses || 1;

      if (appointment?.order?.orderId) {
        const order = await orderApi.getOrderById(appointment.order.orderId);
        console.log("Fetched Order:", order);
        const orderDetail = order.orderDetails.find(detail => detail.facilityVaccineId === facilityVaccineId);
        const remainingQuantity = orderDetail?.remainingQuantity ?? 1;
        console.log("Remaining Quantity:", remainingQuantity);

        const calculatedDoseNum = Math.max(1, numberOfDoses - remainingQuantity + 1);
        console.log("Calculated Dose Number:", calculatedDoseNum);
        setDoseNum(calculatedDoseNum);
      } else {
        setDoseNum(1);
        console.warn("No order found for appointment, defaulting doseNum to 1");
      }
    } catch (err) {
      console.error("Error calculating dose number:", err);
      setDoseNum(1);
      message.error("Không thể tính toán số liều mặc định.");
    }
  };

  const handleConfirmVaccination = async () => {
    if (!id || !appointment || !facilityVaccineId || !expectedDateForNextDose || doseNum < 1) {
      setSubmitMessage("Vui lòng nhập đầy đủ thông tin hợp lệ.");
      message.error("Vui lòng nhập đầy đủ thông tin hợp lệ.");
      return;
    }
    if ((vaccineQuantities.get(facilityVaccineId) ?? 1) === 0) {
      setSubmitMessage("Vắc xin đã chọn đã được tiêm hết.");
      message.error("Vắc xin đã chọn đã được tiêm hết.");
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
      console.log("Vaccination Payload:", payload);
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

  // Vaccines to inject display
  const vaccinesToInjectDisplay = appointment?.vaccinesToInject?.length
    ? appointment.vaccinesToInject
        .map((vaccine) => `${vaccine.vaccineName} (Liều ${vaccine.doseNumber}, ${vaccine.diseaseName})`)
        .join(", ")
    : "Không có vắc xin cần tiêm";

  if (loading || loadingPackage || loadingFacilityVaccines) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg max-w-4xl mx-auto flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-indigo-600 mr-2"></div>
        <span className="text-gray-600">Đang tải thông tin...</span>
      </div>
    );
  }
  if (error || errorPackage || errorFacilityVaccines) {
    return (
      <div className="p-6 bg-rose-50 text-rose-600 rounded-lg max-w-4xl mx-auto text-center">
        {error || errorPackage || errorFacilityVaccines}
      </div>
    );
  }
  if (!appointment) {
    return (
      <div className="p-6 bg-gray-50 text-gray-600 rounded-lg max-w-4xl mx-auto text-center">
        Không có dữ liệu lịch hẹn.
      </div>
    );
  }

  const child = appointment.child;
  const isCompletedStatus = appointment.status === "Completed";
  const isPaidStatus = appointment.status === "Paid";
  const isApprovalOrPending = appointment.status === "Approval" || appointment.status === "Pending";
  const isCancelledStatus = appointment.status === "Cancelled";
  const hasAvailableVaccines = facilityVaccines.some(fv => (vaccineQuantities.get(fv.facilityVaccineId) ?? 1) > 0);
  const vaccineDisplay = appointment.order?.packageName || "Không có gói vắc xin";
  const selectedFacilityVaccine = facilityVaccines.find(fv => fv.facilityVaccineId === facilityVaccineId);

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
          open={vaccinationConfirmed}
          onCancel={() => setVaccinationConfirmed(false)}
          footer={[
            <AntButton
              key="close"
              onClick={() => setVaccinationConfirmed(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-full transition-colors"
            >
              Đóng
            </AntButton>,
            <AntButton
              key="continue"
              type="primary"
              onClick={() => {
                setVaccinationConfirmed(false);
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
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span className="font-semibold">
              Vui lòng hoàn thành khảo sát trước khi tiêm và thanh toán để tiếp tục.
            </span>
          </div>
        )}
        {!isCompletedStatus && isPaidStatus && !vaccinationConfirmed && !isCancelledStatus && (
          <div className="mb-8 p-4 bg-rose-100 text-rose-700 rounded-lg flex items-center justify-center">
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
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span className="font-semibold">Đang chờ bác sĩ thực hiện tiêm chủng...</span>
          </div>
        )}
        {(isCompletedStatus || vaccinationConfirmed) && (
          <div className="mb-8 p-4 bg-emerald-100 text-emerald-800 rounded-lg flex items-center justify-center">
            <CheckCircleIcon className="w-6 h-6 mr-2" />
            <span className="font-semibold">
              Đã tiêm xong! Bệnh nhân đã hoàn thành quá trình tiêm chủng.
            </span>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border-l-4 border-indigo-600">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Thông tin cuộc hẹn</h3>
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
                  {appointment.appointmentDate
                    ? new Date(appointment.appointmentDate).toLocaleDateString("vi-VN")
                    : "-"}
                </span>
              </div>
            </div>
            <div className="space-y-3">
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
          <div className="bg-white rounded-xl shadow-md p-6 mb-8 border-l-4 border-yellow-400">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center">
              <svg
                className="w-6 h-6 mr-2 text-yellow-500"
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
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-gray-800 whitespace-pre-wrap">
                {appointment.note || "Không có ghi chú sau tiêm."}
              </p>
            </div>
          </div>
        )}

        {!isCompletedStatus && !vaccinationConfirmed && !isCancelledStatus && isPaidStatus && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8 border-l-4 border-teal-500">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Chi tiết tiêm chủng</h3>
            {vaccineStatusMessage && (
              <div className="mb-4 p-4 bg-yellow-100 text-yellow-700 rounded-lg">
                {vaccineStatusMessage}
              </div>
            )}
            <div className="space-y-6">
              <div>
                <label className="block text-gray-600 mb-2">Vắc xin:</label>
                {facilityVaccines.length > 0 ? (
                  <div className="flex flex-wrap gap-4">
                    {facilityVaccines.map(fv => (
                      <Tooltip
                        key={fv.facilityVaccineId}
                        title={(vaccineQuantities.get(fv.facilityVaccineId) ?? 1) === 0 ? "Vắc xin này đã được tiêm hết" : ""}
                      >
                        <button
                          type="button"
                          onClick={() => handleVaccineSelect(fv.facilityVaccineId)}
                          disabled={submitting || (vaccineQuantities.get(fv.facilityVaccineId) ?? 1) === 0}
                          className={`px-4 py-2 border rounded-lg transition-colors ${
                            facilityVaccineId === fv.facilityVaccineId
                              ? "bg-teal-600 text-white border-teal-600"
                              : (vaccineQuantities.get(fv.facilityVaccineId) ?? 1) === 0
                              ? "bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed"
                              : "bg-white text-gray-800 border-gray-300 hover:bg-teal-100 hover:border-teal-500"
                          }`}
                        >
                          {fv.vaccine?.name ? `${fv.vaccine.name}` : `ID: ${fv.facilityVaccineId}`}
                        </button>
                      </Tooltip>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">Không có vắc xin nào được liên kết với lịch hẹn.</p>
                )}
                {selectedFacilityVaccine && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p><strong>Mô tả:</strong> {selectedFacilityVaccine.vaccine?.description || "Không có"}</p>
                    <p><strong>Nhà sản xuất:</strong> {selectedFacilityVaccine.vaccine?.manufacturer || "Không có"}</p>
                    <p><strong>Loại:</strong> {selectedFacilityVaccine.vaccine?.category || "Không có"}</p>
                    <p><strong>Nhóm tuổi:</strong> {selectedFacilityVaccine.vaccine?.ageGroup || "Không có"}</p>
                    <p><strong>Tác dụng phụ:</strong> {selectedFacilityVaccine.vaccine?.sideEffects || "Không có"}</p>
                    <p><strong>Chống chỉ định:</strong> {selectedFacilityVaccine.vaccine?.contraindications || "Không có"}</p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-gray-600 mb-2">Mũi số:</label>
                <input
                  type="number"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  value={doseNum}
                  onChange={handleDoseNumChange}
                  min="1"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-gray-600 mb-2">Ngày dự kiến liều tiếp theo:</label>
                <DatePicker
                  className="w-full"
                  value={expectedDateForNextDose ? dayjs(expectedDateForNextDose) : null}
                  onChange={(date) => setExpectedDateForNextDose(date ? date.format("YYYY-MM-DD") : "")}
                  format="DD/MM/YYYY"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-gray-600 mb-2">
                  Ghi chú sau tiêm: <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
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

        <div className="flex justify-end space-x-4 mt-8 items-center">
          <AntButton
            type="default"
            onClick={handleBackByPosition}
            disabled={submitting}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-full transition-colors"
          >
            Trở lại
          </AntButton>
          {!isCompletedStatus && !vaccinationConfirmed && !isCancelledStatus && isPaidStatus && (
            <AntButton
              type="primary"
              onClick={handleConfirmVaccination}
              loading={submitting}
              disabled={submitting || !hasAvailableVaccines || !facilityVaccineId || !expectedDateForNextDose || doseNum < 1}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-full transition-colors"
            >
              {submitting ? "Đang xử lý..." : "Xác nhận tiêm chủng"}
            </AntButton>
          )}
          {(isCompletedStatus || vaccinationConfirmed || isCancelledStatus || (!isPaidStatus && !isCompletedStatus && !isCancelledStatus)) && (
            <AntButton
              type="primary"
              onClick={handleComplete}
              disabled={submitting}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-full transition-colors"
            >
              Hoàn thành
            </AntButton>
          )}
          {submitMessage && !vaccinationConfirmed && (
            <span
              className={`ml-4 font-medium ${
                submitMessage.includes("thành công") || submitMessage.includes("hoàn thành") ? "text-emerald-600" : "text-rose-500"
              }`}
            >
              {submitMessage}
            </span>
          )}
        </div>

        <Modal
          title="Hủy lịch hẹn"
          open={isCancelModalVisible}
          onOk={handleCancelAppointment}
          onCancel={() => {
            setIsCancelModalVisible(false);
            setCancelReason("");
          }}
          okText="Xác nhận hủy"
          cancelText="Đóng"
          okButtonProps={{ disabled: submitting || !cancelReason.trim(), className: "bg-rose-500 hover:bg-rose-600" }}
          cancelButtonProps={{ disabled: submitting }}
        >
          <div className="mb-4">
            <label className="block text-gray-600 mb-2">Lý do hủy lịch hẹn:</label>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
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