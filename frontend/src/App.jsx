import { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Signup from './pages/Signup';
import VerifyOtp from './pages/VerifyOtp';
import Login from './pages/Login';
import Bikes from './pages/Bikes';
import { Bike, LogOut } from 'lucide-react';

// 🔒 1. Protected Route Helper
// This component checks if the user is logged in. If not, it redirects them to /login.
const ProtectedRoute = ({ children }) => {
  const { token } = useContext(AuthContext);
  return token ? children : <Navigate to="/login" replace />;
};

// 🏠 2. Dashboard/Home Screen
export const Dashboard = () => {
  const { user, logoutUser } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-md text-center">
        <div className="bg-emerald-500 p-4 rounded-full w-fit mx-auto mb-4">
          <Bike className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">BikeGo Dashboard</h1>
        <p className="text-slate-400 mt-2">Welcome back, <span className="text-emerald-400 font-semibold">{user?.username || 'Renter'}</span>!</p>
        
        <div className="mt-8 border-t border-slate-700 pt-6">
          <p className="text-sm text-slate-400">Email: {user?.email || 'N/A'}</p>
          <p className="text-xs text-slate-500 mt-1">Status: Account Verified ✅</p>
        </div>

        <button
          onClick={logoutUser}
          className="mt-8 w-full bg-red-500/10 border border-red-500/30 hover:bg-red-500 hover:text-white text-red-300 font-bold py-3 rounded-xl transition duration-200 flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
};

// 🌐 3. Main App component managing Routers
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoute><Bikes /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
