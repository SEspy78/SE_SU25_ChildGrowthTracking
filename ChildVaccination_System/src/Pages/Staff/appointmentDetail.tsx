import React from "react"
import VaccinationSteps from "@/Components/VaccinationStep"
import { Button } from "@/Components/ui/button"

interface Appointment {
  id: number
  time: string
  name: string
  age: string
  vaccine: string
  status: string
}

interface VaccinationDetailProps {
  appointment: Appointment
  onClose?: () => void
}

const AppointmentDetail: React.FC<VaccinationDetailProps> = ({ appointment }) => {
  return (
    <div className="mt-8 p-6 bg-white shadow rounded-xl">
      <h2 className="text-xl font-semibold mb-4">Vaccination Process</h2>

      <div className="flex items-center justify-between mb-4">
        <VaccinationSteps currentStep={0} />

      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p><strong>Name:</strong> {appointment.name}</p>
          <p><strong>Age:</strong> {appointment.age}</p>
          <p><strong>Parent’s name:</strong> Jack Maxem</p>
          <p><strong>Contact Number:</strong> 0923626623</p>
          <p><strong>Vaccination date:</strong> 22-3-2025</p>
        </div>
        <div>
          <p><strong>Blood Type:</strong> A</p>
          <p><strong>Allergies:</strong> None</p>
        </div>
      </div>

      <p className="mb-2"><strong>Vaccine:</strong> {appointment.vaccine} (Package)</p>

      <div>
        <p className="mb-2 font-semibold">Vaccination history:</p>
        <table className="w-full text-sm border border-gray-200">
          <thead>
            <tr>
              <th className="border p-2">Vaccine</th>
              {[...Array(12)].map((_, i) => (
                <th key={i} className="border p-2">{i + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {["Bại Liệt", "Bạch hầu, ho gà, uốn ván", "Viêm gan B**", "MMR"].map((vaccine, i) => (
              <tr key={i}>
                <td className="border p-2 font-medium">{vaccine}</td>
                {[...Array(12)].map((_, m) => (
                  <td key={m} className="border p-2 text-center">
                    {Math.random() > 0.75 ? "❌" : Math.random() > 0.5 ? "✅" : "🟡"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

       <div className="flex space-x-4 pt-10">
          <Button
            type="button"
            className="bg-gray-300 hover:bg-gray-400 text-black px-6 py-2 rounded-full"
          >
            Back
          </Button>

          <Button
            type="button"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full"
          >
            Confirm 
          </Button>
        </div>
    </div>
  )
}

export default AppointmentDetail
