import { Route, Routes } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import PageTransition from "./components/layout/PageTransition";
import DecisionPage from "./pages/DecisionPage";
import DecisionsPage from "./pages/DecisionsPage";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route element={<PageTransition />}>
          <Route path="/" element={<DecisionsPage />} />
          <Route path="/decisions/:id" element={<DecisionPage />} />
          <Route path="*" element={<DecisionsPage />} />
        </Route>
      </Routes>
    </AppShell>
  );
}