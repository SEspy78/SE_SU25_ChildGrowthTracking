import { useEffect, useState, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import VaccinationSteps from "@/Components/VaccinationStep"
import { Button as AntButton, message, DatePicker, Modal } from 'antd'
import { appointmentApi, type Appointment, type finishVaccinationPayload } from "@/api/appointmentAPI"
import { vaccinePackageApi, type VaccinePackage } from "@/api/vaccinePackageApi"
import { facilityVaccineApi, type FacilityVaccine } from "@/api/vaccineApi"
import { getUserInfo } from "@/lib/storage"
import { Button } from "@/Components/ui/button"
import dayjs from 'dayjs'

export default function DoctorConfirmVaccination() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [vaccinePackages, setVaccinePackages] = useState<VaccinePackage[]>([])
  const [facilityVaccines, setFacilityVaccines] = useState<FacilityVaccine[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingPackages, setLoadingPackages] = useState(true)
  const [loadingFacilityVaccines, setLoadingFacilityVaccines] = useState(true)
  const [error, setError] = useState("")
  const [errorPackages, setErrorPackages] = useState("")
  const [errorFacilityVaccines, setErrorFacilityVaccines] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState("")
  const [postVaccinationNotes, setPostVaccinationNotes] = useState("")
  const [facilityVaccineId, setFacilityVaccineId] = useState<number | null>(null)
  const [doseNum, setDoseNum] = useState<number>(1)
  const [expectedDateForNextDose, setExpectedDateForNextDose] = useState<string>(dayjs().format('YYYY-MM-DD'))
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [vaccinationConfirmed, setVaccinationConfirmed] = useState(false)
  const user = getUserInfo()

  // Fetch appointment data and facility vaccine details
  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        setLoading(true)
        setLoadingFacilityVaccines(true)
        if (!id) {
          setError("Không có ID lịch hẹn trong URL.")
          setAppointment(null)
          return
        }
        const appointmentRes = await appointmentApi.getAppointmentById(Number(id))
        console.log("Appointment Response:", appointmentRes)
        const appointmentData: Appointment = appointmentRes.appointments?.[0] || appointmentRes
        console.log("Appointment Data:", appointmentData)
        setAppointment(appointmentData)

        // Extract facilityVaccineIds from orderDetails or facilityVaccines
        let facilityVaccineIds: number[] = []
        if (appointmentData.order && Array.isArray(appointmentData.order.orderDetails) && appointmentData.order.orderDetails.length > 0) {
          console.log("Order Details:", appointmentData.order.orderDetails)
          facilityVaccineIds = appointmentData.order.orderDetails
            .filter(detail => detail && typeof detail.facilityVaccineId === 'number' && detail.facilityVaccineId > 0)
            .map(detail => detail.facilityVaccineId)
          console.log("Facility Vaccine IDs from Order Details:", facilityVaccineIds)
        } else if (Array.isArray(appointmentData.facilityVaccines) && appointmentData.facilityVaccines.length > 0) {
          console.log("Facility Vaccines:", appointmentData.facilityVaccines)
          facilityVaccineIds = appointmentData.facilityVaccines
            .filter(fv => fv && typeof fv.facilityVaccineId === 'number' && fv.facilityVaccineId > 0)
            .map(fv => fv.facilityVaccineId)
          console.log("Facility Vaccine IDs from Facility Vaccines:", facilityVaccineIds)
        }

        // Fetch FacilityVaccine details
        if (facilityVaccineIds.length > 0) {
          const vaccinePromises = facilityVaccineIds.map(id => facilityVaccineApi.getById(id))
          const vaccineResults = await Promise.allSettled(vaccinePromises)
          const vaccines: FacilityVaccine[] = []
          vaccineResults.forEach((result, index) => {
            if (result.status === "fulfilled") {
              const vaccine = result.value
              if (vaccine && typeof vaccine.facilityVaccineId === 'number' && vaccine.vaccine) {
                vaccines.push(vaccine)
              } else {
                console.warn(`Invalid FacilityVaccine data for ID ${facilityVaccineIds[index]}:`, vaccine)
              }
            } else {
              console.error(`Failed to fetch facility vaccine ${facilityVaccineIds[index]}:`, result.reason)
            }
          })
          console.log("Fetched Facility Vaccines:", vaccines)
          setFacilityVaccines(vaccines)
          if (vaccines.length > 0) {
            setFacilityVaccineId(vaccines[0].facilityVaccineId)
          } else {
            setErrorFacilityVaccines("Không thể tải thông tin chi tiết vắc xin.")
          }
        } else {
          setFacilityVaccines([])
          setErrorFacilityVaccines("Không có vắc xin nào được liên kết với lịch hẹn.")
        }
      } catch (err) {
        console.error("Error fetching appointment:", err)
        setError("Không thể tải thông tin lịch hẹn.")
        setAppointment(null)
        message.error("Không thể tải thông tin lịch hẹn.")
      } finally {
        setLoading(false)
        setLoadingFacilityVaccines(false)
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

  const handleBackByPosition = () => {
    if (!id) return
    const basePath = user?.position === "Doctor" ? "/doctor" : "/staff"
    navigate(`${basePath}/appointments/${id}/step-3`)
  }

  const handleDoseNumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === '' || Number(value) < 1) {
      setDoseNum(1)
    } else {
      setDoseNum(Number(value))
    }
  }

  const handleVaccineSelect = (facilityVaccineId: number) => {
    setFacilityVaccineId(facilityVaccineId)
    console.log("Selected Facility Vaccine ID:", facilityVaccineId)
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
      console.log("Vaccination Payload:", payload)
      await appointmentApi.completeVaccination(payload)
      setSubmitMessage("Xác nhận tiêm chủng thành công!")
      setVaccinationConfirmed(true)
      setAppointment({ ...appointment, status: "Completed" })
      message.success("Xác nhận tiêm chủng thành công!")
      setTimeout(() => {
        navigate(user?.position === "Doctor" ? "/doctor/appointments" : "/staff/appointments")
      }, 1200)
    } catch {
      setSubmitMessage("Có lỗi khi xác nhận tiêm chủng.")
      message.error("Có lỗi khi xác nhận tiêm chủng.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelAppointment = async () => {
    if (!id || !appointment) return
    if (!cancelReason.trim()) {
      message.error("Vui lòng nhập lý do hủy lịch hẹn.")
      return
    }
    setSubmitting(true)
    setSubmitMessage("")
    try {
      await appointmentApi.updateAppointmentStatus(appointment.appointmentId, { status: "Cancelled", note: cancelReason })
      setAppointment({ ...appointment, status: "Cancelled" })
      setSubmitMessage("Hủy lịch hẹn thành công!")
      message.success("Hủy lịch hẹn thành công!")
      setIsCancelModalVisible(false)
      setCancelReason("")
      setTimeout(() => {
        navigate(user?.position === "Doctor" ? "/doctor/appointments" : "/staff/appointments")
      }, 1200)
    } catch {
      setSubmitMessage("Có lỗi khi hủy lịch hẹn.")
      message.error("Có lỗi khi hủy lịch hẹn.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleComplete = () => {
    if (!id) return
    const basePath = user?.position === "Doctor" ? "/doctor" : "/staff"
    navigate(`${basePath}/appointments`)
  }

  if (loading || loadingPackages || loadingFacilityVaccines) return (
    <div className="p-8 text-gray-700 text-center flex justify-center items-center bg-gray-50 rounded-lg">
      <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-indigo-600 mr-2"></div>
      Đang tải thông tin...
    </div>
  )
  if (error || errorPackages || errorFacilityVaccines) return (
    <div className="p-8 text-rose-600 text-center bg-rose-50 rounded-lg">
      {error || errorPackages || errorFacilityVaccines}
    </div>
  )
  if (!appointment) return (
    <div className="p-8 text-gray-600 text-center bg-gray-50 rounded-lg">
      Không có dữ liệu lịch hẹn.
    </div>
  )

  const child = appointment.child
  const isCompletedStatus = appointment.status === "Completed"
  const isPayedStatus = appointment.status === "Paid"
  const isCancelledStatus = appointment.status === "Cancelled"

  // Extract vaccine names from facilityVaccines
  const vaccineNames = Array.isArray(appointment.facilityVaccines)
    ? appointment.facilityVaccines.map((fv) => fv.vaccine.name)
    : []

  // Find package data based on order.packageId
  const packageData = vaccinePackages.find(
    (pkg) => pkg.packageId === appointment.order?.packageId
  )
  const packageName = packageData?.name
  const packageVaccineNames = packageData?.packageVaccines
    ? packageData.packageVaccines.map((pv) => pv.facilityVaccine.vaccine.name)
    : []

  // Combine individual vaccines and package details
  const vaccineDisplayParts: string[] = []
  if (vaccineNames.length > 0) {
    vaccineDisplayParts.push(vaccineNames.join(", "))
  }
  if (packageName) {
    const packageDisplay =
      packageVaccineNames.length > 0
        ? `${packageName} (${packageVaccineNames.join(", ")})`
        : packageName
    vaccineDisplayParts.push(packageDisplay)
  }
  const vaccineDisplay =
    vaccineDisplayParts.length > 0 ? vaccineDisplayParts.join(", ") : "-"

  // Get selected facility vaccine details
  const selectedFacilityVaccine = facilityVaccines.find(fv => fv.facilityVaccineId === facilityVaccineId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-teal-50 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl p-6">
        <Button
          type="button"
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-full transition-colors mb-6"
          onClick={handleBackByPosition}
        >
          Quay lại
        </Button>
        <h2 className="text-3xl font-bold text-indigo-900 mb-6">Quy trình tiêm chủng</h2>
        <div className="mb-8">
          <VaccinationSteps currentStep={3} />
        </div>

        {/* Success Message */}
        {(isCompletedStatus || vaccinationConfirmed) && (
          <div className="mb-8 p-4 bg-emerald-100 text-emerald-800 rounded-lg flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span className="font-semibold">Tiêm chủng đã được xác nhận thành công!</span>
          </div>
        )}

        {/* Patient Information Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border-l-4 border-indigo-600">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Thông tin cuộc hẹn</h3>
          {isCancelledStatus && (
            <div className="mb-4 p-4 bg-rose-100 text-rose-700 rounded-lg">
              Lịch hẹn đã bị hủy.
            </div>
          )}
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
                <span className="font-medium text-gray-600 w-32">Gói vắc xin:</span>
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
        {!isCompletedStatus && !vaccinationConfirmed && !isCancelledStatus && isPayedStatus && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8 border-l-4 border-teal-500">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Chi tiết tiêm chủng</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-gray-600 mb-2">Vắc xin:</label>
                <div className="flex flex-wrap gap-4">
                  {facilityVaccines.length > 0 ? (
                    facilityVaccines.map(fv => (
                      <button
                        key={fv.facilityVaccineId}
                        type="button"
                        onClick={() => handleVaccineSelect(fv.facilityVaccineId)}
                        disabled={submitting}
                        className={`px-4 py-2 border rounded-lg transition-colors ${
                          facilityVaccineId === fv.facilityVaccineId
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-white text-gray-800 border-gray-300 hover:bg-teal-100 hover:border-teal-500'
                        }`}
                      >
                        {fv.vaccine?.name ? `${fv.vaccine.name} ` : `ID: ${fv.facilityVaccineId}`}
                      </button>
                    ))
                  ) : (
                    <p className="text-gray-600">Không có vắc xin nào khả dụng</p>
                  )}
                </div>
                {selectedFacilityVaccine && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p><strong>Mô tả:</strong> {selectedFacilityVaccine.vaccine?.description || 'Không có'}</p>
                    <p><strong>Nhà sản xuất:</strong> {selectedFacilityVaccine.vaccine?.manufacturer || 'Không có'}</p>
                    <p><strong>Loại:</strong> {selectedFacilityVaccine.vaccine?.category || 'Không có'}</p>
                    <p><strong>Nhóm tuổi:</strong> {selectedFacilityVaccine.vaccine?.ageGroup || 'Không có'}</p>
                    <p><strong>Tác dụng phụ:</strong> {selectedFacilityVaccine.vaccine?.sideEffects || 'Không có'}</p>
                    <p><strong>Chống chỉ định:</strong> {selectedFacilityVaccine.vaccine?.contraindications || 'Không có'}</p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-gray-600 mb-2">Số liều:</label>
                <input
                  type="number"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  value={postVaccinationNotes}
                  onChange={(e) => setPostVaccinationNotes(e.target.value)}
                  rows={4}
                  placeholder="Nhập ghi chú về phản ứng sau tiêm..."
                  disabled={submitting}
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 mt-8 items-center">
          <AntButton
            type="default"
            onClick={handleBackByPosition}
            disabled={submitting}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-full transition-colors"
          >
            Trở lại
          </AntButton>
          {!isCompletedStatus && !vaccinationConfirmed && !isCancelledStatus && (
            <AntButton
              type="default"
              onClick={() => setIsCancelModalVisible(true)}
              disabled={submitting}
              className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-2 rounded-full transition-colors"
            >
              Hủy lịch hẹn
            </AntButton>
          )}
          {!isCompletedStatus && !vaccinationConfirmed && !isCancelledStatus && isPayedStatus && (
            <AntButton
              type="primary"
              onClick={handleConfirmVaccination}
              loading={submitting}
              disabled={submitting || !facilityVaccineId || !expectedDateForNextDose || doseNum < 1}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-full transition-colors"
            >
              {submitting ? "Đang xử lý..." : "Xác nhận tiêm chủng"}
            </AntButton>
          )}
          {(isCompletedStatus || vaccinationConfirmed || isCancelledStatus || (!isPayedStatus && !isCompletedStatus && !isCancelledStatus)) && (
            <AntButton
              type="primary"
              onClick={handleComplete}
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-full transition-colors"
            >
              Hoàn thành
            </AntButton>
          )}
          {submitMessage && !vaccinationConfirmed && (
            <span className={`ml-4 font-medium ${submitMessage.includes("thành công") ? "text-emerald-600" : "text-rose-500"}`}>
              {submitMessage}
            </span>
          )}
        </div>

        {/* Cancel Appointment Modal */}
        <Modal
          title="Hủy lịch hẹn"
          open={isCancelModalVisible}
          onOk={handleCancelAppointment}
          onCancel={() => {
            setIsCancelModalVisible(false)
            setCancelReason("")
          }}
          okText="Xác nhận hủy"
          cancelText="Đóng"
          okButtonProps={{ disabled: submitting || !cancelReason.trim(), className: "bg-rose-500 hover:bg-rose-600" }}
          cancelButtonProps={{ disabled: submitting }}
        >
          <div className="mb-4">
            <label className="block text-gray-600 mb-2">Lý do hủy lịch hẹn:</label>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={4}
              placeholder="Nhập lý do hủy lịch hẹn..."
              disabled={submitting}
            />
          </div>
        </Modal>
      </div>
    </div>
  )
}