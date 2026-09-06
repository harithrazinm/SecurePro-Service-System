//const API_BASE = "https://securepro-service-system.onrender.com/api";

const API_BASE = "http://localhost:5001/api";
const form = document.querySelector("#loginForm");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const button = document.querySelector("#loginButton");
const errorBox = document.querySelector("#loginError");

form.addEventListener("submit", async event => {
    event.preventDefault();
    errorBox.hidden = true;

    button.disabled = true;
    button.firstChild.textContent = "Signing in... ";

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: emailInput.value.trim(),
                password: passwordInput.value
            })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Unable to sign in.");
        }

        if (result.data?.user?.role !== "super_admin") {
            throw new Error("Super Admin access required.");
        }

        localStorage.setItem("securepro_super_admin_token", result.data.token);
        localStorage.setItem("securepro_super_admin_user", JSON.stringify(result.data.user));

        window.location.href = "dashboard.html";
    } catch (error) {
        errorBox.textContent = error.message || "Unable to sign in.";
        errorBox.hidden = false;
        button.disabled = false;
        button.firstChild.textContent = "Sign In ";
    }
});
