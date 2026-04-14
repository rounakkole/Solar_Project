import { useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import styles from "./AdminLogin.module.css";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/auth/login", { email, password });

      localStorage.setItem("token", res.data.token);

      // force reload (reliable)
      window.location.href = "/admin";

    } catch {
      setError("Invalid email or password");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>

        <h2 className={styles.title}>Admin Login</h2>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form onSubmit={handleLogin}>
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className={styles.loginBtn}>Login</button>
        </form>
      </div>
    </div>
  );
}