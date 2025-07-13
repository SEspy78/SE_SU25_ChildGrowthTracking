
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
        setSlots(res.data);
      } catch (err) {
        setError("Không thể tải dữ liệu lịch khám.");
      } finally {
        setLoading(false);
      }
    };
    fetchSlots();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100">
    <div className="max-w-4xl mx-auto p-6">
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
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">Khung giờ</th>
                <th className="px-4 py-2">Số thứ tự</th>
                <th className="px-4 py-2">Sức chứa</th>
                <th className="px-4 py-2">Đã đặt</th>
                <th className="px-4 py-2">Còn lại</th>
                <th className="px-4 py-2">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((slot, idx) => (
                <tr key={slot.slotId} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{idx + 1}</td>
                  <td className="px-4 py-2">{slot.slotTime}</td>
                  <td className="px-4 py-2">{slot.slotNumber}</td>
                  <td className="px-4 py-2">{slot.maxCapacity}</td>
                  <td className="px-4 py-2">{slot.bookedCount}</td>
                  <td className="px-4 py-2">{slot.availableCapacity}</td>
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
