import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import type { AuthStatus } from "@/types/auth";
import { LoadingPage } from "@/features/shared/loading-page";

type ProtectedRouteProps = {
  children: ReactElement;
  authStatus: AuthStatus;
};

export const ProtectedRoute = ({
  children,
  authStatus,
}: ProtectedRouteProps) => {
  if (authStatus === "loading") {
    return <LoadingPage />;
  }

  return authStatus === "authenticated" ? (
    children
  ) : (
    <Navigate to="/login" replace />
  );
};
