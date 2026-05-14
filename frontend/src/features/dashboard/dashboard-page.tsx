import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientTable } from "@/features/people/client-table";
import { EmployeeTable } from "@/features/people/employee-table";
import { API_BASE_URL } from "@/lib/api";

type DashboardPageProps = {
  onLoggedOut: () => void;
};

export const DashboardPage = ({ onLoggedOut }: DashboardPageProps) => {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const performLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch(`${API_BASE_URL}/api/sign-out`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Navigation below still clears local auth flow.
    } finally {
      onLoggedOut();
      void navigate("/login", { replace: true });
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-foreground dark:bg-slate-950">
      <div className="mx-auto grid w-full max-w-7xl gap-4">
        <Card>
          <CardHeader className="flex min-h-16 flex-row items-center justify-between">
            <CardTitle className="font-heading text-2xl font-semibold tracking-tight">
              Scheduler Dashboard
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              onClick={() => void performLogout()}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "Logging out..." : "Log out"}
            </Button>
          </CardHeader>
        </Card>

        <ClientTable />
        <EmployeeTable />
      </div>
    </main>
  );
};
