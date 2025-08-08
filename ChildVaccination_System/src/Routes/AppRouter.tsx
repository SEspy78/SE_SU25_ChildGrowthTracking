// import React from "react";
// import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
// import HomePage from "@/Pages/HomePage";
// import LoginPage from "@/Pages/LoginPage";
// import RegisterPage from "@/Pages/Register";
// import StaffLayout from "@/Layouts/staffLayout";
// import TodaySchedule from "@/Pages/Staff/dashBoardStaff";
// import VaccinationDetailPage from "@/Pages/Staff/vaccinationDetail";
// import HealthSurvey from "@/Pages/Staff/healthSurvey";
// import Payment from "@/Pages/Staff/payment";
// import ConfirmVaccination from "@/Pages/Staff/confirmVaccination";
// import DoctorLayout from "@/Layouts/doctorLayout";
// import ProtectedRoute from "./ProtectedRoute";
// import AdminLayout from "@/Layouts/adminLayout";
// import VaccineManagement from "@/Pages/Admin/vaccineManagePage";
// import ManagerLayout from "@/Layouts/mangerLayout";
// import FacilityManagement from "@/Pages/Admin/facilitiesManagement";
// import FacilityDetail from "@/Pages/Manager/facilityMangement";
// import FacilityVaccinePage from "@/Pages/Manager/facilityVaccinesManagement";
// import VaccinePackageManagement from "@/Pages/Manager/vaccinePackageManagement";
// import MemberManagement from "@/Pages/Admin/memberManagement";
// import ScheduleSlotPage from "@/Pages/Manager/scheduleSlot";
// import SurveyManagement from "@/Pages/Manager/surveyManagement";
// import DoctorConfirmVaccination from "@/Pages/Doctor/doctorVaccination";
// import CompletedVaccinationInfo from "@/Pages/Staff/finishVaccination";


// const App: React.FC = () => {
//   return (
//     <Router>
//   <Routes>
//     <Route path="/" element={<HomePage />} />
//     <Route path="/login" element={<LoginPage />} />
//     <Route path="/register" element={<RegisterPage />} />

//     {/* Staff */}
//     <Route
//       path="/staff"
//       element={
//         <ProtectedRoute allowedRoles={["FacilityStaff"]} allowedPositions={["Staff"]}>
//           <StaffLayout />
//         </ProtectedRoute>
//       }
//     >
//       <Route path="appointments" element={<TodaySchedule />} />
//       <Route path="appointments/:id/step-1" element={<VaccinationDetailPage />} />
//       <Route path="appointments/:id/step-2" element={<HealthSurvey />} />
//       <Route path="appointments/:id/step-3" element={<Payment />} />
//       <Route path="appointments/:id/step-4" element={<ConfirmVaccination />} />
//     </Route>

//     {/* Doctor */}
//     <Route
//       path="/doctor"
//       element={
//         <ProtectedRoute allowedRoles={["FacilityStaff"]} allowedPositions={["Doctor"]}>
//           <DoctorLayout />
//         </ProtectedRoute>
//       }
//     >
//       <Route path="appointments" element={<TodaySchedule />} />
//       <Route path="appointments/:id/step-1" element={<VaccinationDetailPage />} />
//       <Route path="appointments/:id/step-2" element={<HealthSurvey />} />
//       <Route path="appointments/:id/step-3" element={<Payment />} />
//       <Route path="appointments/:id/step-4" element={<DoctorConfirmVaccination />} />
//        <Route path="appointments/:id/finish" element={<CompletedVaccinationInfo />} />
//     </Route>
//     {/* Doctor */}


//     {/* Admin */}
//     <Route path="/admin" element={
//     <ProtectedRoute allowedRoles={["Admin"]}>
//       <AdminLayout />
//     </ProtectedRoute>
//   }>
//     <Route path="dashboard" element={<TodaySchedule />} />
//     <Route path="members" element={<MemberManagement />} />
//     <Route path="vaccines" element={<VaccineManagement />} />
//     <Route path="facilities" element={<FacilityManagement />} />
//     </Route>
//     {/* Admin */}


//     {/* Manager */}
//  <Route path="/manager" element={
//     <ProtectedRoute allowedRoles={["FacilityStaff"]} allowedPositions={["Manager"]}>
//       <ManagerLayout />
//     </ProtectedRoute>
//   }>
//     <Route path="survey-management" element={<SurveyManagement />} />
//     <Route path="staffs-management" element={<TodaySchedule />} />
//     <Route path="vaccines-management" element={<FacilityVaccinePage />} />
//     <Route path="facility-management" element={<FacilityDetail />} />
//     <Route path="vaccine-packages" element={<VaccinePackageManagement />} />
//     <Route path="schedule-slots" element={<ScheduleSlotPage />} />

//     </Route>
//     {/* Manager */}

//   </Routes>
// </Router>

//   );
// };

// export default App;



import React from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import HomePage from "@/Pages/HomePage";
import LoginPage from "@/Pages/LoginPage";
import RegisterPage from "@/Pages/Register";
import AuthRedirect from "@/Components/AuthReditect";
import StaffLayout from "@/Layouts/staffLayout";
import TodaySchedule from "@/Pages/Staff/dashBoardStaff";
import VaccinationDetailPage from "@/Pages/Staff/vaccinationDetail";
import HealthSurvey from "@/Pages/Staff/healthSurvey";
import Payment from "@/Pages/Staff/payment";
import ConfirmVaccination from "@/Pages/Staff/confirmVaccination";
import DoctorLayout from "@/Layouts/doctorLayout";
import ProtectedRoute from "./ProtectedRoute";
import AdminLayout from "@/Layouts/adminLayout";
import VaccineManagement from "@/Pages/Admin/vaccineManagePage";
import ManagerLayout from "@/Layouts/mangerLayout";
import FacilityManagement from "@/Pages/Admin/facilitiesManagement";
import FacilityDetail from "@/Pages/Manager/facilityMangement";
import FacilityVaccinePage from "@/Pages/Manager/facilityVaccinesManagement";
import VaccinePackageManagement from "@/Pages/Manager/vaccinePackageManagement";
import MemberManagement from "@/Pages/Admin/memberManagement";
import BlogManagement from "@/Pages/Admin/blogManagement";
import ScheduleSlotPage from "@/Pages/Manager/scheduleSlot";
import SurveyManagement from "@/Pages/Manager/surveyManagement";
import DoctorConfirmVaccination from "@/Pages/Doctor/doctorVaccination";
import CompletedVaccinationInfo from "@/Pages/Staff/finishVaccination";
import PaymentAccountManagement from "@/Pages/Manager/paymentAccount";
const App: React.FC = () => {
  return (
    <Router>
      <AuthRedirect />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

    {/* Staff */}
    <Route
      path="/staff"
      element={
        <ProtectedRoute allowedRoles={["FacilityStaff"]} allowedPositions={["Staff"]}>
          <StaffLayout />
        </ProtectedRoute>
      }
    >
      <Route path="appointments" element={<TodaySchedule />} />
      <Route path="appointments/:id/step-1" element={<VaccinationDetailPage />} />
      <Route path="appointments/:id/step-2" element={<HealthSurvey />} />
      <Route path="appointments/:id/step-3" element={<Payment />} />
      <Route path="appointments/:id/step-4" element={<ConfirmVaccination />} />
    </Route>

    {/* Doctor */}
    <Route
      path="/doctor"
      element={
        <ProtectedRoute allowedRoles={["FacilityStaff"]} allowedPositions={["Doctor"]}>
          <DoctorLayout />
        </ProtectedRoute>
      }
    >
      <Route path="appointments" element={<TodaySchedule />} />
      <Route path="appointments/:id/step-1" element={<VaccinationDetailPage />} />
      <Route path="appointments/:id/step-2" element={<HealthSurvey />} />
      <Route path="appointments/:id/step-3" element={<Payment />} />
      <Route path="appointments/:id/step-4" element={<DoctorConfirmVaccination />} />
      <Route path="appointments/:id/finish" element={<CompletedVaccinationInfo />} />
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
    <Route path="blogs" element={<BlogManagement />} />
    </Route>
    {/* Admin */}


    {/* Manager */}
 <Route path="/manager" element={
    <ProtectedRoute allowedRoles={["FacilityStaff"]} allowedPositions={["Manager"]}>
      <ManagerLayout />
    </ProtectedRoute>
  }>
    <Route path="survey-management" element={<SurveyManagement />} />
    <Route path="staffs-management" element={<TodaySchedule />} />
    <Route path="vaccines-management" element={<FacilityVaccinePage />} />
    <Route path="facility-management" element={<FacilityDetail />} />
    <Route path="vaccine-packages" element={<VaccinePackageManagement />} />
    <Route path="schedule-slots" element={<ScheduleSlotPage />} />
    <Route path="payment-accounts" element={<PaymentAccountManagement/>} />
    </Route>
    {/* Manager */}

  </Routes>
</Router>

  );
};

export default App;