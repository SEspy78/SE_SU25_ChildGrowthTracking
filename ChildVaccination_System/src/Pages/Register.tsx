// src/pages/RegisterPage.tsx
import Header from "@/Components/Header"
import { useState } from "react"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Kiểm tra mật khẩu khớp và gửi API tạo tài khoản
    console.log(formData)
  }

  return (
    <div>
        <Header></Header>
    <div className="min-h-screen flex items-center justify-center bg-blue-50 px-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-blue-800 mb-6 text-center">Tạo tài khoản</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Họ tên</label>
            <input
              type="text"
              name="name"
              className="mt-1 block w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-200"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              className="mt-1 block w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-200"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
            <input
              type="password"
              name="password"
              className="mt-1 block w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-200"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Nhập lại mật khẩu</label>
            <input
              type="password"
              name="confirmPassword"
              className="mt-1 block w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-200"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            Đăng ký
          </button>
        </form>
        <p className="text-sm text-center mt-4">
          Đã có tài khoản? <a href="/login" className="text-blue-600 hover:underline">Đăng nhập</a>
        </p>
      </div>
    </div>
    </div>
  )
}
