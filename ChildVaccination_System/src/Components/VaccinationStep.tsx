import { useParams, useNavigate, useLocation } from "react-router-dom"

const steps = [
  "Confirm Schedule",
  "Pre-vaccination health survey",
  "Payment",
  "Vaccination",
  "Finish",
]

interface VaccinationStepsProps {
  currentStep: number // 0-based index
}

export default function VaccinationSteps({ currentStep }: VaccinationStepsProps) {
  const { id } = useParams()
  const navigate = useNavigate()

  const goToStep = (stepIndex: number) => {
    navigate(`/staff/appointments/${id}/step-${stepIndex + 1}`)
  }

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex gap-4 flex-wrap">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center space-x-2 cursor-pointer" onClick={() => goToStep(index)}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                index <= currentStep
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-gray-300 text-gray-600"
              }`}
            >
              {index + 1}
            </div>
            <span className="text-sm">{step}</span>
            {index < steps.length - 1 && <div className="w-6 border-t-2 border-blue-400" />}
          </div>
        ))}
      </div>
    </div>
  )
}
