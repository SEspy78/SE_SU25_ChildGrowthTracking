import React, { useState } from "react"
import VaccinationSteps from "@/Components/VaccinationStep"
import { Button } from "@/Components/ui/button"
import type { Appointment } from "@/api/appointmentAPI"
import { childprofileApi, type VaccineProfile } from "@/api/childInfomationAPI"
import { vaccineApi } from "@/api/vaccineApi"
import { diseaseApi } from "@/api/diseaseApi"
import { useNavigate } from "react-router-dom"
import { getUserInfo } from "@/lib/storage"
import { Collapse, Button as AntButton } from 'antd'
import { CaretRightOutlined } from '@ant-design/icons'

const AppointmentDetail: React.FC<{ appointment: Appointment; onClose?: () => void }> = ({ appointment }) => {
  const user = getUserInfo()
  const navigate = useNavigate()
  const child = appointment.child
  const [isHistoryVisible, setIsHistoryVisible] = useState(false)

  const handleConfirmByRole = () => {
    navigate(`/staff/appointments/${appointment.appointmentId}/step-2`)
  }

  const handleContinueDoctor = () => {
    navigate(`/doctor/appointments/${appointment.appointmentId}/step-2`)
  }

  const handleBackByRole = () => {
    if (user?.role === "Doctor") {
      navigate("/doctor/appointments")
    } else {
      navigate("/staff/appointments")
    }
  }

  const [vaccineProfiles, setVaccineProfiles] = React.useState<VaccineProfile[]>([])
  const [loadingProfiles, setLoadingProfiles] = React.useState(false)
  const [errorProfiles, setErrorProfiles] = React.useState<string>("")
  const [vaccineMap, setVaccineMap] = React.useState<Record<number, string>>({})
  const [diseaseMap, setDiseaseMap] = React.useState<Record<number, string>>({})

  const getVaccineName = React.useCallback(async (id: number) => {
    if (vaccineMap[id]) return vaccineMap[id]
    try {
      const v = await vaccineApi.getById(id)
      setVaccineMap(prev => ({ ...prev, [id]: v.name }))
      return v.name
    } catch {
      setVaccineMap(prev => ({ ...prev, [id]: `ID: ${id}` }))
      return `ID: ${id}`
    }
  }, [vaccineMap])

  const getDiseaseName = React.useCallback(async (id: number) => {
    if (diseaseMap[id]) return diseaseMap[id]
    try {
      const d = await diseaseApi.getById(id)
      setDiseaseMap(prev => ({ ...prev, [id]: d.name }))
      return d.name
    } catch {
      setDiseaseMap(prev => ({ ...prev, [id]: `Bệnh ID: ${id}` }))
      return `Bệnh ID: ${id}`
    }
  }, [diseaseMap])

  React.useEffect(() => {
    if (!child?.childId) return
    setLoadingProfiles(true)
    setErrorProfiles("")
    childprofileApi.getChildVaccineProfile(child.childId)
      .then(setVaccineProfiles)
      .catch(() => setErrorProfiles("Không thể tải lịch sử tiêm chủng."))
      .finally(() => setLoadingProfiles(false))
  }, [child?.childId])

  return (
    <div>
      <Button
              type="button"
              className="bg-gray-300 hover:bg-blue-400 text-black px-6 py-2 rounded-full transition-colors"
              onClick={handleBackByRole}
            >
              Quay lại
            </Button>
    <div className="mt-8 p-6 bg-white shadow rounded-xl">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl justify-center font-bold text-gray-800 mb-6">Vaccination Process</h2>
        
        <div className="mb-8">
          <VaccinationSteps currentStep={0} />
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Appointment Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Tên bé:</span>
                <span className="text-gray-800">{child.fullName}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Giới tính:</span>
                <span className="text-gray-800">{child.gender}</span>
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
                <span className="text-gray-800">{appointment.memberEmail}</span>
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
                <span className="font-medium text-gray-600 w-32">Medical History:</span>
                <span className="text-gray-800">{child.medicalHistory || "Không có"}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Thời gian tiêm:</span>
                <span className="text-gray-800">{appointment.appointmentTime}</span>
              </div>
              
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center">
              <span className="font-medium text-gray-600 w-32">Vaccines:</span>
              <span className="text-gray-800">{appointment.vaccineNames.join(", ") } {appointment.packageName }</span>
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

        <Collapse activeKey={isHistoryVisible ? ['1'] : []} className="mb-8">
          <Collapse.Panel header="" key="1">
              <h3 className="text-lg font-semibold text-blue-700 mb-4 border-b pb-2">Vaccination History</h3>
              {loadingProfiles ? (
                <div className="text-gray-600 text-center py-4">Loading...</div>
              ) : errorProfiles ? (
                <div className="text-red-600 text-center py-4">{errorProfiles}</div>
              ) : vaccineProfiles.length === 0 ? (
                <div className="text-gray-600 text-center py-4">No vaccination history available.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full table-auto border border-gray-200 text-sm">
                    <thead className="bg-blue-50 text-blue-800">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Disease</th>
                        <th className="px-4 py-3 text-left font-semibold">Vaccine</th>
                        <th className="px-4 py-3 text-left font-semibold">Dose</th>
                        <th className="px-4 py-3 text-left font-semibold">Expected Date</th>
                        <th className="px-4 py-3 text-left font-semibold">Actual Date</th>
                        <th className="px-4 py-3 text-left font-semibold">Status</th>
                        <th className="px-4 py-3 text-left font-semibold">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vaccineProfiles.map((vp) => (
                        <VaccineProfileRow key={vp.vaccineProfileId} vp={vp} getVaccineName={getVaccineName} getDiseaseName={getDiseaseName} />
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
            onClick={handleBackByRole}
          >
            Trở lại
          </Button>
          {user?.role === "Doctor" ? (
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
  )
}

interface VaccineProfileRowProps {
  vp: VaccineProfile
  getVaccineName: (id: number) => Promise<string>
  getDiseaseName: (id: number) => Promise<string>
}

const VaccineProfileRow: React.FC<VaccineProfileRowProps> = ({ vp, getVaccineName, getDiseaseName }) => {
  const [vaccineName, setVaccineName] = React.useState<string>(`ID: ${vp.vaccineId}`)
  const [diseaseName, setDiseaseName] = React.useState<string>(`Bệnh ID: ${vp.diseaseId}`)
  const [numberOfDose, setNumberOfDose] = React.useState<number | null>(null)

  React.useEffect(() => {
    let mounted = true
    getVaccineName(vp.vaccineId).then(name => { if (mounted) setVaccineName(name) })
    getDiseaseName(vp.diseaseId).then(name => { if (mounted) setDiseaseName(name) })
    vaccineApi.getById(vp.vaccineId).then(v => {
      if (mounted) setNumberOfDose(v.numberOfDoses ?? null)
    }).catch(() => {
      if (mounted) setNumberOfDose(null)
    })
    return () => { mounted = false }
  }, [vp.vaccineId, vp.diseaseId, getVaccineName, getDiseaseName])

  return (
    <tr className="border-t hover:bg-gray-50">
      <td className="px-4 py-3">{diseaseName}</td>
      <td className="px-4 py-3">{vaccineName}</td>
      <td className="px-4 py-3">
        {numberOfDose !== null ? `${numberOfDose}/` : ""}
        {vp.doseNum}
      </td>
      <td className="px-4 py-3">{vp.expectedDate?.slice(0,10) || "-"}</td>
      <td className="px-4 py-3">{vp.actualDate?.slice(0,10) || "-"}</td>
      <td className="px-4 py-3">{vp.status}</td>
      <td className="px-4 py-3">{vp.note || "None"}</td>
    </tr>
  )
}

export default AppointmentDetail