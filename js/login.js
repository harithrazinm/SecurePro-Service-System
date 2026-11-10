const API_BASE = /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
  ? "http://localhost:5001/api"
  : "/api";
const destinations = {
  admin: { token: "securepro_admin_token", user: "securepro_admin_user", path: "admin/dashboard.html" },
  super_admin: { token: "securepro_super_admin_token", user: "securepro_super_admin_user", path: "super-admin/dashboard.html" },
  technician: { token: "securepro_technician_token", user: "securepro_technician_user", path: "technician/dashboard.html" }
};

const form = document.querySelector("#loginForm");
const button = document.querySelector("#loginButton");
const errorBox = document.querySelector("#loginError");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const rememberEmail = document.querySelector("#rememberEmail");
const SAVED_EMAIL_KEY = "securepro_login_email";

const savedEmail = localStorage.getItem(SAVED_EMAIL_KEY);
if (savedEmail) {
  emailInput.value = savedEmail;
  rememberEmail.checked = true;
}

rememberEmail.addEventListener("change", () => {
  if (!rememberEmail.checked) {
    localStorage.removeItem(SAVED_EMAIL_KEY);
    return;
  }

  const email = emailInput.value.trim();
  if (email) localStorage.setItem(SAVED_EMAIL_KEY, email);
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  const email = emailInput.value.trim();
  if (rememberEmail.checked) {
    localStorage.setItem(SAVED_EMAIL_KEY, email);
  } else {
    localStorage.removeItem(SAVED_EMAIL_KEY);
  }

  errorBox.hidden = true;
  button.disabled = true;
  button.querySelector("span").textContent = "Signing in…";

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: passwordInput.value
      })
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || "Unable to sign in.");

    const session = destinations[result.data?.user?.role];
    if (!session) throw new Error("This account does not have a supported staff role.");

    localStorage.setItem(session.token, result.data.token);
    localStorage.setItem(session.user, JSON.stringify(result.data.user));

    // Let supported browsers offer to save this sign-in in their password manager.
    if (window.PasswordCredential && navigator.credentials?.store) {
      try {
        await navigator.credentials.store(new PasswordCredential({
          id: email,
          name: email,
          password: passwordInput.value
        }));
      } catch (credentialError) {
        // Password-manager support is optional; do not interrupt a successful login.
      }
    }

    location.href = session.path;
  } catch (error) {
    errorBox.textContent = error.message || "Unable to sign in.";
    errorBox.hidden = false;
    button.disabled = false;
    button.querySelector("span").textContent = "Sign in";
  }
});
