const API_BASE = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? "http://localhost:5001/api" : "/api";
const destinations = {
  admin: { token: "securepro_admin_token", user: "securepro_admin_user", path: "admin/dashboard.html" },
  super_admin: { token: "securepro_super_admin_token", user: "securepro_super_admin_user", path: "super-admin/dashboard.html" },
  technician: { token: "securepro_technician_token", user: "securepro_technician_user", path: "technician/dashboard.html" }
};

const form = document.querySelector("#loginForm");
const button = document.querySelector("#loginButton");
const errorBox = document.querySelector("#loginError");

form.addEventListener("submit", async event => {
  event.preventDefault();
  errorBox.hidden = true;
  button.disabled = true;
  button.querySelector("span").textContent = "Signing in…";

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: document.querySelector("#email").value.trim(),
        password: document.querySelector("#password").value
      })
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || "Unable to sign in.");

    const session = destinations[result.data?.user?.role];
    if (!session) throw new Error("This account does not have a supported staff role.");

    localStorage.setItem(session.token, result.data.token);
    localStorage.setItem(session.user, JSON.stringify(result.data.user));
    location.href = session.path;
  } catch (error) {
    errorBox.textContent = error.message || "Unable to sign in.";
    errorBox.hidden = false;
    button.disabled = false;
    button.querySelector("span").textContent = "Sign in";
  }
});
