
import React, { useEffect, useState } from "react";
import { authApi, type Member } from "@/api/authenApi";
import { userMembershipApi, type UserMembership } from "@/api/UserMembershipApi";
import { Search, Eye, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

const MemberManagement: React.FC = () => {
  const [tab, setTab] = useState<'normal' | 'vip'>("normal");
  const [members, setMembers] = useState<Member[]>([]);
  const [vipMembers, setVipMembers] = useState<UserMembership[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setError("Không thể tải danh sách người dùng.");
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
    setCurrentPage(1); // Reset về trang 1 khi chuyển tab
  }, [tab]);

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.accountName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "active" && member.status) ||
                         (filterStatus === "inactive" && !member.status);
    return matchesSearch && matchesStatus;
  });

  const filteredVipMembers = vipMembers.filter(member => {
    const matchesSearch = member.accountName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "active" && member.isActive) ||
                         (filterStatus === "inactive" && !member.isActive);
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
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

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  const currentMembers = getCurrentPageData(filteredMembers);
  const currentVipMembers = getCurrentPageVipData(filteredVipMembers);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Quản lý người dùng</h1>
            <p className="text-gray-600 mt-1">Quản lý tài khoản người dùng và thành viên VIP</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Có thể thêm các action khác ở đây */}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              tab === "normal" 
                ? "bg-blue-600 text-white shadow-md" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => setTab("normal")}
          >
            Tài khoản thường ({members.length})
          </button>
          <button
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              tab === "vip" 
                ? "bg-blue-600 text-white shadow-md" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => setTab("vip")}
          >
            Tài khoản VIP ({vipMembers.length})
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, tài khoản hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </select>
          </div>
        </div>

        {/* Loading and Error States */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Normal Members Table */}
        {!loading && !error && tab === "normal" && (
          <div className="overflow-x-auto">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Danh sách tài khoản thường ({filteredMembers.length})
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Thông tin
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Liên hệ
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Ngày tạo
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentMembers.map((member) => (
                      <tr key={member.memberId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-5">
                          <div>
                            <div className="text-base font-semibold text-gray-900 mb-1">{member.fullName}</div>
                            <div className="text-base text-gray-600">@{member.accountName}</div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-base text-gray-900 mb-1">{member.email?.trim()}</div>
                          <div className="text-base text-gray-600">{member.phoneNumber}</div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex px-3 py-2 text-sm font-semibold rounded-full ${
                            member.status 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {member.status ? "Hoạt động" : "Khóa"}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-base text-gray-600">
                          {new Date(member.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex space-x-3">
                            <button className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors">
                              <Eye className="w-5 h-5" />
                            </button>
                            <button className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50 transition-colors">
                              <Edit className="w-5 h-5" />
                            </button>
                            <button className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors">
                              <Trash2 className="w-5 h-5" />
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
                  <p className="text-gray-500 text-lg">Không tìm thấy người dùng nào.</p>
                </div>
              )}

              {/* Pagination for Normal Members */}
              {filteredMembers.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-base text-gray-700">
                      Hiển thị {((currentPage - 1) * itemsPerPage) + 1} đến {Math.min(currentPage * itemsPerPage, filteredMembers.length)} trong tổng số {filteredMembers.length} kết quả
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                        className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-4 py-2 text-base font-medium rounded-lg transition-colors ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      
                      <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIP Members Table */}
        {!loading && !error && tab === "vip" && (
          <div className="overflow-x-auto">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Danh sách thành viên VIP ({filteredVipMembers.length})
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Thông tin
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Gói thành viên
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Thời hạn
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentVipMembers.map((member) => (
                      <tr key={member.userMembershipId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-5">
                          <div className="text-base font-semibold text-gray-900">@{member.accountName}</div>
                        </td>
                        <td className="px-6 py-5">
                          <div>
                            <div className="text-base font-semibold text-gray-900 mb-1">{member.membershipName}</div>
                            <div className="text-base text-gray-600 mb-2">{member.membershipDescription}</div>
                            <div className="text-base font-semibold text-green-600">
                              {member.membershipPrice.toLocaleString('vi-VN')}₫
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-base text-gray-900">
                            <div className="mb-1">Từ: {new Date(member.startDate).toLocaleDateString('vi-VN')}</div>
                            <div className="mb-1">Đến: {new Date(member.endDate).toLocaleDateString('vi-VN')}</div>
                            <div className="text-blue-600 font-semibold text-base">
                              Còn {member.daysRemaining} ngày
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex px-3 py-2 text-sm font-semibold rounded-full ${
                            member.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {member.isActive ? "Hoạt động" : "Hết hạn"}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex space-x-3">
                            <button className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors">
                              <Eye className="w-5 h-5" />
                            </button>
                            <button className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50 transition-colors">
                              <Edit className="w-5 h-5" />
                            </button>
                            <button className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors">
                              <Trash2 className="w-5 h-5" />
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
                  <p className="text-gray-500 text-lg">Không tìm thấy thành viên VIP nào.</p>
                </div>
              )}

              {/* Pagination for VIP Members */}
              {filteredVipMembers.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-base text-gray-700">
                      Hiển thị {((currentPage - 1) * itemsPerPage) + 1} đến {Math.min(currentPage * itemsPerPage, filteredVipMembers.length)} trong tổng số {filteredVipMembers.length} kết quả
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                        className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-4 py-2 text-base font-medium rounded-lg transition-colors ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      
                      <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberManagement;
