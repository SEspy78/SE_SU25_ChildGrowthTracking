import Header from "@/Components/Header"
import { useState } from "react"
import { FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaBuilding, FaCity, FaLock } from "react-icons/fa"

export default function RegisterClinicPage() {
 
  const [error, setError] = useState("")

 



  const InputGroup = ({ label, name, type = "text", icon, required = true }: any) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-500">{icon}</span>
        <input
          className="pl-10 block w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:outline-none"
        />
      </div>
    </div>
  )

  return (
    <div className="">
      <Header />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300 px-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-2xl space-y-6">
          <h2 className="text-3xl font-bold text-center text-blue-700">Đăng ký hệ thống KID TRACK</h2>

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}

          <form  className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputGroup label="Tên cơ sở" name="clinicName" icon={<FaBuilding />} />
            <InputGroup label="Mã số cơ sở" name="clinicCode" icon={<FaBuilding />} required={false} />
            <InputGroup label="Người đại diện" name="representative" icon={<FaUser />} />
            <InputGroup label="Số điện thoại" name="phone" type="tel" icon={<FaPhone />} />
            <InputGroup label="Email" name="email" type="email" icon={<FaEnvelope />} />
            <InputGroup label="Địa chỉ" name="address" icon={<FaMapMarkerAlt />} />
            <InputGroup label="Tỉnh/Thành phố" name="city" icon={<FaCity />} />
            <InputGroup label="Mật khẩu" name="password" type="password" icon={<FaLock />} />
            <InputGroup label="Xác nhận mật khẩu" name="confirmPassword" type="password" icon={<FaLock />} />

            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition"
              >
                Đăng ký cơ sở
              </button>
            </div>
          </form>

          <p className="text-sm text-center mt-4 text-gray-600">
            Đã có tài khoản?{" "}
            <a href="/login" className="text-blue-600 font-semibold hover:underline">
              Đăng nhập
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
