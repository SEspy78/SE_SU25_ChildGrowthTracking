
import React, { useEffect, useState } from "react";
import { scheduleApi, type ScheduleSlot } from "@/api/scheduleApi";

const ScheduleSlotPage: React.FC = () => {
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 text-blue-700">Lịch khám của cơ sở</h1>
        {loading ? (
          <div>Đang tải...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto border border-gray-200 text-sm text-left">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-4 py-2">Slot</th>
                  <th className="px-4 py-2">Tên cơ sở</th>
                  <th className="px-4 py-2">Khung giờ</th>
                  <th className="px-4 py-2">Bắt đầu</th>
                  <th className="px-4 py-2">Kết thúc</th>
                  <th className="px-4 py-2">Sức chứa</th>
                  <th className="px-4 py-2">Đã đặt</th>
                  <th className="px-4 py-2">Còn lại</th>
                  <th className="px-4 py-2">Nghỉ trưa</th>
                  <th className="px-4 py-2">Trạng thái</th>
                  <th className="px-4 py-2">Làm việc</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((slot, idx) => (
                  <tr key={slot.slotId} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">{idx + 1}</td>
                    <td className="px-4 py-2">{slot.facilityName}</td>
                    <td className="px-4 py-2">{slot.slotTime}</td>
                    <td className="px-4 py-2">{slot.startTime}</td>
                    <td className="px-4 py-2">{slot.endTime}</td>
                    <td className="px-4 py-2">{slot.maxCapacity}</td>
                    <td className="px-4 py-2">{slot.bookedCount}</td>
                    <td className="px-4 py-2">{slot.availableCapacity}</td>
                    <td className="px-4 py-2">{slot.lunchBreakStart} - {slot.lunchBreakEnd}</td>
                    <td className="px-4 py-2">
                      <span className={
                        slot.status === "Available"
                          ? "text-green-700 font-semibold"
                          : slot.status === "Full"
                          ? "text-red-600 font-semibold"
                          : "text-gray-700"
                      }>
                        {slot.status === "Available" ? "Còn chỗ" : slot.status === "Full" ? "Đã đầy" : slot.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {slot.isWorkingHours ? (
                        <span className="text-green-700 font-semibold">Làm việc</span>
                      ) : (
                        <span className="text-gray-500">Nghỉ</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleSlotPage;
