import { useEffect, useState } from "react";

import { Header } from "./components/Header";
import { ChatToggle } from "./components/ChatToggle";
import { useAuth } from "./hooks/useAuth";
import { DashboardPage } from "./pages/DashboardPage";
import { HomePage } from "./pages/HomePage";
import { ProjectsPage } from "./pages/ProjectsPage";

export default function App() {
  const auth = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (path === currentPath) return;
    window.history.pushState({}, "", path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="app-shell">
      <Header {...auth} currentPath={currentPath} onNavigate={navigate} />
      {auth.error && (
        <p className="auth-notice" role="status">
          {auth.error}
        </p>
      )}
      {currentPath === "/dashboard" ? (
        <DashboardPage user={auth.user} authIsLoading={auth.isLoading} />
      ) : currentPath === "/projects" ? (
        <ProjectsPage />
      ) : (
        <HomePage user={auth.user} />
      )}
      <ChatToggle user={auth.user} />
    </div>
  );
}
