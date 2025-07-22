
import React, { useEffect, useState } from "react";
import { authApi, type Member } from "@/api/authenApi";
import { userMembershipApi, type UserMembership } from "@/api/UserMembershipApi";

const MemberManagement: React.FC = () => {
  const [tab, setTab] = useState<'normal' | 'vip'>("normal");
  const [members, setMembers] = useState<Member[]>([]);
  const [vipMembers, setVipMembers] = useState<UserMembership[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      setError(null);
      try {
        if (tab === "normal") {
          const res = await authApi.getAllMember();
          setMembers(res.data);
        } else {
          const res = await userMembershipApi.getAll();
          setVipMembers(res.data);
        }
      } catch (err) {
        setError("Không thể tải danh sách người dùng.");
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, [tab]);

  return (
    <div className="p-6">
      <main className="flex-1 p-8 bg-gray-50 overflow-y-auto shadow-lg border rounded-md">
        <h1 className="text-3xl font-semibold mb-8">Quản lý người dùng</h1>
        <div className="mb-6 flex gap-4">
          <button
            className={`px-4 py-2 rounded ${tab === "normal" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            onClick={() => setTab("normal")}
          >
            Tài khoản thường
          </button>
          <button
            className={`px-4 py-2 rounded ${tab === "vip" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            onClick={() => setTab("vip")}
          >
            Tài khoản VIP
          </button>
        </div>
        {loading && <p className="text-gray-500">Đang tải dữ liệu...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && tab === "normal" && (
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
        {!loading && !error && tab === "vip" && (
          <div className="overflow-x-auto rounded shadow">
            <table className="min-w-full border rounded-lg overflow-hidden border-black shadow-sm">
              <thead className="bg-blue-100 text-blue-800">
                <tr>
                  <th className="p-3 border">Tên tài khoản</th>
                  <th className="p-3 border">Tên gói</th>
                  <th className="p-3 border">Mô tả gói</th>
                  <th className="p-3 border">Giá</th>
                  <th className="p-3 border">Ngày bắt đầu</th>
                  <th className="p-3 border">Ngày kết thúc</th>
                  <th className="p-3 border">Còn lại</th>
                  <th className="p-3 border">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {vipMembers.map((v) => (
                  <tr key={v.userMembershipId} className="hover:bg-gray-50">
                    <td className="p-3 border">{v.accountName}</td>
                    <td className="p-3 border">{v.membershipName}</td>
                    <td className="p-3 border">{v.membershipDescription}</td>
                    <td className="p-3 border">{v.membershipPrice.toLocaleString()}</td>
                    <td className="p-3 border">{new Date(v.startDate).toLocaleDateString()}</td>
                    <td className="p-3 border">{new Date(v.endDate).toLocaleDateString()}</td>
                    <td className="p-3 border">{v.daysRemaining} ngày</td>
                    <td className="p-3 border">{v.isActive ? "Hoạt động" : "Hết hạn"}</td>
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
