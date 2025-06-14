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

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/staff" element={<StaffLayout />}>
          <Route path="dashboard" element={<TodaySchedule />} />
          <Route path="appointments/:id" >
              <Route path="step-1" element={<VaccinationDetailPage />} />
              <Route path="step-2" element={<HealthSurvey />} />
              <Route path="step-3" element={<Payment />} />
              <Route path="step-4" element={<ConfirmVaccination />} />
                <Route path="step-5" element={<FinishVaccination />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
