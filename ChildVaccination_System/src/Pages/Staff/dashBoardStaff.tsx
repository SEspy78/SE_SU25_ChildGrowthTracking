import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getUserInfo } from "@/lib/storage"
import { appointmentApi, type AppointmentResponse, type Appointment } from "../../api/appointmentAPI"
import { vaccinePackageApi, type VaccinePackageResponse, type VaccinePackage } from "../../api/vaccinePackageApi"

const statusStyle: Record<string, string> = {
  Scheduled: "bg-indigo-600 text-white",
  Confirmed: "bg-teal-500 text-white",
  Completed: "bg-emerald-500 text-white",
  Cancelled: "bg-rose-500 text-white",
  Pending: "bg-gray-600 text-white",
  Approval: "bg-amber-500 text-white",
  Paid: "bg-yellow-400 text-gray-900",
}

export default function DashboardStaff() {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [vaccinePackages, setVaccinePackages] = useState<VaccinePackage[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [loadingPackages, setLoadingPackages] = useState<boolean>(true)
  const [error, setError] = useState<string>("")
  const [errorPackages, setErrorPackages] = useState<string>("")
  const [search, setSearch] = useState<string>("")
  const [pendingCount, setPendingCount] = useState<number>(0)
  const [completedCount, setCompletedCount] = useState<number>(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res: AppointmentResponse = await appointmentApi.getAllAppointments()
        setAppointments(res.appointments || [])
        setPendingCount(res.pendingCount || 0)
        setCompletedCount(res.completedCount || 0)
      } catch {
        setError("Không thể tải danh sách cuộc hẹn.")
        setAppointments([])
        setPendingCount(0)
        setCompletedCount(0)
      } finally {
        setLoading(false)
      }

      try {
        setLoadingPackages(true)
        // Assuming facilityId = 5 based on JSON data; replace with actual facilityId if available
        const facilityId = 5
        const packageRes: VaccinePackageResponse = await vaccinePackageApi.getAll(facilityId)
        setVaccinePackages(packageRes.data || [])
      } catch {
        setErrorPackages("Không thể tải danh sách gói vắc xin.")
        setVaccinePackages([])
      } finally {
        setLoadingPackages(false)
      }
    }
    fetchData()
  }, [])

  const filteredAppointments = appointments
    .filter(item => item.child.fullName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.appointmentId - a.appointmentId) // Sort by appointmentId in descending order

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
      case "Paid":
        stepIndex = 2 // Step 3
        break
      case "Completed":
        stepIndex = 3 // Step 5
        break
      default:
        stepIndex = 0 // Default to Step 1 for other statuses
    }
    const basePath = user?.position === "Doctor" ? "/doctor/appointments" : "/staff/appointments"
    navigate(`${basePath}/${appointmentId}/step-${stepIndex + 1}`)
  }

  // Function to calculate age
  const calculateAge = (birthDate: string): string => {
    if (!birthDate) return "Không có"

    const birth = new Date(birthDate)
    const today = new Date()

    if (isNaN(birth.getTime())) return "Không có"

    // Calculate the difference in milliseconds
    const diffTime = today.getTime() - birth.getTime()
    
    // Convert to days
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    // Calculate weeks, months, and years
    const weeks = Math.floor(diffDays / 7)
    const months = Math.floor(diffDays / 30.42) // Average days in a month
    const years = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    const dayDiff = today.getDate() - birth.getDate()

    // Adjust years if the birthday hasn't occurred this year
    let adjustedYears = years
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      adjustedYears--
    }

    // Determine the appropriate unit
    if (diffDays <= 90) {
      // Less than or equal to 3 months, show in weeks
      return `${weeks} tuần`
    } else if (months < 24) {
      // Less than 2 years, show in months
      return `${months} tháng`
    } else {
      // 2 years or older, show in years
      return `${adjustedYears} tuổi`
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-teal-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-indigo-900 mb-6">Tất cả lịch hẹn</h2>
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-100 p-4 rounded-lg shadow-md border-l-4 border-gray-600">
            <h3 className="text-lg font-semibold text-gray-800">Lịch hẹn đang chờ</h3>
            <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
          </div>
          <div className="bg-emerald-100 p-4 rounded-lg shadow-md border-l-4 border-emerald-500">
            <h3 className="text-lg font-semibold text-gray-800">Lịch hẹn đã hoàn thành</h3>
            <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
          </div>
        </div>
        <div className="mb-6">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên trẻ"
            className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 transition bg-white"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading || loadingPackages ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600"></div>
            <span className="ml-4 text-gray-700 text-lg">Đang tải...</span>
          </div>
        ) : error || errorPackages ? (
          <div className="bg-rose-100 text-rose-700 p-6 rounded-lg text-center">
            {error || errorPackages}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="w-full table-auto border-collapse">
              <thead className="bg-indigo-700 text-white">
                <tr>
                  <th className="p-4 text-left font-semibold">Giờ</th>
                  <th className="p-4 text-left font-semibold">Ngày</th>
                  <th className="p-4 text-left font-semibold">Tên trẻ</th>
                  <th className="p-4 text-left font-semibold">Tuổi</th>
                  <th className="p-4 text-left font-semibold">Vắc xin/Gói</th>
                  <th className="p-4 text-left font-semibold">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-600">
                      Không tìm thấy lịch hẹn
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((item, index) => {
                    // Get vaccine names from facilityVaccines
                    const vaccineNames = Array.isArray(item.facilityVaccines)
                      ? item.facilityVaccines.map((fv) => fv.vaccine.name)
                      : []
                    // Get package name and vaccines from order.packageId
                    const packageData = vaccinePackages.find(pkg => pkg.packageId === item.order?.packageId)
                    const packageName = packageData?.name
                    const packageVaccineNames = packageData?.packageVaccines
                      ? packageData.packageVaccines.map(pv => pv.facilityVaccine.vaccine.name)
                      : []
                    // Combine vaccine and package
                    const vaccineDisplayParts: string[] = []
                    if (vaccineNames.length > 0) {
                      vaccineDisplayParts.push(vaccineNames.join(", "))
                    }
                    if (packageName) {
                      const packageDisplay = packageVaccineNames.length > 0
                        ? `${packageName} (${packageVaccineNames.join(", ")})`
                        : packageName
                      vaccineDisplayParts.push(packageDisplay)
                    }
                    const vaccineDisplay = vaccineDisplayParts.length > 0
                      ? vaccineDisplayParts.join(", ")
                      : "Không có vắc xin"
                    // Format date
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
                        className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-indigo-100 cursor-pointer transition-colors duration-200`}
                        onClick={() => handleNavigateByRoleAndStatus(item.appointmentId, item.status)}
                      >
                        <td className="p-4 text-gray-800">{item.appointmentTime}</td>
                        <td className="p-4 text-gray-800">{date}</td>
                        <td className="p-4 text-gray-800 font-medium">{item.child.fullName}</td>
                        <td className="p-4 text-gray-800">{calculateAge(item.child.birthDate)}</td>
                        <td className="p-4 text-gray-800">{vaccineDisplay}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium shadow-sm ${statusStyle[item.status] || 'bg-gray-600 text-white'}`}>
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