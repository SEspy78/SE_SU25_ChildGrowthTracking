import Header from "@/Components/Header"


export default function RegisterClinicPage() {
 



  return (
    <div className="">
      <Header />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300 px-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-2xl space-y-6">
          <h2 className="text-3xl font-bold text-center text-blue-700">Đăng ký hệ thống KID TRACK</h2>



            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition"
              >
                Đăng ký cơ sở
              </button>
            </div>
        

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
