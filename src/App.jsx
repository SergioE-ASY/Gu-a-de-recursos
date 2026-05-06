import { Navigate, Route, Routes } from "react-router-dom";
import PublicMapPage from "./pages/PublicMapPage";
import AdminPortalPage from "./pages/AdminPortalPage";
import InternalPeopleGuidePage from "./pages/InternalPeopleGuidePage";
import InternalMapPage from "./pages/InternalMapPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicMapPage />} />
      <Route path="/admin" element={<AdminPortalPage />} />
      <Route path="/admin/internal-guide" element={<InternalPeopleGuidePage />} />
      <Route path="/admin/internal-map" element={<InternalMapPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
