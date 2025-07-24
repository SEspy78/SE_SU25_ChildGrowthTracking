import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getUserInfo } from "@/lib/storage"
import { appointmentApi } from "../../api/appointmentAPI"
import type { Appointment } from "../../api/appointmentAPI"

const statusStyle: Record<string, string> = {
  Scheduled: "bg-blue-100 text-blue-600",
  Confirmed: "bg-blue-100 text-blue-600",
  Completed: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-600",
  Examined: "bg-yellow-100 text-yellow-800",
}

export default function DashboardStaff() {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [search, setSearch] = useState<string>("")

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true)
        const res = await appointmentApi.getAllAppointments()
        setAppointments(res.appointments)
      } catch (error) {
        setAppointments([])
      } finally {
        setLoading(false)
      }
    }
    fetchAppointments()
  }, [])

  const filteredAppointments = appointments.filter(item =>
    item.child.fullName.toLowerCase().includes(search.toLowerCase())
  )

  // Hàm điều hướng theo role và status
const handleNavigateByRoleAndStatus = (appointmentId: number, status: string) => {
  const user = getUserInfo()
  let stepIndex = 0 // Default to Step 1
  switch (status) {
    case "Pending":
      stepIndex = 0 // Step 1
      break
    case "Approval":
      stepIndex = 1 // Step 2
      break
    case "Payed":
      stepIndex = 2 // Step 3
      break
    case "Vaccinated":
      stepIndex = 3 // Step 4
      break
    case "Completed":
      stepIndex = 4 // Step 5
      break
    default:
      stepIndex = 0 // Default to Step 1 for other statuses
  }
  const basePath = user?.position === "Doctor" ? "/doctor/appointments" : "/staff/appointments"
  navigate(`${basePath}/${appointmentId}/step-${stepIndex + 1}`)
}

  return (
    <div className="mt-8 p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">All Appointments</h2>
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search child’s name"
            className="border rounded-full px-4 py-2 w-full max-w-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-gray-600 text-center py-8">Loading...</div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="w-full table-auto border-collapse">
              <thead className="text-left text-gray-600 bg-gray-50">
                <tr>
                  <th className="p-4">Time</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Child's Name</th>
                  <th className="p-4">Age</th>
                  <th className="p-4">Vaccine</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-600">No appointments found</td></tr>
                ) : (
                  filteredAppointments.map((item) => {
                    // Tính tuổi
                    const birthDate = new Date(item.child.birthDate)
                    const today = new Date()
                    let age = today.getFullYear() - birthDate.getFullYear()
                    const m = today.getMonth() - birthDate.getMonth()
                    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                      age--
                    }
                    const vaccine = item.vaccineNames.join(", ")
                    let date = ""
                    if (item.appointmentDate) {
                      const d = new Date(item.appointmentDate)
                      const day = String(d.getDate()).padStart(2, '0')
                      const month = String(d.getMonth() + 1).padStart(2, '0')
                      const year = String(d.getFullYear()).slice(-2)
                      date = `${day}/${month}/${year}`
                    }
                    // Custom status styling based on new requirements
                    let customStatusStyle = ""
                    if (item.status === "Pending") {
                      customStatusStyle = "bg-gray-100 text-gray-600"
                    } else if (item.status === "Approval" || item.status === "Payed") {
                      customStatusStyle = "bg-yellow-100 text-yellow-800"
                    } else if (item.status === "Completed") {
                      customStatusStyle = "bg-green-100 text-green-700"
                    } else {
                      customStatusStyle = statusStyle[item.status] || "bg-gray-100 text-gray-600"
                    }
                    return (
                      <tr
                        key={item.appointmentId}
                        className="border-t hover:bg-blue-50 cursor-pointer transition"
                        onClick={() => handleNavigateByRoleAndStatus(item.appointmentId, item.status)}
                      >
                        <td className="p-4">{item.appointmentTime}</td>
                        <td className="p-4">{date}</td>
                        <td className="p-4">{item.child.fullName}</td>
                        <td className="p-4">{age}</td>
                        <td className="p-4">{vaccine}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${customStatusStyle}`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}