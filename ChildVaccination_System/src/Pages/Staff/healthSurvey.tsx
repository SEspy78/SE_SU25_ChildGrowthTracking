import { useNavigate, useParams } from "react-router-dom"
import VaccinationSteps from "@/Components/VaccinationStep"
import { Button } from "@/Components/ui/button"

export default function HealthSurvey() {
  const navigate = useNavigate()
  const { id } = useParams()

  const handleBack = () => {
    navigate(`/staff/appointments/${id}`) 
  }

  const handleSubmit = () => {
    // Xử lý lưu form tại đây (nếu cần)
    navigate(`/staff/appointments/${id}/step-3`) 
  }

  return (
    <div className="mt-8 p-6 bg-white shadow rounded-xl">
      <h2 className="text-xl font-semibold mb-4">Vaccination Process</h2>
      <VaccinationSteps currentStep={1} />

      <h1 className="text-xl font-bold mb-4 mt-6">Pre-vaccination Health Survey</h1>

      {/* Form khảo sát đơn giản */}
      <form className="space-y-4">
        <div>
          <label className="block font-medium">Have you had any allergic reactions to vaccines?</label>
          <select className="w-full p-2 border border-gray-300 rounded">
            <option>-- Select --</option>
            <option>No</option>
            <option>Yes</option>
          </select>
        </div>

        <div>
          <label className="block font-medium">Do you have a fever or any symptoms of illness today?</label>
          <select className="w-full p-2 border border-gray-300 rounded">
            <option>-- Select --</option>
            <option>No</option>
            <option>Yes</option>
          </select>
        </div>

        <div>
          <label className="block font-medium">Any chronic conditions (e.g., asthma, diabetes)?</label>
          <input type="text" className="w-full p-2 border border-gray-300 rounded" />
        </div>

        {/* Buttons: Back & Submit */}
        <div className="flex space-x-4 pt-4">
          <Button
            type="button"
            onClick={handleBack}
            className="bg-gray-300 hover:bg-gray-400 text-black px-6 py-2 rounded-full"
          >
            Back
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full"
          >
            Submit Survey 
          </Button>
        </div>
      </form>
    </div>
  )
}
