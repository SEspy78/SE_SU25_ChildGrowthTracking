

// import { useNavigate, useParams } from "react-router-dom"
// import { getUserInfo } from "@/lib/storage"
// import VaccinationSteps from "@/Components/VaccinationStep"
// import { Button } from "@/Components/ui/button"
// import { useEffect, useState } from "react"
// import { appointmentApi, type Appointment } from "@/api/appointmentAPI"
// import { surveyAPI, type Survey, type Question } from "@/api/surveyAPI"
// import { Collapse, Button as AntButton, Select, message } from 'antd'
// import { CaretRightOutlined } from '@ant-design/icons'

// const { Option } = Select

// export default function HealthSurvey() {
//   const [showSurveySelect, setShowSurveySelect] = useState(true)
//   const [surveyAnswers, setSurveyAnswers] = useState<any[]>([])
//   const [answers, setAnswers] = useState<Record<number, string>>({})
//   const [submitting, setSubmitting] = useState(false)
//   const [submitMessage, setSubmitMessage] = useState("")
//   const [isAnswersVisible, setIsAnswersVisible] = useState(false)
//   const navigate = useNavigate()
//   const { id } = useParams()
//   const [appointment, setAppointment] = useState<Appointment | null>(null)
//   const [loading, setLoading] = useState(true)
//   const [surveys, setSurveys] = useState<Survey[]>([])
//   const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null)
//   const [surveyQuestions, setSurveyQuestions] = useState<Question[]>([])
//   const [loadingQuestions, setLoadingQuestions] = useState(false)
//     const user = getUserInfo()

//   useEffect(() => {
//     const fetchAppointment = async () => {
//       try {
//         setLoading(true)
//         if (id) {
//           const res = await appointmentApi.getAppointmentById(Number(id))
//           const appointmentData = (res as any).data || res
//           setAppointment(appointmentData)
//           if (appointmentData && appointmentData.status === "Approval") {
//             setShowSurveySelect(false)
//             const response = await surveyAPI.getSurveyResponse(appointmentData.appointmentId)
//             setSurveyAnswers(response.data || [])
//           } else {
//             setShowSurveySelect(true)
//           }
//         } else {
//           setAppointment(null)
//         }
//       } catch (error) {
//         setAppointment(null)
//       } finally {
//         setLoading(false)
//       }
//     }
//     fetchAppointment()
//   }, [id])

//   useEffect(() => {
//     const fetchSurveys = async () => {
//       try {
//         const res = await surveyAPI.getAllSurveys()
//         setSurveys(res.data || [])
//       } catch {
//         setSurveys([])
//       }
//     }
//     fetchSurveys()
//   }, [])

//   useEffect(() => {
//     if (!selectedSurvey) {
//       setSurveyQuestions([])
//       return
//     }
//     setLoadingQuestions(true)
//     surveyAPI.getSurveybyId(selectedSurvey.surveyId)
//       .then(res => setSurveyQuestions(res.data || []))
//       .catch(() => setSurveyQuestions([]))
//       .finally(() => setLoadingQuestions(false))
//   }, [selectedSurvey])

//   const handleBack = () => {
//     navigate(`/staff/appointments/${id}/step-1`)
//   }

//   const handleChangeAnswer = (questionId: number, value: string) => {
//     setAnswers(prev => ({ ...prev, [questionId]: value }))
//   }

//     const handleBackByPosition = () => {
//     if (user?.position === "Doctor") {
//       navigate("/doctor/appointments")
//     } else {
//       navigate("/staff/appointments")
//     }
//   }

//   const handleSubmit = async () => {
//     if (!appointment || !selectedSurvey) {
//       message.error("Please select a survey before submitting.")
//       return
//     }
//     setSubmitting(true)
//     setSubmitMessage("")
//     try {
//       const answerPayload = surveyQuestions.map(q => ({
//         questionId: q.questionId,
//         answerId: null,
//         answerText: answers[q.questionId] || ""
//       }))
//       await surveyAPI.submitSurveyAnswer(appointment.appointmentId, answerPayload)
//       await appointmentApi.updateAppointmentStatus(appointment.appointmentId, { status: "Approval", note: "" })
//       setSubmitMessage("Survey answers saved successfully")
//       message.success("Survey answers saved successfully")
//       setTimeout(() => {
//         navigate(`/staff/appointments/${id}/step-3`)
//       }, 1200)
//     } catch (error) {
//       setSubmitMessage("Error saving survey answers")
//       message.error("Error saving survey answers")
//     } finally {
//       setSubmitting(false)
//     }
//   }

//   if (loading) return <div className="p-8 text-gray-600 text-center">Loading...</div>
//   if (!appointment) return <div className="p-8 text-gray-600 text-center">Appointment not found.</div>

//   const child = appointment.child

//   return (
//     <div className="mt-8 p-6 bg-white shadow rounded-xl">
//       <Button
//                     type="button"
//                     className="bg-gray-300 hover:bg-blue-400 text-black px-6 py-2 rounded-full transition-colors"
//                     onClick={ handleBackByPosition }
//                   >
//                     Quay lại
//                   </Button>
//       <div className="max-w-4xl mx-auto">
//         <h2 className="text-3xl font-bold text-gray-800 mb-6">Vaccination Process</h2>
        
//         <div className="mb-8">
//           <VaccinationSteps currentStep={1} />
//         </div>

//         {/* Appointment Information Card */}
//         <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
//           <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Appointment Details</h3>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div className="space-y-3">
//               <div className="flex items-center">
//                 <span className="font-medium text-gray-600 w-32">Child's Name:</span>
//                 <span className="text-gray-800">{child.fullName}</span>
//               </div>
//               <div className="flex items-center">
//                 <span className="font-medium text-gray-600 w-32">Gender:</span>
//                 <span className="text-gray-800">{child.gender}</span>
//               </div>
//               <div className="flex items-center">
//                 <span className="font-medium text-gray-600 w-32">Parent's Name:</span>
//                 <span className="text-gray-800">{appointment.memberName}</span>
//               </div>
//               <div className="flex items-center">
//                 <span className="font-medium text-gray-600 w-32">Contact:</span>
//                 <span className="text-gray-800">{appointment.memberPhone}</span>
//               </div>
//               <div className="flex items-center">
//                 <span className="font-medium text-gray-600 w-32">Email:</span>
//                 <span className="text-gray-800">{appointment.memberEmail}</span>
//               </div>
//             </div>
//             <div className="space-y-3">
//               <div className="flex items-center">
//                 <span className="font-medium text-gray-600 w-32">Blood Type:</span>
//                 <span className="text-gray-800">{child.bloodType || "N/A"}</span>
//               </div>
//               <div className="flex items-center">
//                 <span className="font-medium text-gray-600 w-32">Allergies:</span>
//                 <span className="text-gray-800">{child.allergiesNotes || "None"}</span>
//               </div>
//               <div className="flex items-center">
//                 <span className="font-medium text-gray-600 w-32">Medical History:</span>
//                 <span className="text-gray-800">{child.medicalHistory || "None"}</span>
//               </div>
//             </div>
//           </div>
//         </div>

//         {showSurveySelect && (
//           <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
//             <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Select Vaccination Survey</h3>
//             <Select
//               placeholder="-- Select Survey --"
//               className="w-full"
//               onChange={(value) => {
//                 const survey = surveys.find(s => s.surveyId === value)
//                 setSelectedSurvey(survey || null)
//               }}
//               value={selectedSurvey?.surveyId}
//             >
//               {surveys.map(survey => (
//                 <Option key={survey.surveyId} value={survey.surveyId}>
//                   {survey.title}
//                 </Option>
//               ))}
//             </Select>
//           </div>
//         )}

//         {showSurveySelect && selectedSurvey && (
//           <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
//             <h3 className="text-lg font-semibold text-blue-700 mb-4 border-b pb-2">Survey Questions: {selectedSurvey.title}</h3>
//             {loadingQuestions ? (
//               <div className="text-gray-600 text-center py-4">Loading questions...</div>
//             ) : surveyQuestions.length === 0 ? (
//               <div className="text-gray-600 text-center py-4">No questions available for this survey.</div>
//             ) : (
//               <ul className="space-y-4">
//                 {surveyQuestions.map((q: Question) => (
//                   <li key={q.questionId} className="border p-4 rounded bg-gray-50">
//                     <div className="flex items-center">
//                       <span className="font-medium text-gray-800">{q.questionText}</span>
//                       {q.isRequired && <span className="text-red-500 ml-2">*</span>}
//                     </div>
//                     <div className="mt-3">
//                       {q.questionType === "Text" ? (
//                         <textarea
//                           className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
//                           value={answers[q.questionId] || ""}
//                           onChange={e => handleChangeAnswer(q.questionId, e.target.value)}
//                           rows={4}
//                         />
//                       ) : q.questionType === "YesNo" ? (
//                         <div className="flex gap-6">
//                           <label className="flex items-center gap-2">
//                             <input
//                               type="radio"
//                               name={`q_${q.questionId}`}
//                               value="yes"
//                               checked={answers[q.questionId] === "yes"}
//                               onChange={() => handleChangeAnswer(q.questionId, "yes")}
//                               className="h-4 w-4 text-blue-600 focus:ring-blue-500"
//                             />
//                             <span className="text-gray-700">Yes</span>
//                           </label>
//                           <label className="flex items-center gap-2">
//                             <input
//                               type="radio"
//                               name={`q_${q.questionId}`}
//                               value="no"
//                               checked={answers[q.questionId] === "no"}
//                               onChange={() => handleChangeAnswer(q.questionId, "no")}
//                               className="h-4 w-4 text-blue-600 focus:ring-blue-500"
//                             />
//                             <span className="text-gray-700">No</span>
//                           </label>
//                         </div>
//                       ) : null}
//                     </div>
//                   </li>
//                 ))}
//               </ul>
//             )}
//           </div>
//         )}

//         {!showSurveySelect && surveyAnswers.length > 0 && (
//           <>
//             <AntButton
//               type="primary"
//               icon={<CaretRightOutlined />}
//               onClick={() => setIsAnswersVisible(!isAnswersVisible)}
//               className="mb-4"
//             >
//               {isAnswersVisible ? "Hide Survey Answers" : "Show Survey Answers"}
//             </AntButton>
//             <Collapse activeKey={isAnswersVisible ? ['1'] : []} className="mb-8">
//               <Collapse.Panel header="Survey Answers" key="1">
//                 <div className="bg-white rounded-xl shadow-lg p-6">
//                   <h3 className="text-lg font-semibold text-blue-700 mb-4 border-b pb-2">Survey Questions & Answers</h3>
//                   <ul className="space-y-4">
//                     {surveyAnswers.map((ans, idx) => (
//                       <li key={idx} className="border p-4 rounded bg-gray-50">
//                         <span className="font-medium text-gray-800">{ans.questionText}</span>
//                         <div className="mt-2">
//                           <span className="text-blue-700">Answer: {ans.answerText}</span>
//                         </div>
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               </Collapse.Panel>
//             </Collapse>
//           </>
//         )}

//         <div className="flex justify-end space-x-4 mt-8 items-center">
//           <Button
//             type="button"
//             onClick={handleBack}
//             className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-full transition-colors"
//             disabled={submitting}
//           >
//             Trở lại
//           </Button>
//           {appointment?.status === "Approval" ? (
//             <Button
//               type="button"
//               className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full transition-colors"
//               onClick={() => {
//                 const user = getUserInfo()
//                 if (user?.role === "Doctor") {
//                   navigate(`/doctor/appointments/${id}/step-3`)
//                 } else {
//                   navigate(`/staff/appointments/${id}/step-3`)
//                 }
//               }}
//             >
//               Tiếp tục
//             </Button>
//           ) : (
//             <AntButton
//               type="primary"
//               onClick={handleSubmit}
//               loading={submitting}
//               disabled={submitting}
//             >
//               {submitting ? "Saving..." : "Submit Survey"}
//             </AntButton>
//           )}
//           {submitMessage && (
//             <span className={`ml-4 font-medium ${submitMessage.includes("Error") ? "text-red-600" : "text-green-600"}`}>
//               {submitMessage}
//             </span>
//           )}
//         </div>
//       </div>
//     </div>
//   )
// }



import { useNavigate, useParams } from "react-router-dom"
import { getUserInfo } from "@/lib/storage"
import VaccinationSteps from "@/Components/VaccinationStep"
import { Button } from "@/Components/ui/button"
import { useEffect, useState } from "react"
import { appointmentApi, type Appointment } from "@/api/appointmentAPI"
import { surveyAPI, type Survey, type Question } from "@/api/surveyAPI"
import { Collapse, Button as AntButton, Select, message } from 'antd'
import { CaretRightOutlined } from '@ant-design/icons'

const { Option } = Select

export default function HealthSurvey() {
  const [showSurveySelect, setShowSurveySelect] = useState(true)
  const [surveyAnswers, setSurveyAnswers] = useState<any[]>([])
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState("")
  const [isAnswersVisible, setIsAnswersVisible] = useState(false)
  const navigate = useNavigate()
  const { id } = useParams()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null)
  const [surveyQuestions, setSurveyQuestions] = useState<Question[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const user = getUserInfo()

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        setLoading(true)
        if (id) {
          const res = await appointmentApi.getAppointmentById(Number(id))
          const appointmentData = (res as any).data || res
          setAppointment(appointmentData)
          if (appointmentData && appointmentData.status === "Approval") {
            setShowSurveySelect(false)
            const response = await surveyAPI.getSurveyResponse(appointmentData.appointmentId)
            setSurveyAnswers(response.data || [])
          } else {
            setShowSurveySelect(true)
          }
        } else {
          setAppointment(null)
        }
      } catch (error) {
        setAppointment(null)
      } finally {
        setLoading(false)
      }
    }
    fetchAppointment()
  }, [id])

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        const res = await surveyAPI.getAllSurveys()
        setSurveys(res.data || [])
      } catch {
        setSurveys([])
      }
    }
    fetchSurveys()
  }, [])

  useEffect(() => {
    if (!selectedSurvey) {
      setSurveyQuestions([])
      return
    }
    setLoadingQuestions(true)
    surveyAPI.getSurveybyId(selectedSurvey.surveyId)
      .then(res => setSurveyQuestions(res.data || []))
      .catch(() => setSurveyQuestions([]))
      .finally(() => setLoadingQuestions(false))
  }, [selectedSurvey])

  // Function to calculate age
  const calculateAge = (birthDate: string): string => {
    if (!birthDate) return "N/A";
    const birth = new Date(birthDate);
    const today = new Date();
    if (isNaN(birth.getTime())) return "N/A";

    const diffMs = today.getTime() - birth.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30.436875); // Average month length
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffMonths >= 12) {
      const years = Math.floor(diffMonths / 12);
      return `${years} tuổi`;
    } else if (diffMonths > 0) {
      return `${diffMonths} tháng tuổi`;
    } else {
      return `${diffWeeks} tuần tuổi`;
    }
  };

  const handleBack = () => {
    navigate(`/staff/appointments/${id}/step-1`)
  }

  const handleChangeAnswer = (questionId: number, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const handleBackByPosition = () => {
    if (user?.position === "Doctor") {
      navigate("/doctor/appointments")
    } else {
      navigate("/staff/appointments")
    }
  }

  const handleSubmit = async () => {
    if (!appointment || !selectedSurvey) {
      message.error("Please select a survey before submitting.")
      return
    }
    setSubmitting(true)
    setSubmitMessage("")
    try {
      const answerPayload = surveyQuestions.map(q => ({
        questionId: q.questionId,
        answerId: null,
        answerText: answers[q.questionId] || ""
      }))
      await surveyAPI.submitSurveyAnswer(appointment.appointmentId, answerPayload)
      await appointmentApi.updateAppointmentStatus(appointment.appointmentId, { status: "Approval", note: "" })
      setSubmitMessage("Survey answers saved successfully")
      message.success("Survey answers saved successfully")
      setTimeout(() => {
        navigate(`/staff/appointments/${id}/step-3`)
      }, 1200)
    } catch (error) {
      setSubmitMessage("Error saving survey answers")
      message.error("Error saving survey answers")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-8 text-gray-600 text-center">Loading...</div>
  if (!appointment) return <div className="p-2 text-gray-600 text-center">Appointment not found.</div>

  const child = appointment.child

  return (
    <div className="mt-8 p-6 bg-white shadow rounded-xl">
      <Button
        type="button"
        className="bg-gray-300 hover:bg-blue-400 text-black px-6 py-2 rounded-full transition-colors"
        onClick={handleBackByPosition}
      >
        Quay lại
      </Button>
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Vaccination Process</h2>
        
        <div className="mb-8">
          <VaccinationSteps currentStep={1} />
        </div>

        {/* Appointment Information Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Appointment Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Child's Name:</span>
                <span className="text-gray-800">{child.fullName} ({calculateAge(child.birthDate)})</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Gender:</span>
                <span className="text-gray-800">{child.gender.trim()}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Parent's Name:</span>
                <span className="text-gray-800">{appointment.memberName}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Contact:</span>
                <span className="text-gray-800">{appointment.memberPhone}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Email:</span>
                <span className="text-gray-800">{appointment.memberEmail.trim()}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Blood Type:</span>
                <span className="text-gray-800">{child.bloodType || "N/A"}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Allergies:</span>
                <span className="text-gray-800">{child.allergiesNotes || "None"}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Medical History:</span>
                <span className="text-gray-800">{child.medicalHistory || "None"}</span>
              </div>
            </div>
          </div>
        </div>

        {showSurveySelect && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Select Vaccination Survey</h3>
            <Select
              placeholder="-- Select Survey --"
              className="w-full"
              onChange={(value) => {
                const survey = surveys.find(s => s.surveyId === value)
                setSelectedSurvey(survey || null)
              }}
              value={selectedSurvey?.surveyId}
            >
              {surveys.map(survey => (
                <Option key={survey.surveyId} value={survey.surveyId}>
                  {survey.title}
                </Option>
              ))}
            </Select>
          </div>
        )}

        {showSurveySelect && selectedSurvey && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-700 mb-4 border-b pb-2">Survey Questions: {selectedSurvey.title}</h3>
            {loadingQuestions ? (
              <div className="text-gray-600 text-center py-4">Loading questions...</div>
            ) : surveyQuestions.length === 0 ? (
              <div className="text-gray-600 text-center py-4">No questions available for this survey.</div>
            ) : (
              <ul className="space-y-4">
                {surveyQuestions.map((q: Question) => (
                  <li key={q.questionId} className="border p-4 rounded bg-gray-50">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-800">{q.questionText}</span>
                      {q.isRequired && <span className="text-red-500 ml-2">*</span>}
                    </div>
                    <div className="mt-3">
                      {q.questionType === "Text" ? (
                        <textarea
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          value={answers[q.questionId] || ""}
                          onChange={e => handleChangeAnswer(q.questionId, e.target.value)}
                          rows={4}
                        />
                      ) : q.questionType === "YesNo" ? (
                        <div className="flex gap-6">
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`q_${q.questionId}`}
                              value="yes"
                              checked={answers[q.questionId] === "yes"}
                              onChange={() => handleChangeAnswer(q.questionId, "yes")}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-gray-700">Yes</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`q_${q.questionId}`}
                              value="no"
                              checked={answers[q.questionId] === "no"}
                              onChange={() => handleChangeAnswer(q.questionId, "no")}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-gray-700">No</span>
                          </label>
                        </div>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {!showSurveySelect && surveyAnswers.length > 0 && (
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

        <div className="flex justify-end space-x-4 mt-8 items-center">
          <Button
            type="button"
            onClick={handleBack}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-full transition-colors"
            disabled={submitting}
          >
            Trở lại
          </Button>
          {appointment?.status === "Approval" ? (
            <Button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full transition-colors"
              onClick={() => {
                const user = getUserInfo()
                if (user?.role === "Doctor") {
                  navigate(`/doctor/appointments/${id}/step-3`)
                } else {
                  navigate(`/staff/appointments/${id}/step-3`)
                }
              }}
            >
              Tiếp tục
            </Button>
          ) : (
            <AntButton
              type="primary"
              onClick={handleSubmit}
              loading={submitting}
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Submit Survey"}
            </AntButton>
          )}
          {submitMessage && (
            <span className={`ml-4 font-medium ${submitMessage.includes("Error") ? "text-red-600" : "text-green-600"}`}>
              {submitMessage}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}