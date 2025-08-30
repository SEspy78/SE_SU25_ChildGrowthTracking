import React, { useState, useCallback, useEffect } from "react";
import VaccinationSteps from "@/Components/VaccinationStep";
import { Button } from "@/Components/ui/button";
import { appointmentApi, type Appointment } from "@/api/appointmentAPI";
import { childprofileApi, type VaccineProfile } from "@/api/childInfomationAPI";
import { vaccineApi } from "@/api/vaccineApi";
import { vaccinePackageApi, type VaccinePackage } from "@/api/vaccinePackageApi";
import { diseaseApi } from "@/api/diseaseApi";
import { useNavigate } from "react-router-dom";
import { getUserInfo } from "@/lib/storage";
import { Collapse } from "antd";
import { CaretRightOutlined } from "@ant-design/icons";

const AppointmentDetail: React.FC<{ appointment: Appointment }> = ({ appointment }) => {
  const user = getUserInfo();
  const navigate = useNavigate();
  const child = appointment.child;
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [vaccinePackage, setVaccinePackage] = useState<VaccinePackage | null>(null);
  const [loadingPackage, setLoadingPackage] = useState<boolean>(false);
  const [errorPackage, setErrorPackage] = useState<string>("");
  const [vaccineProfiles, setVaccineProfiles] = useState<VaccineProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [errorProfiles, setErrorProfiles] = useState<string>("");
  const [vaccineMap, setVaccineMap] = useState<Record<number, string>>({});
  const [diseaseMap, setDiseaseMap] = useState<Record<number, string>>({});
  const [appointmentData, setAppointmentData] = useState<Appointment | null>(null);

  const handleConfirmByRole = () => {
    navigate(`/staff/appointments/${appointment.appointmentId}/step-2`);
  };

  const handleContinueDoctor = () => {
    navigate(`/doctor/appointments/${appointment.appointmentId}/step-2`);
  };

  const handleBackByPosition = () => {
    if (user?.position === "Doctor") {
      navigate("/doctor/appointments");
    } else {
      navigate("/staff/appointments");
    }
  };

  const getVaccineName = useCallback(async (id: number) => {
    if (vaccineMap[id]) return vaccineMap[id];
    try {
      const v = await vaccineApi.getById(id);
      setVaccineMap((prev) => ({ ...prev, [id]: v.name }));
      return v.name;
    } catch {
      setVaccineMap((prev) => ({ ...prev, [id]: `ID: ${id}` }));
      return `ID: ${id}`;
    }
  }, [vaccineMap]);

  const getDiseaseName = useCallback(async (id: number) => {
    if (diseaseMap[id]) return diseaseMap[id];
    try {
      const d = await diseaseApi.getById(id);
      setDiseaseMap((prev) => ({ ...prev, [id]: d.name }));
      return d.name;
    } catch {
      setDiseaseMap((prev) => ({ ...prev, [id]: `Bệnh ID: ${id}` }));
      return `Bệnh ID: ${id}`;
    }
  }, [diseaseMap]);

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const response = await appointmentApi.getAppointmentById(appointment.appointmentId);
        setAppointmentData(response);
      } catch {
        setErrorPackage("Không thể tải thông tin lịch hẹn.");
      }
    };
    fetchAppointment();
  }, [appointment.appointmentId]);

  useEffect(() => {
    if (appointmentData?.order?.packageId) {
      const fetchVaccinePackage = async () => {
        setLoadingPackage(true);
        setErrorPackage("");
        try {
          const response = await vaccinePackageApi.getById(appointmentData.order!.packageId);
          setVaccinePackage(response);
        } catch {
          setErrorPackage("Không thể tải thông tin gói vắc xin.");
        } finally {
          setLoadingPackage(false);
        }
      };
      fetchVaccinePackage();
    }
  }, [appointmentData?.order]);

  useEffect(() => {
    if (!child?.childId) return;
    setLoadingProfiles(true);
    setErrorProfiles("");
    childprofileApi
      .getChildVaccineProfile(child.childId)
      .then((profiles) => {
        console.log("Raw vaccine profiles:", profiles);
        const filteredProfiles = profiles.filter((vp) => vp.status === "Completed");
        console.log("Filtered vaccine profiles (Completed only):", filteredProfiles);
        setVaccineProfiles(filteredProfiles);
      })
      .catch(() => setErrorProfiles("Không thể tải lịch sử tiêm chủng."))
      .finally(() => setLoadingProfiles(false));
  }, [child?.childId]);

  const calculateAge = (birthDate: string) => {
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

  const vaccinesToInjectDisplay = appointmentData?.vaccinesToInject?.length
    ? appointmentData.vaccinesToInject
        .map((v) => `${v.vaccineName} (Liều ${v.doseNumber})`)
        .join(", ")
    : "Không có vắc xin cần tiêm";

  const totalDoses = vaccineProfiles.length;

  return (
    <div className="min-h-screen bg-gray-100 p-6 md:p-8">
      <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-2xl p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Chi tiết lịch hẹn</h2>
          <Button
            type="button"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-full transition duration-300"
            onClick={handleBackByPosition}
          >
            Quay lại
          </Button>
        </div>

        <div className="mb-10">
          <VaccinationSteps currentStep={0} />
        </div>

        {appointmentData?.status === "Cancelled" && (
          <div className="mb-8 p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold text-lg">Lịch tiêm đã bị hủy</span>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border-l-4 border-indigo-600">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
            Thông tin cuộc hẹn
          </h3>
          {loadingPackage ? (
            <div className="flex items-center justify-center py-6 bg-gray-50 rounded-lg">
              <svg className="animate-spin h-8 w-8 text-indigo-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-gray-600 text-lg">Đang tải thông tin...</span>
            </div>
          ) : errorPackage ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 17h.01M12 3C7.029 3 3 7.029 3 12s4.029 9 9 9 9-4.029 9-9-4.029-9-9-9z"></path>
              </svg>
              {errorPackage}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center">
                  <span className="font-medium text-gray-600 w-36">Tên bé:</span>
                  <span className="text-gray-800 font-semibold">{child.fullName} ({calculateAge(child.birthDate)})</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-600 w-36">Giới tính:</span>
                  <span className="text-gray-800">{child.gender.trim()}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-600 w-36">Tên phụ huynh:</span>
                  <span className="text-gray-800">{appointment.memberName}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-600 w-36">Số liên lạc:</span>
                  <span className="text-gray-800">{appointment.memberPhone}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-600 w-36">Email:</span>
                  <span className="text-gray-800">{appointment.memberEmail.trim()}</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center">
                  <span className="font-medium text-gray-600 w-36">Nhóm máu:</span>
                  <span className="text-gray-800">{child.bloodType || "Không có"}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-600 w-36">Tiền sử dị ứng:</span>
                  <span className="text-gray-800">{child.allergiesNotes || "Không có"}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-600 w-36">Tiền sử bệnh lý:</span>
                  <span className="text-gray-800">{child.medicalHistory || "Không có"}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-600 w-36">Thời gian tiêm:</span>
                  <span className="text-gray-800">{appointment.appointmentTime}</span>
                </div>
                {appointmentData?.order && (
                  <div className="flex items-center">
                    <span className="font-medium text-gray-600 w-36">Gói vắc xin:</span>
                    <span className="text-gray-800 font-semibold">{vaccinePackage?.name || "Đang tải..."}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center mt-3">
              <span className="font-medium text-gray-600 w-36">Vắc xin cần tiêm:</span>
              <span className="text-gray-800">{vaccinesToInjectDisplay}</span>
            </div>
            <div className="flex items-center mt-3">
              <span className="font-medium text-gray-600 w-36">Ghi chú:</span>
              <span className="text-gray-800">{appointment.note || "Không có"}</span>
            </div>
          </div>
        </div>

        <Collapse
          activeKey={isHistoryVisible ? ["1"] : []}
          className="mb-8 bg-white rounded-xl shadow-md border-l-4 border-teal-500"
          expandIcon={({ isActive }) => (
            <CaretRightOutlined rotate={isActive ? 90 : 0} className="text-teal-600 text-lg" />
          )}
          onChange={() => setIsHistoryVisible(!isHistoryVisible)}
        >
          <Collapse.Panel
            header={
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800 mb-0">
                  Lịch sử tiêm chủng
                </h3>
              </div>
            }
            key="1"
            className="p-6"
          >
            {loadingProfiles ? (
              <div className="flex flex-col items-center py-6 bg-gray-50 rounded-lg">
                <svg className="animate-spin h-8 w-8 text-indigo-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-gray-600 text-lg">Đang tải thông tin...</span>
                <div className="w-full max-w-xs bg-gray-200 rounded-full h-2 mt-3">
                  <div className="bg-indigo-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
            ) : errorProfiles ? (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 17h.01M12 3C7.029 3 3 7.029 3 12s4.029 9 9 9 9-4.029 9-9-4.029-9-9-9z"></path>
                </svg>
                {errorProfiles}
              </div>
            ) : vaccineProfiles.length === 0 ? (
              <div className="bg-gray-50 text-gray-600 p-4 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 3C7.029 3 3 7.029 3 12s4.029 9 9 9 9-4.029 9-9-4.029-9-9-9z"></path>
                </svg>
                Không có lịch sử tiêm chủng.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-teal-50 rounded-lg p-4 flex items-center justify-between">
                  <span className="text-teal-700 font-semibold text-lg">Tổng cộng: {totalDoses} liều</span>
                  <span className="text-sm text-gray-500">Cập nhật đến {new Date().toLocaleDateString("vi-VN")}</span>
                </div>
                {vaccineProfiles.map((vp) => (
                  <VaccineProfileCard
                    key={vp.vaccineProfileId}
                    vp={vp}
                    getVaccineName={getVaccineName}
                    getDiseaseName={getDiseaseName}
                  />
                ))}
              </div>
            )}
          </Collapse.Panel>
        </Collapse>

        <div className="flex justify-end mt-5 space-x-4">
          <Button
            type="button"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-full transition duration-300"
            onClick={handleBackByPosition}
          >
            Trở lại
          </Button>
          {user?.position === "Doctor" ? (
            <Button
              type="button"
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-full transition duration-300"
              onClick={handleContinueDoctor}
            >
              Tiếp tục
            </Button>
          ) : (
            <Button
              type="button"
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-full transition duration-300"
              onClick={handleConfirmByRole}
            >
              Tiếp tục
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

interface VaccineProfileCardProps {
  vp: VaccineProfile;
  getVaccineName: (id: number) => Promise<string>;
  getDiseaseName: (id: number) => Promise<string>;
}

const VaccineProfileCard: React.FC<VaccineProfileCardProps> = ({ vp, getVaccineName, getDiseaseName }) => {
  const [vaccineName, setVaccineName] = useState<string>(`ID: ${vp.vaccineId}`);
  const [diseaseName, setDiseaseName] = useState<string>(`Bệnh ID: ${vp.diseaseId}`);

  useEffect(() => {
    let mounted = true;
    getVaccineName(vp.vaccineId).then((name) => {
      if (mounted) setVaccineName(name);
    });
    getDiseaseName(vp.diseaseId).then((name) => {
      if (mounted) setDiseaseName(name);
    });
    return () => {
      mounted = false;
    };
  }, [vp.vaccineId, vp.diseaseId, getVaccineName, getDiseaseName]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 3.996a11.955 11.955 0 01-8.618 3.986A12.02 12.02 0 003 12c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
            <span className="font-medium text-gray-600">Bệnh:</span>
            <span className="ml-2 text-gray-800 font-semibold">{diseaseName}</span>
          </div>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
            </svg>
            <span className="font-medium text-gray-600">Vắc xin:</span>
            <span className="ml-2 text-gray-800 font-semibold">{vaccineName}</span>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2"></path>
            </svg>
            <span className="font-medium text-gray-600">Liều:</span>
            <span className="ml-2 text-gray-800">{vp.doseNum}</span>
          </div>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <span className="font-medium text-gray-600">Ngày tiêm:</span>
            <span className="ml-2 text-gray-800">{vp.actualDate?.slice(0, 10) || "-"}</span>
          </div>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
            <span className="font-medium text-gray-600">Ghi chú:</span>
            <span className="ml-2 text-gray-800">{vp.note || "Không"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetail;