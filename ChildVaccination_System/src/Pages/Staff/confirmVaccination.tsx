import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import VaccinationSteps from "@/Components/VaccinationStep"
import { Button } from "@/Components/ui/button"

export default function ConfirmVaccination() {
  const { id } = useParams()

  // Trạng thái giả lập: waiting (đang chờ) | completed (đã tiêm)
  const [status, setStatus] = useState<"waiting" | "completed">("waiting")

  // Dữ liệu mẫu (nên lấy từ API theo id)
  const patient = {
    name: "Nguyễn Văn A",
    age: "2 tuổi",
    parent: "Nguyễn Văn B",
    contact: "0912345678",
    vaccine: "ComBE Five",
    bloodType: "A",
    allergies: "Không",
    date: "22-03-2025",
  }

  // Mô phỏng cập nhật trạng thái sau 5s
  useEffect(() => {
    const timer = setTimeout(() => {
      setStatus("completed")
    }, 5000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="mt-8 p-6 bg-white shadow rounded-xl">
      <h2 className="text-xl font-semibold mb-4">Vaccination Process</h2>
      <VaccinationSteps currentStep={3} />

      <h1 className="text-xl font-bold my-4">💉 Confirm Vaccination</h1>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <p><strong>Patient Name:</strong> {patient.name}</p>
          <p><strong>Age:</strong> {patient.age}</p>
          <p><strong>Parent’s Name:</strong> {patient.parent}</p>
          <p><strong>Contact:</strong> {patient.contact}</p>
          <p><strong>Vaccination Date:</strong> {patient.date}</p>
        </div>
        <div>
          <p><strong>Vaccine:</strong> {patient.vaccine}</p>
          <p><strong>Blood Type:</strong> {patient.bloodType}</p>
          <p><strong>Allergies:</strong> {patient.allergies}</p>
        </div>
      </div>

      <div className="text-center my-8">
        {status === "waiting" ? (
          <>
            <p className="text-lg font-medium text-gray-700 mb-4">⏳ Đang chờ bác sĩ thực hiện tiêm chủng...</p>
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 mx-auto" />
          </>
        ) : (
          <>
            <p className="text-lg font-semibold text-green-600 mb-4">✅ Đã tiêm xong!</p>
            <p className="text-gray-600">Bệnh nhân đã hoàn thành quá trình tiêm chủng ở bước này.</p>
          </>
        )}
      </div>

      <div className="flex gap-4 mt-6">
             <Button
                        type="button"
                        className="bg-gray-300 hover:bg-gray-400 text-black px-6 py-2 rounded-full"
                      >
                        Back
                      </Button>

        {status === "completed" && (
          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full" onClick={() => window.location.href = `/staff/appointments/${id}/step-5`}>
            Tiếp tục
          </Button>
        )}
      </div>
    </div>
  )
}
