import { useState } from "react"
import { Syringe } from "lucide-react"
import { useNavigate } from "react-router-dom"



const appointments = [
  { id: 1, time: "09:00", name: "James Wilson", age: "4", vaccine: "MMR", status: "Scheduled" },
  { id: 2, time: "09:30", name: "Emma Davis", age: "2", vaccine: "DPT", status: "Completed" },
  { id: 3, time: "10:00", name: "Lucas Smith", age: "18m", vaccine: "Polio", status: "Scheduled" },
  { id: 4, time: "10:30", name: "Sophia Brown", age: "3", vaccine: "Hepatitis B", status: "Canceled" },
  { id: 5, time: "11:00", name: "Oliver Taylor", age: "1", vaccine: "DPT", status: "Examined" },
]

const statusStyle: Record<string, string> = {
  Scheduled: "bg-blue-100 text-blue-600",
  Completed: "bg-green-100 text-green-700",
  Canceled: "bg-red-100 text-red-600",
  Examined: "bg-yellow-100 text-yellow-800",
}

export default function DashboardStaff() {

  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen">

      {/* Main Content */}
      <main className="flex-1 p-8 bg-gray-50 overflow-y-auto">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search child’s name"
            className="border rounded-full px-4 py-2 w-80 shadow-sm focus:outline-none focus:ring"
          />
        </div>

        <h2 className="text-2xl font-semibold mb-4">Today's Appointments</h2>

        <table className="min-w-full bg-white rounded-xl shadow overflow-hidden">
          <thead className="text-left text-gray-600 bg-gray-50">
            <tr>
              <th className="p-4">Time</th>
              <th className="p-4">Child's Name</th>
              <th className="p-4">Age</th>
              <th className="p-4">Vaccine</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((item) => (
              <tr
                key={item.id}
                className="border-t hover:bg-blue-50 cursor-pointer transition"
                onClick={() => navigate(`/staff/appointments/${item.id}/step-1`)}
              >
                <td className="p-4">{item.time}</td>
                <td className="p-4">{item.name}</td>
                <td className="p-4">{item.age}</td>
                <td className="p-4">{item.vaccine}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusStyle[item.status]}`}>
                    {item.status}
                  </span>
                </td>
                <td className="p-4">
                  {item.status === "Scheduled" && (
                    <button className="bg-rose-300 hover:bg-rose-400 text-white px-3 py-1 rounded">
                      Confirm Vaccination
                    </button>
                  )}
                  {item.status === "Completed" && (
                    <button className="bg-violet-500 hover:bg-violet-600 text-white px-3 py-1 rounded">
                      Check Report
                    </button>
                  )}
                  {item.status === "Examined" && (
                    <button className="bg-rose-300 hover:bg-rose-400 text-white px-3 py-1 rounded">
                      Confirm Vaccination
                    </button>
                  )}
                  {item.status === "Canceled" && (
                    <span className="text-gray-400 italic">No action</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

      </main>
    </div>
  )
}


