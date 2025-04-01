
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { GDProvider } from "@/context/GDContext";
import Navbar from "@/components/layout/Navbar";

// Pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import Profile from "./pages/Profile";
import CreateSession from "./pages/CreateSession";
import SessionDetails from "./pages/SessionDetails";
import EvaluateSession from "./pages/EvaluateSession";
import SessionResults from "./pages/SessionResults";
import Analytics from "./pages/Analytics";
import ExportReports from "./pages/ExportReports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// ProtectedRoute component to handle auth checks
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

// InstructorRoute component to restrict access to instructors only
const InstructorRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!user || user.role !== "instructor") {
    return <Navigate to="/dashboard" />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    
    {/* Protected Routes */}
    <Route path="/dashboard" element={
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    } />
    
    <Route path="/profile" element={
      <ProtectedRoute>
        <Profile />
      </ProtectedRoute>
    } />
    
    <Route path="/create-session" element={
      <InstructorRoute>
        <CreateSession />
      </InstructorRoute>
    } />
    
    <Route path="/session/:id" element={
      <ProtectedRoute>
        <SessionDetails />
      </ProtectedRoute>
    } />
    
    <Route path="/session/:id/evaluate" element={
      <ProtectedRoute>
        <EvaluateSession />
      </ProtectedRoute>
    } />
    
    <Route path="/session/:id/results" element={
      <InstructorRoute>
        <SessionResults />
      </InstructorRoute>
    } />
    
    <Route path="/analytics" element={
      <InstructorRoute>
        <Analytics />
      </InstructorRoute>
    } />
    
    <Route path="/export-reports" element={
      <InstructorRoute>
        <ExportReports />
      </InstructorRoute>
    } />
    
    {/* 404 Route */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <GDProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">
                <AppRoutes />
              </main>
            </div>
          </BrowserRouter>
        </GDProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
