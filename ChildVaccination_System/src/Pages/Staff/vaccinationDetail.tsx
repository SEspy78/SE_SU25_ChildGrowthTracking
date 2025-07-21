import { useParams } from "react-router-dom"
import AppointmentDetail from "./appointmentDetail"
import { useEffect, useState } from "react"
import { appointmentApi } from "@/api/appointmentAPI"
import type { Appointment } from "@/api/appointmentAPI"

export default function VaccinationDetailPage() {
  const { id } = useParams()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        setLoading(true)
        const res = await appointmentApi.getAllAppointments()
        const found = res.appointments.find((a) => a.appointmentId === Number(id))
        setAppointment(found || null)
      } catch (error) {
        setAppointment(null)
      } finally {
        setLoading(false)
      }
    }
    fetchAppointment()
  }, [id])

  if (loading) return <div className="p-8">Loading...</div>
  if (!appointment) return <div className="p-8">Appointment not found.</div>

  return (
    <div>
      <AppointmentDetail appointment={appointment} />
    </div>
  )
}
