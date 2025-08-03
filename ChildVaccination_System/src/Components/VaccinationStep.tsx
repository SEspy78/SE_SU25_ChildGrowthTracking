import { useParams, useNavigate, useLocation } from "react-router-dom"
import { useEffect, useState } from "react"
import { appointmentApi } from "@/api/appointmentAPI"
import { message } from 'antd'
import { getUserInfo } from "@/lib/storage"

const steps = [
  "Confirm Schedule",
  "Pre-vaccination health survey",
  "Payment",
  "Vaccination",
]

interface VaccinationStepsProps {
  currentStep: number // 0-based index
}

export default function VaccinationSteps({ currentStep: propCurrentStep }: VaccinationStepsProps) {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [appointmentStatus, setAppointmentStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(propCurrentStep)
  const user = getUserInfo()

  useEffect(() => {
    // Update currentStep based on URL path
    const pathSegments = location.pathname.split('/')
    const stepSegment = pathSegments[pathSegments.indexOf('step') + 1]
    if (stepSegment) {
      const stepNum = parseInt(stepSegment, 10) - 1 // Convert to 0-based index
      if (!isNaN(stepNum) && stepNum >= 0 && stepNum < steps.length) {
        setCurrentStep(stepNum)
      }
    }

    const fetchAppointment = async () => {
      try {
        setLoading(true)
        if (!id) {
          message.error("No appointment ID provided in the URL.")
          return
        }
        const res = await appointmentApi.getAppointmentById(Number(id))
        const appointmentData = (res as any).data || res
        setAppointmentStatus(appointmentData.status)
      } catch (error) {
        message.error("Không thể tải trạng thái lịch hẹn.")
        setAppointmentStatus(null)
      } finally {
        setLoading(false)
      }
    }
    fetchAppointment()
  }, [id, location.pathname])

  const isStepClickable = (_stepIndex: number, _status: string | null): boolean => {
    return true // All steps are always clickable
  }

  const isStepCompleted = (stepIndex: number, status: string | null): boolean => {
    if (!status) return false
    switch (status) {
      case "Pending":
        return stepIndex < 0 // No steps completed
      case "Approval":
        return stepIndex <= 1 // Confirm Schedule, Pre-vaccination health survey completed
      case "Paid":
        return stepIndex <= 2 // Confirm Schedule, Pre-vaccination health survey, Payment completed
      case "Completed":
        return stepIndex <= 3 // All steps (Confirm Schedule, Pre-vaccination health survey, Payment, Vaccination, Finish) completed
      default:
        return false
    }
  }

  const goToStep = (stepIndex: number) => {
    if (!id) return
    const basePath = user?.position === "Doctor" ? "/doctor" : "/staff"
    navigate(`${basePath}/appointments/${id}/step-${stepIndex + 1}`)
  }

  if (loading) return <div className="text-gray-600 text-center py-4">Loading...</div>

  return (
    <div className="flex items-center justify-center mb-8">
      <div className="flex gap-4 flex-wrap">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`flex items-center space-x-2 ${
              isStepClickable(index, appointmentStatus) ? 'cursor-pointer' : 'cursor-not-allowed'
            }`}
            onClick={() => goToStep(index)}
          >
            <div
              className={`rounded-full flex items-center justify-center transition-all ${
                isStepCompleted(index, appointmentStatus) && index !== currentStep
                  ? "w-8 h-8 bg-green-600 text-white border-2 border-green-600"
                  : index === currentStep
                  ? "w-10 h-10 bg-yellow-500 text-white border-4 border-yellow-600 shadow-md ring-2 ring-yellow-200"
                  : index === 0 && appointmentStatus === "Pending"
                  ? "w-8 h-8 bg-white text-blue-600 border-2 border-blue-600"
                  : "w-8 h-8 bg-gray-100 text-gray-400 border-2 border-gray-300"
              }`}
            >
              {index + 1}
            </div>
            <span
              className={`text-sm ${
                index === currentStep
                  ? 'font-bold text-gray-800'
                  : isStepCompleted(index, appointmentStatus)
                  ? 'text-gray-800'
                  : 'text-gray-400'
              }`}
            >
              {step}
            </span>
            {index < steps.length - 1 && (
              <div
                className={`w-6 border-t-2 ${
                  isStepCompleted(index, appointmentStatus) ? 'border-green-600' : 'border-gray-300'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}