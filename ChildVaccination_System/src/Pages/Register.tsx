import Header from "@/Components/Header";
import { useState } from "react";
import { FaUser, FaEnvelope, FaPhone } from "react-icons/fa";

export default function RegisterClinicPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setShowPopup(true);
      // Reset form
      setName("");
      setEmail("");
      setPhone("");
    }, 1000);
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-100 to-purple-100 flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="bg-white/30 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-2xl border border-white/20 transform transition-all duration-500 ease-out hover:scale-105">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
            Đăng ký hệ thống KID TRACK
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Họ và tên 
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-500">
                  <FaUser className="size-5" />
                </span>
                <input
                  type="text"
                  className="pl-10 w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition-all duration-300 placeholder-gray-400"
                  placeholder=""
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-500">
                  <FaEnvelope className="size-5" />
                </span>
                <input
                  type="email"
                  className="pl-10 w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition-all duration-300 placeholder-gray-400"
                  placeholder="Nhập email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số điện thoại
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-500">
                  <FaPhone className="size-5" />
                </span>
                <input
                  type="tel"
                  className="pl-10 w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition-all duration-300 placeholder-gray-400"
                  placeholder="Nhập số điện thoại"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Đang đăng ký...
                </>
              ) : (
                "Đăng ký cơ sở"
              )}
            </button>
          </form>

          <p className="text-sm text-center mt-6 text-gray-600">
            Đã có tài khoản?{" "}
            <a
              href="/login"
              className="text-indigo-600 font-semibold hover:underline transition-all duration-200"
            >
              Đăng nhập
            </a>
          </p>
        </div>
      </div>

      {showPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/30 backdrop-blur-lg p-6 rounded-2xl shadow-2xl max-w-sm w-full border border-white/20 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-800 text-center">
              Đăng ký thành công
            </h3>
            <p className="text-sm text-gray-600 text-center mt-2">
              Đã đăng ký thành công! Vui lòng đợi nhân viên liên hệ.
            </p>
            <button
              onClick={closePopup}
              className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-semibold transition-all duration-300"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}