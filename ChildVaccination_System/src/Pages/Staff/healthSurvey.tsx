import { useNavigate, useParams } from "react-router-dom";
import { getUserInfo } from "@/lib/storage";
import VaccinationSteps from "@/Components/VaccinationStep";
import { Button } from "@/Components/ui/button";
import {diseaseApi} from "@/api/diseaseApi";
import { useEffect, useState, useMemo } from "react";
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
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });
  const user = getUserInfo();
  const [vaccineProfiles, setVaccineProfiles] = useState<VaccineProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [errorProfiles, setErrorProfiles] = useState<string>("");
  const [vaccineMap, setVaccineMap] = useState<Record<number, string>>({});
  const [diseaseMap, setDiseaseMap] = useState<Record<number, string>>({});

  const getVaccineName = async (id: number) => {
    if (vaccineMap[id]) return vaccineMap[id];
    try {
      const v = await facilityVaccineApi.getById(id);
      setVaccineMap((prev) => ({ ...prev, [id]: v.vaccine.name }));
      return v.vaccine.name;
    } catch {
      setVaccineMap((prev) => ({ ...prev, [id]: `ID: ${id}` }));
      return `ID: ${id}`;
    }
  };

  const getDiseaseName = async (id: number) => {
    if (diseaseMap[id]) return diseaseMap[id];
    try {
      const d = await diseaseApi.getById(id); 
      setDiseaseMap((prev) => ({ ...prev, [id]: d.name }));
      return d.name;
    } catch {
      setDiseaseMap((prev) => ({ ...prev, [id]: `Bệnh ID: ${id}` }));
      return `Bệnh ID: ${id}`;
    }
  };

  const showSurveySelect = appointment && user?.position === "Doctor" && appointment.status === "Pending";

  const totalPrice = useMemo(() => {
    if (!appointment?.order?.orderDetails || !availableVaccines.length) return 0;
    return appointment.order.orderDetails.reduce((total, detail) => {
      const selectedVaccineId = tempVaccineSelections[detail.orderDetailId] || detail.facilityVaccine.facilityVaccineId;
      const vaccine = availableVaccines.find(v => v.facilityVaccineId === selectedVaccineId);
      const quantity = tempQuantities[detail.orderDetailId] ?? detail.remainingQuantity;
      return total + (vaccine?.price || 0) * quantity;
    }, 0);
  }, [appointment?.order?.orderDetails, tempQuantities, tempVaccineSelections, availableVaccines]);

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

  useEffect(() => {
    if (appointment?.child?.childId && user?.position === "Doctor") {
      setLoadingProfiles(true);
      setErrorProfiles("");
      childprofileApi
        .getChildVaccineProfile(appointment.child.childId)
        .then((profiles) => {
          console.log("Raw vaccine profiles:", profiles);
          const filteredProfiles = profiles.filter((vp) => vp.status === "Completed");
          console.log("Filtered vaccine profiles (Completed only):", filteredProfiles);
          setVaccineProfiles(filteredProfiles);
        })
        .catch(() => setErrorProfiles("Không thể tải lịch sử tiêm chủng."))
        .finally(() => setLoadingProfiles(false));
    }
  }, [appointment?.child?.childId, user?.position]);

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
      setToast({ show: true, message: "Không có ID lịch hẹn.", type: "error" });
      setTimeout(() => setToast({ show: false, message: "", type: "success" }), 2500);
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
      setToast({ show: true, message: "Hủy lịch hẹn thành công", type: "success" });
      setTimeout(() => setToast({ show: false, message: "", type: "success" }), 2500);
    } catch {
      message.error("Không thể hủy lịch hẹn.");
      setToast({ show: true, message: "Không thể hủy lịch hẹn", type: "error" });
      setTimeout(() => setToast({ show: false, message: "", type: "success" }), 2500);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRebook = async () => {
    if (!id || !selectedSlotId || !childVaccineProfileId) {
      message.error("Vui lòng chọn ngày và slot.");
      setToast({ show: true, message: "Vui lòng chọn ngày và slot", type: "error" });
      setTimeout(() => setToast({ show: false, message: "", type: "success" }), 2500);
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
      setShowRebookModal(false);
      navigate("/staff/appointments");
      setToast({ show: true, message: "Đã hủy và đặt lại lịch thành công", type: "success" });
      setTimeout(() => setToast({ show: false, message: "", type: "success" }), 2500);
    } catch {
      message.error("Không thể hủy và đặt lại lịch.");
      setToast({ show: true, message: "Không thể hủy và đặt lại lịch", type: "error" });
      setTimeout(() => setToast({ show: false, message: "", type: "success" }), 2500);
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
      setToast({ show: true, message: "Vui lòng chọn khảo sát trước khi gửi", type: "error" });
      setTimeout(() => setToast({ show: false, message: "", type: "success" }), 2500);
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
        setShowSuccessModal(true);
        setToast({ show: true, message: "Đã hoàn thành khảo sát sức khỏe", type: "success" });
        setTimeout(() => {
          setShowSuccessModal(false);
          navigate(`/doctor/appointments/${id}/step-3`);
          setToast({ show: false, message: "", type: "success" });
        }, 2500);
      } else {
        setSubmitMessage(response.message);
        message.error(response.message);
        setToast({ show: true, message: response.message, type: "error" });
        setTimeout(() => setToast({ show: false, message: "", type: "success" }), 2500);
      }
    } catch {
      setSubmitMessage("Lỗi khi lưu câu trả lời khảo sát.");
      message.error("Lỗi khi lưu câu trả lời khảo sát.");
      setToast({ show: true, message: "Lỗi khi lưu câu trả lời khảo sát", type: "error" });
      setTimeout(() => setToast({ show: false, message: "", type: "success" }), 2500);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmSubmit = () => {
    if (!appointment || !selectedSurvey) {
      setSubmitMessage("Vui lòng chọn khảo sát trước khi gửi.");
      message.error("Vui lòng chọn khảo sát trước khi gửi.");
      setToast({ show: true, message: "Vui lòng chọn khảo sát trước khi gửi", type: "error" });
      setTimeout(() => setToast({ show: false, message: "", type: "success" }), 2500);
      return;
    }
    if (!isInputComplete()) {
      setSubmitMessage("Vui lòng điền đầy đủ thông tin bắt buộc.");
      message.error("Vui lòng điền đầy đủ thông tin bắt buộc.");
      setToast({ show: true, message: "Vui lòng điền đầy đủ thông tin bắt buộc", type: "error" });
      setTimeout(() => setToast({ show: false, message: "", type: "success" }), 2500);
      return;
    }
    setShowConfirmSubmitModal(true);
  };

  const handleUpdateOrder = async () => {
    if (!appointment?.order?.orderId) {
      message.error("Không tìm thấy thông tin đơn hàng.");
      setToast({ show: true, message: "Không tìm thấy thông tin đơn hàng", type: "error" });
      setTimeout(() => setToast({ show: false, message: "", type: "success" }), 2500);
      return;
    }
    setSubmitting(true);
    try {
      const updatedOrderDetails = appointment.order.orderDetails.map((detail) => ({
        diseaseId: detail.diseaseId,
        facilityVaccineId: tempVaccineSelections[detail.orderDetailId] || detail.facilityVaccine.facilityVaccineId,
        quantity: tempQuantities[detail.orderDetailId] ?? detail.remainingQuantity,
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
      const initialQuantities: Record<number, number> = {};
      const initialSelections: Record<number, number> = {};
      appointmentData.order.orderDetails.forEach((detail: any) => {
        initialQuantities[detail.orderDetailId] = detail.remainingQuantity;
        initialSelections[detail.orderDetailId] = detail.facilityVaccine.facilityVaccineId;
      });
      setTempQuantities(initialQuantities);
      setTempVaccineSelections(initialSelections);
      setShowAdjustSuccessModal(true);
      setToast({ show: true, message: "Cập nhật gói vắc xin thành công", type: "success" });
      setTimeout(() => {
        setShowAdjustSuccessModal(false);
        setToast({ show: false, message: "", type: "success" });
      }, 2500);
    } catch (error) {
      console.error("Error updating order:", error);
      message.error("Lỗi khi cập nhật gói vắc xin.");
      setToast({ show: true, message: "Lỗi khi cập nhật gói vắc xin", type: "error" });
      setTimeout(() => setToast({ show: false, message: "", type: "success" }), 2500);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuantityChange = (orderDetailId: number, delta: number) => {
    setTempQuantities((prev) => {
      const newQuantity = (prev[orderDetailId] ?? 0) + delta;
      return { ...prev, [orderDetailId]: newQuantity < 0 ? 0 : newQuantity };
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
      render: (text: string) => <span className="text-gray-700 font-medium">{text}</span>,
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
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleQuantityChange(record.orderDetailId, -1)}
            disabled={(tempQuantities[record.orderDetailId] ?? 0) <= 0}
            className="w-8 h-8 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
          >
            -
          </button>
          <span className="text-gray-700 font-medium">{tempQuantities[record.orderDetailId] ?? 0}</span>
          <button
            onClick={() => handleQuantityChange(record.orderDetailId, 1)}
            className="w-8 h-8 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full flex items-center justify-center transition-colors"
          >
            +
          </button>
        </div>
      ),
    },
    {
      title: "Giá",
      key: "price",
      render: (_: any, record: any) => {
        const selectedVaccineId = tempVaccineSelections[record.orderDetailId] || record.facilityVaccine.facilityVaccineId;
        const vaccine = availableVaccines.find(v => v.facilityVaccineId === selectedVaccineId);
        const quantity = tempQuantities[record.orderDetailId] ?? 0;
        const price = vaccine ? (vaccine.price * quantity) : 0;
        return (
          <span className="text-gray-700 font-medium">
            {price.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
          </span>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
          <span className="text-lg text-gray-600 font-medium">Đang tải dữ liệu...</span>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-100 text-red-700 p-6 rounded-xl shadow-lg flex items-center space-x-3">
          <svg
            className="w-8 h-8"
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
          <span className="text-lg font-semibold">Không tìm thấy cuộc hẹn</span>
        </div>
      </div>
    );
  }

  const child = appointment.child;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg text-white font-semibold transition-all duration-300 ease-in-out ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="max-w-5xl mx-auto bg-white shadow-2xl rounded-2xl p-8">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={handleBackByPosition}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-full font-medium transition-colors duration-200"
          >
            Quay lại
          </button>
          <h2 className="text-3xl font-bold text-gray-800">Thăm khám trước khi tiêm</h2>
          <div className="w-24"></div> {/* Placeholder for alignment */}
        </div>
        <div className="mb-10">
          <VaccinationSteps currentStep={1} />
        </div>

        <Modal
          title={<span className="text-xl font-semibold text-gray-800">Xác nhận gửi khảo sát</span>}
          open={showConfirmSubmitModal}
          onCancel={() => setShowConfirmSubmitModal(false)}
          footer={[
            <button
              key="no"
              onClick={() => setShowConfirmSubmitModal(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-full font-medium transition-colors duration-200"
            >
              Không
            </button>,
            <button
              key="submit"
              onClick={() => {
                setShowConfirmSubmitModal(false);
                handleSubmit();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium transition-colors duration-200"
            >
              Gửi
            </button>,
          ]}
          centered
          className="rounded-xl"
        >
          <p className="text-gray-600">Bạn có muốn gửi khảo sát sức khỏe này không?</p>
        </Modal>

        <Modal
          title={<span className="text-xl font-semibold text-gray-800">Điều chỉnh gói vắc xin</span>}
          open={showAdjustPackageModal}
          onCancel={() => setShowAdjustPackageModal(false)}
          footer={[
            <button
              key="close"
              onClick={() => setShowAdjustPackageModal(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-full font-medium transition-colors duration-200"
            >
              Đóng
            </button>,
            <button
              key="save"
              onClick={handleUpdateOrder}
              disabled={submitting}
              className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium transition-colors duration-200 ${submitting ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {submitting ? "Đang lưu..." : "Lưu"}
            </button>,
          ]}
          centered
          width={900}
          className="rounded-xl"
        >
          <div className="space-y-6">
            <p className="text-gray-600 font-medium">Danh sách vắc xin trong gói:</p>
            {appointment.order && appointment.order.orderDetails.length > 0 ? (
              <>
                <Table
                  columns={vaccineColumns}
                  dataSource={appointment.order.orderDetails}
                  rowKey="orderDetailId"
                  pagination={false}
                  className="border rounded-xl bg-white shadow-sm"
                  locale={{
                    emptyText: (
                      <div className="text-gray-500 py-6 text-center">Không có vắc xin trong gói.</div>
                    ),
                  }}
                />
                <div className="bg-blue-50 rounded-xl p-4 flex items-center justify-between shadow-sm">
                  <span className="text-blue-700 font-semibold text-lg">Tổng giá gói vắc xin:</span>
                  <span className="text-blue-700 font-semibold text-lg">
                    {totalPrice.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-gray-500 py-6 text-center">Không có vắc xin trong gói.</div>
            )}
          </div>
        </Modal>

        <Modal
          title={<span className="text-xl font-semibold text-gray-800">Thành công</span>}
          open={showAdjustSuccessModal}
          onCancel={() => setShowAdjustSuccessModal(false)}
          footer={[
            <button
              key="ok"
              onClick={() => setShowAdjustSuccessModal(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium transition-colors duration-200"
            >
              OK
            </button>,
          ]}
          centered
          className="rounded-xl"
        >
          <p className="text-gray-600">Cập nhật gói vắc xin thành công!</p>
        </Modal>

        {appointment.status === "Cancelled" && (
          <div className="mb-8 p-6 bg-red-50 text-red-700 rounded-xl flex items-center space-x-3 shadow-sm">
            <svg
              className="w-8 h-8"
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
            <span className="text-lg font-semibold">Lịch tiêm đã bị hủy</span>
          </div>
        )}

        <Modal
          title={<span className="text-xl font-semibold text-gray-800">Thành công</span>}
          open={showSuccessModal}
          onCancel={() => setShowSuccessModal(false)}
          footer={null}
          centered
          className="rounded-xl"
        >
          <p className="text-gray-600">Đã hoàn thành khảo sát sức khỏe.</p>
        </Modal>

        <Modal
          title={<span className="text-xl font-semibold text-gray-800">Thành công</span>}
          open={showCancelSuccessModal}
          onCancel={() => {
            setShowCancelSuccessModal(false);
            navigate("/staff/appointments");
          }}
          footer={[
            <button
              key="ok"
              onClick={() => {
                setShowCancelSuccessModal(false);
                navigate("/staff/appointments");
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium transition-colors duration-200"
            >
              OK
            </button>,
          ]}
          centered
          className="rounded-xl"
        >
          <p className="text-gray-600">Hủy lịch hẹn thành công!</p>
        </Modal>

        <Modal
          title={<span className="text-xl font-semibold text-gray-800">Xác nhận hủy lịch hẹn</span>}
          open={showCancelConfirmModal}
          onCancel={() => setShowCancelConfirmModal(false)}
          footer={[
            <button
              key="no"
              onClick={() => {
                setShowCancelConfirmModal(false);
                setShowCancelReasonModal(true);
              }}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-full font-medium transition-colors duration-200"
            >
              Không
            </button>,
            <button
              key="yes"
              onClick={() => {
                setShowCancelConfirmModal(false);
                setShowRebookModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium transition-colors duration-200"
            >
              Có
            </button>,
          ]}
          centered
          className="rounded-xl"
        >
          <p className="text-gray-600">Bạn có muốn đặt lại lịch mới không?</p>
        </Modal>

        <Modal
          title={<span className="text-xl font-semibold text-gray-800">Lý do hủy lịch hẹn</span>}
          open={showCancelReasonModal}
          onCancel={() => setShowCancelReasonModal(false)}
          footer={[
            <button
              key="cancel"
              onClick={() => setShowCancelReasonModal(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-full font-medium transition-colors duration-200"
            >
              Hủy
            </button>,
            <button
              key="submit"
              onClick={handleCancel}
              disabled={submitting}
              className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium transition-colors duration-200 ${submitting ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {submitting ? "Đang xử lý..." : "Xác nhận hủy"}
            </button>,
          ]}
          centered
          className="rounded-xl"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Lý do hủy</label>
              <TextArea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Nhập lý do hủy lịch hẹn (không bắt buộc)"
                rows={4}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </Modal>

        <Modal
          title={<span className="text-xl font-semibold text-gray-800">Đặt lại lịch hẹn</span>}
          open={showRebookModal}
          onCancel={() => setShowRebookModal(false)}
          footer={[
            <button
              key="cancel"
              onClick={() => setShowRebookModal(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-full font-medium transition-colors duration-200"
            >
              Hủy
            </button>,
            <button
              key="submit"
              onClick={handleRebook}
              disabled={submitting || !selectedSlotId}
              className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium transition-colors duration-200 ${submitting || !selectedSlotId ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {submitting ? "Đang xử lý..." : "Xác nhận đặt lại"}
            </button>,
          ]}
          centered
          className="rounded-xl"
        >
          <div className="space-y-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Chọn ngày</label>
              <DatePicker
                value={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                format="YYYY-MM-DD"
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              <TextArea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập ghi chú"
                rows={4}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </Modal>

        {user?.position === "Staff" && appointment.status === "Pending" && (
          <div className="mb-8 p-6 bg-yellow-50 text-yellow-700 rounded-xl flex items-center space-x-3 shadow-sm">
            <svg
              className="w-8 h-8"
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
            <span className="text-lg font-semibold">Đang đợi bác sĩ làm thăm khám</span>
          </div>
        )}

        {(user?.position === "Doctor" || (user?.position === "Doctor" && appointment.order &&   appointment.status === "Pending")) && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                Chọn bộ câu hỏi thăm khám trước tiêm chủng
              </h3>
              {user?.position === "Doctor" && appointment.order && appointment.status === "Pending" && (
                <button
                  onClick={() => setShowAdjustPackageModal(true)}
                  disabled={submitting}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-full font-medium transition-colors duration-200"
                >
                  Điều chỉnh gói vắc xin
                </button>
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
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h3 className="text-xl font-semibold text-blue-700 mb-6 border-b border-gray-200 pb-4">
              Câu hỏi thăm khám trước khi tiêm chủng: {selectedSurvey.title}
            </h3>
            {loadingQuestions ? (
              <div className="flex flex-col items-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
                <span className="mt-4 text-lg text-gray-600 font-medium">Đang tải câu hỏi...</span>
                <div className="w-full max-w-md bg-gray-200 rounded-full h-2 mt-4">
                  <div
                    className="bg-blue-600 h-2 rounded-full animate-pulse"
                    style={{ width: "60%" }}
                  ></div>
                </div>
              </div>
            ) : surveyQuestions.length === 0 ? (
              <div className="bg-gray-50 text-gray-600 p-6 rounded-xl flex items-center justify-center space-x-3 shadow-sm">
                <svg
                  className="w-8 h-8"
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
                <span className="text-lg font-medium">Không có câu hỏi nào cho bộ câu hỏi này.</span>
              </div>
            ) : (
              <>
                <h4 className="text-lg font-semibold text-gray-800 mb-6">Câu hỏi thăm khám sức khỏe</h4>
                <ul className="space-y-6 mb-10">
                  {surveyQuestions.map((q: Question) => (
                    <li
                      key={q.questionId}
                      className="bg-gray-50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="flex items-center mb-4">
                        <svg
                          className="w-6 h-6 mr-3 text-blue-600"
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
                        <span className="text-lg font-medium text-gray-800">{q.questionText}</span>
                        {q.isRequired && <span className="text-red-500 ml-2">*</span>}
                      </div>
                      <div className="mt-4">
                        {q.questionType === "Text" ? (
                          <textarea
                            className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none transition-colors duration-200"
                            value={answers[q.questionId] || ""}
                            onChange={(e) => handleChangeAnswer(q.questionId, e.target.value)}
                            rows={4}
                            placeholder="Nhập câu trả lời..."
                          />
                        ) : q.questionType === "YesNo" ? (
                          <div className="flex gap-8">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="radio"
                                name={`q_${q.questionId}`}
                                value="yes"
                                checked={answers[q.questionId] === "yes"}
                                onChange={() => handleChangeAnswer(q.questionId, "yes")}
                                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                              />
                              <span className="text-gray-700 font-medium">Có</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="radio"
                                name={`q_${q.questionId}`}
                                value="no"
                                checked={answers[q.questionId] === "no"}
                                onChange={() => handleChangeAnswer(q.questionId, "no")}
                                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                              />
                              <span className="text-gray-700 font-medium">Không</span>
                            </label>
                          </div>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>

                <h4 className="text-lg font-semibold text-gray-800 mb-6">Thông tin sức khỏe</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Nhiệt độ cơ thể (°C)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={healthInfo.temperatureC ?? ""}
                        onChange={(e) =>
                          handleHealthInfoChange("temperatureC", parseFloat(e.target.value) || null)
                        }
                        placeholder="Nhập nhiệt độ cơ thể (tùy chọn)"
                        className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors duration-200"
                      />
                      <p className="text-sm text-gray-500 mt-2">Bình thường: 35.0°C - 40.0°C</p>
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Nhịp tim (bpm)
                      </label>
                      <input
                        type="number"
                        value={healthInfo.heartRateBpm ?? ""}
                        onChange={(e) =>
                          handleHealthInfoChange("heartRateBpm", parseInt(e.target.value) || null)
                        }
                        placeholder="Nhập nhịp tim (tùy chọn)"
                        className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors duration-200"
                      />
                      <p className="text-sm text-gray-500 mt-2">Bình thường: 60 - 160 bpm</p>
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Huyết áp tâm thu (mmHg)
                      </label>
                      <input
                        type="number"
                        value={healthInfo.systolicBpmmHg ?? ""}
                        onChange={(e) =>
                          handleHealthInfoChange("systolicBpmmHg", parseInt(e.target.value) || null)
                        }
                        placeholder="Nhập huyết áp tâm thu (tùy chọn)"
                        className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors duration-200"
                      />
                      <p className="text-sm text-gray-500 mt-2">Bình thường: 70 - 120 mmHg</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Huyết áp tâm trương (mmHg)
                      </label>
                      <input
                        type="number"
                        value={healthInfo.diastolicBpmmHg ?? ""}
                        onChange={(e) =>
                          handleHealthInfoChange("diastolicBpmmHg", parseInt(e.target.value) || null)
                        }
                        placeholder="Nhập huyết áp tâm trương (tùy chọn)"
                        className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors duration-200"
                      />
                      <p className="text-sm text-gray-500 mt-2">Bình thường: 40 - 80 mmHg</p>
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Độ bão hòa oxy (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={healthInfo.oxygenSatPercent ?? ""}
                        onChange={(e) =>
                          handleHealthInfoChange("oxygenSatPercent", parseFloat(e.target.value) || null)
                        }
                        placeholder="Nhập độ bão hòa oxy (tùy chọn)"
                        className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors duration-200"
                      />
                      <p className="text-sm text-gray-500 mt-2">Bình thường: 90% - 100%</p>
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Ghi chú quyết định</label>
                      <TextArea
                        value={healthInfo.decisionNote}
                        onChange={(e) => handleHealthInfoChange("decisionNote", e.target.value)}
                        placeholder="Nhập ghi chú quyết định (tùy chọn)"
                        rows={4}
                        className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none transition-colors duration-200"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox
                          checked={healthInfo.consentObtained}
                          onChange={(e) => handleHealthInfoChange("consentObtained", e.target.checked)}
                          className="text-blue-600"
                          required
                        />
                        <span className="text-gray-700 font-medium">Đã nhận được sự đồng ý</span>
                        <span className="text-red-500">*</span>
                      </label>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {user?.position === "Doctor" && (
          <Collapse
            activeKey={isAnswersVisible ? ["1"] : []}
            className="mb-8 bg-white rounded-xl shadow-md border-l-4 border-teal-500"
            expandIcon={({ isActive }) => (
              <CaretRightOutlined rotate={isActive ? 90 : 0} className="text-teal-600 text-lg" />
            )}
            onChange={() => setIsAnswersVisible(!isAnswersVisible)}
          >
            <Collapse.Panel
              header={
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-800 mb-0">
                    Lịch sử tiêm chủng
                  </h3>
                </div>
              }
              key="1"
              className="p-6"
            >
              {loadingProfiles ? (
                <div className="flex flex-col items-center py-6 bg-gray-50 rounded-lg">
                  <svg className="animate-spin h-8 w-8 text-indigo-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-gray-600 text-lg">Đang tải thông tin...</span>
                  <div className="w-full max-w-xs bg-gray-200 rounded-full h-2 mt-3">
                    <div className="bg-indigo-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                </div>
              ) : errorProfiles ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 17h.01M12 3C7.029 3 3 7.029 3 12s4.029 9 9 9 9-4.029 9-9-4.029-9-9-9z"></path>
                  </svg>
                  {errorProfiles}
                </div>
              ) : vaccineProfiles.length === 0 ? (
                <div className="bg-gray-50 text-gray-600 p-4 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 3C7.029 3 3 7.029 3 12s4.029 9 9 9 9-4.029 9-9-4.029-9-9-9z"></path>
                  </svg>
                  Không có lịch sử tiêm chủng.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-teal-50 rounded-lg p-4 flex items-center justify-between">
                    <span className="text-teal-700 font-semibold text-lg">Tổng cộng: {vaccineProfiles.length} liều</span>
                    <span className="text-sm text-gray-500">Cập nhật đến {new Date().toLocaleDateString("vi-VN")}</span>
                  </div>
                  {vaccineProfiles.map((vp) => (
                    <VaccineProfileCard
                      key={vp.vaccineProfileId}
                      vp={vp}
                      getVaccineName={getVaccineName}
                      getDiseaseName={getDiseaseName}
                    />
                  ))}
                </div>
              )}
            </Collapse.Panel>
          </Collapse>
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
                  <h3 className="text-xl font-semibold text-blue-700 mb-0">
                    Câu trả lời thăm khám sức khỏe
                  </h3>
                  <span className="text-sm text-gray-500 font-medium">
                    {surveyAnswers.questions.length} câu trả lời
                  </span>
                </div>
              }
              key="1"
              className="p-8"
            >
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-xl p-6 flex items-center justify-between shadow-sm">
                  <span className="text-blue-700 font-semibold text-lg">
                    Tổng cộng: {surveyAnswers.questions.length} câu trả lời
                  </span>
                  <span className="text-sm text-gray-500">
                    Cập nhật: {new Date(surveyAnswers.submittedAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Thông tin sức khỏe</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <p><strong className="text-gray-700">Nhiệt độ cơ thể:</strong> {surveyAnswers.temperatureC || "0"}°C</p>
                      <p><strong className="text-gray-700">Nhịp tim:</strong> {surveyAnswers.heartRateBpm || "0"} bpm</p>
                      <p><strong className="text-gray-700">Huyết áp:</strong> {surveyAnswers.systolicBpmmHg || "0"}/{surveyAnswers.diastolicBpmmHg || "0"} mmHg</p>
                    </div>
                    <div className="space-y-3">
                      <p><strong className="text-gray-700">Độ bão hòa oxy:</strong> {surveyAnswers.oxygenSatPercent || "0"}%</p>
                      <p><strong className="text-gray-700">Ghi chú quyết định:</strong> {surveyAnswers.decisionNote || "Không có"}</p>
                      <p><strong className="text-gray-700">Đồng ý:</strong> {surveyAnswers.consentObtained ? "Có" : "Không"}</p>
                    </div>
                  </div>
                </div>
                {surveyAnswers.questions.map((ans: QuestionResponse, idx: number) => (
                  <div
                    key={idx}
                    className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center mb-3">
                      <svg
                        className="w-6 h-6 mr-3 text-blue-600"
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
                      <span className="text-lg font-medium text-gray-800">{ans.questionText}</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-blue-700 font-medium">Trả lời: {ans.answerText}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Collapse.Panel>
          </Collapse>
        )}

        {!showSurveySelect && (!surveyAnswers || surveyAnswers.questions.length === 0) && (
          <div className="bg-gray-50 text-gray-600 p-6 rounded-xl flex items-center justify-center space-x-3 shadow-sm">
            <svg
              className="w-8 h-8"
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
            <span className="text-lg font-medium">Không có câu trả lời.</span>
          </div>
        )}

        <div className="flex justify-end space-x-4 mt-10 items-center">
          <button
            onClick={handleBack}
            className={`bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-full font-medium transition-colors duration-200 ${submitting || appointment.status === "Cancelled" ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={submitting || appointment.status === "Cancelled"}
          >
            Trở lại
          </button>
          {user?.position === "Staff" && appointment.status === "Approval" && (
            <button
              onClick={handleCancelConfirm}
              disabled={submitting}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full font-medium transition-colors duration-200"
            >
              Hủy lịch hẹn
            </button>
          )}
          {user?.position === "Doctor" && showSurveySelect && (
            <button
              onClick={handleConfirmSubmit}
              className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium transition-colors duration-200 ${submitting ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={submitting}
            >
              {submitting ? "Đang lưu..." : "Gửi"}
            </button>
          )}
          {user?.position === "Staff" && appointment.status !== "Pending" && appointment.status !== "Cancelled" && (
            <button
              onClick={() => navigate(`/staff/appointments/${id}/step-3`)}
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium transition-colors duration-200"
            >
              Tiếp tục
            </button>
          )}
          {user?.position === "Doctor" && !showSurveySelect && appointment.status !== "Cancelled" && (
            <button
              onClick={() => navigate(`/doctor/appointments/${id}/step-3`)}
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium transition-colors duration-200"
            >
              Tiếp tục
            </button>
          )}
          {submitMessage && (
            <span className={`ml-4 font-medium ${submitMessage.includes("thành công") || submitMessage.includes("hoàn thành") ? "text-green-600" : "text-red-500"}`}>
              {submitMessage}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface VaccineProfileCardProps {
  vp: VaccineProfile;
  getVaccineName: (id: number) => Promise<string>;
  getDiseaseName: (id: number) => Promise<string>;
}

const VaccineProfileCard: React.FC<VaccineProfileCardProps> = ({ vp, getVaccineName, getDiseaseName }) => {
  const [vaccineName, setVaccineName] = useState<string>(`ID: ${vp.vaccineId}`);
  const [diseaseName, setDiseaseName] = useState<string>(`Bệnh ID: ${vp.diseaseId}`);

  useEffect(() => {
    let mounted = true;
    getVaccineName(vp.vaccineId).then((name) => {
      if (mounted) setVaccineName(name);
    });
    getDiseaseName(vp.diseaseId).then((name) => {
      if (mounted) setDiseaseName(name);
    });
    return () => {
      mounted = false;
    };
  }, [vp.vaccineId, vp.diseaseId, getVaccineName, getDiseaseName]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 3.996a11.955 11.955 0 01-8.618 3.986A12.02 12.02 0 003 12c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
            <span className="font-medium text-gray-600">Bệnh:</span>
            <span className="ml-2 text-gray-800 font-semibold">{diseaseName}</span>
          </div>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
            </svg>
            <span className="font-medium text-gray-600">Vắc xin:</span>
            <span className="ml-2 text-gray-800 font-semibold">{vaccineName}</span>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
            <span className="font-medium text-gray-600">Liều:</span>
            <span className="ml-2 text-gray-800">{vp.doseNum}</span>
          </div>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <span className="font-medium text-gray-600">Ngày tiêm:</span>
            <span className="ml-2 text-gray-800 font-semibold">{new Date(vp.actualDate).toLocaleDateString("vi-VN")}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export { VaccineProfileCard };