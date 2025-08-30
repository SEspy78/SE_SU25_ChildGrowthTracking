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
  TrendingUp,
  Activity,
  Target
} from 'lucide-react';



import { DashBoardAPI, type AdminDashboardResponse } from '@/api/dashboardAPI';

const StatCard: React.FC<{
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}> = ({ title, value, icon, color, subtitle }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className={`text-3xl font-bold ${color} mt-1`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
        {icon}
      </div>
    </div>
  </div>
);

const ProgressBar: React.FC<{
  percentage: number;
  color: string;
  showLabel?: boolean;
}> = ({ percentage, color, showLabel = true }) => (
  <div className="w-full">
    <div className="flex justify-between text-sm mb-1">
      {showLabel && <span className="text-gray-600">{percentage.toFixed(1)}%</span>}
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className={`h-2 rounded-full transition-all duration-300 ${color}`}
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
    </div>
  </div>
);

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
  </div>
);

const ErrorAlert: React.FC<{ message: string }> = ({ message }) => (
  <div className="p-6">
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-center">
        <XCircle className="h-5 w-5 text-red-500 mr-2" />
        <div>
          <h3 className="text-red-800 font-medium">Lỗi</h3>
          <p className="text-red-700 text-sm mt-1">{message}</p>
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
        setError('Không thể tải dữ liệu dashboard');
        console.error('Dashboard API error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error || !dashboardData) return <ErrorAlert message={error || 'Không thể tải dữ liệu dashboard'} />;

  const { appointmentStats } = dashboardData;

  // Calculate percentages
  const getAppointmentPercentage = (value: number) => 
    appointmentStats.totalAppointments > 0 ? (value / appointmentStats.totalAppointments) * 100 : 0;

  const paymentRate = getAppointmentPercentage(appointmentStats.paid);
  const vaccinationCoverage = (appointmentStats.uniqueChildrenVaccinated / dashboardData.totalChildren) * 100;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard admin</h1>
          <p className="text-gray-600">Tổng quan thống kê và chỉ số hiệu suất hệ thống</p>
        </div>

        {/* Main Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Tổng Cơ Sở Y Tế"
            value={dashboardData.totalFacilities}
            icon={<Building className="h-6 w-6 text-blue-600" />}
            color="text-blue-600"
          />
          <StatCard
            title="Tổng Số Trẻ Em"
            value={dashboardData.totalChildren}
            icon={<Users className="h-6 w-6 text-green-600" />}
            color="text-green-600"
          />
          <StatCard
            title="Gói Thành Viên"
            value={dashboardData.totalMembershipPackages}
            icon={<Crown className="h-6 w-6 text-purple-600" />}
            color="text-purple-600"
          />
          <StatCard
            title="Thành Viên Đăng Ký"
            value={dashboardData.totalUserMemberships}
            icon={<Target className="h-6 w-6 text-orange-600" />}
            color="text-orange-600"
          />
        </div>

        {/* Revenue and Key Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <DollarSign className="h-6 w-6 text-green-500 mr-3" />
              <h2 className="text-xl font-bold text-gray-900">Thống Kê Doanh Thu</h2>
            </div>
            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-600 mb-2">Tổng Doanh Thu Từ Gói Thành Viên</p>
                <p className="text-4xl font-bold text-green-600">
                  {dashboardData.totalRevenueFromMemberships.toLocaleString()} VND
                </p>
              </div>
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">TB/Thành Viên</p>
                    <p className="text-xl font-bold text-blue-600">
                      {Math.round(dashboardData.totalRevenueFromMemberships / dashboardData.totalUserMemberships).toLocaleString()} VND
                    </p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">Hồ Sơ Phát Triển</p>
                    <p className="text-xl font-bold text-purple-600">
                      {dashboardData.totalGrowthRecords.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <TrendingUp className="h-6 w-6 text-blue-500 mr-3" />
              <h2 className="text-xl font-bold text-gray-900">Chỉ Số Quan Trọng</h2>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Sử Dụng Cơ Sở</span>
                <span className="font-bold text-blue-600">
                  {Math.round(dashboardData.totalChildren / dashboardData.totalFacilities)} trẻ/cơ sở
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Tỷ Lệ Chuyển Đổi</span>
                <span className="font-bold text-green-600">
                  {Math.round((dashboardData.totalUserMemberships / dashboardData.totalChildren) * 100)}%
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Bao Phủ Tiêm Chủng</span>
                <span className="font-bold text-purple-600">{vaccinationCoverage.toFixed(1)}%</span>
              </div>
              <div className="pt-4">
                <ProgressBar percentage={vaccinationCoverage} color="bg-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Appointments Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center mb-6">
            <Calendar className="h-6 w-6 text-indigo-500 mr-3" />
            <h2 className="text-xl font-bold text-gray-900">Tổng Quan Lịch Hẹn</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {appointmentStats.totalAppointments.toLocaleString()}
              </div>
              <p className="text-gray-600">Tổng Lịch Hẹn</p>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {appointmentStats.packageAppointments.toLocaleString()}
              </div>
              <p className="text-gray-600">Lịch Hẹn Gói</p>
            </div>
            <div className="text-center p-6 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {appointmentStats.individualAppointments.toLocaleString()}
              </div>
              <p className="text-gray-600">Lịch Hẹn Lẻ</p>
            </div>
          </div>
        </div>

        {/* Appointment Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-full mr-3">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <span className="font-medium text-gray-900">Chờ Xử Lý</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-orange-600">{appointmentStats.pending}</div>
                <div className="text-sm text-gray-500">{getAppointmentPercentage(appointmentStats.pending).toFixed(1)}%</div>
              </div>
            </div>
            <ProgressBar percentage={getAppointmentPercentage(appointmentStats.pending)} color="bg-orange-500" showLabel={false} />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-full mr-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <span className="font-medium text-gray-900">Hoàn Thành</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">{appointmentStats.completed}</div>
                <div className="text-sm text-gray-500">{getAppointmentPercentage(appointmentStats.completed).toFixed(1)}%</div>
              </div>
            </div>
            <ProgressBar percentage={getAppointmentPercentage(appointmentStats.completed)} color="bg-green-500" showLabel={false} />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-full mr-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>
                <span className="font-medium text-gray-900">Chờ Duyệt</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-yellow-600">{appointmentStats.approval}</div>
                <div className="text-sm text-gray-500">{getAppointmentPercentage(appointmentStats.approval).toFixed(1)}%</div>
              </div>
            </div>
            <ProgressBar percentage={getAppointmentPercentage(appointmentStats.approval)} color="bg-yellow-500" showLabel={false} />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-full mr-3">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <span className="font-medium text-gray-900">Đã Hủy</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-red-600">{appointmentStats.cancelled}</div>
                <div className="text-sm text-gray-500">{getAppointmentPercentage(appointmentStats.cancelled).toFixed(1)}%</div>
              </div>
            </div>
            <ProgressBar percentage={getAppointmentPercentage(appointmentStats.cancelled)} color="bg-red-500" showLabel={false} />
          </div>
        </div>

        {/* Payment and Vaccination Impact */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <CreditCard className="h-6 w-6 text-green-500 mr-3" />
              <h2 className="text-xl font-bold text-gray-900">Thống Kê Thanh Toán</h2>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="font-bold text-green-700">Đã Thanh Toán</p>
                  <p className="text-3xl font-bold text-green-600">{appointmentStats.paid.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Tỷ Lệ Thanh Toán</p>
                  <p className="text-xl font-bold text-green-600">{paymentRate.toFixed(1)}%</p>
                </div>
              </div>
              <div className="pt-2">
                <ProgressBar percentage={paymentRate} color="bg-green-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <Activity className="h-6 w-6 text-purple-500 mr-3" />
              <h2 className="text-xl font-bold text-gray-900">Tác Động Tiêm Chủng</h2>
            </div>
            <div className="space-y-4">
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-4xl font-bold text-purple-600 mb-2">
                  {appointmentStats.uniqueChildrenVaccinated.toLocaleString()}
                </p>
                <p className="font-bold text-purple-700">Trẻ Em Được Tiêm Chủng</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Tỷ Lệ Bao Phủ</p>
                  <p className="text-lg font-bold text-blue-600">{vaccinationCoverage.toFixed(1)}%</p>
                </div>
                <div className="text-center p-3 bg-indigo-50 rounded-lg">
                  <p className="text-sm text-gray-600">TB/Cơ Sở</p>
                  <p className="text-lg font-bold text-indigo-600">
                    {Math.round(appointmentStats.uniqueChildrenVaccinated / dashboardData.totalFacilities)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;