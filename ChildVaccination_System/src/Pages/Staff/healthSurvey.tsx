import { useNavigate, useParams } from "react-router-dom";
import { getUserInfo } from "@/lib/storage";
import VaccinationSteps from "@/Components/VaccinationStep";
import { Button } from "@/Components/ui/button";
import { useEffect, useState } from "react";
import { appointmentApi, orderApi, type Appointment, type FacilityScheduleResponse } from "@/api/appointmentAPI";
import { surveyAPI, type Survey, type Question, type QuestionResponse } from "@/api/surveyAPI";
import { childprofileApi, type VaccineProfile } from "@/api/childInfomationAPI";
import { facilityVaccineApi, type FacilityVaccine } from "@/api/vaccineApi";
import { Collapse, Select, message, Input, Checkbox, Modal, DatePicker, Table } from "antd";
import { CaretRightOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Option } = Select;
const { TextArea } = Input;

export default function HealthSurvey() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [surveyQuestions, setSurveyQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [surveyAnswers, setSurveyAnswers] = useState<{
    appointmentId: number;
    submittedAt: string;
    temperatureC: number;
    heartRateBpm: number;
    systolicBpmmHg: number;
    diastolicBpmmHg: number;
    oxygenSatPercent: number;
    decisionNote: string;
    consentObtained: boolean;
    questions: QuestionResponse[];
  } | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCancelSuccessModal, setShowCancelSuccessModal] = useState(false);
  const [showAdjustSuccessModal, setShowAdjustSuccessModal] = useState(false);
  const [isAnswersVisible, setIsAnswersVisible] = useState(false);
  const [healthInfo, setHealthInfo] = useState<{
    temperatureC: number | null;
    heartRateBpm: number | null;
    systolicBpmmHg: number | null;
    diastolicBpmmHg: number | null;
    oxygenSatPercent: number | null;
    decisionNote: string;
    consentObtained: boolean;
  }>({
    temperatureC: null,
    heartRateBpm: null,
    systolicBpmmHg: null,
    diastolicBpmmHg: null,
    oxygenSatPercent: null,
    decisionNote: "",
    consentObtained: false,
  });
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [showCancelReasonModal, setShowCancelReasonModal] = useState(false);
  const [showRebookModal, setShowRebookModal] = useState(false);
  const [showConfirmSubmitModal, setShowConfirmSubmitModal] = useState(false);
  const [showAdjustPackageModal, setShowAdjustPackageModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [schedules, setSchedules] = useState<FacilityScheduleResponse | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [note, setNote] = useState("");
  const [childVaccineProfileId, setChildVaccineProfileId] = useState<number | null>(null);
  const [availableVaccines, setAvailableVaccines] = useState<FacilityVaccine[]>([]);
  const [tempQuantities, setTempQuantities] = useState<Record<number, number>>({});
  const [tempVaccineSelections, setTempVaccineSelections] = useState<Record<number, number>>({});
  const user = getUserInfo();

  const showSurveySelect = appointment && user?.position === "Doctor" && appointment.status === "Pending";

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        setLoading(true);
        if (!id) {
          setAppointment(null);
          message.error("Không có ID lịch hẹn trong URL.");
          return;
        }
        const res = await appointmentApi.getAppointmentById(Number(id));
        const appointmentData = (res as any).data || res;
        setAppointment(appointmentData);
        if (appointmentData && ["Approval", "Paid", "Completed", "Cancelled"].includes(appointmentData.status)) {
          const response = await surveyAPI.getSurveyResponse(appointmentData.appointmentId);
          setSurveyAnswers(response.data || null);
        }
      } catch {
        setAppointment(null);
        message.error("Không thể tải thông tin cuộc hẹn.");
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
        message.error("Không thể tải danh sách khảo sát.");
      }
    };
    if (user?.position === "Doctor") {
      fetchSurveys();
    }
  }, [user?.position]);

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

  useEffect(() => {
    if (appointment?.child?.childId) {
      const fetchChildVaccineProfile = async () => {
        try {
          const profiles = await childprofileApi.getChildVaccineProfile(appointment.child.childId);
          const matchingProfile = profiles.find(profile => profile.appointmentId === Number(id));
          if (matchingProfile) {
            setChildVaccineProfileId(matchingProfile.vaccineProfileId);
          } else {
            message.error("Không tìm thấy hồ sơ vắc xin cho lịch hẹn này.");
          }
        } catch {
          message.error("Không thể tải hồ sơ vắc xin của trẻ.");
        }
      };
      fetchChildVaccineProfile();
    }
  }, [appointment, id]);

  useEffect(() => {
    if (selectedDate && user?.facilityId) {
      const fetchSchedules = async () => {
        try {
          const dateStr = selectedDate.format("YYYY-MM-DD");
          const response = await appointmentApi.getFacilitySchedule(user.facilityId, dateStr, dateStr);
          setSchedules(response);
        } catch {
          message.error("Không thể tải lịch trình.");
        }
      };
      fetchSchedules();
    }
  }, [selectedDate, user?.facilityId]);

  // Fetch available vaccines when adjust package modal is opened
  useEffect(() => {
    if (showAdjustPackageModal && user?.facilityId) {
      const fetchVaccines = async () => {
        try {
          const res = await facilityVaccineApi.getAll(user.facilityId);
          setAvailableVaccines(res.data || []);
        } catch {
          message.error("Không thể tải danh sách vắc xin.");
          setAvailableVaccines([]);
        }
      };
      fetchVaccines();
    }
  }, [showAdjustPackageModal, user?.facilityId]);

  // Initialize temporary quantities and vaccine selections
  useEffect(() => {
    if (showAdjustPackageModal && appointment?.order?.orderDetails) {
      const initialQuantities: Record<number, number> = {};
      const initialSelections: Record<number, number> = {};
      appointment.order.orderDetails.forEach((detail) => {
        initialQuantities[detail.orderDetailId] = detail.remainingQuantity;
        initialSelections[detail.orderDetailId] = detail.facilityVaccine.facilityVaccineId;
      });
      setTempQuantities(initialQuantities);
      setTempVaccineSelections(initialSelections);
    }
  }, [showAdjustPackageModal, appointment?.order?.orderDetails]);

  // Auto-refresh every 10 seconds for Staff when appointment is Pending
  useEffect(() => {
    if (appointment?.status === "Pending" && user?.position === "Staff") {
      const interval = setInterval(() => {
        window.location.reload();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [appointment?.status, user?.position]);

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

  const isInputComplete = () => {
    if (!healthInfo.consentObtained) {
      return false;
    }
    const requiredQuestions = surveyQuestions.filter((q) => q.isRequired);
    return requiredQuestions.every((q) => answers[q.questionId] && answers[q.questionId].trim() !== "");
  };

  const validateHealthInfo = () => {
    const { temperatureC, heartRateBpm, systolicBpmmHg, diastolicBpmmHg, oxygenSatPercent } = healthInfo;

    if (
      temperatureC === null &&
      heartRateBpm === null &&
      systolicBpmmHg === null &&
      diastolicBpmmHg === null &&
      oxygenSatPercent === null
    ) {
      return true;
    }

    if (temperatureC !== null && (temperatureC < 35.0 || temperatureC > 40.0)) {
      message.error("Nhiệt độ cơ thể phải từ 35.0°C đến 40.0°C.");
      return false;
    }
    if (heartRateBpm !== null && (heartRateBpm < 60 || heartRateBpm > 160)) {
      message.error("Nhịp tim phải từ 60 đến 160 bpm.");
      return false;
    }
    if (systolicBpmmHg !== null && (systolicBpmmHg < 70 || systolicBpmmHg > 120)) {
      message.error("Huyết áp tâm thu phải từ 70 đến 120 mmHg.");
      return false;
    }
    if (diastolicBpmmHg !== null && (diastolicBpmmHg < 40 || diastolicBpmmHg > 80)) {
      message.error("Huyết áp tâm trương phải từ 40 đến 80 mmHg.");
      return false;
    }
    if (oxygenSatPercent !== null && (oxygenSatPercent < 90 || oxygenSatPercent > 100)) {
      message.error("Độ bão hòa oxy phải từ 90% đến 100%.");
      return false;
    }

    return true;
  };

  const handleBack = () => {
    navigate(`/staff/appointments/${id}/step-1`);
  };

  const handleBackByPosition = () => {
    if (user?.position === "Doctor") {
      navigate("/doctor/appointments");
    } else {
      navigate("/staff/appointments");
    }
  };

  const handleCancelConfirm = () => {
    setShowCancelConfirmModal(true);
  };

  const handleCancel = async () => {
    if (!id) {
      message.error("Không có ID lịch hẹn.");
      return;
    }
    setSubmitting(true);
    try {
      await appointmentApi.updateAppointmentStatus(Number(id), {
        status: "Cancelled",
        note: cancelReason || "Không có lý do hủy",
      });
      setShowCancelReasonModal(false);
      setShowCancelSuccessModal(true);
    } catch {
      message.error("Không thể hủy lịch hẹn.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRebook = async () => {
    if (!id || !selectedSlotId || !childVaccineProfileId) {
      message.error("Vui lòng chọn ngày và slot.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        currentAppointmentId: Number(id),
        newScheduleId: selectedSlotId,
        childVaccineProfileId,
        cancelReason: "",
        note: note || "",
      };
      await appointmentApi.cancelAndReBook(payload);
      message.success("Đã hủy và đặt lại lịch thành công!");
      setShowRebookModal(false);
      navigate("/staff/appointments");
    } catch {
      message.error("Không thể hủy và đặt lại lịch.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeAnswer = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleHealthInfoChange = (
    field: keyof typeof healthInfo,
    value: string | boolean | number | null
  ) => {
    setHealthInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!appointment || !selectedSurvey) {
      setSubmitMessage("Vui lòng chọn khảo sát trước khi gửi.");
      message.error("Vui lòng chọn khảo sát trước khi gửi.");
      return;
    }
    if (!validateHealthInfo()) {
      return;
    }
    setSubmitting(true);
    setSubmitMessage("");
    try {
      const answerPayload = surveyQuestions.map((q) => ({
        questionId: q.questionId,
        answerId: null,
        answerText: answers[q.questionId] || "",
        temperatureC: healthInfo.temperatureC ?? 0,
        heartRateBpm: healthInfo.heartRateBpm ?? 0,
        systolicBpmmHg: healthInfo.systolicBpmmHg ?? 0,
        diastolicBpmmHg: healthInfo.diastolicBpmmHg ?? 0,
        oxygenSatPercent: healthInfo.oxygenSatPercent ?? 0,
        decisionNote: healthInfo.decisionNote,
        consentObtained: healthInfo.consentObtained,
      }));
      const response = await surveyAPI.submitSurveyAnswer(appointment.appointmentId, answerPayload);
      if (response.success) {
        await appointmentApi.updateAppointmentStatus(appointment.appointmentId, {
          status: "Approval",
          note: "",
        });
        setSubmitMessage("Đã hoàn thành khảo sát sức khỏe.");
        message.success("Đã hoàn thành khảo sát sức khỏe.");
        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          navigate(`/doctor/appointments/${id}/step-3`);
        }, 1200);
      } else {
        setSubmitMessage(response.message);
        message.error(response.message);
      }
    } catch {
      setSubmitMessage("Lỗi khi lưu câu trả lời khảo sát.");
      message.error("Lỗi khi lưu câu trả lời khảo sát.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmSubmit = () => {
    if (!appointment || !selectedSurvey) {
      setSubmitMessage("Vui lòng chọn khảo sát trước khi gửi.");
      message.error("Vui lòng chọn khảo sát trước khi gửi.");
      return;
    }
    if (!isInputComplete()) {
      setSubmitMessage("Vui lòng điền đầy đủ thông tin bắt buộc.");
      message.error("Vui lòng điền đầy đủ thông tin bắt buộc.");
      return;
    }
    setShowConfirmSubmitModal(true);
  };

  const handleUpdateOrder = async () => {
    if (!appointment?.order?.orderId) {
      message.error("Không tìm thấy thông tin đơn hàng.");
      return;
    }
    setSubmitting(true);
    try {
      const updatedOrderDetails = appointment.order.orderDetails.map((detail) => ({
        diseaseId: detail.diseaseId,
        facilityVaccineId: tempVaccineSelections[detail.orderDetailId] || detail.facilityVaccine.facilityVaccineId,
        quantity: tempQuantities[detail.orderDetailId] || detail.remainingQuantity,
      }));
      const payload = { selectedVaccines: updatedOrderDetails };
      await orderApi.updateOrder(appointment.order.orderId, payload);
      const res = await appointmentApi.getAppointmentById(Number(id));
      const appointmentData = (res as any).data || res;
      setAppointment(appointmentData);
      if (user?.facilityId) {
        const vaccineRes = await facilityVaccineApi.getAll(user.facilityId);
        setAvailableVaccines(vaccineRes.data || []);
      }
      // Reset temporary quantities and selections with updated data
      const initialQuantities: Record<number, number> = {};
      const initialSelections: Record<number, number> = {};
      appointmentData.order.orderDetails.forEach((detail: any) => {
        initialQuantities[detail.orderDetailId] = detail.remainingQuantity;
        initialSelections[detail.orderDetailId] = detail.facilityVaccine.facilityVaccineId;
      });
      setTempQuantities(initialQuantities);
      setTempVaccineSelections(initialSelections);
      // Show success modal
      setShowAdjustSuccessModal(true);
      // Auto-close success modal after 1.5 seconds
      setTimeout(() => {
        setShowAdjustSuccessModal(false);
      }, 1500);
    } catch (error) {
      console.error("Error updating order:", error);
      message.error("Lỗi khi cập nhật gói vắc xin.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuantityChange = (orderDetailId: number, delta: number) => {
    setTempQuantities((prev) => {
      const newQuantity = (prev[orderDetailId] || 0) + delta;
      return { ...prev, [orderDetailId]: Math.max(0, newQuantity) };
    });
  };

  const handleVaccineChange = (orderDetailId: number, facilityVaccineId: number) => {
    setTempVaccineSelections((prev) => ({
      ...prev,
      [orderDetailId]: facilityVaccineId,
    }));
  };

  const vaccineColumns = [
    {
      title: "Tên bệnh",
      dataIndex: ["disease", "name"],
      key: "diseaseName",
      render: (text: string) => <span className="text-gray-800">{text}</span>,
    },
    {
      title: "Tên vắc xin",
      dataIndex: ["facilityVaccine", "vaccine", "name"],
      key: "vaccineName",
      render: (_: any, record: any) => (
        <Select
          value={tempVaccineSelections[record.orderDetailId] || record.facilityVaccine.facilityVaccineId}
          onChange={(value) => handleVaccineChange(record.orderDetailId, value)}
          className="w-full"
          placeholder="Chọn vắc xin"
        >
          {availableVaccines
            .filter((vaccine) => vaccine.vaccine.diseases.some((d: any) => d.diseaseId === record.disease.diseaseId))
            .map((vaccine) => (
              <Option key={vaccine.facilityVaccineId} value={vaccine.facilityVaccineId}>
                {vaccine.vaccine.name}
              </Option>
            ))}
        </Select>
      ),
    },
    {
      title: "Số lượng",
      dataIndex: "remainingQuantity",
      key: "remainingQuantity",
      render: (_: any, record: any) => (
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            onClick={() => handleQuantityChange(record.orderDetailId, -1)}
            disabled={tempQuantities[record.orderDetailId] <= 0}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded-full"
          >
            -
          </Button>
          <span className="text-gray-800">{tempQuantities[record.orderDetailId]}</span>
          <Button
            type="button"
            onClick={() => handleQuantityChange(record.orderDetailId, 1)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded-full"
          >
            +
          </Button>
        </div>
      ),
    },
  ];

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-teal-50 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <Button
            type="button"
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-full transition-colors"
            onClick={handleBackByPosition}
          >
            Quay lại
          </Button>
        </div>
        <h2 className="text-3xl font-bold text-indigo-900 mb-6">Quy trình tiêm chủng</h2>
        <div className="mb-8">
          <VaccinationSteps currentStep={1} />
        </div>

        <Modal
          title="Xác nhận gửi khảo sát sức khỏe"
          open={showConfirmSubmitModal}
          onCancel={() => setShowConfirmSubmitModal(false)}
          footer={[
            <Button
              key="no"
              onClick={() => setShowConfirmSubmitModal(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-full transition-colors"
            >
              Không
            </Button>,
            <Button
              key="submit"
              onClick={() => {
                setShowConfirmSubmitModal(false);
                handleSubmit();
              }}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-full transition-colors"
            >
              Gửi
            </Button>,
          ]}
          centered
        >
          <p className="text-gray-700">Bạn có muốn gửi khảo sát sức khỏe này không?</p>
        </Modal>

        <Modal
          title="Điều chỉnh gói vắc xin"
          open={showAdjustPackageModal}
          onCancel={() => setShowAdjustPackageModal(false)}
          footer={[
            <Button
              key="close"
              onClick={() => setShowAdjustPackageModal(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-full transition-colors"
            >
              Đóng
            </Button>,
            <Button
              key="save"
              onClick={handleUpdateOrder}
              disabled={submitting}
              className={`bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-full transition-colors ${
                submitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {submitting ? "Đang lưu..." : "Lưu"}
            </Button>,
          ]}
          centered
          width={800}
        >
          <div className="space-y-4">
            <p className="text-gray-700">Danh sách vắc xin trong gói:</p>
            {appointment.order && appointment.order.orderDetails.length > 0 ? (
              <Table
                columns={vaccineColumns}
                dataSource={appointment.order.orderDetails}
                rowKey="orderDetailId"
                pagination={false}
                className="border rounded-lg"
                locale={{
                  emptyText: (
                    <div className="text-gray-500 py-4">Không có vắc xin trong gói.</div>
                  ),
                }}
              />
            ) : (
              <div className="text-gray-500 py-4">Không có vắc xin trong gói.</div>
            )}
          </div>
        </Modal>

        <Modal
          title="Thành công"
          open={showAdjustSuccessModal}
          onCancel={() => setShowAdjustSuccessModal(false)}
          footer={[
            <Button
              key="ok"
              onClick={() => setShowAdjustSuccessModal(false)}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-full transition-colors"
            >
              OK
            </Button>,
          ]}
          centered
        >
          <p className="text-gray-700">Cập nhật gói vắc xin thành công!</p>
        </Modal>

        {appointment.status === "Cancelled" && (
          <div className="mb-8 p-4 bg-rose-100 text-rose-700 rounded-lg flex items-center">
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
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-semibold">Lịch tiêm đã bị hủy</span>
          </div>
        )}

        <Modal
          title="Thành công"
          open={showSuccessModal}
          onCancel={() => setShowSuccessModal(false)}
          footer={null}
          centered
        >
          <p className="text-gray-700">Đã hoàn thành khảo sát sức khỏe.</p>
        </Modal>

        <Modal
          title="Thành công"
          open={showCancelSuccessModal}
          onCancel={() => {
            setShowCancelSuccessModal(false);
            navigate("/staff/appointments");
          }}
          footer={[
            <Button
              key="ok"
              onClick={() => {
                setShowCancelSuccessModal(false);
                navigate("/staff/appointments");
              }}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-full transition-colors"
            >
              OK
            </Button>,
          ]}
          centered
        >
          <p className="text-gray-700">Hủy lịch hẹn thành công!</p>
        </Modal>

        <Modal
          title="Xác nhận hủy lịch hẹn"
          open={showCancelConfirmModal}
          onCancel={() => setShowCancelConfirmModal(false)}
          footer={[
            <Button
              key="no"
              onClick={() => {
                setShowCancelConfirmModal(false);
                setShowCancelReasonModal(true);
              }}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-full transition-colors"
            >
              Không
            </Button>,
            <Button
              key="yes"
              onClick={() => {
                setShowCancelConfirmModal(false);
                setShowRebookModal(true);
              }}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-full transition-colors"
            >
              Có
            </Button>,
          ]}
          centered
        >
          <p className="text-gray-700">Bạn có muốn đặt lại lịch mới không?</p>
        </Modal>

        <Modal
          title="Lý do hủy lịch hẹn"
          open={showCancelReasonModal}
          onCancel={() => setShowCancelReasonModal(false)}
          footer={[
            <Button
              key="cancel"
              onClick={() => setShowCancelReasonModal(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-full transition-colors"
            >
              Hủy
            </Button>,
            <Button
              key="submit"
              onClick={handleCancel}
              disabled={submitting}
              className={`bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-full transition-colors ${
                submitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {submitting ? "Đang xử lý..." : "Xác nhận hủy"}
            </Button>,
          ]}
          centered
        >
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Lý do hủy</label>
              <Input.TextArea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Nhập lý do hủy lịch hẹn (không bắt buộc)"
                rows={3}
              />
            </div>
          </div>
        </Modal>

        <Modal
          title="Đặt lại lịch hẹn"
          open={showRebookModal}
          onCancel={() => setShowRebookModal(false)}
          footer={[
            <Button
              key="cancel"
              onClick={() => setShowRebookModal(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-full transition-colors"
            >
              Hủy
            </Button>,
            <Button
              key="submit"
              onClick={handleRebook}
              disabled={submitting || !selectedSlotId}
              className={`bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-full transition-colors ${
                submitting || !selectedSlotId ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {submitting ? "Đang xử lý..." : "Xác nhận đặt lại"}
            </Button>,
          ]}
          centered
        >
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Chọn ngày</label>
              <DatePicker
                value={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                format="YYYY-MM-DD"
                className="w-full"
                disabledDate={(current) => current && current < dayjs().startOf("day")}
              />
            </div>
            {schedules && (
              <div>
                <label className="block text-gray-700 font-medium mb-2">Chọn giờ tiêm</label>
                <Select
                  value={selectedSlotId}
                  onChange={(value) => setSelectedSlotId(value)}
                  placeholder="Chọn giờ tiêm"
                  className="w-full"
                >
                  {schedules.dailySchedules[0]?.availableSlots.map(slot => (
                    <Select.Option key={slot.scheduleId} value={slot.scheduleId}>
                      {slot.slotTime}
                    </Select.Option>
                  ))}
                </Select>
              </div>
            )}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Ghi chú</label>
              <Input.TextArea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập ghi chú"
                rows={3}
              />
            </div>
          </div>
        </Modal>

        {user?.position === "Staff" && appointment.status === "Pending" && (
          <div className="mb-8 p-4 bg-yellow-100 text-yellow-700 rounded-lg flex items-center">
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
            <span className="font-semibold">Đang đợi bác sĩ làm thăm khám</span>
          </div>
        )}

        {(user?.position === "Doctor" || (user?.position === "Doctor" && appointment.order && appointment.status === "Pending")) && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-lg font-semibold text-gray-800">
                Chọn bộ câu hỏi thăm khám trước tiêm chủng
              </h3>
              {user?.position === "Doctor" && appointment.order && appointment.status === "Pending" && (
                <Button
                  type="button"
                  onClick={() => setShowAdjustPackageModal(true)}
                  disabled={submitting}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-full transition-colors"
                >
                  Điều chỉnh gói vắc xin
                </Button>
              )}
            </div>
            {user?.position === "Doctor" && showSurveySelect && (
              <Select
                placeholder="-- Chọn bộ câu hỏi --"
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
            )}
          </div>
        )}

        {user?.position === "Doctor" && showSurveySelect && selectedSurvey && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-700 mb-4 border-b pb-2">
              Câu hỏi thăm khám trước khi tiêm chủng: {selectedSurvey.title}
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
                Không có câu hỏi nào cho bộ câu hỏi này.
              </div>
            ) : (
              <>
                <h4 className="text-md font-semibold text-gray-800 mb-4">Câu hỏi thăm khám sức khỏe</h4>
                <ul className="space-y-4 mb-8">
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

                <h4 className="text-md font-semibold text-gray-800 mb-4">Thông tin sức khỏe</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">
                        Nhiệt độ cơ thể (°C)
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        value={healthInfo.temperatureC ?? ""}
                        onChange={(e) =>
                          handleHealthInfoChange("temperatureC", parseFloat(e.target.value) || null)
                        }
                        placeholder="Nhập nhiệt độ cơ thể (tùy chọn)"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-sm text-gray-500 mt-1">Nhiệt độ cơ thể bình thường từ 35.0°C đến 40.0°C</p>
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">
                        Nhịp tim (bpm)
                      </label>
                      <Input
                        type="number"
                        value={healthInfo.heartRateBpm ?? ""}
                        onChange={(e) =>
                          handleHealthInfoChange("heartRateBpm", parseInt(e.target.value) || null)
                        }
                        placeholder="Nhập nhịp tim (tùy chọn)"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-sm text-gray-500 mt-1">Nhịp tim bình thường từ 60 đến 160 bpm</p>
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">
                        Huyết áp tâm thu (mmHg)
                      </label>
                      <Input
                        type="number"
                        value={healthInfo.systolicBpmmHg ?? ""}
                        onChange={(e) =>
                          handleHealthInfoChange("systolicBpmmHg", parseInt(e.target.value) || null)
                        }
                        placeholder="Nhập huyết áp tâm thu (tùy chọn)"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-sm text-gray-500 mt-1">Huyết áp tâm thu bình thường từ 70 đến 120 mmHg</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">
                        Huyết áp tâm trương (mmHg)
                      </label>
                      <Input
                        type="number"
                        value={healthInfo.diastolicBpmmHg ?? ""}
                        onChange={(e) =>
                          handleHealthInfoChange("diastolicBpmmHg", parseInt(e.target.value) || null)
                        }
                        placeholder="Nhập huyết áp tâm trương (tùy chọn)"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-sm text-gray-500 mt-1">Huyết áp tâm trương bình thường từ 40 đến 80 mmHg</p>
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">
                        Độ bão hòa oxy (%)
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        value={healthInfo.oxygenSatPercent ?? ""}
                        onChange={(e) =>
                          handleHealthInfoChange("oxygenSatPercent", parseFloat(e.target.value) || null)
                        }
                        placeholder="Nhập độ bão hòa oxy (tùy chọn)"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-sm text-gray-500 mt-1">Độ bão hòa oxy bình thường từ 90% đến 100%</p>
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">Ghi chú quyết định</label>
                      <TextArea
                        value={healthInfo.decisionNote}
                        onChange={(e) => handleHealthInfoChange("decisionNote", e.target.value)}
                        placeholder="Nhập ghi chú quyết định (tùy chọn)"
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="flex items-center">
                        <Checkbox
                          checked={healthInfo.consentObtained}
                          onChange={(e) => handleHealthInfoChange("consentObtained", e.target.checked)}
                          className="text-gray-700"
                          required
                        />
                        <span className="ml-2">Đã nhận được sự đồng ý</span>
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {!showSurveySelect && surveyAnswers && surveyAnswers.questions.length > 0 && (
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
                    Câu trả lời thăm khám sức khỏe
                  </h3>
                  <span className="text-sm text-gray-500">
                    {surveyAnswers.questions.length} câu trả lời
                  </span>
                </div>
              }
              key="1"
              className="p-6"
            >
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4 flex items-center justify-between">
                  <span className="text-blue-700 font-semibold">
                    Tổng cộng: {surveyAnswers.questions.length} câu trả lời
                  </span>
                  <span className="text-sm text-gray-500">
                    Cập nhật đến {new Date(surveyAnswers.submittedAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h4 className="text-md font-semibold text-gray-800 mb-2">Thông tin sức khỏe</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p><strong>Nhiệt độ cơ thể:</strong> {surveyAnswers.temperatureC || "0"}°C</p>
                      <p><strong>Nhịp tim:</strong> {surveyAnswers.heartRateBpm || "0"} bpm</p>
                      <p><strong>Huyết áp:</strong> {surveyAnswers.systolicBpmmHg || "0"}/{surveyAnswers.diastolicBpmmHg || "0"} mmHg</p>
                    </div>
                    <div>
                      <p><strong>Độ bão hòa oxy:</strong> {surveyAnswers.oxygenSatPercent || "0"}%</p>
                      <p><strong>Ghi chú quyết định:</strong> {surveyAnswers.decisionNote || "Không có"}</p>
                      <p><strong>Đồng ý:</strong> {surveyAnswers.consentObtained ? "Có" : "Không"}</p>
                    </div>
                  </div>
                </div>
                {surveyAnswers.questions.map((ans: QuestionResponse, idx: number) => (
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

        {!showSurveySelect && (!surveyAnswers || surveyAnswers.questions.length === 0) && (
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
            Không có câu trả lời.
          </div>
        )}

        <div className="flex justify-end space-x-4 mt-8 items-center">
          <Button
            type="button"
            onClick={handleBack}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-full transition-colors"
            disabled={submitting || appointment.status === "Cancelled"}
          >
            Trở lại
          </Button>
          {user?.position === "Staff" && appointment.status === "Approval" && (
            <Button
              type="button"
              onClick={handleCancelConfirm}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full transition-colors"
            >
              Hủy lịch hẹn
            </Button>
          )}
          {user?.position === "Doctor" && showSurveySelect && (
            <Button
              type="button"
              onClick={handleConfirmSubmit}
              className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full transition-colors ${
                submitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={submitting}
            >
              {submitting ? "Đang lưu..." : "Gửi"}
            </Button>
          )}
          {user?.position === "Staff" && appointment.status !== "Pending" && appointment.status !== "Cancelled" && (
            <Button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full transition-colors"
              onClick={() => navigate(`/staff/appointments/${id}/step-3`)}
              disabled={submitting}
            >
              Tiếp tục
            </Button>
          )}
          {user?.position === "Doctor" && !showSurveySelect && appointment.status !== "Cancelled" && (
            <Button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full transition-colors"
              onClick={() => navigate(`/doctor/appointments/${id}/step-3`)}
              disabled={submitting}
            >
              Tiếp tục
            </Button>
          )}
          {submitMessage && (
            <span className={`ml-4 font-medium ${submitMessage.includes("thành công") || submitMessage.includes("hoàn thành") ? "text-emerald-600" : "text-rose-500"}`}>
              {submitMessage}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}