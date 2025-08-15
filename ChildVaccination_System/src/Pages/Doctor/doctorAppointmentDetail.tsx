import React, { useEffect, useState, useRef } from "react";
import { Button, Card, Col, Row } from "antd";
import { BarChart, Home, AlertCircle, RefreshCcw } from "lucide-react";
import { DashBoardAPI, type FacilityDashBoardResponse } from "@/api/dashboardAPI";
import { getUserInfo } from "@/lib/storage";
import { Pie } from "@ant-design/charts";

const DoctorAppointment: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<FacilityDashBoardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchDashboardData = async () => {
    const userInfo = getUserInfo();
    if (!userInfo?.facilityId) {
      setError("Không tìm thấy mã cơ sở.");
      setToast({ show: true, message: "Không tìm thấy mã cơ sở.", type: "error" });
      setTimeout(() => setToast({ show: false, message: "", type: "success" }), 2500);
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      const res = await DashBoardAPI.facilityDashboard(userInfo.facilityId);
      console.log("API Response:", res);
      if (JSON.stringify(res) !== JSON.stringify(dashboardData)) {
        setDashboardData(res);
        setToast({ show: true, message: "Cập nhật dữ liệu dashboard thành công", type: "success" });
        setTimeout(() => setToast({ show: false, message: "", type: "success" }), 2500);
      }
    } catch (err: any) {
      setError(err.message || "Không thể tải dữ liệu dashboard.");
      setToast({ show: true, message: err.message || "Tải dữ liệu dashboard thất bại", type: "error" });
      setTimeout(() => setToast({ show: false, message: "", type: "success" }), 2500);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    pollingIntervalRef.current = setInterval(fetchDashboardData, 30000);
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Dữ liệu cho biểu đồ tròn, chỉ lấy paid và completed
  const pieData = dashboardData?.appointmentStats
    ? [
        { type: "Đã thanh toán", value: dashboardData.appointmentStats.paid || 0 },
        { type: "Hoàn thành", value: dashboardData.appointmentStats.completed || 0 },
      ].filter((item) => item.value > 0)
    : [];

  const pieConfig = {
    data: pieData,
    angleField: "value",
    colorField: "type",
    radius: 0.8,
    label: {
      type: "inner",
      offset: "-30%",
      content: ({ percent }: any) => `${(percent * 100).toFixed(0)}%`,
      style: { fontSize: 14, textAlign: "center" },
    },
    interactions: [{ type: "element-active" }],
    color: ["#4BC0C0", "#4CAF50"],
  };

  if (loading && !dashboardData) {
    return (
      <div className="p-6 max-w-6xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="animate-pulse space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, idx) => (
              <div key={idx} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast.show && (
        <div
          className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded shadow-lg text-white font-semibold transition ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="p-6 max-w-6xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Home className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Bác sĩ - Thống kê cuộc hẹn</h1>
              <p className="text-gray-600 mt-1">Tổng quan thống kê và thông tin cơ sở</p>
            </div>
          </div>
          <Button
            onClick={fetchDashboardData}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            loading={loading}
          >
            <RefreshCcw className="w-4 h-4" />
            Làm mới
          </Button>
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Card className="bg-blue-50 border-blue-200">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <div className="w-6 h-6 bg-blue-600 rounded-full"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-600">Tổng vaccine cơ sở</p>
                  <p className="text-2xl font-bold text-blue-900">{dashboardData?.totalFacilityVaccines || 0}</p>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card className="bg-green-50 border-green-200">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <div className="w-6 h-6 bg-green-600 rounded-full"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-600">Số gói đã bán</p>
                  <p className="text-2xl font-bold text-green-900">{dashboardData?.totalOrders || 0}</p>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card className="bg-orange-50 border-orange-200">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <div className="w-6 h-6 bg-orange-600 rounded-full"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-orange-600">Tổng vaccine trong gói</p>
                  <p className="text-2xl font-bold text-orange-900">{dashboardData?.totalPackageVaccines || 0}</p>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card className="bg-teal-50 border-teal-200">
              <div className="flex items-center">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <div className="w-6 h-6 bg-teal-600 rounded-full"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-teal-600">Doanh thu đã thanh toán</p>
                  <p className="text-2xl font-bold text-teal-900">
                    {(dashboardData?.revenueStats?.paidRevenue || 0).toLocaleString("vi-VN")} VNĐ
                  </p>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card className="bg-indigo-50 border-indigo-200">
              <div className="flex items-center">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <div className="w-6 h-6 bg-indigo-600 rounded-full"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-indigo-600">Tổng nhân viên</p>
                  <p className="text-2xl font-bold text-indigo-900">{dashboardData?.staffCounts?.totalStaffs || 0}</p>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card className="bg-cyan-50 border-cyan-200">
              <div className="flex items-center">
                <div className="p-2 bg-cyan-100 rounded-lg">
                  <div className="w-6 h-6 bg-cyan-600 rounded-full"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-cyan-600">Tổng bác sĩ</p>
                  <p className="text-2xl font-bold text-cyan-900">{dashboardData?.staffCounts?.totalDoctors || 0}</p>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      <div className="p-6 max-w-6xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <BarChart className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Thống kê cuộc hẹn</h2>
        </div>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card className="bg-gray-50 border-gray-200">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">
                  Tổng số cuộc hẹn: <span className="font-bold text-gray-900">{dashboardData?.appointmentStats?.totalAppointments || 0}</span>
                </p>
                <p className="text-sm font-medium text-gray-600">
                  Cuộc hẹn gói: <span className="font-bold text-gray-900">{dashboardData?.appointmentStats?.packageAppointments || 0}</span>
                </p>
                <p className="text-sm font-medium text-gray-600">
                  Cuộc hẹn lẻ: <span className="font-bold text-gray-900">{dashboardData?.appointmentStats?.individualAppointments || 0}</span>
                </p>
                <p className="text-sm font-medium text-gray-600">
                  Số trẻ em được tiêm: <span className="font-bold text-gray-900">{dashboardData?.appointmentStats?.uniqueChildrenVaccinated || 0}</span>
                </p>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card className="bg-gray-50 border-gray-200">
              {pieData.length > 0 ? (
                <Pie {...pieConfig} />
              ) : (
                <p className="text-center text-gray-500">Hiện chưa có lịch tiêm nào.</p>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default DoctorAppointment;