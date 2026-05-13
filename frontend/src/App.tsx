import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "@/features/auth/login-page";
import { ProtectedRoute } from "@/features/auth/protected-route";
import { DashboardPage } from "@/features/dashboard/dashboard-page";
import { CreatePersonPage } from "@/features/people/create-person-page";
import { LoadingPage } from "@/features/shared/loading-page";
import { API_BASE_URL } from "@/lib/api";
import type { AuthStatus, SessionResponse } from "@/types/auth";

function App() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/session`, {
          credentials: "include",
        });
        const payload = (await response
          .json()
          .catch(() => null)) as SessionResponse | null;
        const hasActiveSession = response.ok && Boolean(payload?.session);
        setAuthStatus(hasActiveSession ? "authenticated" : "unauthenticated");
      } catch {
        setAuthStatus("unauthenticated");
      }
    };

    void checkSession();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            authStatus === "loading" ? (
              <LoadingPage />
            ) : (
              <Navigate
                to={authStatus === "authenticated" ? "/dashboard" : "/login"}
                replace
              />
            )
          }
        />
        <Route
          path="/login"
          element={
            authStatus === "loading" ? (
              <LoadingPage />
            ) : authStatus === "authenticated" ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginPage onSignedIn={() => setAuthStatus("authenticated")} />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute authStatus={authStatus}>
              <DashboardPage
                onLoggedOut={() => setAuthStatus("unauthenticated")}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients/new"
          element={
            <ProtectedRoute authStatus={authStatus}>
              <CreatePersonPage entityKind="clients" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees/new"
          element={
            <ProtectedRoute authStatus={authStatus}>
              <CreatePersonPage entityKind="employees" />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
