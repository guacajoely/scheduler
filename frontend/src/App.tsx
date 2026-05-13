import { useEffect, useState } from "react";
import { AppRoutes } from "@/app/routes";
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
    <AppRoutes
      authStatus={authStatus}
      onSignedIn={() => setAuthStatus("authenticated")}
      onLoggedOut={() => setAuthStatus("unauthenticated")}
    />
  );
}

export default App;
