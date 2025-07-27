import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState, useMemo } from "react"
import { appointmentApi, type Appointment } from "@/api/appointmentAPI"
import { vaccinePackageApi, type VaccinePackage } from "@/api/vaccinePackageApi"
import { getUserInfo } from "@/lib/storage"
import { Button as AntButton, message } from 'antd'
import VaccinationSteps from "@/Components/VaccinationStep"
import { Button } from "@/Components/ui/button"

export default function Payment() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [vaccinePackages, setVaccinePackages] = useState<VaccinePackage[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingPackages, setLoadingPackages] = useState(true)
  const [error, setError] = useState("")
  const [errorPackages, setErrorPackages] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState("")
  const user = getUserInfo()

  // Fetch appointment data
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
      } catch {
        setError("Không thể tải thông tin thanh toán.")
        setAppointment(null)
      } finally {
        setLoading(false)
      }
    }
    fetchAppointment()
  }, [id])

  // Derive facilityId from appointment or fallback to 5
  const facilityId = useMemo(() => {
    return appointment?.facilityVaccines[0]?.facilityId || 5
  }, [appointment])

  // Fetch vaccine packages when facilityId changes
  useEffect(() => {
    const fetchVaccinePackages = async () => {
      try {
        setLoadingPackages(true)
        const packageRes = await vaccinePackageApi.getAll(facilityId)
        setVaccinePackages(packageRes.data || [])
      } catch {
        setErrorPackages("Không thể tải danh sách gói vaccine.")
        setVaccinePackages([])
      } finally {
        setLoadingPackages(false)
      }
    }
    if (facilityId) {
      fetchVaccinePackages()
    }
  }, [facilityId])

  // Function to calculate age
  const calculateAge = (birthDate: string): string => {
    if (!birthDate) return "N/A"
    const birth = new Date(birthDate)
    const today = new Date()
    if (isNaN(birth.getTime())) return "N/A"

    const diffMs = today.getTime() - birth.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffMonths = Math.floor(diffDays / 30.436875) // Average month length
    const diffWeeks = Math.floor(diffDays / 7)

    if (diffMonths >= 12) {
      const years = Math.floor(diffMonths / 12)
      return `${years} tuổi`
    } else if (diffMonths > 0) {
      return `${diffMonths} tháng tuổi`
    } else {
      return `${diffWeeks} tuần tuổi`
    }
  }

  const handleBackByPosition = () => {
    if (user?.position === "Doctor") {
      navigate("/doctor/appointments")
    } else {
      navigate("/staff/appointments")
    }
  }

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
      setTimeout(() => {
        if (user?.position === "Doctor") {
          navigate(`/doctor/appointments/${id}/step-4`)
        } else {
          navigate(`/staff/appointments/${id}/step-4`)
        }
      }, 1200)
    } catch {
      setSubmitMessage("Có lỗi khi xác nhận thanh toán.")
      message.error("Có lỗi khi xác nhận thanh toán.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleContinue = () => {
    if (!id) return
    if (user?.position === "Doctor") {
      navigate(`/doctor/appointments/${id}/step-4`)
    } else {
      navigate(`/staff/appointments/${id}/step-4`)
    }
  }

  if (loading || loadingPackages) return <div className="p-8 text-gray-600 text-center">Đang tải thông tin...</div>
  if (error || errorPackages) return <div className="p-8 text-red-500 text-center">{error || errorPackages}</div>
  if (!appointment) return <div className="p-8 text-gray-600 text-center">Không có dữ liệu lịch hẹn.</div>

  const child = appointment.child
  const isApprovalStatus = appointment.status === "Approval"
  const isPendingStatus = appointment.status === "Pending"
  const isPayedStatus = appointment.status === "Payed"

  // Extract vaccine names from facilityVaccines
  const vaccineNames = Array.isArray(appointment.facilityVaccines)
    ? appointment.facilityVaccines.map(fv => fv.vaccine.name)
    : []

  // Find package data based on order.packageId
  const packageData = vaccinePackages.find(pkg => pkg.packageId === appointment.order?.packageId)
  const packageName = packageData?.name
  const packageVaccineNames = packageData?.packageVaccines
    ? packageData.packageVaccines.map(pv => pv.facilityVaccine.vaccine.name)
    : []

  // Combine individual vaccines and package details
  const vaccineDisplayParts: string[] = []
  if (vaccineNames.length > 0) {
    vaccineDisplayParts.push(vaccineNames.join(", "))
  }
  if (packageName) {
    const packageDisplay = packageVaccineNames.length > 0
      ? `${packageName} (${packageVaccineNames.join(", ")})`
      : packageName
    vaccineDisplayParts.push(packageDisplay)
  }
  const vaccineDisplay = vaccineDisplayParts.length > 0
    ? vaccineDisplayParts.join(", ")
    : "-"

  return (
    <div className="mt-8 p-6 bg-white shadow rounded-xl">
      <Button
        type="button"
        className="bg-gray-300 hover:bg-blue-400 text-black px-6 py-2 rounded-full transition-colors"
        onClick={handleBackByPosition}
      >
        Quay lại
      </Button>
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Vaccination Process</h2>
        
        <div className="mb-8">
          <VaccinationSteps currentStep={2} />
        </div>

        <div className="bg-white rounded-xl  shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Payment Details</h3>
          {isPayedStatus && (
            <div className="mb-4 p-4 bg-green-100 text-center text-green-700 rounded-lg">
             Đã thanh toán thành công .
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Patient Name:</span>
                <span className="text-gray-800">{child?.fullName || '-'}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Age:</span>
                <span className="text-gray-800">{child?.birthDate ? calculateAge(child.birthDate) : '-'}</span>
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
                <span className="text-gray-800">{vaccineDisplay}</span>
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
        {!isPayedStatus && isApprovalStatus && (
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
          {!isPayedStatus && isApprovalStatus && (
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
          {(!isApprovalStatus || isPayedStatus) && !isPendingStatus && (
            <AntButton
              type="primary"
              onClick={handleContinue}
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full transition-colors"
            >
              Continue
            </AntButton>
          )}
          {(submitMessage || isPayedStatus) && (
            <span className={`ml-4 font-medium ${submitMessage.includes("thành công") || isPayedStatus ? "text-green-600" : "text-red-500"}`}>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}