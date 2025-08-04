import React, { useState, useCallback, useEffect } from "react";
import VaccinationSteps from "@/Components/VaccinationStep";
import { Button } from "@/Components/ui/button";
import type { Appointment } from "@/api/appointmentAPI";
import { childprofileApi, type VaccineProfile } from "@/api/childInfomationAPI";
import { vaccineApi, type FacilityVaccine } from "@/api/vaccineApi";
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
  const [vaccinePackages, setVaccinePackages] = useState<VaccinePackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState<boolean>(false);
  const [errorPackages, setErrorPackages] = useState<string>("");
  const [vaccineProfiles, setVaccineProfiles] = useState<VaccineProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [errorProfiles, setErrorProfiles] = useState<string>("");
  const [vaccineMap, setVaccineMap] = useState<Record<number, string>>({});
  const [diseaseMap, setDiseaseMap] = useState<Record<number, string>>({});

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
    if (!child?.childId) return;
    setLoadingProfiles(true);
    setErrorProfiles("");
    childprofileApi
      .getChildVaccineProfile(child.childId)
      .then(setVaccineProfiles)
      .catch(() => setErrorProfiles("Không thể tải lịch sử tiêm chủng."))
      .finally(() => setLoadingProfiles(false));
  }, [child?.childId]);

  // Fetch vaccine packages
  useEffect(() => {
    const fetchVaccinePackages = async () => {
      const facilityId = appointment.facilityVaccines[0]?.facilityId || 5;
      setLoadingPackages(true);
      setErrorPackages("");
      try {
        const response = await vaccinePackageApi.getAll(facilityId);
        setVaccinePackages(response.data || []);
      } catch {
        setErrorPackages("Không thể tải danh sách gói vắc xin.");
      } finally {
        setLoadingPackages(false);
      }
    };
    fetchVaccinePackages();
  }, [appointment.facilityVaccines]);

  // Function to calculate age
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

  const vaccineNames = Array.isArray(appointment.facilityVaccines)
    ? appointment.facilityVaccines.map((fv: FacilityVaccine) => fv.vaccine.name)
    : [];

  // Find package data based on order.packageId
  const packageData = vaccinePackages.find(pkg => pkg.packageId === appointment.order?.packageId);
  const packageName = packageData?.name;
  const packageVaccineNames = packageData?.packageVaccines
    ? packageData.packageVaccines.map(pv => pv.facilityVaccine.vaccine.name)
    : [];

  const vaccineDisplayParts: string[] = [];
  if (vaccineNames.length > 0) {
    vaccineDisplayParts.push(vaccineNames.join(", "));
  }
  if (packageName) {
    const packageDisplay = packageVaccineNames.length > 0
      ? `${packageName} (${packageVaccineNames.join(", ")})`
      : packageName;
    vaccineDisplayParts.push(packageDisplay);
  }
  const vaccineDisplay = vaccineDisplayParts.length > 0
    ? vaccineDisplayParts.join(", ")
    : "Không có vắc xin";

  // Calculate total doses
  const totalDoses = vaccineProfiles.length;

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
          <VaccinationSteps currentStep={0} />
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border-l-4 border-indigo-600">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
            Thông tin cuộc hẹn
          </h3>
          {loadingPackages ? (
            <div className="flex justify-center items-center py-4 bg-gray-50 rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-indigo-600 mr-2"></div>
              <span className="text-gray-600">Đang tải gói vắc xin...</span>
            </div>
          ) : errorPackages ? (
            <div className="bg-rose-50 text-rose-600 p-4 rounded-lg text-center">{errorPackages}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="font-medium text-gray-600 w-32">Tên bé:</span>
                  <span className="text-gray-800 font-medium">
                    {child.fullName} ({calculateAge(child.birthDate)})
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-600 w-32">Giới tính:</span>
                  <span className="text-gray-800">{child.gender.trim()}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-600 w-32">Tên phụ huynh:</span>
                  <span className="text-gray-800">{appointment.memberName}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-600 w-32">Số liên lạc:</span>
                  <span className="text-gray-800">{appointment.memberPhone}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-600 w-32">Email:</span>
                  <span className="text-gray-800">{appointment.memberEmail.trim()}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="font-medium text-gray-600 w-32">Nhóm máu:</span>
                  <span className="text-gray-800">{child.bloodType || "Không có"}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-600 w-32">Tiền sử dị ứng:</span>
                  <span className="text-gray-800">{child.allergiesNotes || "Không có"}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-600 w-32">Tiền sử bệnh lý:</span>
                  <span className="text-gray-800">{child.medicalHistory || "Không có"}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-600 w-32">Thời gian tiêm:</span>
                  <span className="text-gray-800">{appointment.appointmentTime}</span>
                </div>
              </div>
            </div>
          )}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center">
              <span className="font-medium text-gray-600 w-32">Vắc xin:</span>
              <span className="text-gray-800">{vaccineDisplay}</span>
            </div>
            <div className="flex items-center mt-2">
              <span className="font-medium text-gray-600 w-32">Ghi chú:</span>
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
                <h3 className="text-lg font-semibold text-gray-800 mb-0">
                  Lịch sử tiêm chủng
                </h3>
              </div>
            }
            key="1"
            className="p-6"
          >
            {loadingProfiles ? (
              <div className="flex flex-col items-center py-4 bg-gray-50 rounded-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-indigo-600 mr-2"></div>
                <span className="text-gray-600">Đang tải lịch sử tiêm chủng...</span>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-indigo-600 h-2 rounded-full animate-pulse" style={{ width: '50%' }}></div>
                </div>
              </div>
            ) : errorProfiles ? (
              <div className="bg-rose-50 text-rose-600 p-4 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M12 17h.01M12 3C7.029 3 3 7.029 3 12s4.029 9 9 9 9-4.029 9-9-4.029-9-9-9z"></path>
                </svg>
                {errorProfiles}
              </div>
            ) : vaccineProfiles.length === 0 ? (
              <div className="bg-gray-50 text-gray-600 p-4 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M12 3C7.029 3 3 7.029 3 12s4.029 9 9 9 9-4.029 9-9-4.029-9-9-9z"></path>
                </svg>
                Không có lịch sử tiêm chủng.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-teal-50 rounded-lg p-4 flex items-center justify-between">
                  <span className="text-teal-700 font-semibold">Tổng cộng: {totalDoses} liều</span>
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

        <div className="flex justify-end space-x-4 mt-8">
          <Button
            type="button"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-full transition-colors"
            onClick={handleBackByPosition}
          >
            Trở lại
          </Button>
          {user?.position === "Doctor" ? (
            <Button
              type="button"
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-full transition-colors"
              onClick={handleContinueDoctor}
            >
              Tiếp tục
            </Button>
          ) : (
            <Button
              type="button"
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-full transition-colors"
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
  const [numberOfDose, setNumberOfDose] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    getVaccineName(vp.vaccineId).then((name) => {
      if (mounted) setVaccineName(name);
    });
    getDiseaseName(vp.diseaseId).then((name) => {
      if (mounted) setDiseaseName(name);
    });
    vaccineApi
      .getById(vp.vaccineId)
      .then((v) => {
        if (mounted) setNumberOfDose(v.numberOfDoses ?? null);
      })
      .catch(() => {
        if (mounted) setNumberOfDose(null);
      });
    return () => {
      mounted = false;
    };
  }, [vp.vaccineId, vp.diseaseId, getVaccineName, getDiseaseName]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 3.996a11.955 11.955 0 01-8.618 3.986A12.02 12.02 0 003 12c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
            <span className="font-medium text-gray-600">Bệnh:</span>
            <span className="ml-2 text-gray-800">{diseaseName}</span>
          </div>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
            </svg>
            <span className="font-medium text-gray-600">Vắc xin:</span>
            <span className="ml-2 text-gray-800 font-semibold">{vaccineName}</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
            <span className="font-medium text-gray-600">Liều:</span>
            <span className="ml-2 text-gray-800">
              {vp.doseNum}
              {numberOfDose !== null ? `/${numberOfDose}` : ""}
            </span>
          </div>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <span className="font-medium text-gray-600">Ngày tiêm:</span>
            <span className="ml-2 text-gray-800">{vp.actualDate?.slice(0, 10) || "-"}</span>
          </div>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
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