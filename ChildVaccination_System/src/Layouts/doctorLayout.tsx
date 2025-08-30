import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { getUserInfo, removeItem } from "@/lib/storage";
import { facilityApi, type GetByIdFacilitiesResponse } from "@/api/vaccinationFacilitiesApi";
import { LogOut, User } from "lucide-react";

export default function DoctorLayout() {
  const navigate = useNavigate();
  const user = getUserInfo();
  const userName = user?.fullName || "";
  const [facilityName, setFacilityName] = useState<string>("Unknown Facility");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFacilityName = async () => {
      if (!user?.facilityId) {
        setError("Không tìm thấy mã cơ sở.");
        setFacilityName("Unknown Facility");
        return;
      }

      setLoading(true);
      try {
        const response: GetByIdFacilitiesResponse = await facilityApi.getById(user.facilityId);
        if (response.success && response.data) {
          setFacilityName(response.data.facilityName);
        } else {
          setError(response.message || "Không thể tải thông tin cơ sở.");
          setFacilityName("Unknown Facility");
        }
      } catch (err: any) {
        setError(err.message || "Lỗi không xác định khi tải thông tin cơ sở.");
        setFacilityName("Unknown Facility");
      } finally {
        setLoading(false);
      }
    };

    fetchFacilityName();
  }, [user?.facilityId]);

  const handleLogout = () => {
    removeItem("accessToken");
    removeItem("userInfo");
    navigate("/login");
  };

  const handleAccountManagement = () => {
    navigate("/doctor/account");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-teal-50 p-6">
      <main className="flex-1">
        {/* Top Navbar */}
        <header className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-md">
          <h1 className="text-xl font-semibold text-indigo-900">
            Cơ sở y tế: {loading ? "Loading..." : facilityName} 
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700 font-medium hidden sm:block">Dr. {userName}</span>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
              onClick={handleAccountManagement}
            >
              <User className="w-4 h-4 inline-block mr-2" />
              Quản lý profile
            </button>
            <button
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 inline-block mr-2" />
              Đăng xuất
            </button>
          </div>
        </header>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg flex items-center gap-3 mb-6">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01M12 17h.01M12 3C7.029 3 3 7.029 3 12s4.029 9 9 9 9-4.029 9-9-4.029-9-9-9z"
              />
            </svg>
            <span className="text-sm">{error}</span>
          </div>
        )}

        <Outlet />
      </main>
    </div>
  );
}