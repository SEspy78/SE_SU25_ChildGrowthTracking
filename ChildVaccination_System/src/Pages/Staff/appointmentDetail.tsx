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
import { Collapse, Button as AntButton } from "antd";
import { CaretRightOutlined } from "@ant-design/icons";

const AppointmentDetail: React.FC<{ appointment: Appointment; onClose?: () => void }> = ({
  appointment,
}) => {
  const user = getUserInfo();
  const navigate = useNavigate();
  const child = appointment.child;
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [vaccinePackages, setVaccinePackages] = useState<VaccinePackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState<boolean>(false);
  const [errorPackages, setErrorPackages] = useState<string>("");

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

  const [vaccineProfiles, setVaccineProfiles] = useState<VaccineProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [errorProfiles, setErrorProfiles] = useState<string>("");
  const [vaccineMap, setVaccineMap] = useState<Record<number, string>>({});
  const [diseaseMap, setDiseaseMap] = useState<Record<number, string>>({});

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
      // Assuming facilityId = 5 based on JSON data; replace with actual facilityId if available
      const facilityId = appointment.facilityVaccines[0]?.facilityId || 5;
      setLoadingPackages(true);
      setErrorPackages("");
      try {
        const response = await vaccinePackageApi.getAll(facilityId);
        setVaccinePackages(response.data || []);
      } catch {
        setErrorPackages("Không thể tải danh sách gói vaccine.");
      } finally {
        setLoadingPackages(false);
      }
    };
    fetchVaccinePackages();
  }, [appointment.facilityVaccines]);

  // Function to calculate age
  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
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

  // Extract vaccine names from facilityVaccines
  const vaccineNames = Array.isArray(appointment.facilityVaccines)
    ? appointment.facilityVaccines.map((fv: FacilityVaccine) => fv.vaccine.name)
    : [];

  // Find package data based on order.packageId
  const packageData = vaccinePackages.find(pkg => pkg.packageId === appointment.order?.packageId);
  const packageName = packageData?.name;
  const packageVaccineNames = packageData?.packageVaccines
    ? packageData.packageVaccines.map(pv => pv.facilityVaccine.vaccine.name)
    : [];

  // Combine individual vaccines and package details
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
    : "Không có vaccine";

  return (
    <div>
      <div className="mt-8 p-6 bg-white shadow rounded-xl">
        <Button
          type="button"
          className="bg-gray-300 hover:bg-blue-400 text-black px-6 py-2 rounded-full transition-colors"
          onClick={handleBackByPosition}
        >
          Quay lại
        </Button>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl justify-center font-bold text-gray-800 mb-6">
            Vaccination Process
          </h2>

          <div className="mb-8">
            <VaccinationSteps currentStep={0} />
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
              Appointment Details
            </h3>
            {loadingPackages ? (
              <div className="text-gray-600 text-center py-4">Đang tải gói vaccine...</div>
            ) : errorPackages ? (
              <div className="text-red-600 text-center py-4">{errorPackages}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-600 w-32">Tên bé:</span>
                    <span className="text-gray-800">
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
                    <span className="font-medium text-gray-600 w-32">Nhóm Máu:</span>
                    <span className="text-gray-800">{child.bloodType || "N/A"}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium text-gray-600 w-32">Tiền sử dị ứng:</span>
                    <span className="text-gray-800">{child.allergiesNotes || "Không có"}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium text-gray-600 w-32">Tiền sử bệnh lí:</span>
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
                <span className="font-medium text-gray-600 w-32">Vaccines:</span>
                <span className="text-gray-800">{vaccineDisplay}</span>
              </div>
              <div className="flex items-center mt-2">
                <span className="font-medium text-gray-600 w-32">Ghi chú:</span>
                <span className="text-gray-800">{appointment.note || "Không có"}</span>
              </div>
            </div>
          </div>

          <AntButton
            type="primary"
            icon={<CaretRightOutlined />}
            onClick={() => setIsHistoryVisible(!isHistoryVisible)}
            className="mb-4"
          >
            {isHistoryVisible ? "Ẩn" : "Lịch sử tiêm chủng"}
          </AntButton>

          <Collapse activeKey={isHistoryVisible ? ["1"] : []} className="mb-8">
            <Collapse.Panel header="" key="1">
              <h3 className="text-lg font-semibold text-blue-700 mb-4 border-b pb-2">
                Vaccination History
              </h3>
              {loadingProfiles ? (
                <div className="text-gray-600 text-center py-4">Loading...</div>
              ) : errorProfiles ? (
                <div className="text-red-600 text-center py-4">{errorProfiles}</div>
              ) : vaccineProfiles.length === 0 ? (
                <div className="text-gray-600 text-center py-4">
                  No vaccination history available.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full table-auto border border-gray-200 text-sm">
                    <thead className="bg-blue-50 text-blue-800">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Bệnh</th>
                        <th className="px-4 py-3 text-left font-semibold">Vaccine</th>
                        <th className="px-4 py-3 text-left font-semibold">Liều</th>
                        <th className="px-4 py-3 text-left font-semibold">Ngày tiêm</th>
                        <th className="px-4 py-3 text-left font-semibold">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vaccineProfiles.map((vp) => (
                        <VaccineProfileRow
                          key={vp.vaccineProfileId}
                          vp={vp}
                          getVaccineName={getVaccineName}
                          getDiseaseName={getDiseaseName}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Collapse.Panel>
          </Collapse>

          <div className="flex justify-end space-x-4 mt-8">
            <Button
              type="button"
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-full transition-colors"
              onClick={handleBackByPosition}
            >
              Trở lại
            </Button>
            {user?.position === "Doctor" ? (
              <Button
                type="button"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full transition-colors"
                onClick={handleContinueDoctor}
              >
                Tiếp tục
              </Button>
            ) : (
              <Button
                type="button"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full transition-colors"
                onClick={handleConfirmByRole}
              >
                Tiếp tục
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface VaccineProfileRowProps {
  vp: VaccineProfile;
  getVaccineName: (id: number) => Promise<string>;
  getDiseaseName: (id: number) => Promise<string>;
}

const VaccineProfileRow: React.FC<VaccineProfileRowProps> = ({ vp, getVaccineName, getDiseaseName }) => {
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
    <tr className="border-t hover:bg-gray-50">
      <td className="px-4 py-3">{diseaseName}</td>
      <td className="px-4 py-3">{vaccineName}</td>
      <td className="px-4 py-3">
        {vp.doseNum}
        {numberOfDose !== null ? `/${numberOfDose}` : ""}
      </td>
      <td className="px-4 py-3">{vp.actualDate?.slice(0, 10) || "-"}</td>
      <td className="px-4 py-3">{vp.note || "Không"}</td>
    </tr>
  );
};

export default AppointmentDetail;