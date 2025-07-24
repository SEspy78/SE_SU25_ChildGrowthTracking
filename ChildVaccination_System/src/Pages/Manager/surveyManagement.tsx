import { useEffect, useState, useRef, useCallback } from "react"
import { surveyAPI } from "@/api/surveyAPI"
import type { Survey, Question, createQuestionPayload, createSurveyPayload } from "@/api/surveyAPI"

export default function SurveyManagement() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newQuestion, setNewQuestion] = useState<createQuestionPayload>({
    questionText: "",
    questionType: "Text",
    isRequired: false
  })
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState("")
  const [showDropdown, setShowDropdown] = useState<false | 'questionType' | 'status'>(false)
  const popupRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const questionInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const dropdownButtonRef = useRef<HTMLButtonElement>(null)
  const [showCreateSurvey, setShowCreateSurvey] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")
  const [newSurvey, setNewSurvey] = useState<createSurveyPayload>({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    status: "Active",
  })
  

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        setLoading(true)
        const res = await surveyAPI.getAllSurveys()
        setSurveys(res.data)
      } catch (err) {
        setError("Failed to load surveys.")
      } finally {
        setLoading(false)
      }
    }
    fetchSurveys()
  }, [])


  const handleCreateSurvey = async () => {
    if (!newSurvey.title.trim() || !newSurvey.startDate || !newSurvey.endDate) {
      setCreateError("Title, Start Date, and End Date are required.")
      return
    }
    setCreating(true)
    setCreateError("")
    try {
      await surveyAPI.createSurvey(newSurvey)
      setShowCreateSurvey(false)
      setNewSurvey({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        status: "Active",
      })
      const res = await surveyAPI.getAllSurveys()
      setSurveys(res.data)
    } catch {
      setCreateError("Failed to create survey.")
    } finally {
      setCreating(false)
    }
  }

  const handleView = async (survey: Survey) => {
    setSelectedSurvey(survey)
    setLoadingQuestions(true)
    setShowPopup(true)
    try {
      const res = await surveyAPI.getSurveybyId(survey.surveyId)
      setQuestions(res.data)
    } catch {
      setQuestions([])
    } finally {
      setLoadingQuestions(false)
    }
  }

  const handleAddQuestion = async () => {
    if (!selectedSurvey) return
    if (!newQuestion.questionText.trim()) {
      setAddError("Question text is required.")
      questionInputRef.current?.focus()
      return
    }
    setAdding(true)
    setAddError("")
    try {
      await surveyAPI.addQuestion(selectedSurvey.surveyId, newQuestion)
      const res = await surveyAPI.getSurveybyId(selectedSurvey.surveyId)
      setQuestions(res.data)
      setNewQuestion({ questionText: "", questionType: "Text", isRequired: false })
      setShowAddForm(false)
      questionInputRef.current?.focus()
    } catch {
      setAddError("Failed to add question.")
    } finally {
      setAdding(false)
    }
  }

  const closePopup = useCallback(() => {
    setShowPopup(false)
    setSelectedSurvey(null)
    setQuestions([])
    setNewQuestion({ questionText: "", questionType: "Text", isRequired: false })
    setAddError("")
    setShowAddForm(false)
    setShowDropdown(false)
  }, [])

  const handleDropdownSelect = (value: string) => {
    setNewQuestion(q => ({ ...q, questionType: value }))
    setShowDropdown(false)
    dropdownButtonRef.current?.focus()
  }

  useEffect(() => {
    if (showPopup && closeButtonRef.current) {
      closeButtonRef.current.focus()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showPopup) {
        closePopup()
      }
    }

    const handleDropdownKeyDown = (event: KeyboardEvent) => {
      if (!showDropdown) return
      if (event.key === "Escape") {
        setShowDropdown(false)
        dropdownButtonRef.current?.focus()
      }
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener("keydown", handleDropdownKeyDown)
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleDropdownKeyDown)
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [showPopup, closePopup, showDropdown])

  return (
    <div className="p-4 sm:p-8">
      <div className={`transition-all duration-300 ${(showPopup || showCreateSurvey ) ? 'blur-sm' : ''}`}>
        <h2 className="text-2xl font-bold mb-6">Survey Management</h2>
        <button
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg mb-4 transition-colors duration-200 cursor-pointer"
          onClick={() => setShowCreateSurvey(true)}
          type="button"
        >
          Tạo khảo sát mới 
        </button>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <table className="min-w-full bg-white rounded-xl shadow overflow-hidden mb-8">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-left">Tiêu đề</th>
                <th className="p-4 text-left">Mô tả</th>
                <th className="p-4 text-left">Ngày bắt đầu</th>
                <th className="p-4 text-left">Ngày kết thúc</th>
                <th className="p-4 text-left">Trạng thái</th>
                <th className="p-4 text-left"></th>
              </tr>
            </thead>
            <tbody>
              {surveys.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8">No surveys found</td></tr>
              ) : (
                surveys.map(survey => (
                  <tr key={survey.surveyId} className="border-t hover:bg-gray-50">
                    <td className="p-4 font-semibold">{survey.title}</td>
                    <td className="p-4">{survey.description}</td>
                    <td className="p-4">{survey.startDate}</td>
                    <td className="p-4">{survey.endDate}</td>
                    <td className="p-4">{survey.status}</td>
                    <td className="p-4">
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded mr-2 transition-colors duration-200 cursor-pointer"
                        onClick={() => handleView(survey)}
                      >
                        Xem
                      </button>
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition-colors duration-200 cursor-pointer"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
      {showCreateSurvey && (
          <div
  className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
  role="dialog"
  aria-modal="true"
>
        <div
          ref={popupRef}
          role="dialog"
          aria-labelledby="popup-title"
          aria-modal="false"
          className="bg-white rounded-xl shadow-lg p-4 sm:p-6 w-full max-w-2xl mx-auto mt-4 transition-all duration-300 transform translate-y-0 opacity-100 z-10 relative border border-gray-200"
          style={{ animation: showCreateSurvey ? 'slideIn 0.3s ease-out' : 'none' }}
        >
          <style>
            {`
              @keyframes slideIn {
                from { transform: translateY(-20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
              }
            `}
          </style>
        
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Tạo khảo sát mới</h3>
            <button
              className="text-gray-400 hover:text-gray-600 text-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer"
              onClick={() => setShowCreateSurvey(false)}
              type="button"
              aria-label="Close create survey popup"
            >
              ×
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tiêu đề</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                value={newSurvey.title}
                onChange={e => setNewSurvey(s => ({ ...s, title: e.target.value }))}
                disabled={creating}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mô tả</label>
              <textarea
                className="w-full border rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                value={newSurvey.description}
                onChange={e => setNewSurvey(s => ({ ...s, description: e.target.value }))}
                disabled={creating}
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Ngày bắt đầu</label>
                <input
                  type="date"
                  className="w-full border rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                  value={newSurvey.startDate}
                  onChange={e => setNewSurvey(s => ({ ...s, startDate: e.target.value }))}
                  disabled={creating}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Ngày kết thúc</label>
                <input
                  type="date"
                  className="w-full border rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                  value={newSurvey.endDate}
                  onChange={e => setNewSurvey(s => ({ ...s, endDate: e.target.value }))}
                  disabled={creating}
                />
              </div>
            </div>
            <div>
             <div>
  <label className="block text-sm font-medium mb-1">Trạng thái</label>
  <div className="relative" style={{ zIndex: 60 }}>
    <button
      type="button"
      className={`w-full border rounded-lg px-3 py-2 text-gray-700 bg-white text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${creating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
      onClick={() => setShowDropdown(showDropdown === 'status' ? false : 'status')}
      disabled={creating}
      aria-expanded={showDropdown === 'status'}
      aria-haspopup="listbox"
    >
      <span>{newSurvey.status === 'Active' ? 'Hoạt động' : 'Ngừng hoạt động'}</span>
      <span className="text-gray-600">▼</span>
    </button>
    {showDropdown === 'status' && (
      <ul
        className="absolute w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto"
        role="listbox"
      >
        {[
          { value: 'Active', label: 'Hoạt động' },
          { value: 'Inactive', label: 'Ngừng hoạt động' }
        ].map(opt => (
          <li
            key={opt.value}
            className={`px-3 py-2 border-b border-gray-200 last:border-b-0 text-gray-700 hover:bg-blue-50 cursor-pointer transition-colors duration-200 ${newSurvey.status === opt.value ? 'bg-blue-100 font-medium' : ''}`}
            onClick={() => {
              setNewSurvey(s => ({ ...s, status: opt.value }));
              setShowDropdown(false);
            }}
            role="option"
            aria-selected={newSurvey.status === opt.value}
          >
            {opt.label}
          </li>
        ))}
      </ul>
    )}
  </div>
</div>
            </div>
            {createError && (
              <div className="text-red-500 text-sm">{createError}</div>
            )}
            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                onClick={() => setShowCreateSurvey(false)}
                type="button"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                className={`bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors duration-200 ${creating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer'}`}
                onClick={handleCreateSurvey}
                disabled={creating}
                type="button"
              >
                {creating ? "Creating..." : "Create Survey"}
              </button>
            </div>
          </div>
        </div>
        </div>
      )}









      {showPopup && selectedSurvey && (
        <div
  className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
  role="dialog"
  aria-modal="true"
>
        <div
          ref={popupRef}
          role="dialog"
          aria-labelledby="popup-title"
          aria-modal="false"
          className="bg-white rounded-xl shadow-lg p-4 sm:p-6 w-full max-w-2xl mx-auto mt-4 transition-all duration-300 transform translate-y-0 opacity-100 z-10 relative border border-gray-200"
          style={{ animation: showPopup ? 'slideIn 0.3s ease-out' : 'none' }}
        >
          <style>
            {`
              @keyframes slideIn {
                from { transform: translateY(-20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
              }
            `}
          </style>
          <div className="flex justify-between items-center mb-4">
            <h3 id="popup-title" className="text-xl sm:text-2xl font-semibold text-gray-800">Survey: {selectedSurvey.title}</h3>
            <button
              ref={closeButtonRef}
              className="text-gray-400 hover:text-gray-600 text-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer"
              onClick={closePopup}
              aria-label="Close popup"
            >
              ×
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto px-2 mb-6">
            {loadingQuestions ? (
              <div className="text-center text-gray-500">Loading questions...</div>
            ) : questions.length === 0 ? (
              <div className="text-center text-gray-500">No questions found for this survey.</div>
            ) : (
              <ul className="space-y-3">
                {questions.map((q, index) => (
                  <li key={q.questionId} className="text-gray-700 text-base border-b border-gray-200 pb-2">
                    <span className="font-medium text-gray-800">Question {index + 1} ({q.questionType || 'Unknown'}):</span> {q.questionText}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t pt-4">
            <button
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 mb-4 cursor-pointer"
              onClick={() => setShowAddForm(!showAddForm)}
              type="button"
              aria-label={showAddForm ? "Hide add question form" : "Show add question form"}
            >
              {showAddForm ? "Hide Add Question" : "Add New Question"}
            </button>
            {showAddForm && (
              <div className="transition-all duration-300 ease-in-out">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Add New Question</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label htmlFor="question-text" className="block text-sm font-medium text-gray-700 mb-1">
                      Question Text
                    </label>
                    <input
                      id="question-text"
                      type="text"
                      ref={questionInputRef}
                      className={`w-full border rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${addError && !newQuestion.questionText.trim() ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Enter question text"
                      value={newQuestion.questionText}
                      onChange={e => setNewQuestion(q => ({ ...q, questionText: e.target.value }))}
                      disabled={adding}
                      aria-invalid={addError && !newQuestion.questionText.trim() ? 'true' : 'false'}
                      aria-describedby={addError && !newQuestion.questionText.trim() ? 'question-error' : undefined}
                    />
                    {addError && !newQuestion.questionText.trim() && (
                      <p id="question-error" className="text-red-500 text-sm mt-1">{addError}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="question-type" className="block text-sm font-medium text-gray-700 mb-1">
                      Question Type
                    </label>
                    <div className="relative" ref={dropdownRef}>
                      <button
                        id="question-type"
                        type="button"
                        ref={dropdownButtonRef}
                        className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 bg-white text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${adding ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                        onClick={() => setShowDropdown(showDropdown === 'questionType' ? false : 'questionType')}
                        disabled={adding}
                        aria-expanded={showDropdown === 'questionType'}
                        aria-haspopup="listbox"
                      >
                        <span>{newQuestion.questionType === 'Text' ? 'Text' : newQuestion.questionType === 'YesNo' ? 'Yes/No' : 'Multiple Choice'}</span>
                        <span className="text-gray-600">▼</span>
                      </button>
                      {showDropdown === 'questionType' && (
                        <ul
                          className="absolute w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto"
                          role="listbox"
                          aria-labelledby="question-type"
                        >
                          {['Text', 'YesNo', 'MultipleChoice'].map(type => (
                            <li
                              key={type}
                              className={`px-3 py-2 border-b border-gray-200 last:border-b-0 text-gray-700 hover:bg-blue-50 cursor-pointer transition-colors duration-200 ${newQuestion.questionType === type ? 'bg-blue-100 font-medium' : ''}`}
                              onClick={() => handleDropdownSelect(type)}
                              role="option"
                              aria-selected={newQuestion.questionType === type}
                            >
                              {type === 'Text' ? 'Text' : type === 'YesNo' ? 'Yes/No' : 'Multiple Choice'}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="is-required" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <input
                        id="is-required"
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={newQuestion.isRequired}
                        onChange={e => setNewQuestion(q => ({ ...q, isRequired: e.target.checked }))}
                        disabled={adding}
                      />
                      Required
                    </label>
                  </div>
                  {addError && newQuestion.questionText.trim() && (
                    <div>
                      <p id="question-error" className="text-red-500 text-sm">{addError}</p>
                    </div>
                  )}
                  <div className="flex justify-end">
                    <button
                      className={`bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors duration-200 ${adding ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer'}`}
                      onClick={handleAddQuestion}
                      disabled={adding}
                      type="button"
                      aria-label="Add new question"
                    >
                      {adding ? "Adding..." : "Add Question"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              onClick={closePopup}
              type="button"
              aria-label="Close popup"
            >
              Close
            </button>
          </div>
        </div>
        </div>
      )}
    </div>
  )
}