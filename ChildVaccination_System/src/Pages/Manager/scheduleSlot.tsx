import React, { useEffect, useState, useRef } from "react";
import { scheduleApi, type ScheduleSlot, type CreateScheduleSlotRequest, type BulkWorkingHoursRequest } from "@/api/scheduleApi";
import { getUserInfo } from "@/lib/storage";
import { Input, Button, Spin, Modal, DatePicker, Select, type InputRef } from "antd";
import { Clock, Plus } from "lucide-react";
import dayjs from "dayjs";

const ScheduleSlotPage: React.FC = () => {
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for CreateScheduleSlot form
  const [createFormData, setCreateFormData] = useState<CreateScheduleSlotRequest>({
    startTime: "",
    endTime: "",
    slotDurationMinutes: 30,
    lunchBreakStart: "",
    lunchBreakEnd: "",
    maxCapacity: 10,
    status: "Available",
    isWorkingHours: true,
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [createFormErrors, setCreateFormErrors] = useState<Partial<Record<keyof CreateScheduleSlotRequest, string>>>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const createStartTimeRef = useRef<InputRef>(null);

  // State for BulkWorkingHours form
  const [bulkFormData, setBulkFormData] = useState<BulkWorkingHoursRequest>({
    facilityId: getUserInfo()?.facilityId || 0,
    workingHoursGroupId: 0,
    date: "",
    status: "Available",
  });
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkSuccess, setBulkSuccess] = useState<string | null>(null);
  const [bulkFormErrors, setBulkFormErrors] = useState<Partial<Record<keyof BulkWorkingHoursRequest, string>>>({});
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const bulkDateRef = useRef<any>(null);

  useEffect(() => {
    const fetchSlots = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await scheduleApi.getAllScheduleSlot();
        if (Array.isArray(res)) {
          setSlots(res);
        } else if (Array.isArray(res.data)) {
          setSlots(res.data);
        } else {
          setSlots([]);
        }
      } catch (err) {
        setError("Không thể tải dữ liệu lịch khám.");
        setSlots([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSlots();
  }, []);

  // Validation for CreateScheduleSlot form
  const validateCreateForm = (): boolean => {
    const errors: Partial<Record<keyof CreateScheduleSlotRequest, string>> = {};
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

    if (!createFormData.startTime) {
      errors.startTime = "Giờ bắt đầu là bắt buộc";
    } else if (!timeRegex.test(createFormData.startTime)) {
      errors.startTime = "Giờ bắt đầu phải có định dạng HH:mm";
    }
    if (!createFormData.endTime) {
      errors.endTime = "Giờ kết thúc là bắt buộc";
    } else if (!timeRegex.test(createFormData.endTime)) {
      errors.endTime = "Giờ kết thúc phải có định dạng HH:mm";
    } else if (createFormData.startTime >= createFormData.endTime) {
      errors.endTime = "Giờ kết thúc phải sau giờ bắt đầu";
    }
    if (!createFormData.slotDurationMinutes) {
      errors.slotDurationMinutes = "Thời lượng slot là bắt buộc";
    } else if (createFormData.slotDurationMinutes < 5) {
      errors.slotDurationMinutes = "Thời lượng slot phải lớn hơn hoặc bằng 5 phút";
    }
    if (!createFormData.lunchBreakStart) {
      errors.lunchBreakStart = "Giờ bắt đầu nghỉ trưa là bắt buộc";
    } else if (!timeRegex.test(createFormData.lunchBreakStart)) {
      errors.lunchBreakStart = "Giờ bắt đầu nghỉ trưa phải có định dạng HH:mm";
    }
    if (!createFormData.lunchBreakEnd) {
      errors.lunchBreakEnd = "Giờ kết thúc nghỉ trưa là bắt buộc";
    } else if (!timeRegex.test(createFormData.lunchBreakEnd)) {
      errors.lunchBreakEnd = "Giờ kết thúc nghỉ trưa phải có định dạng HH:mm";
    } else if (createFormData.lunchBreakStart >= createFormData.lunchBreakEnd) {
      errors.lunchBreakEnd = "Giờ kết thúc nghỉ trưa phải sau giờ bắt đầu";
    }
    if (!createFormData.maxCapacity) {
      errors.maxCapacity = "Sức chứa là bắt buộc";
    } else if (createFormData.maxCapacity < 1) {
      errors.maxCapacity = "Sức chứa phải lớn hơn 0";
    }
    if (!createFormData.status) errors.status = "Trạng thái là bắt buộc";

    setCreateFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validation for BulkWorkingHours form
  const validateBulkForm = (): boolean => {
    const errors: Partial<Record<keyof BulkWorkingHoursRequest, string>> = {};
    if (!bulkFormData.facilityId) errors.facilityId = "Mã cơ sở là bắt buộc";
    if (!bulkFormData.workingHoursGroupId) errors.workingHoursGroupId = "Mã nhóm giờ làm việc là bắt buộc";
    if (!bulkFormData.date) errors.date = "Ngày là bắt buộc";
    if (!bulkFormData.status) errors.status = "Trạng thái là bắt buộc";

    setBulkFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle CreateScheduleSlot submission
  const handleCreateSubmit = async () => {
    if (!validateCreateForm()) {
      createStartTimeRef.current?.focus();
      return;
    }

    setCreateLoading(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      const response = await scheduleApi.createScheduleSlot(createFormData);
      if (response.success) {
        setCreateSuccess("Tạo slot lịch khám thành công!");
        setCreateFormData({
          startTime: "",
          endTime: "",
          slotDurationMinutes: 30,
          lunchBreakStart: "",
          lunchBreakEnd: "",
          maxCapacity: 10,
          status: "Available",
          isWorkingHours: true,
        });
        setCreateFormErrors({});
        setIsCreateModalOpen(false);
        // Refresh slots
        const res = await scheduleApi.getAllScheduleSlot();
        setSlots(Array.isArray(res) ? res : res.data || []);
      } else {
        setCreateError(response.message || "Tạo slot lịch khám thất bại");
      }
    } catch (err: any) {
      setCreateError(err.response?.data?.message || "Lỗi không xác định");
    } finally {
      setCreateLoading(false);
    }
  };

  // Handle BulkWorkingHours submission
  const handleBulkSubmit = async () => {
    if (!validateBulkForm()) {
      bulkDateRef.current?.focus();
      return;
    }

    setBulkLoading(true);
    setBulkError(null);
    setBulkSuccess(null);

    try {
      const response = await scheduleApi.BulkWorkingHours(bulkFormData);
      if (response.success) {
        setBulkSuccess("Gán lịch làm việc hàng loạt thành công!");
        setBulkFormData({
          facilityId: getUserInfo()?.facilityId || 0,
          workingHoursGroupId: 0,
          date: "",
          status: "Available",
        });
        setBulkFormErrors({});
        setIsBulkModalOpen(false);
        // Refresh slots
        const res = await scheduleApi.getAllScheduleSlot();
        setSlots(Array.isArray(res) ? res : res.data || []);
      } else {
        setBulkError(response.message || "Gán lịch làm việc hàng loạt thất bại");
      }
    } catch (err: any) {
      setBulkError(err.response?.data?.message || "Lỗi không xác định");
    } finally {
      setBulkLoading(false);
    }
  };

  // Handle modal cancel
  const handleCreateCancel = () => {
    setCreateFormData({
      startTime: "",
      endTime: "",
      slotDurationMinutes: 30,
      lunchBreakStart: "",
      lunchBreakEnd: "",
      maxCapacity: 10,
      status: "Available",
      isWorkingHours: true,
    });
    setCreateFormErrors({});
    setCreateError(null);
    setCreateSuccess(null);
    setIsCreateModalOpen(false);
  };

  const handleBulkCancel = () => {
    setBulkFormData({
      facilityId: getUserInfo()?.facilityId || 0,
      workingHoursGroupId: 0,
      date: "",
      status: "Available",
    });
    setBulkFormErrors({});
    setBulkError(null);
    setBulkSuccess(null);
    setIsBulkModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-teal-50 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-indigo-900 flex items-center gap-2">
            <Clock className="w-6 h-6" /> Quản lý lịch khám
          </h1>
          <div className="flex gap-3">
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="w-4 h-4" /> Tạo slot lịch khám
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
              onClick={() => setIsBulkModalOpen(true)}
            >
              <Plus className="w-4 h-4" /> Gán lịch làm việc hàng loạt
            </Button>
          </div>
        </div>

        {/* Create Schedule Slot Modal */}
        <Modal
          title="Tạo slot lịch khám"
          open={isCreateModalOpen}
          onCancel={handleCreateCancel}
          footer={null}
          destroyOnClose
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giờ bắt đầu (HH:mm)</label>
                <Input
                  ref={createStartTimeRef}
                  placeholder="VD: 08:00"
                  value={createFormData.startTime}
                  onChange={(e) => setCreateFormData({ ...createFormData, startTime: e.target.value })}
                  className={createFormErrors.startTime ? "border-red-500" : ""}
                  disabled={createLoading}
                />
                {createFormErrors.startTime && (
                  <p className="text-red-500 text-sm mt-1">{createFormErrors.startTime}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giờ kết thúc (HH:mm)</label>
                <Input
                  placeholder="VD: 17:00"
                  value={createFormData.endTime}
                  onChange={(e) => setCreateFormData({ ...createFormData, endTime: e.target.value })}
                  className={createFormErrors.endTime ? "border-red-500" : ""}
                  disabled={createLoading}
                />
                {createFormErrors.endTime && (
                  <p className="text-red-500 text-sm mt-1">{createFormErrors.endTime}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thời lượng slot (phút)</label>
                <Input
                  type="number"
                  placeholder="VD: 30"
                  value={createFormData.slotDurationMinutes}
                  onChange={(e) => setCreateFormData({ ...createFormData, slotDurationMinutes: Number(e.target.value) })}
                  className={createFormErrors.slotDurationMinutes ? "border-red-500" : ""}
                  disabled={createLoading}
                />
                {createFormErrors.slotDurationMinutes && (
                  <p className="text-red-500 text-sm mt-1">{createFormErrors.slotDurationMinutes}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sức chứa tối đa</label>
                <Input
                  type="number"
                  placeholder="VD: 10"
                  value={createFormData.maxCapacity}
                  onChange={(e) => setCreateFormData({ ...createFormData, maxCapacity: Number(e.target.value) })}
                  className={createFormErrors.maxCapacity ? "border-red-500" : ""}
                  disabled={createLoading}
                />
                {createFormErrors.maxCapacity && (
                  <p className="text-red-500 text-sm mt-1">{createFormErrors.maxCapacity}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nghỉ trưa bắt đầu (HH:mm)</label>
                <Input
                  placeholder="VD: 12:00"
                  value={createFormData.lunchBreakStart}
                  onChange={(e) => setCreateFormData({ ...createFormData, lunchBreakStart: e.target.value })}
                  className={createFormErrors.lunchBreakStart ? "border-red-500" : ""}
                  disabled={createLoading}
                />
                {createFormErrors.lunchBreakStart && (
                  <p className="text-red-500 text-sm mt-1">{createFormErrors.lunchBreakStart}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nghỉ trưa kết thúc (HH:mm)</label>
                <Input
                  placeholder="VD: 13:00"
                  value={createFormData.lunchBreakEnd}
                  onChange={(e) => setCreateFormData({ ...createFormData, lunchBreakEnd: e.target.value })}
                  className={createFormErrors.lunchBreakEnd ? "border-red-500" : ""}
                  disabled={createLoading}
                />
                {createFormErrors.lunchBreakEnd && (
                  <p className="text-red-500 text-sm mt-1">{createFormErrors.lunchBreakEnd}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <Select
                  value={createFormData.status}
                  onChange={(value) => setCreateFormData({ ...createFormData, status: value })}
                  options={[
                    { value: "Available", label: "Còn chỗ" },
                    { value: "Full", label: "Đã đầy" },
                  ]}
                  className={createFormErrors.status ? "border-red-500" : ""}
                  disabled={createLoading}
                />
                {createFormErrors.status && (
                  <p className="text-red-500 text-sm mt-1">{createFormErrors.status}</p>
                )}
              </div>
             
            </div>
            {createError && (
              <div className="bg-red-100 text-red-700 p-4 rounded-lg flex items-center gap-3">
                <svg
                  className="w-5 h-5"
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
                <span className="text-sm">{createError}</span>
              </div>
            )}
            {createSuccess && (
              <div className="bg-green-100 text-green-700 p-4 rounded-lg flex items-center gap-3">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-sm">{createSuccess}</span>
              </div>
            )}
            <div className="flex justify-end gap-3 mt-6">
              <Button
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg"
                onClick={handleCreateCancel}
                disabled={createLoading}
              >
                Hủy
              </Button>
              <Button
                className={`bg-blue-600 hover:bg-blue-700 text-white rounded-lg ${createLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={handleCreateSubmit}
                disabled={createLoading}
              >
                {createLoading ? "Đang tạo..." : "Xác nhận"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Bulk Working Hours Modal */}
        <Modal
          title="Gán lịch làm việc hàng loạt"
          open={isBulkModalOpen}
          onCancel={handleBulkCancel}
          footer={null}
          destroyOnClose
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã cơ sở</label>
              <Input
                value={bulkFormData.facilityId}
                disabled
                className={bulkFormErrors.facilityId ? "border-red-500" : ""}
              />
              {bulkFormErrors.facilityId && (
                <p className="text-red-500 text-sm mt-1">{bulkFormErrors.facilityId}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã nhóm giờ làm việc</label>
              <Input
                type="number"
                placeholder="Nhập mã nhóm giờ làm việc"
                value={bulkFormData.workingHoursGroupId || ""}
                onChange={(e) => setBulkFormData({ ...bulkFormData, workingHoursGroupId: Number(e.target.value) })}
                className={bulkFormErrors.workingHoursGroupId ? "border-red-500" : ""}
                disabled={bulkLoading}
              />
              {bulkFormErrors.workingHoursGroupId && (
                <p className="text-red-500 text-sm mt-1">{bulkFormErrors.workingHoursGroupId}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày</label>
              <DatePicker
                ref={bulkDateRef}
                format="YYYY-MM-DD"
                value={bulkFormData.date ? dayjs(bulkFormData.date) : null}
                onChange={(date) => setBulkFormData({ ...bulkFormData, date: date ? date.format("YYYY-MM-DD") : "" })}
                className={bulkFormErrors.date ? "border-red-500" : ""}
                disabled={bulkLoading}
              />
              {bulkFormErrors.date && (
                <p className="text-red-500 text-sm mt-1">{bulkFormErrors.date}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <Select
                value={bulkFormData.status}
                onChange={(value) => setBulkFormData({ ...bulkFormData, status: value })}
                options={[
                  { value: "Available", label: "Còn chỗ" },
                  { value: "Full", label: "Đã đầy" },
                ]}
                className={bulkFormErrors.status ? "border-red-500" : ""}
                disabled={bulkLoading}
              />
              {bulkFormErrors.status && (
                <p className="text-red-500 text-sm mt-1">{bulkFormErrors.status}</p>
              )}
            </div>
            {bulkError && (
              <div className="bg-red-100 text-red-700 p-4 rounded-lg flex items-center gap-3">
                <svg
                  className="w-5 h-5"
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
                <span className="text-sm">{bulkError}</span>
              </div>
            )}
            {bulkSuccess && (
              <div className="bg-green-100 text-green-700 p-4 rounded-lg flex items-center gap-3">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-sm">{bulkSuccess}</span>
              </div>
            )}
            <div className="flex justify-end gap-3 mt-6">
              <Button
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg"
                onClick={handleBulkCancel}
                disabled={bulkLoading}
              >
                Hủy
              </Button>
              <Button
                className={`bg-blue-600 hover:bg-blue-700 text-white rounded-lg ${bulkLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={handleBulkSubmit}
                disabled={bulkLoading}
              >
                {bulkLoading ? "Đang gán..." : "Xác nhận"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Schedule Slots Table */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spin size="large" className="text-indigo-600" />
            <span className="ml-4 text-gray-700 text-lg">Đang tải...</span>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg flex items-center gap-3">
            <svg
              className="w-5 h-5"
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
            <span className="text-sm">{error}</span>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="w-full table-auto border-collapse">
              <thead className="bg-indigo-700 text-white">
                <tr>
                  <th className="p-4 text-left font-semibold">Slot</th>
                  <th className="p-4 text-left font-semibold">Tên cơ sở</th>
                  <th className="p-4 text-left font-semibold">Khung giờ</th>
                  <th className="p-4 text-left font-semibold">Bắt đầu</th>
                  <th className="p-4 text-left font-semibold">Kết thúc</th>
                  <th className="p-4 text-left font-semibold">Sức chứa</th>
                  {/* <th className="p-4 text-left font-semibold">Đã đặt</th> */}
                  {/* <th className="p-4 text-left font-semibold">Còn lại</th>*/}
                  <th className="p-4 text-left font-semibold">Nghỉ trưa</th>
                  <th className="p-4 text-left font-semibold">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {slots.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-8 text-gray-600">
                      Không tìm thấy lịch khám
                    </td>
                  </tr>
                ) : (
                  slots.map((slot, idx) => (
                    <tr
                      key={slot.slotId}
                      className={`border-b border-gray-200 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-indigo-100 transition-colors duration-200`}
                    >
                      <td className="p-4 text-gray-800">{idx + 1}</td>
                      <td className="p-4 text-gray-800">{slot.facilityName}</td>
                      <td className="p-4 text-gray-800">{slot.slotTime}</td>
                      <td className="p-4 text-gray-800">{slot.startTime}</td>
                      <td className="p-4 text-gray-800">{slot.endTime}</td>
                      <td className="p-4 text-gray-800">{slot.maxCapacity}</td>
                      {/* <td className="p-4 text-gray-800">{slot.bookedCount}</td>
                      <td className="p-4 text-gray-800">{slot.availableCapacity}</td> */}
                      <td className="p-4 text-gray-800">{slot.lunchBreakStart} - {slot.lunchBreakEnd}</td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium shadow-sm ${
                            slot.status === "Available"
                              ? "bg-green-100 text-green-700"
                              : slot.status === "Full"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {slot.status === "Available" ? "Còn chỗ" : slot.status === "Full" ? "Đã đầy" : slot.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleSlotPage;