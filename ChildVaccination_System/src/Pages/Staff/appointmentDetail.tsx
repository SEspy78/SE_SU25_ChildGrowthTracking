import React from "react"
import VaccinationSteps from "@/Components/VaccinationStep"
import { Button } from "@/Components/ui/button"
import type { Appointment } from "@/api/appointmentAPI"
import { childprofileApi, type VaccineProfile } from "@/api/childInfomationAPI"
import { vaccineApi } from "@/api/vaccineApi"
import { diseaseApi } from "@/api/diseaseApi"
import { useNavigate } from "react-router-dom"
 import { getUserInfo } from "@/lib/storage";

const AppointmentDetail: React.FC<{ appointment: Appointment; onClose?: () => void }> = ({ appointment }) => {
  const user = getUserInfo();
  const handleConfirmByRole = () => {
    navigate(`/staff/appointments/${appointment.appointmentId}/step-2`);
  };
  const handleContinueDoctor = () => {
    navigate(`/doctor/appointments/${appointment.appointmentId}/step-2`);
  };

  const handleBackByRole = () => {
    const user = getUserInfo();
    if (user?.role === "Doctor") {
      navigate("/doctor/appointments");
    } else {
      navigate("/staff/appointments");
    }
  };
  const [vaccineProfiles, setVaccineProfiles] = React.useState<VaccineProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = React.useState(false);
  const [errorProfiles, setErrorProfiles] = React.useState<string>("");

  const [vaccineMap, setVaccineMap] = React.useState<Record<number, string>>({});
  const [diseaseMap, setDiseaseMap] = React.useState<Record<number, string>>({});

 

  // Hàm lấy tên vaccine/disease theo id
  const getVaccineName = React.useCallback(async (id: number) => {
    if (vaccineMap[id]) return vaccineMap[id];
    try {
      const v = await vaccineApi.getById(id);
      setVaccineMap(prev => ({ ...prev, [id]: v.name }));
      return v.name;
    } catch {
      setVaccineMap(prev => ({ ...prev, [id]: `ID: ${id}` }));
      return `ID: ${id}`;
    }
  }, [vaccineMap]);

  const getDiseaseName = React.useCallback(async (id: number) => {
    if (diseaseMap[id]) return diseaseMap[id];
    try {
      const d = await diseaseApi.getById(id);
      setDiseaseMap(prev => ({ ...prev, [id]: d.name }));
      return d.name;
    } catch {
      setDiseaseMap(prev => ({ ...prev, [id]: `Bệnh ID: ${id}` }));
      return `Bệnh ID: ${id}`;
    }
  }, [diseaseMap]);
  const navigate = useNavigate()
  const child = appointment.child

  // Calculate age: nếu nhỏ hơn 1 tuổi thì hiển thị theo tháng
  const birthDate = new Date(child.birthDate);
  const today = new Date();
  // Tính số ngày tuổi
  const diffMs = today.getTime() - birthDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  let ageYear = today.getFullYear() - birthDate.getFullYear();
  let ageMonth = today.getMonth() - birthDate.getMonth();
  if (today.getDate() < birthDate.getDate()) {
    ageMonth--;
  }
  if (ageMonth < 0) {
    ageYear--;
    ageMonth += 12;
  }
  let ageDisplay = "";
  if (ageYear < 1) {
    // Nếu nhỏ hơn 1 tháng thì hiển thị theo tuần
    const totalMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
    if (totalMonths < 1) {
      const weeks = Math.floor(diffDays / 7);
      ageDisplay = weeks > 0 ? `${weeks} tuần` : `${diffDays} ngày`;
    } else {
      ageDisplay = `${totalMonths} tháng`;
    }
  } else {
    ageDisplay = `${ageYear} tuổi`;
  }

  // Format vaccination date
  let date = ""
  if (appointment.appointmentDate) {
    const d = new Date(appointment.appointmentDate)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = String(d.getFullYear()).slice(-2)
    date = `${day}/${month}/${year}`
  }


  React.useEffect(() => {
    if (!child?.childId) return;
    setLoadingProfiles(true);
    setErrorProfiles("");
    childprofileApi.getChildVaccineProfile(child.childId)
      .then(setVaccineProfiles)
      .catch(() => setErrorProfiles("Không thể tải lịch sử tiêm chủng."))
      .finally(() => setLoadingProfiles(false));
  }, [child?.childId]);

  return (
    <div className="mt-8 p-6 bg-white shadow rounded-xl">
      <h2 className="text-xl font-semibold mb-4">Vaccination Process</h2>
      <div className="flex items-center justify-between mb-4">
        <VaccinationSteps currentStep={0} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <p><strong>Child's Name:</strong> {child.fullName}</p>
          <p><strong>Age:</strong> {ageDisplay}</p>
          <p><strong>Gender:</strong> {child.gender}</p>
          <p><strong>Parent’s Name:</strong> {appointment.memberName}</p>
          <p><strong>Contact Number:</strong> {appointment.memberPhone}</p>
          <p><strong>Email:</strong> {appointment.memberEmail}</p>
          <p><strong>Vaccination Date:</strong> {date}</p>
          <p><strong>Appointment Time:</strong> {appointment.appointmentTime}</p>
          <p><strong>Status:</strong> {appointment.status}</p>
          <p><strong>Note:</strong> {appointment.note || "N/A"}</p>
        </div>
        <div>
          <p><strong>Blood Type:</strong> {child.bloodType || "N/A"}</p>
          <p><strong>Allergies:</strong> {child.allergiesNotes || "None"}</p>
          <p><strong>Medical History:</strong> {child.medicalHistory || "None"}</p>
        </div>
      </div>
      <p className="mb-2"><strong>Vaccine:</strong> {appointment.vaccineNames.join(", ") || "N/A"} (Package: {appointment.packageName || "N/A"})</p>
      {/* Lịch sử tiêm chủng của trẻ */}
      <div className="mb-4">
        <h3 className="font-semibold text-blue-700 mb-2">Lịch sử tiêm chủng</h3>
        {loadingProfiles ? (
          <div>Đang tải...</div>
        ) : errorProfiles ? (
          <div className="text-red-600">{errorProfiles}</div>
        ) : vaccineProfiles.length === 0 ? (
          <div>Không có lịch sử tiêm chủng.</div>
        ) : (
          <table className="w-full table-auto border border-gray-200 text-sm text-left">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-2 py-1">Bệnh</th>
                <th className="px-2 py-1">Vaccine</th>
                <th className="px-2 py-1">Liều</th>
                <th className="px-2 py-1">Ngày dự kiến</th>
                <th className="px-2 py-1">Ngày thực tế</th>
                <th className="px-2 py-1">Trạng thái</th>
                <th className="px-2 py-1">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {vaccineProfiles.map((vp) => (
                <VaccineProfileRow key={vp.vaccineProfileId} vp={vp} getVaccineName={getVaccineName} getDiseaseName={getDiseaseName} />
              ))}
            </tbody>
          </table>
        )}

      </div>
      <div className="flex space-x-4 pt-10">
        <Button
          type="button"
          className="bg-gray-300 hover:bg-gray-400 text-black px-6 py-2 rounded-full cursor-pointer"
          onClick={handleBackByRole}
        >
          Quay lại
        </Button>

        {user?.role === "Doctor" ? (
          <Button
            type="button"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full cursor-pointer"
            onClick={handleContinueDoctor}
          >
            Tiếp tục
          </Button>
        ) : (
          <Button
            type="button"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full cursor-pointer"
            onClick={handleConfirmByRole}
          >
            Xác nhận
          </Button>
        )}
      </div>
    </div>
  );
}

// Component cho từng dòng vaccine profile, xử lý lấy tên vaccine/disease qua API
interface VaccineProfileRowProps {
  vp: VaccineProfile;
  getVaccineName: (id: number) => Promise<string>;
  getDiseaseName: (id: number) => Promise<string>;
}

const VaccineProfileRow: React.FC<VaccineProfileRowProps> = ({ vp, getVaccineName, getDiseaseName }) => {
  const [vaccineName, setVaccineName] = React.useState<string>(`ID: ${vp.vaccineId}`);
  const [diseaseName, setDiseaseName] = React.useState<string>(`Bệnh ID: ${vp.diseaseId}`);
  const [numberOfDose, setNumberOfDose] = React.useState<number | null>(null);

  React.useEffect(() => {
    let mounted = true;
    getVaccineName(vp.vaccineId).then(name => { if (mounted) setVaccineName(name); });
    getDiseaseName(vp.diseaseId).then(name => { if (mounted) setDiseaseName(name); });
    // Lấy số liều của vaccine
    vaccineApi.getById(vp.vaccineId).then(v => {
      if (mounted) setNumberOfDose(v.numberOfDoses ?? null);
    }).catch(() => {
      if (mounted) setNumberOfDose(null);
    });
    return () => { mounted = false; };
  }, [vp.vaccineId, vp.diseaseId, getVaccineName, getDiseaseName]);

  return (
    <tr className="border-t">
      <td className="px-2 py-1">
        {vaccineName}
      </td>
      <td className="px-2 py-1">{diseaseName}</td>
      <td className="px-2 py-1">
        {numberOfDose !== null ? `${numberOfDose}/` : ""}
        {vp.doseNum}
      </td>
      <td className="px-2 py-1">{vp.expectedDate?.slice(0,10) || "-"}</td>
      <td className="px-2 py-1">{vp.actualDate?.slice(0,10) || "-"}</td>
      <td className="px-2 py-1">{vp.status}</td>
      <td className="px-2 py-1">{vp.note || "None"}</td>
    </tr>
  );
};

export default AppointmentDetail