import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import VaccinationSteps from "@/Components/VaccinationStep";
import { Button as AntButton, message } from "antd";
import { appointmentApi, type Appointment } from "@/api/appointmentAPI";
import { vaccinePackageApi, type VaccinePackage } from "@/api/vaccinePackageApi";
import { getUserInfo } from "@/lib/storage";
import { Button } from "@/Components/ui/button";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

export default function ConfirmVaccination() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [vaccinePackage, setVaccinePackage] = useState<VaccinePackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPackage, setLoadingPackage] = useState(true);
  const [error, setError] = useState("");
  const [errorPackage, setErrorPackage] = useState("");
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

  // Fetch vaccine package if order exists
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

  // Function to calculate age
  const calculateAge = (birthDate: string): string => {
    if (!birthDate) return "Không có";
    const birth = new Date(birthDate);
    const today = new Date();
    if (isNaN(birth.getTime())) return "Không có";

    const diffMs = today.getTime() - birth.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30.436875); // Average month length
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
    const basePath = user?.role === "Doctor" ? "/doctor" : "/staff";
    navigate(`${basePath}/appointments/${id}/step-3`);
  };

  if (loading || loadingPackage) return (
    <div className="p-6 bg-gray-50 rounded-lg max-w-4xl mx-auto flex justify-center items-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-indigo-600 mr-2"></div>
      <span className="text-gray-600">Đang tải thông tin...</span>
    </div>
  );
  if (error || errorPackage) return (
    <div className="p-6 bg-rose-50 text-rose-600 rounded-lg max-w-4xl mx-auto text-center">
      {error || errorPackage}
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

  // Vaccine display logic
  const vaccineNames = Array.isArray(appointment.facilityVaccines)
    ? appointment.facilityVaccines.map(fv => fv.vaccine.name)
    : [];
  const packageName = vaccinePackage?.name;
  const packageVaccineNames = vaccinePackage?.packageVaccines
    ? vaccinePackage.packageVaccines.map(pv => pv.facilityVaccine.vaccine.name)
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

        {/* Notifications */}
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

        {/* Patient Information Card */}
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

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 mt-8 items-center">
          <AntButton
            type="default"
            onClick={handleBack}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-full transition-colors"
          >
            Trở lại
          </AntButton>
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