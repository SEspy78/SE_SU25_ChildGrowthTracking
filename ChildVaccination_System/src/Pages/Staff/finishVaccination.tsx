import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { appointmentApi, type Appointment } from "@/api/appointmentAPI"
import { facilityVaccineApi } from "@/api/vaccineApi"
import { message, Button as AntButton } from 'antd'
import VaccinationSteps from "@/Components/VaccinationStep"
import { CheckCircleIcon } from "@heroicons/react/24/solid"
import { getUserInfo } from "@/lib/storage"

interface CompletedVaccinationInfoProps {
  appointmentId?: number // Optional prop if not using useParams
}

export default function CompletedVaccinationInfo({ appointmentId }: CompletedVaccinationInfoProps) {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [vaccineNames, setVaccineNames] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const user = getUserInfo()

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        setLoading(true)
        const effectiveId = appointmentId || Number(id)
        if (!effectiveId) {
          setError("Không có ID lịch hẹn.")
          setAppointment(null)
          return
        }
        const appointmentRes = await appointmentApi.getAppointmentById(effectiveId)
        console.log("Appointment Response:", appointmentRes)
        const appointmentData: Appointment = appointmentRes.appointments?.[0] || appointmentRes
        console.log("Appointment Data:", appointmentData)
        setAppointment(appointmentData)

        // Extract facilityVaccineIds from orderDetails or facilityVaccines
        let facilityVaccineIds: number[] = []
        if (appointmentData.order && Array.isArray(appointmentData.order.orderDetails) && appointmentData.order.orderDetails.length > 0) {
          console.log("Order Details:", appointmentData.order.orderDetails)
          facilityVaccineIds = appointmentData.order.orderDetails
            .filter(detail => detail && typeof detail.facilityVaccineId === 'number' && detail.facilityVaccineId > 0)
            .map(detail => detail.facilityVaccineId)
          console.log("Facility Vaccine IDs from Order Details:", facilityVaccineIds)
        } else if (Array.isArray(appointmentData.facilityVaccines) && appointmentData.facilityVaccines.length > 0) {
          console.log("Facility Vaccines:", appointmentData.facilityVaccines)
          facilityVaccineIds = appointmentData.facilityVaccines
            .filter(fv => fv && typeof fv.facilityVaccineId === 'number' && fv.facilityVaccineId > 0)
            .map(fv => fv.facilityVaccineId)
          console.log("Facility Vaccine IDs from Facility Vaccines:", facilityVaccineIds)
        }

        // Fetch vaccine names
        if (facilityVaccineIds.length > 0) {
          const vaccinePromises = facilityVaccineIds.map(async (id) => {
            try {
              const response = await facilityVaccineApi.getById(id)
              console.log(`Raw response for facilityVaccineId ${id}:`, response)
              return response
            } catch (err) {
              console.error(`Error fetching facilityVaccineId ${id}:`, err)
              return null
            }
          })
          const vaccineResults = await Promise.allSettled(vaccinePromises)
          const names: string[] = []
          vaccineResults.forEach((result, index) => {
            if (result.status === "fulfilled" && result.value && result.value?.vaccine) {
              names.push(result.value.vaccine.name || `ID: ${facilityVaccineIds[index]}`)
            } else {
              console.warn(`Invalid FacilityVaccine data for ID ${facilityVaccineIds[index]}:`, result.status === "fulfilled" ? result.value : result.reason)
            }
          })
          console.log("Fetched Vaccine Names:", names)
          setVaccineNames(names)
        } else {
          setVaccineNames([])
          setError("Không có vắc xin nào được liên kết với lịch hẹn.")
        }
      } catch (err) {
        console.error("Error fetching appointment:", err)
        setError("Không thể tải thông tin lịch hẹn.")
        setAppointment(null)
        message.error("Không thể tải thông tin lịch hẹn.")
      } finally {
        setLoading(false)
      }
    }
    fetchAppointment()
  }, [id, appointmentId])

  const handleBack = () => {
    if (user?.position === "Doctor") {
      navigate("/doctor/appointments")
    } else {
      navigate("/staff/appointments")
    }
  }

  if (loading) return (
    <div className="mt-8 p-6 bg-white shadow rounded-xl max-w-4xl mx-auto">
      <div className="text-gray-600 text-center">Đang tải...</div>
    </div>
  )
  if (error || !appointment) return (
    <div className="mt-8 p-6 bg-white shadow rounded-xl max-w-4xl mx-auto">
      <div className="text-red-500 text-center">{error || "Không có dữ liệu lịch hẹn."}</div>
    </div>
  )
  if (appointment.status !== "Completed") return (
    <div className="mt-8 p-6 bg-white shadow rounded-xl max-w-4xl mx-auto">
      <div className="text-gray-600 text-center">Lịch hẹn chưa hoàn tất.</div>
    </div>
  )

  const child = appointment.child

  return (
    <div className="mt-8 p-6 bg-white shadow-lg rounded-xl max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 bg-gradient-to-r from-blue-500 to-green-500 text-white p-4 rounded-t-lg">
        Thông tin lịch hẹn
      </h2>
      <div className="mb-8">
        <VaccinationSteps currentStep={5} />
      </div>
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Chi tiết lịch hẹn</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center">
              <span className="font-medium text-gray-700 w-32">Bệnh nhân:</span>
              <span className="text-gray-800">{child?.fullName || '-'}</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium text-gray-700 w-32">Phụ huynh:</span>
              <span className="text-gray-800">{appointment.memberName || '-'}</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium text-gray-700 w-32">Liên hệ:</span>
              <span className="text-gray-800">{appointment.memberPhone || '-'}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center">
              <span className="font-medium text-gray-700 w-32">Ngày tiêm:</span>
              <span className="text-gray-800">
                {appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString('vi-VN') : '-'}
              </span>
            </div>
            <div className="flex items-center">
              <span className="font-medium text-gray-700 w-32">Vắc xin:</span>
              <span className="text-gray-800">{vaccineNames.length > 0 ? vaccineNames.join(", ") : "Không có"}</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium text-gray-700 w-32">Trạng thái:</span>
              <div className="flex items-center space-x-1">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                <span className="text-green-600 font-medium">Hoàn tất</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <AntButton
          type="default"
          onClick={handleBack}
          className="bg-gray-300 hover:bg-blue-400 text-black px-6 py-2 rounded-full transition-colors"
        >
          Quay lại
        </AntButton>
      </div>
    </div>
  )
}