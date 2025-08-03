import { useEffect, useState, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import VaccinationSteps from "@/Components/VaccinationStep"
import { Button as AntButton, message, DatePicker, Select } from 'antd'
import { appointmentApi, type Appointment, type finishVaccinationPayload } from "@/api/appointmentAPI"
import { vaccinePackageApi, type VaccinePackage } from "@/api/vaccinePackageApi"
import { getUserInfo } from "@/lib/storage"
import { Button } from "@/Components/ui/button"
import { CheckCircleIcon } from "@heroicons/react/24/solid"
import dayjs from 'dayjs'

const { Option } = Select

export default function ConfirmVaccination() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [vaccinePackages, setVaccinePackages] = useState<VaccinePackage[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingPackages, setLoadingPackages] = useState(true)
  const [error, setError] = useState("")
  const [errorPackages, setErrorPackages] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState("")
  const [postVaccinationNotes, setPostVaccinationNotes] = useState("")
  const [facilityVaccineId, setFacilityVaccineId] = useState<number | null>(null)
  const [doseNum, setDoseNum] = useState<number>(1)
  const [expectedDateForNextDose, setExpectedDateForNextDose] = useState<string>(dayjs().format('YYYY-MM-DD'))
  const user = getUserInfo()

  // Fetch appointment data
  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        setLoading(true)
        if (!id) {
          setError("Không có ID lịch hẹn trong URL.")
          setAppointment(null)
          return
        }
        const res = await appointmentApi.getAppointmentById(Number(id))
        console.log("Appointment Response:", res)
        const appointmentData: Appointment = res.appointments?.[0] || res
        console.log("Appointment Data:", appointmentData)
        setAppointment(appointmentData)
        // Pre-select the first facilityVaccineId if facilityVaccines is available
        if (Array.isArray(appointmentData.facilityVaccines) && appointmentData.facilityVaccines.length > 0) {
          setFacilityVaccineId(appointmentData.facilityVaccines[0].facilityVaccineId)
        }
      } catch {
        setError("Không thể tải thông tin lịch hẹn.")
        setAppointment(null)
        message.error("Không thể tải thông tin lịch hẹn.")
      } finally {
        setLoading(false)
      }
    }
    fetchAppointment()
  }, [id])

  // Derive facilityId from appointment or fallback to 5
  const facilityId = useMemo(() => {
    return appointment?.facilityVaccines[0]?.facilityId || appointment?.order?.orderDetails[0]?.facilityVaccineId || 5
  }, [appointment])

  // Fetch vaccine packages when facilityId changes
  useEffect(() => {
    const fetchVaccinePackages = async () => {
      try {
        setLoadingPackages(true)
        const packageRes = await vaccinePackageApi.getAll(facilityId)
        setVaccinePackages(packageRes.data || [])
      } catch {
        setErrorPackages("Không thể tải danh sách gói vắc xin.")
        setVaccinePackages([])
      } finally {
        setLoadingPackages(false)
      }
    }
    if (facilityId) {
      fetchVaccinePackages()
    }
  }, [facilityId])

  // Function to calculate age
  const calculateAge = (birthDate: string): string => {
    if (!birthDate) return "Không có"
    const birth = new Date(birthDate)
    const today = new Date()
    if (isNaN(birth.getTime())) return "Không có"

    const diffMs = today.getTime() - birth.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffMonths = Math.floor(diffDays / 30.436875) // Average month length
    const diffWeeks = Math.floor(diffDays / 7)

    if (diffMonths >= 12) {
      const years = Math.floor(diffMonths / 12)
      return `${years} tuổi`
    } else if (diffMonths > 0) {
      return `${diffMonths} tháng tuổi`
    } else {
      return `${diffWeeks} tuần tuổi`
    }
  }

  const handleDoseNumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === '' || Number(value) < 1) {
      setDoseNum(1)
    } else {
      setDoseNum(Number(value))
    }
  }

  const handleConfirmVaccination = async () => {
    if (!id || !appointment || !facilityVaccineId || !expectedDateForNextDose || doseNum < 1) {
      setSubmitMessage("Vui lòng nhập đầy đủ thông tin hợp lệ.")
      message.error("Vui lòng nhập đầy đủ thông tin hợp lệ.")
      return
    }
    setSubmitting(true)
    setSubmitMessage("")
    try {
      const payload: finishVaccinationPayload = {
        appointmentId: Number(id),
        facilityVaccineId,
        note: postVaccinationNotes || "Tiêm chủng hoàn tất bởi bác sĩ",
        doseNumber: doseNum,
        expectedDateForNextDose,
      }
      console.log("Sending payload:", payload)
      await appointmentApi.completeVaccination(payload)
      setSubmitMessage("Xác nhận tiêm chủng thành công!")
      message.success("Xác nhận tiêm chủng thành công!")
      setTimeout(() => {
        navigate(`/${user?.role.toLowerCase()}/appointments/${id}/step-5`)
      }, 1200)
    } catch {
      setSubmitMessage("Có lỗi khi xác nhận tiêm chủng.")
      message.error("Có lỗi khi xác nhận tiêm chủng.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleComplete = () => {
    const basePath = user?.position === "Doctor" ? "/doctor" : "/staff"
    navigate(`${basePath}/appointments`)
  }

  const handleBack = () => {
    if (!id) return
    const basePath = user?.role === "Doctor" ? "/doctor" : "/staff"
    navigate(`${basePath}/appointments/${id}/step-3`)
  }

  if (loading || loadingPackages) return (
    <div className="mt-8 p-6 bg-white shadow rounded-xl max-w-4xl mx-auto">
      <div className="text-gray-600 text-center">Đang tải thông tin...</div>
    </div>
  )
  if (error || errorPackages) return (
    <div className="mt-8 p-6 bg-white shadow rounded-xl max-w-4xl mx-auto">
      <div className="text-red-500 text-center">{error || errorPackages}</div>
    </div>
  )
  if (!appointment) return (
    <div className="mt-8 p-6 bg-white shadow rounded-xl max-w-4xl mx-auto">
      <div className="text-gray-600 text-center">Không có dữ liệu lịch hẹn.</div>
    </div>
  )

  const child = appointment.child
  const isCompletedStatus = appointment.status === "Completed"
  const isPayedStatus = appointment.status === "Paid"
  const isApprovalOrPending = appointment.status === "Approval" || appointment.status === "Pending"

  // Extract vaccine names from facilityVaccines
  const vaccineNames = Array.isArray(appointment.facilityVaccines)
    ? appointment.facilityVaccines.map(fv => fv.vaccine.name)
    : []

  // Find package data based on order.packageId
  const packageData = vaccinePackages.find(pkg => pkg.packageId === appointment.order?.packageId)
  const packageName = packageData?.name
  const packageVaccineNames = packageData?.packageVaccines
    ? packageData.packageVaccines.map(pv => pv.facilityVaccine.vaccine.name)
    : []

  // Combine individual vaccines and package details
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
    : "-"

  return (
    <div className="mt-8 p-6 bg-white shadow rounded-xl">
      <Button
        type="button"
        className="bg-gray-300 hover:bg-blue-400 text-black px-6 py-2 rounded-full"
        onClick={handleComplete}
      >
        Quay lại
      </Button>
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 bg-gradient-to-r from-blue-500 to-green-500 text-white p-4 rounded-t-lg">
          Quy trình tiêm chủng
        </h2>
        <div className="mb-8">
          <VaccinationSteps currentStep={isCompletedStatus ? 5 : 3} />
        </div>

        <h1 className="text-xl font-bold my-4"> Xác nhận tiêm chủng</h1>
        
         {!isCompletedStatus && isPayedStatus && !submitting && (
          <div className="my-8 text-center">
            <p className="text-lg font-medium text-gray-700 mb-4">⏳ Đang chờ bác sĩ thực hiện tiêm chủng...</p>
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 mx-auto" />
          </div>
        )} 
        {isApprovalOrPending && (
          <div className="mb-8 p-4 bg-rose-100 text-rose-700 rounded-lg flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span className="font-semibold">Vui lòng hoàn thành khảo sát trước khi tiêm và thanh toán để tiếp tục.</span>
          </div>
        )}

        {/* Completion Message Card */}
        {isCompletedStatus && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Trạng thái tiêm chủng</h3>
            <div className="flex items-center justify-center space-x-2 p-4 bg-green-100 text-green-700 rounded-lg">
              <CheckCircleIcon className="w-6 h-6" />
              <span className="text-lg font-medium">
                Đã tiêm xong! Bệnh nhân đã hoàn thành quá trình tiêm chủng.
              </span>
            </div>
          </div>
        )}

        {/* Patient Information Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Thông tin bệnh nhân</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Tên bệnh nhân:</span>
                <span className="text-gray-800">{child?.fullName || '-'}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Tuổi:</span>
                <span className="text-gray-800">{child?.birthDate ? calculateAge(child.birthDate) : '-'}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Tên phụ huynh:</span>
                <span className="text-gray-800">{appointment.memberName || '-'}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Liên hệ:</span>
                <span className="text-gray-800">{appointment.memberPhone || '-'}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Ngày tiêm chủng:</span>
                <span className="text-gray-800">
                  {appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString('vi-VN') : '-'}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Vắc xin:</span>
                <span className="text-gray-800">{vaccineDisplay}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Nhóm máu:</span>
                <span className="text-gray-800">{child?.bloodType || '-'}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Dị ứng:</span>
                <span className="text-gray-800">{child?.allergiesNotes || 'Không có'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Vaccination Details Card */}
        {/* {!isCompletedStatus && isPayedStatus && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Chi tiết tiêm chủng</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-gray-600 mb-2">Vắc xin:</label>
                <Select
                  className="w-full"
                  value={facilityVaccineId}
                  onChange={(value) => setFacilityVaccineId(value)}
                  disabled={submitting}
                  placeholder="Chọn vắc xin"
                >
                  {Array.isArray(appointment.facilityVaccines) && appointment.facilityVaccines.length > 0
                    ? appointment.facilityVaccines.map(fv => (
                        <Option key={fv.facilityVaccineId} value={fv.facilityVaccineId}>
                          {fv.vaccine.name} (ID: {fv.facilityVaccineId})
                        </Option>
                      ))
                    : <Option value="" disabled>Không có vắc xin nào khả dụng</Option>}
                </Select>
              </div>
              <div>
                <label className="block text-gray-600 mb-2">Số liều:</label>
                <input
                  type="number"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={doseNum}
                  onChange={handleDoseNumChange}
                  min="1"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-gray-600 mb-2">Ngày dự kiến liều tiếp theo:</label>
                <DatePicker
                  className="w-full"
                  value={expectedDateForNextDose ? dayjs(expectedDateForNextDose) : null}
                  onChange={(date) => setExpectedDateForNextDose(date ? date.format('YYYY-MM-DD') : '')}
                  format="DD/MM/YYYY"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-gray-600 mb-2">Ghi chú sau tiêm:</label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={postVaccinationNotes}
                  onChange={(e) => setPostVaccinationNotes(e.target.value)}
                  rows={4}
                  placeholder="Nhập ghi chú về phản ứng sau tiêm..."
                  disabled={submitting}
                />
              </div>
            </div>
          </div>
        )} */}

        {/* Status Message */}
        {/* {!isCompletedStatus && isPayedStatus && !submitting && (
          <div className="my-8 text-center">
            <p className="text-lg font-medium text-gray-700 mb-4">⏳ Đang chờ bác sĩ thực hiện tiêm chủng...</p>
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 mx-auto" />
          </div>
        )}
        {isApprovalOrPending && (
          <div className="my-8 text-center">
            <p className="text-2xl font-medium text-gray-700 mb-4">
              Vui lòng hoàn thành check-in và thanh toán để tiếp tục
            </p>
          </div>
        )} */}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 mt-8 items-center">
          <AntButton
            type="default"
            onClick={handleBack}
            disabled={submitting}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-full transition-colors"
          >
            Trở lại
          </AntButton>
          {isPayedStatus && !isCompletedStatus && (
            <AntButton
              type="primary"
              onClick={handleConfirmVaccination}
              loading={submitting}
              disabled={submitting || !facilityVaccineId || !expectedDateForNextDose || doseNum < 1}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full transition-colors"
            >
              {submitting ? "Đang xử lý..." : "Xác nhận tiêm chủng"}
            </AntButton>
          )}
          {isCompletedStatus && (
            <AntButton
              type="primary"
              onClick={handleComplete}
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full transition-colors"
            >
              Hoàn thành
            </AntButton>
          )}
          {submitMessage && (
            <span className={`ml-4 font-medium ${submitMessage.includes("thành công") ? "text-green-600" : "text-red-500"}`}>
              {submitMessage}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}