// import { useParams } from "react-router-dom"
// import { useState } from "react"
// import VaccinationSteps from "@/Components/VaccinationStep"
// import { Button } from "@/Components/ui/button"

// export default function FinishVaccination() {
//   const { id } = useParams()

//   // Dữ liệu giả lập – có thể thay bằng props hoặc fetch API
//   const vaccineInfo = {
//     name: "ComBE Five",
//     date: "22-03-2025",
//     lot: "CBF-2025-001",
//     site: "Cánh tay trái",
//   }

//   const [reactionNote, setReactionNote] = useState("")
//   const [submitted, setSubmitted] = useState(false)

//   const handleSubmit = () => {
//     // TODO: Gửi ghi chú đến server
//     console.log("Ghi nhận phản ứng:", reactionNote)
//     setSubmitted(true)
//   }

//   return (
//     <div className="mt-8 p-6 bg-white shadow rounded-xl">
//       <h2 className="text-xl font-semibold mb-4">Vaccination Process</h2>
//       <VaccinationSteps currentStep={4} />

//       <h1 className="text-2xl font-bold my-4 text-green-600">🎉 Hoàn tất tiêm chủng</h1>
//       <p className="mb-6 text-gray-700">Bệnh nhân đã tiêm chủng thành công. Vui lòng ghi nhận phản ứng sau tiêm nếu có.</p>

//       <div className="grid grid-cols-2 gap-6 mb-6">
//         <div>
//           <p><strong>Vaccine Name:</strong> {vaccineInfo.name}</p>
//           <p><strong>Vaccination Date:</strong> {vaccineInfo.date}</p>
//         </div>
//         <div>
//           <p><strong>Lot Number:</strong> {vaccineInfo.lot}</p>
//           <p><strong>Injection Site:</strong> {vaccineInfo.site}</p>
//         </div>
//       </div>

//       <div className="mb-6">
//         <label htmlFor="reaction" className="font-medium block mb-2">📋 Ghi nhận phản ứng sau tiêm:</label>
//         <textarea
//           id="reaction"
//           className="w-full border border-gray-300 rounded-md p-3"
//           rows={4}
//           value={reactionNote}
//           onChange={(e) => setReactionNote(e.target.value)}
//           placeholder="Ví dụ: sốt nhẹ, sưng đỏ tại chỗ tiêm..."
//         />
//       </div>

//       {submitted ? (
//         <div className="text-green-600 font-medium mb-4">✅ Đã ghi nhận phản ứng sau tiêm!</div>
//       ) : null}

//       <div className="flex justify-between">
//         <Button variant="outline" onClick={() => window.history.back()}>
//           🔙 Quay lại
//         </Button>
//         <Button onClick={handleSubmit}>
//           ✅ Ghi nhận & Hoàn tất
//         </Button>
//       </div>
//     </div>
//   )
// }
import { useParams } from "react-router-dom";
import VaccinationSteps from "@/Components/VaccinationStep";
import { Button } from "@/Components/ui/button";

export default function FinishVaccination() {
  const { id } = useParams();

  // Dữ liệu mẫu — có thể lấy từ router, context hoặc API
  const vaccineInfo = {
    name: "ComBE Five",
    date: "22-03-2025",
    lot: "CBF-2025-001",
    site: "Cánh tay trái",
    reaction: "Sốt nhẹ trong 24h đầu, không có dấu hiệu nghiêm trọng.",
  };

  return (
    <div className="mt-8 p-6 bg-white shadow rounded-xl">
      <h2 className="text-xl font-semibold mb-4">Vaccination Process</h2>
      <VaccinationSteps currentStep={4} />

      <h1 className="text-2xl font-bold my-4 text-green-600">
        🎉 Hoàn tất tiêm chủng
      </h1>
      <p className="mb-6 text-gray-700">
        Quá trình tiêm đã hoàn tất. Thông tin ghi nhận phản ứng sau tiêm như
        sau:
      </p>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <p>
            <strong>Vaccine Name:</strong> {vaccineInfo.name}
          </p>
          <p>
            <strong>Vaccination Date:</strong> {vaccineInfo.date}
          </p>
        </div>
        <div>
          <p>
            <strong>Lot Number:</strong> {vaccineInfo.lot}
          </p>
          <p>
            <strong>Injection Site:</strong> {vaccineInfo.site}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-medium mb-2">📋 Phản ứng sau tiêm:</h3>
        <p className="bg-gray-100 border border-gray-300 rounded-md p-4 text-gray-800 whitespace-pre-wrap">
          {vaccineInfo.reaction}
        </p>
      </div>

      <div className="flex justify-end">
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full"
          variant="default"
          onClick={() => (window.location.href = "/staff/dashboard")}
        >
          Finish
        </Button>
      </div>
    </div>
  );
}
