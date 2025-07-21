import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getUserInfo } from "@/lib/storage";
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

  // Hàm điều hướng theo role
  const handleNavigateByRole = (appointmentId: number) => {
    const user = getUserInfo();
    if (user?.role === "Doctor") {
      navigate(`/doctor/appointments/${appointmentId}/step-1`);
    } else {
      navigate(`/staff/appointments/${appointmentId}/step-1`);
    }
  };

  return (
    <div className="flex min-h-screen">
      <main className="flex-1 p-8 bg-gray-50 overflow-y-auto">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search child’s name"
            className="border rounded-full px-4 py-2 w-80 shadow-sm focus:outline-none focus:ring"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <h2 className="text-2xl font-semibold mb-4">All Appointments</h2>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <table className="min-w-full bg-white rounded-xl shadow overflow-hidden">
            <thead className="text-left text-gray-600 bg-gray-50">
              <tr>
                <th className="p-4">Time</th>
                <th className="p-4">Date</th>
                <th className="p-4">Child's Name</th>
                <th className="p-4">Age</th>
                <th className="p-4">Vaccine</th>
                <th className="p-4">Status</th>
                {/* <th className="p-4">Actions</th> */}
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8">No appointments found</td></tr>
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
                  return (
                    <tr
                      key={item.appointmentId}
                      className="border-t hover:bg-blue-50 cursor-pointer transition"
                      onClick={() => handleNavigateByRole(item.appointmentId)}
                    >
                      <td className="p-4">{item.appointmentTime}</td>
                      <td className="p-4">{date}</td>
                      <td className="p-4">{item.child.fullName}</td>
                      <td className="p-4">{age}</td>
                      <td className="p-4">{vaccine}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusStyle[item.status] || "bg-gray-100 text-gray-600"}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        )}
      </main>
    </div>
  )
}


