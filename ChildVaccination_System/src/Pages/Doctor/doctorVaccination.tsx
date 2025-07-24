import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import VaccinationSteps from "@/Components/VaccinationStep"
import { Button } from "@/Components/ui/button"
import { appointmentApi, type Appointment } from "@/api/appointmentAPI"
import { surveyAPI } from "@/api/surveyAPI"
import { message, Collapse, Button as AntButton } from 'antd'
import { CaretRightOutlined } from '@ant-design/icons'
import { getUserInfo } from "@/lib/storage"

interface SurveyAnswer {
  questionText: string
  answerText: string
}

export default function DoctorConfirmVaccination() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [surveyAnswers, setSurveyAnswers] = useState<SurveyAnswer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState("")
  const [isAnswersVisible, setIsAnswersVisible] = useState(false)

  useEffect(() => {
    const fetchAppointmentAndSurvey = async () => {
      try {
        setLoading(true)
        if (!id) {
          setError("No appointment ID provided in the URL.")
          setAppointment(null)
          setSurveyAnswers([])
          return
        }
        // Fetch appointment
        const appointmentRes = await appointmentApi.getAppointmentById(Number(id))
        const appointmentData = (appointmentRes as any).data || appointmentRes
        setAppointment(appointmentData)

        // Fetch survey answers for Payed or Completed status
        if (appointmentData.status === "Payed" || appointmentData.status === "Completed") {
          try {
            const surveyRes = await surveyAPI.getSurveyResponse(appointmentData.appointmentId)
            setSurveyAnswers(surveyRes.data || [])
          } catch (surveyError) {
            setSurveyAnswers([])
            message.error("Không thể tải thông tin khảo sát sức khỏe.")
          }
        } else {
          setSurveyAnswers([])
        }
      } catch (error) {
        setError("Không thể tải thông tin lịch hẹn.")
        setAppointment(null)
        setSurveyAnswers([])
        message.error("Không thể tải thông tin lịch hẹn.")
      } finally {
        setLoading(false)
      }
    }
    fetchAppointmentAndSurvey()
  }, [id])

  const handleConfirmVaccination = async () => {
    if (!id || !appointment) return
    setSubmitting(true)
    setSubmitMessage("")
    try {
      await appointmentApi.updateAppointmentStatus(Number(id), {
        status: "Completed",
        note: "Vaccination completed by doctor",
      })
      setSubmitMessage("Xác nhận tiêm chủng thành công!")
      message.success("Xác nhận tiêm chủng thành công!")
      setTimeout(() => {
        navigate(`/doctor/appointments/${id}/step-5`)
      }, 1200)
    } catch (error) {
      setSubmitMessage("Có lỗi khi xác nhận tiêm chủng.")
      message.error("Có lỗi khi xác nhận tiêm chủng.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleContinue = () => {
    if (!id) return
    const user = getUserInfo()
    const basePath = user?.position === "Doctor" ? "/doctor" : "/staff"
    navigate(`${basePath}/appointments/${id}/step-5`)
  }

  if (loading) return <div className="p-8 text-gray-600 text-center">Đang tải thông tin...</div>
  if (error) return <div className="p-8 text-red-500 text-center">{error}</div>
  if (!appointment) return <div className="p-8 text-gray-600 text-center">Không có dữ liệu lịch hẹn.</div>

  const child = appointment.child
  const isCompletedStatus = appointment.status === "Completed"
  const isPayedStatus = appointment.status === "Payed"

  return (
    <div className="mt-8 p-6 bg-white shadow rounded-xl">
      <h2 className="text-xl font-semibold mb-4">Vaccination Process</h2>
      <VaccinationSteps currentStep={3} />

      <h1 className="text-xl font-bold my-4">💉 Confirm Vaccination</h1>

      {/* Patient Information */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <p><strong>Patient Name:</strong> {child?.fullName || '-'}</p>
          <p><strong>Age:</strong> 
            {(() => {
              if (child?.birthDate) {
                const birth = new Date(child.birthDate)
                const now = new Date()
                let age = now.getFullYear() - birth.getFullYear()
                const m = now.getMonth() - birth.getMonth()
                if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
                return age > 0 ? `${age} tuổi` : '-'
              }
              return '-'
            })()}
          </p>
          <p><strong>Parent’s Name:</strong> {appointment.memberName || '-'}</p>
          <p><strong>Contact:</strong> {appointment.memberPhone || '-'}</p>
          <p><strong>Vaccination Date:</strong> 
            {appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString('vi-VN') : '-'}
          </p>
        </div>
        <div>
          <p><strong>Vaccine:</strong> 
            {Array.isArray(appointment.vaccineNames) && appointment.vaccineNames.length > 0 
              ? appointment.vaccineNames.join(", ") 
              : '-'}
          </p>
          <p><strong>Blood Type:</strong> {child?.bloodType || '-'}</p>
          <p><strong>Allergies:</strong> {child?.allergiesNotes || '-'}</p>
        </div>
      </div>

      {/* Survey Answers */}
      {(isPayedStatus || isCompletedStatus) && surveyAnswers.length > 0 && (
        <>
          <AntButton
            type="primary"
            icon={<CaretRightOutlined />}
            onClick={() => setIsAnswersVisible(!isAnswersVisible)}
            className="mb-4"
          >
            {isAnswersVisible ? "Hide Survey Answers" : "Show Survey Answers"}
          </AntButton>
          <Collapse activeKey={isAnswersVisible ? ['1'] : []} className="mb-8">
            <Collapse.Panel header="Survey Answers" key="1">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-blue-700 mb-4 border-b pb-2">Survey Questions & Answers</h3>
                <ul className="space-y-4">
                  {surveyAnswers.map((ans, idx) => (
                    <li key={idx} className="border p-4 rounded bg-gray-50">
                      <span className="font-medium text-gray-800">{ans.questionText}</span>
                      <div className="mt-2">
                        <span className="text-blue-700">Answer: {ans.answerText}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </Collapse.Panel>
          </Collapse>
        </>
      )}
      {(isPayedStatus || isCompletedStatus) && surveyAnswers.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Survey Answers</h3>
          <p className="text-gray-600">Không có dữ liệu khảo sát sức khỏe.</p>
        </div>
      )}

      {/* Status Message */}
      <div className="text-center my-8">
        {isCompletedStatus ? (
          <>
            <p className="text-lg font-semibold text-green-600 mb-4">✅ Đã tiêm xong!</p>
            <p className="text-gray-600">Bệnh nhân đã hoàn thành quá trình tiêm chủng ở bước này.</p>
          </>
        ) : isPayedStatus ? (
          <>
            <p className="text-lg font-medium text-gray-700 mb-4">⏳ Đang chờ bác sĩ thực hiện tiêm chủng...</p>
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 mx-auto" />
          </>
        ) : (
          <p className="text-lg font-medium text-gray-700 mb-4">
            Vui lòng hoàn thành check-in và thanh toán để tiếp tục
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-6">
        <Button
          type="button"
          className="bg-gray-300 hover:bg-gray-400 text-black px-6 py-2 rounded-full"
          onClick={() => window.history.back()}
        >
          Back
        </Button>
        {isPayedStatus && (
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full"
            onClick={handleConfirmVaccination}
            disabled={submitting}
          >
            {submitting ? "Đang xử lý..." : "Confirm Vaccination"}
          </Button>
        )}
        {isCompletedStatus && (
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full"
            onClick={handleContinue}
            disabled={submitting}
          >
            Continue
          </Button>
        )}
        {submitMessage && (
          <span className={`ml-4 font-medium ${submitMessage.includes("thành công") ? "text-green-600" : "text-red-500"}`}>
            {submitMessage}
          </span>
        )}
      </div>
    </div>
  )
}