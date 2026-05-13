import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientTable } from "@/features/people/client-table";
import { EmployeeTable } from "@/features/people/employee-table";
import { API_BASE_URL } from "@/lib/api";

type DashboardPageProps = {
  onLoggedOut: () => void;
};

export const DashboardPage = ({ onLoggedOut }: DashboardPageProps) => {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const performLogout = async () => {
    setIsLoggingOut(true);
    setLogoutError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/sign-out`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        setLogoutError(
          "Logout failed on server, but local session was cleared.",
        );
      }
    } catch {
      setLogoutError("Logout request failed, but local session was cleared.");
    } finally {
      onLoggedOut();
      void navigate("/login", { replace: true });
    }
  };

  return (
    <main className="min-h-screen bg-background p-4 text-foreground">
      <div className="mx-auto grid w-full max-w-7xl gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Scheduler Dashboard</CardTitle>
            <Button
              type="button"
              variant="outline"
              onClick={() => void performLogout()}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "Logging out..." : "Log out"}
            </Button>
          </CardHeader>
          <CardContent>
            {logoutError ? (
              <p className="text-sm text-destructive">{logoutError}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Manage clients and employees.
              </p>
            )}
          </CardContent>
        </Card>

        <ClientTable />
        <EmployeeTable />
      </div>
    </main>
  );
};
