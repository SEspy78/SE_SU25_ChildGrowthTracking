import React from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import HomePage from "@/Pages/HomePage";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
         <Route path="/" element={<HomePage />} />
      </Routes>
    </Router>
  );
};

export default App;
