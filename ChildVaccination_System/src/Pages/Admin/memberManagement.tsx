
import React, { useEffect, useState } from "react";
import { authApi, type Member } from "@/api/authenApi";

const MemberManagement: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await authApi.getAllMember();
        setMembers(res.data);
      } catch (err) {
        setError("Không thể tải danh sách người dùng.");
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  return (
    <div className="p-6">
      <main className="flex-1 p-8 bg-gray-50 overflow-y-auto shadow-lg border rounded-md">
        <h1 className="text-3xl font-semibold mb-8">Quản lý người dùng</h1>
        {loading && <p className="text-gray-500">Đang tải dữ liệu...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && (
          <div className="overflow-x-auto rounded shadow">
            <table className="min-w-full border rounded-lg overflow-hidden border-black shadow-sm">
              <thead className="bg-blue-100 text-blue-800">
                <tr>
                  <th className="p-3 border">Tên tài khoản</th>
                  <th className="p-3 border">Họ tên</th>
                  <th className="p-3 border">Email</th>
                  <th className="p-3 border">Số điện thoại</th>
                  <th className="p-3 border">Địa chỉ</th>
                  <th className="p-3 border">Trạng thái</th>
                  <th className="p-3 border">Ngày tạo</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.memberId} className="hover:bg-gray-50">
                    <td className="p-3 border">{m.accountName}</td>
                    <td className="p-3 border">{m.fullName}</td>
                    <td className="p-3 border">{m.email?.trim()}</td>
                    <td className="p-3 border">{m.phoneNumber}</td>
                    <td className="p-3 border">{m.address}</td>
                    <td className="p-3 border">{m.status ? "Hoạt động" : "Khóa"}</td>
                    <td className="p-3 border">{new Date(m.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default MemberManagement;
