import FeaturesSection from "@/Components/Features";
import Footer from "@/Components/Footer";
import Header from "@/Components/Header";
import HeroSection from "@/Components/HeroSection";



const HomePage: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200">
    <Header />
    <HeroSection/>
    <FeaturesSection/>
    <Footer/>
  </div>
);

export default HomePage;