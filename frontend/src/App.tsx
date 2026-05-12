import { useEffect, useState } from "react";
import type { FormEvent, ReactElement } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:3000";
type AuthStatus = "loading" | "authenticated" | "unauthenticated";
type SessionResponse = {
  session?: unknown;
};
const pageClassName =
  "grid min-h-screen place-items-center bg-gray-100 p-4 text-gray-900";
const cardClassName =
  "grid w-full max-w-[420px] gap-3 rounded-xl border border-gray-300 bg-white p-5";
const headingClassName = "mb-2 text-2xl font-semibold";
const formClassName = "grid gap-3";
const labelClassName = "text-[0.95rem] font-semibold";
const inputClassName =
  "w-full rounded-lg border border-gray-400 px-3 py-2.5 text-base outline-none focus:border-blue-600";
const buttonClassName =
  "cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60";
const errorClassName = "text-[0.95rem] text-red-700";
const bodyTextClassName = "m-0";

const LoadingPage = () => (
  <main className={pageClassName}>
    <section className={cardClassName}>
      <p className={bodyTextClassName}>Checking session...</p>
    </section>
  </main>
);

const LoginPage = ({ onSignedIn }: { onSignedIn: () => void }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("test@email.com");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/sign-in`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Invalid email or password");
      }

      onSignedIn();
      void navigate("/dashboard", { replace: true });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Sign-in failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    void submitLogin(event);
  };

  return (
    <main className={pageClassName}>
      <section className={cardClassName}>
        <h1 className={headingClassName}>Login</h1>
        <form className={formClassName} onSubmit={onSubmit}>
          <label className={labelClassName} htmlFor="email">
            Email
          </label>
          <input
            className={inputClassName}
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label className={labelClassName} htmlFor="password">
            Password
          </label>
          <input
            className={inputClassName}
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {error ? <p className={errorClassName}>{error}</p> : null}

          <button
            className={buttonClassName}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
};

const DashboardPage = ({ onLoggedOut }: { onLoggedOut: () => void }) => {
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

  const onLogout = () => {
    void performLogout();
  };

  return (
    <main className={pageClassName}>
      <section className={cardClassName}>
        <h1 className={headingClassName}>Dashboard</h1>
        <p className={bodyTextClassName}>You are signed in.</p>
        {logoutError ? <p className={errorClassName}>{logoutError}</p> : null}
        <button
          className={buttonClassName}
          type="button"
          onClick={onLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? "Logging out..." : "Log out"}
        </button>
      </section>
    </main>
  );
};

const ProtectedRoute = ({
  children,
  authStatus,
}: {
  children: ReactElement;
  authStatus: AuthStatus;
}) => {
  if (authStatus === "loading") {
    return <LoadingPage />;
  }

  return authStatus === "authenticated" ? (
    children
  ) : (
    <Navigate to="/login" replace />
  );
};

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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
