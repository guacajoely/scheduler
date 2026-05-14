import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "@/features/auth/login-page";
import { ProtectedRoute } from "@/features/auth/protected-route";
import { DashboardPage } from "@/features/dashboard/dashboard-page";
import { ClientScheduleAssignerPage } from "@/features/people/client-schedule-assigner-page";
import { PersonDetailsPage } from "@/features/people/person-details-page";
import { PersonFormPage } from "@/features/people/person-form-page";
import { LoadingPage } from "@/features/shared/loading-page";
import type { AuthStatus } from "@/types/auth";

type AppRoutesProps = {
  authStatus: AuthStatus;
  onSignedIn: () => void;
  onLoggedOut: () => void;
};

export const AppRoutes = ({
  authStatus,
  onSignedIn,
  onLoggedOut,
}: AppRoutesProps) => {
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
              <LoginPage onSignedIn={onSignedIn} />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute authStatus={authStatus}>
              <DashboardPage onLoggedOut={onLoggedOut} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients/new"
          element={
            <ProtectedRoute authStatus={authStatus}>
              <PersonFormPage entityKind="clients" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees/new"
          element={
            <ProtectedRoute authStatus={authStatus}>
              <PersonFormPage entityKind="employees" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients/:id"
          element={
            <ProtectedRoute authStatus={authStatus}>
              <PersonDetailsPage entityKind="clients" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees/:id"
          element={
            <ProtectedRoute authStatus={authStatus}>
              <PersonDetailsPage entityKind="employees" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients/:id/edit"
          element={
            <ProtectedRoute authStatus={authStatus}>
              <PersonFormPage entityKind="clients" mode="edit" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients/:id/assign-schedule"
          element={
            <ProtectedRoute authStatus={authStatus}>
              <ClientScheduleAssignerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees/:id/edit"
          element={
            <ProtectedRoute authStatus={authStatus}>
              <PersonFormPage entityKind="employees" mode="edit" />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};
