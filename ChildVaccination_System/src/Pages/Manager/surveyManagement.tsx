import { useEffect, useState, useRef, useCallback } from "react";
import { surveyAPI } from "@/api/surveyAPI";
import type { Survey, Question, createQuestionPayload, createSurveyPayload } from "@/api/surveyAPI";
import { Button, Table, Modal, Input, Checkbox, Spin, type InputRef } from "antd";

const { TextArea } = Input;

export default function SurveyManagement() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState<createQuestionPayload>({
    questionText: "",
    questionType: "Text",
    isRequired: false,
  });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [showDropdown, setShowDropdown] = useState<false | "questionType" | "status">(false);
  const [showCreateSurvey, setShowCreateSurvey] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [newSurvey, setNewSurvey] = useState<createSurveyPayload>({
    title: "",
    description: "",
    startDate: new Date().toISOString().split("T")[0], // Auto-fill with today's date
    endDate: "",
    status: "Active",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const questionInputRef = useRef<InputRef>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        setLoading(true);
        const res = await surveyAPI.getAllSurveys();
        setSurveys(res.data);
      } catch {
        setError("Không thể tải danh sách khảo sát.");
      } finally {
        setLoading(false);
      }
    };
    fetchSurveys();
  }, []);

  const handleCreateSurvey = async () => {
    if (!newSurvey.title.trim() || !newSurvey.startDate || !newSurvey.endDate) {
      setCreateError("Tiêu đề, ngày bắt đầu và ngày kết thúc là bắt buộc.");
      return;
    }
    setCreating(true);
    setCreateError("");
    try {
      await surveyAPI.createSurvey(newSurvey);
      setShowCreateSurvey(false);
      setNewSurvey({
        title: "",
        description: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        status: "Active",
      });
      setSearchTerm(""); // Reset search term
      const res = await surveyAPI.getAllSurveys();
      setSurveys(res.data);
    } catch {
      setCreateError("Tạo khảo sát thất bại.");
    } finally {
      setCreating(false);
    }
  };

  const handleView = async (survey: Survey) => {
    setSelectedSurvey(survey);
    setLoadingQuestions(true);
    setShowPopup(true);
    try {
      const res = await surveyAPI.getSurveybyId(survey.surveyId);
      setQuestions(res.data);
    } catch {
      setQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleAddQuestion = async () => {
    if (!selectedSurvey) return;
    if (!newQuestion.questionText.trim()) {
      setAddError("Văn bản câu hỏi là bắt buộc.");
      questionInputRef.current?.focus();
      return;
    }
    setAdding(true);
    setAddError("");
    try {
      await surveyAPI.addQuestion(selectedSurvey.surveyId, newQuestion);
      const res = await surveyAPI.getSurveybyId(selectedSurvey.surveyId);
      setQuestions(res.data);
      setNewQuestion({ questionText: "", questionType: "Text", isRequired: false });
      setShowAddForm(false);
      questionInputRef.current?.focus();
    } catch {
      setAddError("Thêm câu hỏi thất bại.");
    } finally {
      setAdding(false);
    }
  };

  const closePopup = useCallback(() => {
    setShowPopup(false);
    setSelectedSurvey(null);
    setQuestions([]);
    setNewQuestion({ questionText: "", questionType: "Text", isRequired: false });
    setAddError("");
    setShowAddForm(false);
    setShowDropdown(false);
  }, []);

  const handleDropdownSelect = (value: string, type: "questionType" | "status") => {
    if (type === "questionType") {
      setNewQuestion((q) => ({ ...q, questionType: value }));
    } else {
      setNewSurvey((s) => ({ ...s, status: value }));
    }
    setShowDropdown(false);
    dropdownButtonRef.current?.focus();
  };

  useEffect(() => {
    const handleDropdownKeyDown = (event: KeyboardEvent) => {
      if (!showDropdown) return;
      if (event.key === "Escape") {
        setShowDropdown(false);
        dropdownButtonRef.current?.focus();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("keydown", handleDropdownKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleDropdownKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  const filteredSurveys = surveys.filter((survey) =>
    survey.title.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  const columns = [
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      render: (text: string) => <span className="font-semibold text-gray-900">{text}</span>,
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      render: (text: string) => <span className="text-gray-600">{text}</span>,
    },
    {
      title: "Ngày bắt đầu",
      dataIndex: "startDate",
      key: "startDate",
      render: (text: string) => new Date(text).toLocaleDateString("vi-VN"),
    },
    {
      title: "Ngày kết thúc",
      dataIndex: "endDate",
      key: "endDate",
      render: (text: string) => new Date(text).toLocaleDateString("vi-VN"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
          }`}
        >
          {status}
        </span>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, survey: Survey) => (
        <div className="flex space-x-2">
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg"
            onClick={() => handleView(survey)}
          >
            Xem
          </Button>
          <Button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg">
            Xóa
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Spin size="large" className="text-blue-600" />
        <span className="mt-4 text-gray-600 text-lg font-medium">Đang tải...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-red-100 text-red-700 p-6 rounded-lg flex items-center gap-3 max-w-md">
          <svg
            className="w-6 h-6"
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
            />
          </svg>
          <span className="text-lg font-medium">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h2 className="text-3xl font-bold text-gray-900">Quản lý khảo sát</h2>
          <div className="flex gap-4 w-full sm:w-auto">
            <Input
              className="w-full sm:w-64 border-gray-200 rounded-lg"
              placeholder="Tìm kiếm theo tiêu đề..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
              onClick={() => setShowCreateSurvey(true)}
            >
              Tạo khảo sát mới
            </Button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <Table
            dataSource={filteredSurveys}
            columns={columns}
            rowKey="surveyId"
            locale={{ emptyText: "Không tìm thấy khảo sát nào." }}
            pagination={false}
            className="overflow-x-auto"
          />
        </div>

        {/* Create Survey Modal */}
        <Modal
          title="Tạo khảo sát mới"
          open={showCreateSurvey}
          onCancel={() => {
            setShowCreateSurvey(false);
            setCreateError("");
            setNewSurvey({
              title: "",
              description: "",
              startDate: new Date().toISOString().split("T")[0],
              endDate: "",
              status: "Active",
            });
          }}
          footer={null}
          centered
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
              <Input
                className="w-full border-gray-200 rounded-lg"
                value={newSurvey.title}
                onChange={(e) => setNewSurvey((s) => ({ ...s, title: e.target.value }))}
                disabled={creating}
                placeholder="Nhập tiêu đề khảo sát"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
              <TextArea
                className="w-full border-gray-200 rounded-lg"
                value={newSurvey.description}
                onChange={(e) => setNewSurvey((s) => ({ ...s, description: e.target.value }))}
                disabled={creating}
                placeholder="Nhập mô tả khảo sát"
                rows={4}
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                <Input
                  type="date"
                  className="w-full border-gray-200 rounded-lg"
                  value={newSurvey.startDate}
                  onChange={(e) => setNewSurvey((s) => ({ ...s, startDate: e.target.value }))}
                  disabled
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                <Input
                  type="date"
                  className="w-full border-gray-200 rounded-lg"
                  value={newSurvey.endDate}
                  onChange={(e) => setNewSurvey((s) => ({ ...s, endDate: e.target.value }))}
                  disabled={creating}
                  placeholder="Chọn ngày kết thúc"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <div className="relative" ref={dropdownRef}>
                <Button
                  className={`w-full border border-gray-200 rounded-lg text-left flex justify-between items-center ${
                    creating ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
                  }`}
                  onClick={() => setShowDropdown(showDropdown === "status" ? false : "status")}
                  disabled={creating}
                >
                  <span>{newSurvey.status}</span>
                  <span className="text-gray-600">▼</span>
                </Button>
                {showDropdown === "status" && (
                  <ul className="absolute w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
                    {[
                      { value: "Active", label: "Active" },
                      { value: "Inactive", label: "Inactive" },
                    ].map((opt) => (
                      <li
                        key={opt.value}
                        className={`px-3 py-2 border-b border-gray-200 last:border-b-0 text-gray-700 hover:bg-blue-50 cursor-pointer ${
                          newSurvey.status === opt.value ? "bg-blue-100 font-medium" : ""
                        }`}
                        onClick={() => handleDropdownSelect(opt.value, "status")}
                      >
                        {opt.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            {createError && <div className="text-red-500 text-sm">{createError}</div>}
            <div className="flex justify-end gap-3">
              <Button
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg"
                onClick={() => setShowCreateSurvey(false)}
                disabled={creating}
              >
                Hủy
              </Button>
              <Button
                className={`bg-blue-600 hover:bg-blue-700 text-white rounded-lg ${
                  creating ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={handleCreateSurvey}
                disabled={creating}
              >
                {creating ? "Đang tạo..." : "Tạo khảo sát"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Survey Details Modal */}
        <Modal
          title={`Khảo sát: ${selectedSurvey?.title}`}
          open={showPopup && !!selectedSurvey}
          onCancel={closePopup}
          footer={null}
          centered
        >
          <div className="max-h-80 overflow-y-auto px-2 mb-6">
            {loadingQuestions ? (
              <div className="flex flex-col items-center py-6">
                <Spin size="large" className="text-blue-600" />
                <span className="mt-4 text-gray-600 text-lg font-medium">Đang tải câu hỏi...</span>
              </div>
            ) : questions.length === 0 ? (
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
                  />
                </svg>
                Không tìm thấy câu hỏi nào cho khảo sát này.
              </div>
            ) : (
              <ul className="space-y-4">
                {questions.map((q, index) => (
                  <li
                    key={q.questionId}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200"
                  >
                    <span className="font-medium text-gray-800">
                      Câu hỏi {index + 1} ({q.questionType || "Không xác định"}):
                    </span>{" "}
                    {q.questionText}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t border-gray-200 pt-4">
            <Button
              className="bg-green-600 hover:bg-green-700 text-white rounded-lg mb-4"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? "Ẩn thêm câu hỏi" : "Thêm câu hỏi mới"}
            </Button>
            {showAddForm && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-800">Thêm câu hỏi mới</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Văn bản câu hỏi
                    </label>
                    <Input
                      ref={questionInputRef}
                      className={`w-full border-gray-200 rounded-lg ${
                        addError && !newQuestion.questionText.trim() ? "border-red-500" : ""
                      }`}
                      placeholder="Nhập văn bản câu hỏi"
                      value={newQuestion.questionText}
                      onChange={(e) =>
                        setNewQuestion((q) => ({ ...q, questionText: e.target.value }))
                      }
                      disabled={adding}
                    />
                    {addError && !newQuestion.questionText.trim() && (
                      <p className="text-red-500 text-sm mt-1">{addError}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Loại câu hỏi
                    </label>
                    <div className="relative" ref={dropdownRef}>
                      <Button
                        ref={dropdownButtonRef}
                        className={`w-full border border-gray-200 rounded-lg text-left flex justify-between items-center ${
                          adding ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
                        }`}
                        onClick={() =>
                          setShowDropdown(showDropdown === "questionType" ? false : "questionType")
                        }
                        disabled={adding}
                      >
                        <span>
                          {newQuestion.questionType === "Text"
                            ? "Text"
                            : newQuestion.questionType === "YesNo"
                            ? "Có/Không"
                            : "Trắc nghiệm"}
                        </span>
                        <span className="text-gray-600">▼</span>
                      </Button>
                      {showDropdown === "questionType" && (
                        <ul className="absolute w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
                          {["Text", "YesNo", "MultipleChoice"].map((type) => (
                            <li
                              key={type}
                              className={`px-3 py-2 border-b border-gray-200 last:border-b-0 text-gray-700 hover:bg-blue-50 cursor-pointer ${
                                newQuestion.questionType === type ? "bg-blue-100 font-medium" : ""
                              }`}
                              onClick={() => handleDropdownSelect(type, "questionType")}
                            >
                              {type === "Text" ? "Text" : type === "YesNo" ? "Có/Không" : "Trắc nghiệm"}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Checkbox
                        checked={newQuestion.isRequired}
                        onChange={(e) =>
                          setNewQuestion((q) => ({ ...q, isRequired: e.target.checked }))
                        }
                        disabled={adding}
                      />
                      Bắt buộc
                    </label>
                  </div>
                  {addError && newQuestion.questionText.trim() && (
                    <p className="text-red-500 text-sm">{addError}</p>
                  )}
                  <div className="flex justify-end">
                    <Button
                      className={`bg-blue-600 hover:bg-blue-700 text-white rounded-lg ${
                        adding ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      onClick={handleAddQuestion}
                      disabled={adding}
                    >
                      {adding ? "Đang thêm..." : "Thêm câu hỏi"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end mt-6">
            <Button
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg"
              onClick={closePopup}
            >
              Đóng
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  );
}