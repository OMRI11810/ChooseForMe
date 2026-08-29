import { Route, Routes } from "react-router-dom";
import DecisionPage from "./pages/DecisionPage";
import DecisionsPage from "./pages/DecisionsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DecisionsPage />} />
      <Route path="/decisions/:id" element={<DecisionPage />} />
      <Route path="*" element={<DecisionsPage />} />
    </Routes>
  );
}