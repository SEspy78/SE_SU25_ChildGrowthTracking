import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import VaccinationSteps from "@/Components/VaccinationStep"
import { Button } from "@/Components/ui/button"
import { appointmentApi, type Appointment } from "@/api/appointmentAPI"
import { getUserInfo } from "@/lib/storage"
import { message } from 'antd'

export default function ConfirmVaccination() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        setLoading(true)
        if (!id) {
          setError("No appointment ID provided in the URL.")
          setAppointment(null)
          return
        }
        const res = await appointmentApi.getAppointmentById(Number(id))
        const appointmentData = (res as any).data || res
        setAppointment(appointmentData)
      } catch (error) {
        setError("Không thể tải thông tin lịch hẹn.")
        setAppointment(null)
        message.error("Không thể tải thông tin lịch hẹn.")
      } finally {
        setLoading(false)
      }
    }
    fetchAppointment()
  }, [id])

  const handleContinue = () => {
    if (!id) return
    const user = getUserInfo()
    if (user?.role === "Doctor") {
      navigate(`/doctor/appointments/${id}/step-5`)
    } else {
      navigate(`/staff/appointments/${id}/step-5`)
    }
  }

  if (loading) return <div className="p-8 text-gray-600 text-center">Đang tải thông tin...</div>
  if (error) return <div className="p-8 text-red-500 text-center">{error}</div>
  if (!appointment) return <div className="p-8 text-gray-600 text-center">Không có dữ liệu lịch hẹn.</div>

  const child = appointment.child
  const isCompletedStatus = appointment.status === "Completed"
  const isPayedStatus = appointment.status === "Payed"

  return (
    <div className="mt-8 p-6 bg-white shadow rounded-xl">
      <h2 className="text-xl font-semibold mb-4">Vaccination Process</h2>
      <VaccinationSteps currentStep={3} />

      <h1 className="text-xl font-bold my-4">💉 Confirm Vaccination</h1>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <p><strong>Patient Name:</strong> {child?.fullName || '-'}</p>
          <p><strong>Age:</strong> 
            {(() => {
              if (child?.birthDate) {
                const birth = new Date(child.birthDate)
                const now = new Date()
                let age = now.getFullYear() - birth.getFullYear()
                const m = now.getMonth() - birth.getMonth()
                if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
                return age > 0 ? `${age} tuổi` : '-'
              }
              return '-'
            })()}
          </p>
          <p><strong>Parent’s Name:</strong> {appointment.memberName || '-'}</p>
          <p><strong>Contact:</strong> {appointment.memberPhone || '-'}</p>
          <p><strong>Vaccination Date:</strong> 
            {appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString('vi-VN') : '-'}
          </p>
        </div>
        <div>
          <p><strong>Vaccine:</strong> 
            {Array.isArray(appointment.vaccineNames) && appointment.vaccineNames.length > 0 
              ? appointment.vaccineNames.join(", ") 
              : '-'}
          </p>
          <p><strong>Blood Type:</strong> {child?.bloodType || '-'}</p>
          <p><strong>Allergies:</strong> {child?.allergiesNotes || '-'}</p>
        </div>
      </div>

      <div className=" my-8">
        {isCompletedStatus ? (
          <>
            <p className="text-lg font-semibold text-green-600 mb-4">✅ Đã tiêm xong!</p>
            <p className="text-gray-600">Bệnh nhân đã hoàn thành quá trình tiêm chủng ở bước này.</p>
          </>
        ) : isPayedStatus ? (
          <>
            <p className="text-lg font-medium text-gray-700 mb-4">⏳ Đang chờ bác sĩ thực hiện tiêm chủng...</p>
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 mx-auto" />
          </>
        ) : (
          <p className="text-2xl font-medium text-gray-700 mb-4">
            Vui lòng hoàn thành check-in và thanh toán để tiếp tục
          </p>
        )}
      </div>

      <div className="flex gap-4 mt-6">
        <Button
          type="button"
          className="bg-gray-300 hover:bg-gray-400 text-black px-6 py-2 rounded-full"
          onClick={() => window.history.back()}
        >
          Back
        </Button>
        {isCompletedStatus && (
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full"
            onClick={handleContinue}
          >
            Tiếp tục
          </Button>
        )}
      </div>
    </div>
  )
}