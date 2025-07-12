import Header from "@/Components/Header";
import { useState } from "react";
import { FaLock } from "react-icons/fa";
import { MdAccountCircle } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/api/authenApi";

export default function LoginPage() {
  const [accountName, setAccountName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await authApi.login({ accountName, password });
      console.log("Đăng nhập thành công:", res);
      if (res.role === "Admin") {
        navigate("/admin/dashboard");
      } else if (res.role === "Doctor") {
        navigate("/doctor/dashboard");
      } else if (res.role === "Manager") {
        navigate("/manager/staffs-management");
      } else if (res.role === "Staff") {
        navigate("/staff/dashboard");
      }
    } catch (err: any) {
      setError("Tên tài khoản hoặc mật khẩu không đúng.");
      console.error(err);
    }
  };
  return (
    <div className="h-screen overflow-hidden">
      <Header />
      <div className="min-h-screen flex items-center justify-center mb-20 bg-gradient-to-br from-blue-100 to-blue-300 px-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md space-y-6">
          <h2 className="text-3xl font-extrabold text-center text-blue-700">
            Đăng nhập
          </h2>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên tài khoản
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-500">
                  <MdAccountCircle className="size-6" />
                </span>
                <input
                  type="text"
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-500">
                  <FaLock />
                </span>
                <input
                  type="password"
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full hover:cursor-pointer bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition"
            >
              Đăng nhập
            </button>
          </form>

          <p className="text-sm text-center mt-4 text-gray-600">
            Chưa có tài khoản?{" "}
            <a
              href="/register"
              className="text-blue-600 hover:cursor-pointer font-semibold hover:underline"
            >
              Đăng ký ngay
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
