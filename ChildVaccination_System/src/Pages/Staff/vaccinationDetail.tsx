import { useParams } from "react-router-dom"
import AppointmentDetail from "./appointmentDetail"

const appointments = [
  { id: 1, time: "09:00", name: "James Wilson", age: "4", vaccine: "MMR", status: "Scheduled" },
  { id: 2, time: "09:30", name: "Emma Davis", age: "2", vaccine: "DPT", status: "Completed" },
  { id: 3, time: "10:00", name: "Lucas Smith", age: "18m", vaccine: "Polio", status: "Scheduled" },
  { id: 4, time: "10:30", name: "Sophia Brown", age: "3", vaccine: "Hepatitis B", status: "Canceled" },
  { id: 5, time: "11:00", name: "Oliver Taylor", age: "1", vaccine: "DPT", status: "Examined" },
]

export default function VaccinationDetailPage() {
  const { id } = useParams()
  const appointment = appointments.find((a) => a.id === Number(id))

  if (!appointment) return <div className="p-8">Appointment not found.</div>

  return (
    <div >
      <AppointmentDetail appointment={appointment} />
    </div>
  )
}
