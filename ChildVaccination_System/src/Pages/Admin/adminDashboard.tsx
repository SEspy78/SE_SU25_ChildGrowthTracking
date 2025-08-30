import React, { useState, useEffect } from 'react';
import {
  Users,
  Building,
  Crown,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  CreditCard,
  Activity,
  Target
} from 'lucide-react';
import { DashBoardAPI, type AdminDashboardResponse } from '@/api/dashboardAPI';

const StatCard: React.FC<{
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-gray-600">{title}</p>
        <p className={`text-2xl font-bold ${color}`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      </div>
      <div className={`p-2 rounded-full ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
        {icon}
      </div>
    </div>
  </div>
);

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
  </div>
);

const ErrorAlert: React.FC<{ message: string }> = ({ message }) => (
  <div className="p-4">
    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
      <div className="flex items-center">
        <XCircle className="h-4 w-4 text-red-500 mr-2" />
        <div>
          <h3 className="text-red-800 font-medium text-sm">Lỗi</h3>
          <p className="text-red-700 text-xs mt-1">{message}</p>
        </div>
      </div>
    </div>
  </div>
);

const AdminDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const data = await DashBoardAPI.adminDashboard();
        setDashboardData(data);
        setError(null);
      } catch (err) {
        setError('Không thể tải dữ liệu bảng điều khiển');
        console.error('Lỗi API bảng điều khiển:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error || !dashboardData) return <ErrorAlert message={error || 'Không thể tải dữ liệu bảng điều khiển'} />;

  const { appointmentStats } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Bảng điều khiển quản trị</h1>
          <p className="text-gray-600 text-sm">Tổng quan về số liệu và hiệu suất hoạt động</p>
        </div>

        {/* Main Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <StatCard
            title="Số cơ sở y tế"
            value={dashboardData.totalFacilities}
            icon={<Building className="h-5 w-5 text-blue-600" />}
            color="text-blue-600"
          />
          <StatCard
            title="Số trẻ em"
            value={dashboardData.totalChildren}
            icon={<Users className="h-5 w-5 text-green-600" />}
            color="text-green-600"
          />
          <StatCard
            title="Gói thành viên"
            value={dashboardData.totalMembershipPackages}
            icon={<Crown className="h-5 w-5 text-purple-600" />}
            color="text-purple-600"
          />
          <StatCard
            title="Thành viên đăng ký"
            value={dashboardData.totalUserMemberships}
            icon={<Target className="h-5 w-5 text-orange-600" />}
            color="text-orange-600"
          />
        </div>

        {/* Revenue */}
        <div className="grid grid-cols-1 gap-3 mb-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center mb-3">
              <DollarSign className="h-5 w-5 text-green-500 mr-2" />
              <h2 className="text-lg font-bold text-gray-900">Tổng quan doanh thu</h2>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-600 mb-1">Doanh thu từ gói thành viên</p>
                <p className="text-2xl font-bold text-green-600">
                  {dashboardData.totalRevenueFromMemberships.toLocaleString()} VND
                </p>
              </div>
              <div className="border-t pt-3">
                <div className="text-center p-2 bg-purple-50 rounded-lg">
                  <p className="text-xs text-gray-600">Hồ sơ theo dõi sức khỏe</p>
                  <p className="text-lg font-bold text-purple-600">
                    {dashboardData.totalGrowthRecords.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Appointments Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex items-center mb-3">
            <Calendar className="h-5 w-5 text-indigo-500 mr-2" />
            <h2 className="text-lg font-bold text-gray-900">Tổng quan lịch hẹn</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {appointmentStats.totalAppointments.toLocaleString()}
              </div>
              <p className="text-xs text-gray-600">Tổng số lịch hẹn</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {appointmentStats.packageAppointments.toLocaleString()}
              </div>
              <p className="text-xs text-gray-600">Lịch hẹn theo gói</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {appointmentStats.individualAppointments.toLocaleString()}
              </div>
              <p className="text-xs text-gray-600">Lịch hẹn lẻ</p>
            </div>
          </div>
        </div>

        {/* Appointment Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-full mr-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
                <span className="font-medium text-gray-900 text-sm">Đang chờ xử lý</span>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-orange-600">{appointmentStats.pending}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-full mr-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <span className="font-medium text-gray-900 text-sm">Đã hoàn thành</span>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-green-600">{appointmentStats.completed}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-full mr-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                </div>
                <span className="font-medium text-gray-900 text-sm">Chờ xác nhận</span>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-yellow-600">{appointmentStats.approval}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-full mr-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                </div>
                <span className="font-medium text-gray-900 text-sm">Đã hủy</span>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-red-600">{appointmentStats.cancelled}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment and Vaccination Impact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center mb-3">
              <CreditCard className="h-5 w-5 text-green-500 mr-2" />
              <h2 className="text-lg font-bold text-gray-900">Thống kê thanh toán</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-bold text-green-700 text-sm">Số lịch hẹn đã thanh toán</p>
                  <p className="text-2xl font-bold text-green-600">{appointmentStats.paid.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center mb-3">
              <Activity className="h-5 w-5 text-purple-500 mr-2" />
              <h2 className="text-lg font-bold text-gray-900">Tỷ lệ tiêm chủng</h2>
            </div>
            <div className="space-y-3">
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600 mb-1">
                  {appointmentStats.uniqueChildrenVaccinated.toLocaleString()}
                </p>
                <p className="font-bold text-purple-700 text-sm">Số trẻ em đã tiêm chủng</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;