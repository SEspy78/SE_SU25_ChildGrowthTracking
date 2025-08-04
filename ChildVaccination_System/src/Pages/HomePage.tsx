// import FeaturesSection from "@/Components/Features";
// import Footer from "@/Components/Footer";
// import Header from "@/Components/Header";
// import HeroSection from "@/Components/HeroSection";



// const HomePage: React.FC = () => (
//   <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200">
//     <Header />
//     <HeroSection/>
//     <FeaturesSection/>
//     <Footer/>
//   </div>
// );

// export default HomePage;

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FeaturesSection from "@/Components/Features";
import Footer from "@/Components/Footer";
import Header from "@/Components/Header";
import HeroSection from "@/Components/HeroSection";
import { useAuth } from "@/Hooks/useAuth";

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "Admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (user.role === "FacilityStaff") {
        if (user.position === "Doctor") {
          navigate("/doctor/appointments", { replace: true });
        } else if (user.position === "Manager") {
          navigate("/manager/staffs-management", { replace: true });
        } else if (user.position === "Staff") {
          navigate("/staff/appointments", { replace: true });
        }
      }
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200">
      <Header />
      <HeroSection/>
      <FeaturesSection/>
      <Footer/>
    </div>
  );
};

export default HomePage;