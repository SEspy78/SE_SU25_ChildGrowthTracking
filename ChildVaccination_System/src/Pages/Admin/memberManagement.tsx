import React, { useEffect, useState } from "react";
import { Modal } from "antd";
import { Search, Eye, Edit, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { authApi, type Member, type Child } from "@/api/authenApi";
import { userMembershipApi, type UserMembership } from "@/api/UserMembershipApi";

const MemberManagement: React.FC = () => {
  const [tab, setTab] = useState<'normal' | 'vip'>("normal");
  const [members, setMembers] = useState<Member[]>([]);
  const [vipMembers, setVipMembers] = useState<UserMembership[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showChildrenModal, setShowChildrenModal] = useState<boolean>(false);
  const [selectedMember, setSelectedMember] = useState<Member | UserMembership | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

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
    setCurrentPage(1);
  }, [tab]);

  const handleViewChildren = async (accountId: number, member: Member | UserMembership) => {
    setLoading(true);
    try {
      const childrenData: Child[] = await authApi.getMemberChildren(accountId);
      setChildren(childrenData);
      setSelectedMember(member);
      setShowChildrenModal(true);
      setTimeout(() => setToast({ show: false, message: "", type: "success" }), 2500);
    } catch (err: any) {
      setTimeout(() => setToast({ show: false, message: "", type: "success" }), 2500);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.accountName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = 
      filterStatus === "all" || 
      (filterStatus === "active" && member.status) ||
      (filterStatus === "inactive" && !member.status);
    return matchesSearch && matchesStatus;
  });

  const filteredVipMembers = vipMembers.filter(member => {
    const matchesSearch = member.accountName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = 
      filterStatus === "all" || 
      (filterStatus === "active" && member.isActive) ||
      (filterStatus === "inactive" && !member.isActive);
    return matchesSearch && matchesStatus;
  });

  const getCurrentPageData = (data: Member[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getCurrentPageVipData = (data: UserMembership[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(
    tab === "normal" ? filteredMembers.length : filteredVipMembers.length
  ) / itemsPerPage;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  const currentMembers = getCurrentPageData(filteredMembers);
  const currentVipMembers = getCurrentPageVipData(filteredVipMembers);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
          <span className="text-lg text-gray-700 font-medium">Đang tải dữ liệu...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-50">
        <div className="bg-red-50 text-red-700 p-6 rounded-xl shadow-lg flex items-center space-x-3 max-w-md">
          <AlertCircle className="w-8 h-8 flex-shrink-0" />
          <span className="text-lg font-semibold">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 py-8 px-4 sm:px-6 lg:px-8">
      {toast.show && (
        <div
          className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg text-white font-semibold transition-all duration-300 ease-in-out ${
            toast.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {toast.message}
        </div>
      )}

      <Modal
        title={
          <span className="text-xl font-semibold text-gray-800">
            Danh sách trẻ em của {selectedMember ? 'fullName' in selectedMember ? selectedMember.fullName : `Account Name:${selectedMember.accountName}` : ''}
          </span>
        }
        open={showChildrenModal}
        onCancel={() => {
          setShowChildrenModal(false);
          setSelectedMember(null);
          setChildren([]);
        }}
        footer={null}
        centered
        className="rounded-xl"
      >
        <div className="space-y-4">
          {children.length === 0 ? (
            <p className="text-gray-600 text-center">Không có trẻ em nào được liên kết với thành viên này.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Họ tên</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ngày sinh</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Giới tính</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nhóm máu</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Dị ứng</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tiền sử bệnh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {children.map((child: Child, index: number) => (
                    <tr key={child.childId} className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition-colors`}>
                      <td className="px-4 py-2 text-sm font-medium text-gray-800">{child.fullName}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{child.birthDate}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{child.gender}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{child.bloodType || "-"}</td>
                      <td className="px-4 py-2 text-sm text-gray-600 max-w-xs truncate" title={child.allergiesNotes}>
                        {child.allergiesNotes || "-"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600 max-w-xs truncate" title={child.medicalHistory}>
                        {child.medicalHistory || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="flex justify-end mt-6">
          <button
            onClick={() => {
              setShowChildrenModal(false);
              setSelectedMember(null);
              setChildren([]);
            }}
            className="py-2 px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full font-medium transition-colors duration-200"
          >
            Đóng
          </button>
        </div>
      </Modal>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a2 2 0 00-2-2h-3m-2-4h7m-7 4h7m-7-8h7M4 6h7m-7 4h7m-7 4h7m-7 4h7"></path>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Quản lý người dùng</h1>
                <p className="text-gray-600 text-sm mt-1">Quản lý tài khoản người dùng và thành viên VIP</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs and Content */}
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6">
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                tab === "normal" 
                  ? "bg-blue-600 text-white shadow-md" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setTab("normal")}
            >
              Tài khoản thường ({filteredMembers.length})
            </button>
            <button
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                tab === "vip" 
                  ? "bg-blue-600 text-white shadow-md" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setTab("vip")}
            >
              Tài khoản VIP ({filteredVipMembers.length})
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, tài khoản hoặc email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </select>
          </div>

          {/* Normal Members Table */}
          {tab === "normal" && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">
                  Danh sách tài khoản thường ({filteredMembers.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Thông tin</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Liên hệ</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Trạng thái</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ngày tạo</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentMembers.map((member) => (
                      <tr key={member.memberId} className="hover:bg-blue-50 transition-colors">
                        <td className="px-6 py-5">
                          <div>
                            <div className="text-base font-semibold text-gray-800 mb-1">{member.fullName}</div>
                            <div className="text-base text-gray-600">@{member.accountName}</div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-base text-gray-800 mb-1">{member.email?.trim()}</div>
                          <div className="text-base text-gray-600">{member.phoneNumber}</div>
                        </td>
                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex px-3 py-2 text-xs font-semibold rounded-full border ${
                              member.status
                                ? "bg-green-100 text-green-800 border-green-200"
                                : "bg-red-100 text-red-800 border-red-200"
                            }`}
                          >
                            {member.status ? "Hoạt động" : "Khóa"}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-base text-gray-600">
                          {new Date(member.createdAt).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleViewChildren(member.accountId, member)}
                              className="text-blue-500 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors duration-200"
                              title="Xem trẻ em"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button
                              className="text-green-500 hover:text-green-600 p-2 rounded-full hover:bg-green-50 transition-colors duration-200"
                              title="Chỉnh sửa"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredMembers.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-600 text-lg font-medium">Không tìm thấy người dùng nào.</p>
                </div>
              )}
              {filteredMembers.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between">
                  <div className="text-sm text-gray-600 mb-4 sm:mb-0">
                    Hiển thị {(currentPage - 1) * itemsPerPage + 1} đến{" "}
                    {Math.min(currentPage * itemsPerPage, filteredMembers.length)} trong tổng số {filteredMembers.length} kết quả
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-full hover:bg-gray-100 transition-colors duration-200"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${
                          currentPage === page ? "bg-blue-600 text-white" : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-full hover:bg-gray-100 transition-colors duration-200"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIP Members Table */}
          {tab === "vip" && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">
                  Danh sách thành viên VIP ({filteredVipMembers.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Thông tin</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Gói thành viên</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Thời hạn</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Trạng thái</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentVipMembers.map((member) => (
                      <tr key={member.userMembershipId} className="hover:bg-blue-50 transition-colors">
                        <td className="px-6 py-5">
                          <div className="text-base font-semibold text-gray-800">@{member.accountName}</div>
                        </td>
                        <td className="px-6 py-5">
                          <div>
                            <div className="text-base font-semibold text-gray-800 mb-1">{member.membershipName}</div>
                            <div className="text-base text-gray-600 mb-2">{member.membershipDescription}</div>
                            <div className="text-base font-semibold text-green-600">
                              {member.membershipPrice.toLocaleString("vi-VN")}₫
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-base text-gray-800">
                            <div className="mb-1">Từ: {new Date(member.startDate).toLocaleDateString("vi-VN")}</div>
                            <div className="mb-1">Đến: {new Date(member.endDate).toLocaleDateString("vi-VN")}</div>
                            <div className="text-blue-600 font-semibold text-base">
                              Còn {member.daysRemaining} ngày
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex px-3 py-2 text-xs font-semibold rounded-full border ${
                              member.isActive
                                ? "bg-green-100 text-green-800 border-green-200"
                                : "bg-red-100 text-red-800 border-red-200"
                            }`}
                          >
                            {member.isActive ? "Hoạt động" : "Hết hạn"}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleViewChildren(member.accountId, member)}
                              className="text-blue-500 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors duration-200"
                              title="Xem trẻ em"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button
                              className="text-green-500 hover:text-green-600 p-2 rounded-full hover:bg-green-50 transition-colors duration-200"
                              title="Chỉnh sửa"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredVipMembers.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-600 text-lg font-medium">Không tìm thấy thành viên VIP nào.</p>
                </div>
              )}
              {filteredVipMembers.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between">
                  <div className="text-sm text-gray-600 mb-4 sm:mb-0">
                    Hiển thị {(currentPage - 1) * itemsPerPage + 1} đến{" "}
                    {Math.min(currentPage * itemsPerPage, filteredVipMembers.length)} trong tổng số {filteredVipMembers.length} kết quả
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-full hover:bg-gray-100 transition-colors duration-200"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${
                          currentPage === page ? "bg-blue-600 text-white" : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-full hover:bg-gray-100 transition-colors duration-200"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberManagement;