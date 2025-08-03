import { useNavigate, useParams } from "react-router-dom";
import { getUserInfo } from "@/lib/storage";
import VaccinationSteps from "@/Components/VaccinationStep";
import { Button } from "@/Components/ui/button";
import { useEffect, useState } from "react";
import { appointmentApi, type Appointment } from "@/api/appointmentAPI";
import { surveyAPI, type Survey, type Question } from "@/api/surveyAPI";
import { Collapse, Select, message, Modal, Input } from "antd";
import { CaretRightOutlined } from "@ant-design/icons";

const { Option } = Select;
const { TextArea } = Input;

export default function HealthSurvey() {
  const [showSurveySelect, setShowSurveySelect] = useState(true);
  const [surveyAnswers, setSurveyAnswers] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [isAnswersVisible, setIsAnswersVisible] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const navigate = useNavigate();
  const { id } = useParams();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [surveyQuestions, setSurveyQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const user = getUserInfo();

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        setLoading(true);
        if (id) {
          const res = await appointmentApi.getAppointmentById(Number(id));
          const appointmentData = (res as any).data || res;
          setAppointment(appointmentData);
          if (
            appointmentData &&
            ["Approval", "Paid", "Completed", "Cancelled"].includes(appointmentData.status)
          ) {
            setShowSurveySelect(false);
            const response = await surveyAPI.getSurveyResponse(appointmentData.appointmentId);
            setSurveyAnswers(response.data || []);
          } else {
            setShowSurveySelect(true);
          }
        } else {
          setAppointment(null);
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

  useEffect(() => {
    if (!selectedSurvey) {
      setSurveyQuestions([]);
      return;
    }
    setLoadingQuestions(true);
    surveyAPI
      .getSurveybyId(selectedSurvey.surveyId)
      .then((res) => setSurveyQuestions(res.data || []))
      .catch(() => setSurveyQuestions([]))
      .finally(() => setLoadingQuestions(false));
  }, [selectedSurvey]);

  // Function to calculate age
  const calculateAge = (birthDate: string): string => {
    if (!birthDate) return "N/A";
    const birth = new Date(birthDate);
    const today = new Date();
    if (isNaN(birth.getTime())) return "N/A";
    const diffMs = today.getTime() - birth.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30.436875);
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
    navigate(`/staff/appointments/${id}/step-1`);
  };

  const handleChangeAnswer = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleBackByPosition = () => {
    if (user?.position === "Doctor") {
      navigate("/doctor/appointments");
    } else {
      navigate("/staff/appointments");
    }
  };

  const handleSubmit = async () => {
    if (!appointment || !selectedSurvey) {
      message.error("Vui lòng chọn khảo sát trước khi gửi.");
      return;
    }
    setSubmitting(true);
    setSubmitMessage("");
    try {
      const answerPayload = surveyQuestions.map((q) => ({
        questionId: q.questionId,
        answerId: null,
        answerText: answers[q.questionId] || "",
      }));
      await surveyAPI.submitSurveyAnswer(appointment.appointmentId, answerPayload);
      await appointmentApi.updateAppointmentStatus(appointment.appointmentId, {
        status: "Approval",
        note: "",
      });
      setSubmitMessage("Lưu câu trả lời khảo sát thành công");
      message.success("Lưu câu trả lời khảo sát thành công");
      setTimeout(() => {
        navigate(`/staff/appointments/${id}/step-3`);
      }, 1200);
    } catch (error) {
      setSubmitMessage("Lỗi khi lưu câu trả lời khảo sát");
      message.error("Lỗi khi lưu câu trả lời khảo sát");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAppointment = () => {
    if (!appointment) {
      message.error("Không có cuộc hẹn để hủy.");
      return;
    }
    setIsCancelModalVisible(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) {
      message.error("Vui lòng nhập lý do hủy cuộc hẹn.");
      return;
    }
    setCancelling(true);
    setSubmitMessage("");
    try {
      await appointmentApi.updateAppointmentStatus(appointment!.appointmentId, {
        status: "Cancelled",
        note: cancelReason,
      });
      message.success("Hủy cuộc hẹn thành công");
      setIsCancelModalVisible(false);
      setCancelReason("");
      setTimeout(() => {
        if (user?.position === "Doctor") {
          navigate("/doctor/appointments");
        } else {
          navigate("/staff/appointments");
        }
      }, 1200);
    } catch (error) {
      message.error("Lỗi khi hủy cuộc hẹn");
    } finally {
      setCancelling(false);
    }
  };

  const handleCancelModalClose = () => {
    setIsCancelModalVisible(false);
    setCancelReason("");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-blue-500"></div>
        <span className="mt-2 text-gray-600">Đang tải...</span>
      </div>
    );
  }
  if (!appointment) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-lg flex items-center justify-center">
        <svg
          className="w-6 h-6 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01M12 17h.01M12 3C7.029 3 3 7.029 3 12s4.029 9 9 9 9-4.029 9-9-4.029-9-9-9z"
          ></path>
        </svg>
        Không tìm thấy cuộc hẹn.
      </div>
    );
  }

  const child = appointment.child;

  return (
    <div className="mt-8 p-6 bg-white shadow rounded-xl">
      <div className="flex justify-between items-center mb-6">
        <Button
          type="button"
          className="bg-gray-300 hover:bg-blue-400 text-black px-6 py-2 rounded-full transition-colors"
          onClick={handleBackByPosition}
        >
          Quay lại
        </Button>
        {appointment.status !== "Cancelled" && (
          <Button
            type="button"
            className={`bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full transition-colors ${
              cancelling ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={handleCancelAppointment}
            disabled={cancelling}
          >
            {cancelling ? "Đang hủy..." : "Hủy lịch hẹn"}
          </Button>
        )}
      </div>
      <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 bg-gradient-to-r from-blue-500 to-green-500 text-white p-4 rounded-t-lg">
                Quy trình tiêm chủng
              </h2>

        <div className="mb-8">
          <VaccinationSteps currentStep={1} />
        </div>

        {/* Appointment Information Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
            Thông tin cuộc hẹn
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Tên bé:</span>
                <span className="text-gray-800">
                  {child.fullName} ({calculateAge(child.birthDate)})
                </span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Giới tính:</span>
                <span className="text-gray-800">{child.gender.trim()}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Tên phụ huynh:</span>
                <span className="text-gray-800">{appointment.memberName}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Số liên lạc:</span>
                <span className="text-gray-800">{appointment.memberPhone}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Email:</span>
                <span className="text-gray-800">{appointment.memberEmail.trim()}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Nhóm máu:</span>
                <span className="text-gray-800">{child.bloodType || "N/A"}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Tiền sử dị ứng:</span>
                <span className="text-gray-800">{child.allergiesNotes || "Không có"}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-600 w-32">Tiền sử bệnh lý:</span>
                <span className="text-gray-800">{child.medicalHistory || "Không có"}</span>
              </div>
            </div>
          </div>
        </div>

        {showSurveySelect && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
              Chọn khảo sát tiêm chủng
            </h3>
            <Select
              placeholder="-- Chọn khảo sát --"
              className="w-full"
              onChange={(value) => {
                const survey = surveys.find((s) => s.surveyId === value);
                setSelectedSurvey(survey || null);
              }}
              value={selectedSurvey?.surveyId}
            >
              {surveys.map((survey) => (
                <Option key={survey.surveyId} value={survey.surveyId}>
                  {survey.title}
                </Option>
              ))}
            </Select>
          </div>
        )}

        {showSurveySelect && selectedSurvey && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-700 mb-4 border-b pb-2">
              Câu hỏi khảo sát: {selectedSurvey.title}
            </h3>
            {loadingQuestions ? (
              <div className="flex flex-col items-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-blue-500"></div>
                <span className="mt-2 text-gray-600">Đang tải câu hỏi...</span>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full animate-pulse"
                    style={{ width: "50%" }}
                  ></div>
                </div>
              </div>
            ) : surveyQuestions.length === 0 ? (
              <div className="bg-gray-50 text-gray-600 p-4 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M12 3C7.029 3 3 7.029 3 12s4.029 9 9 9 9-4.029 9-9-4.029-9-9-9z"
                  ></path>
                </svg>
                Không có câu hỏi nào cho khảo sát này.
              </div>
            ) : (
              <ul className="space-y-4">
                {surveyQuestions.map((q: Question) => (
                  <li
                    key={q.questionId}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 mr-2 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5v-2a2 2 0 012-2h10a2 2 0 012 2v2h-4m-6 0h.01M12 3C7.029 3 3 7.029 3 12s4.029 9 9 9 9-4.029 9-9-4.029-9-9-9z"
                        ></path>
                      </svg>
                      <span className="font-medium text-gray-800">{q.questionText}</span>
                      {q.isRequired && <span className="text-red-500 ml-2">*</span>}
                    </div>
                    <div className="mt-3">
                      {q.questionType === "Text" ? (
                        <textarea
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          value={answers[q.questionId] || ""}
                          onChange={(e) => handleChangeAnswer(q.questionId, e.target.value)}
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
                            <span className="text-gray-700">Có</span>
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
                            <span className="text-gray-700">Không</span>
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
          <Collapse
            activeKey={isAnswersVisible ? ["1"] : []}
            className="mb-8 bg-white rounded-xl shadow-lg"
            expandIcon={({ isActive }) => (
              <CaretRightOutlined
                rotate={isActive ? 90 : 0}
                className="text-blue-600 text-lg"
              />
            )}
            onChange={() => setIsAnswersVisible(!isAnswersVisible)}
          >
            <Collapse.Panel
              header={
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-blue-700 mb-0">
                    Câu trả lời khảo sát
                  </h3>
                  <span className="text-sm text-gray-500">
                    {surveyAnswers.length} câu trả lời
                  </span>
                </div>
              }
              key="1"
              className="p-6"
            >
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4 flex items-center justify-between">
                  <span className="text-blue-700 font-semibold">
                    Tổng cộng: {surveyAnswers.length} câu trả lời
                  </span>
                  <span className="text-sm text-gray-500">
                    Cập nhật đến {new Date().toLocaleDateString("vi-VN")}
                  </span>
                </div>
                {surveyAnswers.map((ans, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 mr-2 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5v-2a2 2 0 012-2h10a2 2 0 012 2v2h-4m-6 0h.01M12 3C7.029 3 3 7.029 3 12s4.029 9 9 9 9-4.029 9-9-4.029-9-9-9z"
                        ></path>
                      </svg>
                      <span className="font-medium text-gray-800">{ans.questionText}</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-blue-700 font-medium">
                        Trả lời: {ans.answerText}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Collapse.Panel>
          </Collapse>
        )}

        {!showSurveySelect && surveyAnswers.length === 0 && (
          <div className="bg-gray-50 text-gray-600 p-4 rounded-lg flex items-center justify-center">
            <svg
              className="w-6 h-6 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M12 3C7.029 3 3 7.029 3 12s4.029 9 9 9 9-4.029 9-9-4.029-9-9-9z"
              ></path>
            </svg>
            Không có câu trả lời khảo sát.
          </div>
        )}

        <Modal
          title="Hủy cuộc hẹn"
          open={isCancelModalVisible}
          onOk={handleConfirmCancel}
          onCancel={handleCancelModalClose}
          okText="Xác nhận"
          cancelText="Hủy bỏ"
          okButtonProps={{
            className: "bg-blue-600 hover:bg-blue-700 text-white",
            disabled: cancelling,
          }}
          cancelButtonProps={{
            className: "bg-gray-300 hover:bg-gray-400 text-gray-800",
            disabled: cancelling,
          }}
        >
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Lý do hủy <span className="text-red-500">*</span>
            </label>
            <TextArea
              rows={4}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Nhập lý do hủy cuộc hẹn"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </Modal>

        <div className="flex justify-end space-x-4 mt-8 items-center">
          <Button
            type="button"
            onClick={handleBack}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-full transition-colors"
            disabled={submitting || cancelling || appointment.status === "Cancelled"}
          >
            Trở lại
          </Button>
          {appointment?.status === "Approval" ||
          appointment?.status === "Paid" ||
          appointment?.status === "Completed" ? (
            <Button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full transition-colors"
              onClick={() => {
                const user = getUserInfo();
                if (user?.position === "Doctor") {
                  navigate(`/doctor/appointments/${id}/step-3`);
                } else {
                  navigate(`/staff/appointments/${id}/step-3`);
                }
              }}
              disabled={submitting || cancelling}
            >
              Tiếp tục
            </Button>
          ) : appointment?.status !== "Cancelled" ? (
            <Button
              type="button"
              onClick={handleSubmit}
              className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full transition-colors ${
                submitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={submitting || cancelling}
            >
              {submitting ? "Đang lưu..." : "Gửi khảo sát"}
            </Button>
          ) : null}
          {submitMessage && (
            <span
              className={`ml-4 font-medium ${
                submitMessage.includes("Lỗi") ? "text-red-600" : "text-green-600"
              }`}
            >
              {submitMessage}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}