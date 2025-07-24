import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { appointmentApi, type Appointment } from "@/api/appointmentAPI"
import { getUserInfo } from "@/lib/storage"
import { Button as AntButton, message } from 'antd'
import VaccinationSteps from "@/Components/VaccinationStep"

export default function Payment() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState("")

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
        setError("Không thể tải thông tin thanh toán.")
        setAppointment(null)
      } finally {
        setLoading(false)
      }
    }
    fetchAppointment()
  }, [id])

  const handleConfirmPayment = async () => {
    if (!id || !appointment) return
    setSubmitting(true)
    setSubmitMessage("")
    try {
      await appointmentApi.updateAppointmentStatus(Number(id), {
        status: "Payed",
        note: "None",
      })
      setSubmitMessage("Thanh toán thành công!")
      message.success("Thanh toán thành công!")
      const user = getUserInfo()
      setTimeout(() => {
        if (user?.position === "Doctor") {
          navigate(`/doctor/appointments/${id}/step-4`)
        } else {
          navigate(`/staff/appointments/${id}/step-4`)
        }
      }, 1200)
    } catch (error) {
      setSubmitMessage("Có lỗi khi xác nhận thanh toán.")
      message.error("Có lỗi khi xác nhận thanh toán.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleContinue = () => {
    if (!id) return
    const user = getUserInfo()
    if (user?.position === "Doctor") {
      navigate(`/doctor/appointments/${id}/step-4`)
    } else {
      navigate(`/staff/appointments/${id}/step-4`)
    }
  }

  if (loading) return <div className="p-8 text-gray-600 text-center">Đang tải thông tin...</div>
  if (error) return <div className="p-8 text-red-500 text-center">{error}</div>
  if (!appointment) return <div className="p-8 text-gray-600 text-center">Không có dữ liệu lịch hẹn.</div>

  const child = appointment.child
  const isApprovalStatus = appointment.status === "Approval"
  const isPendingStatus = appointment.status === "Pending"

  return (
    <div className="mt-8 p-6 bg-white shadow rounded-xl">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Vaccination Process</h2>
        
        <div className="mb-8">
          <VaccinationSteps currentStep={2} />
        </div>

        {/* Payment Information Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Payment Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Patient Name:</span>
                <span className="text-gray-800">{child?.fullName || '-'}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Age:</span>
                <span className="text-gray-800">
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
                </span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Parent's Name:</span>
                <span className="text-gray-800">{appointment.memberName || '-'}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Contact:</span>
                <span className="text-gray-800">{appointment.memberPhone || '-'}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Vaccine:</span>
                <span className="text-gray-800">
                  {Array.isArray(appointment.vaccineNames) && appointment.vaccineNames.length > 0 
                    ? appointment.vaccineNames.join(", ") 
                    : '-'}
                </span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Total Amount:</span>
                <span className="text-gray-800">
                  {typeof appointment.estimatedCost === 'number' 
                    ? appointment.estimatedCost.toLocaleString() + ' VND' 
                    : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        {isApprovalStatus && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-700 mb-4 border-b pb-2">Select Payment Method</h3>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2">
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="cash" 
                  defaultChecked 
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">Tiền mặt</span>
              </label>
              <label className="flex items-center gap-2">
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="bank" 
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">Chuyển khoản qua mã QR</span>
              </label>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 mt-8 items-center">
          <AntButton
            type="default"
            onClick={() => window.history.back()}
            disabled={submitting}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-full transition-colors"
          >
            Back
          </AntButton>
          {isApprovalStatus && (
            <AntButton
              type="primary"
              onClick={handleConfirmPayment}
              loading={submitting}
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full transition-colors"
            >
              {submitting ? "Đang xử lý..." : "Confirm Payment"}
            </AntButton>
          )}
          {!isApprovalStatus && !isPendingStatus && (
            <AntButton
              type="primary"
              onClick={handleContinue}
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full transition-colors"
            >
              Continue
            </AntButton>
          )}
          {submitMessage && (
            <span className={`ml-4 font-medium ${submitMessage.includes("thành công") ? "text-green-600" : "text-red-500"}`}>
              {submitMessage}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}