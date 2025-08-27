import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { appointmentApi, type Appointment } from "@/api/appointmentAPI"
import { message, Button as AntButton } from 'antd'
import VaccinationSteps from "@/Components/VaccinationStep"
import { CheckCircleIcon } from "@heroicons/react/24/solid"
import { getUserInfo } from "@/lib/storage"

interface CompletedVaccinationInfoProps {
  appointmentId?: number 
}

export default function CompletedVaccinationInfo({ appointmentId }: CompletedVaccinationInfoProps) {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
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
        const appointmentData: Appointment = appointmentRes || appointmentRes
        console.log("Appointment Data:", appointmentData)
        setAppointment(appointmentData)
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
  const vaccineDisplay = appointment.order?.packageName || "Không có gói vắc xin"

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
              <span className="text-gray-800">{vaccineDisplay}</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium text-gray-700 w-32">Ghi chú:</span>
              <span className="text-gray-800">{appointment.note || 'Không có'}</span>
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