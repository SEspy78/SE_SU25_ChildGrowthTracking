import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import VaccinationSteps from "@/Components/VaccinationStep";
import { Button } from "@/Components/ui/button";
import { appointmentApi, type Appointment } from "@/api/appointmentAPI";

export default function FinishVaccination() {
  const { id } = useParams<{ id?: string }>();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        setLoading(true);
        if (!id) {
          setError("No appointment ID provided in the URL.");
          setAppointment(null);
          return;
        }
        const appointmentRes = await appointmentApi.getAppointmentById(Number(id));
        const appointmentData = (appointmentRes as any).data || appointmentRes;
        setAppointment(appointmentData);
      } catch (error) {
        setError("Không thể tải thông tin lịch hẹn.");
      } finally {
        setLoading(false);
      }
    };
    fetchAppointment();
  }, [id]);

  if (loading) return <div className="p-8 text-gray-600 text-center">Đang tải thông tin...</div>;
  if (error) return <div className="p-8 text-red-500 text-center">{error}</div>;
  if (!appointment) return <div className="p-8 text-gray-600 text-center">Không có dữ liệu lịch hẹn.</div>;

  const childName = appointment.child.fullName;
  const vaccineNames = Array.isArray(appointment.facilityVaccines) && appointment.facilityVaccines.length > 0
    ? appointment.facilityVaccines.map(fv => fv.vaccine.name).join(", ")
    : "Unknown vaccine";
  const vaccinationDate = appointment.appointmentDate
    ? new Date(appointment.appointmentDate).toLocaleDateString("vi-VN")
    : "Unknown date";
  const isCompleted = appointment.status === "Completed";

  return (
    <div className="mt-8 p-6 bg-white shadow rounded-xl min-h-screen flex items-center justify-center">
      <div className="max-w-4xl mx-auto w-full">
        <h2 className="text-xl font-semibold mb-4">Vaccination Process</h2>
        <div className="mb-8">
          <VaccinationSteps currentStep={4} />
        </div>

        {/* Centered Notification based on status */}
        <div className="flex flex-col items-center text-center">
          <div className="text-6xl mb-4">{isCompleted ? "✅" : "⚠️"}</div>
          <div
            className={`rounded-lg p-6 shadow-md ${
              isCompleted ? "bg-green-100 border-2 border-green-200" : "bg-yellow-100 border-2 border-yellow-200"
            }`}
          >
            <h1 className="text-2xl font-bold mb-2">
              {isCompleted ? "🎉 Hoàn tất tiêm chủng" : "⚠️ Quá trình tiêm chưa hoàn tất"}
            </h1>
            {isCompleted ? (
              <p className="text-lg text-gray-700">
                Đã hoàn tất tiêm vaccine {vaccineNames} cho trẻ {childName} vào ngày{" "}
                {vaccinationDate} lúc 07:55 AM +07, Thứ Bảy, ngày 26/07/2025.
              </p>
            ) : (
              <p className="text-lg text-gray-700">
                Quá trình tiêm chủng chưa hoàn tất. Vui lòng thực hiện các bước
                trước đó.
              </p>
            )}
          </div>
        </div>

        <div className="mt-8">
          <p className="mb-6 text-gray-700">
            {isCompleted
              ? "Quá trình tiêm đã hoàn tất. Thông tin ghi nhận phản ứng sau tiêm như sau:"
              : ""}
          </p>

          {isCompleted && (
            <div>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p>
                    <strong>Vaccine :</strong>{appointment.facilityVaccines.map(fv => fv.vaccine.name).join(", ") } {appointment.order?.packageId ? `(${appointment.order.packageId})` : ""}
                  </p>
                  <p>
                    <strong>Vaccination Date:</strong> {vaccinationDate}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-medium mb-2">📋 Phản ứng sau tiêm:</h3>
                <p className="bg-gray-100 border border-gray-300 rounded-md p-4 text-gray-800 whitespace-pre-wrap">
                  {appointment.note ||
                    "Quá trình tiêm chủng diễn ra bình thường, không có phản ứng bất thường nào được ghi nhận."}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <Button
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-full"
              variant="outline"
              onClick={() => window.history.back()}
            >
              🔙 Quay lại
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full"
              variant="default"
              onClick={() => (window.location.href = "/staff/dashboard")}
              disabled={!isCompleted}
            >
              Finish
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}