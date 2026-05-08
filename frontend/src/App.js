import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider, ProtectedRoute, PublicOnlyRoute } from "./lib/auth";

import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/app/Dashboard";
import Profile from "./pages/app/Profile";
import AccountSetup from "./pages/onboarding/AccountSetup";
import BecomeSeller from "./pages/onboarding/BecomeSeller";
import SellerUpi from "./pages/onboarding/SellerUpi";
import SellerStatus from "./pages/onboarding/SellerStatus";

import Terms from "./pages/legal/Terms";
import Privacy from "./pages/legal/Privacy";
import Refund from "./pages/legal/Refund";
import Grievance from "./pages/legal/Grievance";
import Cookies from "./pages/legal/Cookies";
import About from "./pages/company/About";
import Contact from "./pages/company/Contact";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />

            {/* Auth */}
            <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />

            {/* Authed */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/seller" element={<ProtectedRoute><SellerStatus /></ProtectedRoute>} />
            <Route path="/onboarding/account" element={<ProtectedRoute><AccountSetup /></ProtectedRoute>} />
            <Route path="/onboarding/become-seller" element={<ProtectedRoute><BecomeSeller /></ProtectedRoute>} />
            <Route path="/onboarding/upi" element={<ProtectedRoute><SellerUpi /></ProtectedRoute>} />
            <Route path="/onboarding/status" element={<ProtectedRoute><SellerStatus /></ProtectedRoute>} />

            {/* Legal + company */}
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/refund" element={<Refund />} />
            <Route path="/grievance" element={<Grievance />} />
            <Route path="/cookies" element={<Cookies />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
