import React from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import HomePage from "@/Pages/HomePage";
import LoginPage from "@/Pages/LoginPage";
import RegisterPage from "@/Pages/Register";
import StaffLayout from "@/Layouts/staffLayout";
import TodaySchedule from "@/Pages/Staff/dashBoardStaff";
import VaccinationDetailPage from "@/Pages/Staff/vaccinationDetail";
import HealthSurvey from "@/Pages/Staff/healthSurvey";
import Payment from "@/Pages/Staff/payment";
import ConfirmVaccination from "@/Pages/Staff/confirmVaccination";
import FinishVaccination from "@/Pages/Staff/finishVaccination";
import DoctorLayout from "@/Layouts/doctorLayout";
import ProtectedRoute from "./ProtectedRoute";
import AdminLayout from "@/Layouts/adminLayout";
import VaccineManagement from "@/Pages/Admin/vaccineManagePage";
import ManagerLayout from "@/Layouts/mangerLayout";
import FacilityManagement from "@/Pages/Admin/facilitiesManagement";
import StaffManagement from "@/Pages/Manager/staffManagement";
import FacilityDetail from "@/Pages/Manager/facilityMangement";
import FacilityVaccinePage from "@/Pages/Manager/facilityVaccinesManagement";
import VaccinePackageManagement from "@/Pages/Manager/vaccinePackageManagement";
import MemberManagement from "@/Pages/Admin/memberManagement";
import ScheduleSlotPage from "@/Pages/Manager/scheduleSlot";
const App: React.FC = () => {
  return (
    <Router>
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />

    {/* Staff */}
    <Route
      path="/staff"
      element={
        <ProtectedRoute allowedRoles={["Staff"]}>
          <StaffLayout />
        </ProtectedRoute>
      }
    >
      <Route path="dashboard" element={<TodaySchedule />} />
      <Route path="appointments/:id/step-1" element={<VaccinationDetailPage />} />
      <Route path="appointments/:id/step-2" element={<HealthSurvey />} />
      <Route path="appointments/:id/step-3" element={<Payment />} />
      <Route path="appointments/:id/step-4" element={<ConfirmVaccination />} />
      <Route path="appointments/:id/step-5" element={<FinishVaccination />} />
    </Route>

    {/* Doctor */}
    <Route
      path="/doctor"
      element={
        <ProtectedRoute allowedRoles={["Doctor"]}>
          <DoctorLayout />
        </ProtectedRoute>
      }
    >
      <Route path="dashboard" element={<TodaySchedule />} />
    </Route>
    {/* Doctor */}


    {/* Admin */}
    <Route path="/admin" element={
    <ProtectedRoute allowedRoles={["Admin"]}>
      <AdminLayout />
    </ProtectedRoute>
  }>
    <Route path="dashboard" element={<TodaySchedule />} />
    <Route path="members" element={<MemberManagement />} />
    <Route path="vaccines" element={<VaccineManagement />} />
    <Route path="facilities" element={<FacilityManagement />} />
    </Route>
    {/* Admin */}


    {/* Manager */}
 <Route path="/manager" element={
    <ProtectedRoute allowedRoles={["Manager"]}>
      <ManagerLayout />
    </ProtectedRoute>
  }>
    <Route path="staffs-management" element={<TodaySchedule />} />
    <Route path="vaccines-management" element={<FacilityVaccinePage />} />
    <Route path="facility-management" element={<FacilityDetail />} />
    <Route path="vaccine-packages" element={<VaccinePackageManagement />} />
    <Route path="schedule-slots" element={<ScheduleSlotPage />} />

    </Route>
    {/* Manager */}

  </Routes>
</Router>

  );
};

export default App;
