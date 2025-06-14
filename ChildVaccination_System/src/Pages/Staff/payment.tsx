import VaccinationSteps from "@/Components/VaccinationStep"
import { Button } from "@/Components/ui/button"

export default function Payment() {
  const patient = {
    name: "Nguyễn Văn A",
    age: "2 tuổi",
    parent: "Nguyễn Văn B",
    contact: "0912345678",
    vaccine: "ComBE Five",
    amount: "1,200,000 VND",
  }

  return (
    <div className="mt-8 p-6 bg-white shadow rounded-xl">
      <h2 className="text-xl font-semibold mb-4">Vaccination Process</h2>
      <VaccinationSteps currentStep={2} />

      <h1 className="text-xl font-bold my-4">💳 Payment</h1>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <p><strong>Patient Name:</strong> {patient.name}</p>
          <p><strong>Age:</strong> {patient.age}</p>
          <p><strong>Parent’s Name:</strong> {patient.parent}</p>
          <p><strong>Contact:</strong> {patient.contact}</p>
        </div>
        <div>
          <p><strong>Vaccine:</strong> {patient.vaccine}</p>
          <p><strong>Total Amount:</strong> {patient.amount}</p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold mb-2">Select Payment Method</h3>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="paymentMethod" value="cash" defaultChecked />
            <span>Cash</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="paymentMethod" value="credit" />
            <span>Credit/Debit Card</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="paymentMethod" value="bank" />
            <span>Bank Transfer</span>
          </label>
        </div>
      </div>

      <div className="flex gap-4">
        <Button variant="outline" className="bg-gray-300 hover:bg-gray-400 text-black px-6 py-2 rounded-full"  onClick={() => window.history.back()}>
           Back
        </Button>
        <Button variant="default" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full">
           Confirm Payment
        </Button>
      </div>
    </div>
  )
}
