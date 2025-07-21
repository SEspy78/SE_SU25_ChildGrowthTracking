
import { useNavigate, useParams } from "react-router-dom"
import VaccinationSteps from "@/Components/VaccinationStep"
import { Button } from "@/Components/ui/button"
import { useEffect, useState } from "react"
import { appointmentApi, type Appointment } from "@/api/appointmentAPI"
import { surveyAPI, type Survey, type Question } from "@/api/surveyAPI"


export default function HealthSurvey() {
  const [showSurveySelect, setShowSurveySelect] = useState(true);
  const [surveyAnswers, setSurveyAnswers] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const navigate = useNavigate();
  const { id } = useParams();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [surveyQuestions, setSurveyQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        setLoading(true);
        const res = await appointmentApi.getAllAppointments();
        const found = res.appointments.find((a) => a.appointmentId === Number(id));
        setAppointment(found || null);
        if (found && found.status === "Checked-in") {
          // Đã checked-in, lấy câu trả lời khảo sát
          setShowSurveySelect(false);
          const response = await surveyAPI.getSurveyResponse(found.appointmentId);
          setSurveyAnswers(response.data || []);
        } else {
          setShowSurveySelect(true);
        }
      } catch (error) {
        setAppointment(null);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointment();
  }, [id]);

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        const res = await surveyAPI.getAllSurveys();
        setSurveys(res.data || []);
      } catch {
        setSurveys([]);
      }
    };
    fetchSurveys();
  }, []);

  // Khi chọn survey, gọi API lấy câu hỏi
  useEffect(() => {
    if (!selectedSurvey) {
      setSurveyQuestions([]);
      return;
    }
    setLoadingQuestions(true);
    surveyAPI.getSurveybyId(selectedSurvey.surveyId)
      .then(res => setSurveyQuestions(res.data || []))
      .catch(() => setSurveyQuestions([]))
      .finally(() => setLoadingQuestions(false));
  }, [selectedSurvey]);

  const handleBack = () => {
    navigate(`/staff/appointments/${id}/step-1`);
  };

  const handleChangeAnswer = (questionId: number, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (!appointment || !selectedSurvey) return;
    setSubmitting(true);
    setSubmitMessage("");
    try {
      // Chuẩn bị dữ liệu trả lời
      const answerPayload = surveyQuestions.map(q => ({
        questionId: q.questionId,
        answerId:null,
        answerText: answers[q.questionId] || ""
      }));
      await surveyAPI.submitSurveyAnswer(appointment.appointmentId, answerPayload);
      await appointmentApi.updateAppointmentStatus(appointment.appointmentId, { status: "Checked-in", note: "" });
      setSubmitMessage("Đã lưu câu trả lời");
      setTimeout(() => {
        navigate(`/staff/appointments/${id}/step-3`);
      }, 1200);
    } catch (error) {
      setSubmitMessage("Có lỗi khi lưu câu trả lời");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!appointment) return <div className="p-8">Appointment not found.</div>;

  const child = appointment.child;

  return (
    <div className="mt-8 p-6 bg-white shadow rounded-xl">
      <h2 className="text-xl font-semibold mb-4">Vaccination Process</h2>
      <VaccinationSteps currentStep={1} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <p><strong>Child's Name:</strong> {child.fullName}</p>
          <p><strong>Gender:</strong> {child.gender}</p>
          <p><strong>Parent’s Name:</strong> {appointment.memberName}</p>
          <p><strong>Contact Number:</strong> {appointment.memberPhone}</p>
          <p><strong>Email:</strong> {appointment.memberEmail}</p>
        </div>
        <div>
          <p><strong>Blood Type:</strong> {child.bloodType || "N/A"}</p>
          <p><strong>Allergies:</strong> {child.allergiesNotes || "None"}</p>
          <p><strong>Medical History:</strong> {child.medicalHistory || "None"}</p>
        </div>
      </div>

      {showSurveySelect && (
        <>
          <h1 className="text-xl font-bold mb-4 mt-6">Chọn khảo sát tiêm chủng</h1>
          <div className="mb-6 relative">
            <button
              type="button"
              className="w-full p-2 border border-gray-300 rounded bg-white text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => setDropdownOpen(prev => !prev)}
            >
              <span>{selectedSurvey ? selectedSurvey.title : "-- Chọn khảo sát --"}</span>
              <span className="text-gray-600">▼</span>
            </button>
            {dropdownOpen && (
              <ul className="absolute w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto">
                {surveys.map(survey => (
                  <li
                    key={survey.surveyId}
                    className={`px-3 py-2 border-b border-gray-200 last:border-b-0 text-gray-700 hover:bg-blue-50 cursor-pointer transition-colors duration-200 ${selectedSurvey?.surveyId === survey.surveyId ? 'bg-blue-100 font-medium' : ''}`}
                    onClick={() => {
                      setSelectedSurvey(survey);
                      setDropdownOpen(false);
                    }}
                  >
                    {survey.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {showSurveySelect && selectedSurvey && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Câu hỏi khảo sát: {selectedSurvey.title}</h2>
          {loadingQuestions ? (
            <div>Đang tải câu hỏi...</div>
          ) : surveyQuestions.length === 0 ? (
            <div>Không có câu hỏi cho khảo sát này.</div>
          ) : (
            <ul className="space-y-4">
              {surveyQuestions.map((q: Question) => (
                <li key={q.questionId} className="border p-3 rounded bg-gray-50">
                  <span className="font-medium">{q.questionText}</span>
                  {q.isRequired && <span className="text-red-500 ml-2">*</span>}
                  <div className="mt-2">
                    {q.questionType === "Text" ? (
                      <textarea
                        className="w-full p-2 border border-gray-300 rounded"
                        value={answers[q.questionId] || ""}
                        onChange={e => handleChangeAnswer(q.questionId, e.target.value)}
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
                          /> Có
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`q_${q.questionId}`}
                            value="no"
                            checked={answers[q.questionId] === "no"}
                            onChange={() => handleChangeAnswer(q.questionId, "no")}
                          /> Không
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
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Câu hỏi & câu trả lời khảo sát</h2>
          <ul className="space-y-4">
            {surveyAnswers.map((ans, idx) => (
              <li key={idx} className="border p-3 rounded bg-gray-50">
                <span className="font-medium">{ans.questionText}</span>
                <div className="mt-2">
                  <span className="text-blue-700">Trả lời: {ans.answerText}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Buttons: Back & Submit */}
      <div className="flex space-x-4 pt-4 items-center">
        <Button
          type="button"
          onClick={handleBack}
          className="bg-gray-300 hover:bg-gray-400 text-black px-6 py-2 rounded-full"
          disabled={submitting}
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full"
          disabled={submitting}
        >
          {submitting ? "Đang lưu..." : "Submit Survey"}
        </Button>
        {submitMessage && (
          <span className="ml-4 text-green-600 font-medium">{submitMessage}</span>
        )}
      </div>
    </div>
  );
}
