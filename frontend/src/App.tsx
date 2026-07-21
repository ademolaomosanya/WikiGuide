import { Header } from "./components/Header";
import { useAuth } from "./hooks/useAuth";
import { HomePage } from "./pages/HomePage";

export default function App() {
  const auth = useAuth();

  return (
    <div className="app-shell">
      <Header {...auth} />
      {auth.error && (
        <p className="auth-notice" role="status">
          {auth.error}
        </p>
      )}
      <HomePage />
    </div>
  );
}
