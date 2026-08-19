const API_BASE =
    "http://localhost:5001/api";


const form =
    document.querySelector("#loginForm");


const emailInput =
    document.querySelector("#email");


const passwordInput =
    document.querySelector("#password");


const button =
    document.querySelector("#loginButton");


const errorBox =
    document.querySelector("#loginError");


function showError(message) {

    errorBox.textContent =
        message;

    errorBox.hidden = false;

}


function hideError() {

    errorBox.textContent = "";

    errorBox.hidden = true;

}


form.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        hideError();


        const email =
            emailInput.value.trim();

        const password =
            passwordInput.value;


        button.classList.add(
            "loading"
        );

        button.querySelector(
            "span"
        ).textContent =
            "Signing in...";


        try {

            const response =
                await fetch(
                    `${API_BASE}/auth/login`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                email,
                                password
                            })
                    }
                );


            const result =
                await response.json();


            if (
                !response.ok ||
                !result.success
            ) {

                throw new Error(
                    result.message ||
                    "Unable to sign in."
                );

            }


            /*
             * Make sure the account
             * is actually an administrator.
             */

            if (
                !result.data ||
                !result.data.user ||
                result.data.user.role !==
                    "admin"
            ) {

                throw new Error(
                    "Administrator access required."
                );

            }


            /*
             * Store authentication.
             */

            localStorage.setItem(
                "securepro_admin_token",
                result.data.token
            );


            localStorage.setItem(
                "securepro_admin_user",
                JSON.stringify(
                    result.data.user
                )
            );


            /*
             * Open dashboard.
             */

            window.location.href =
                "dashboard.html";


        } catch (error) {

            console.error(
                "Admin login error:",
                error
            );


            showError(
                error.message ||
                "Unable to sign in."
            );


            button.classList.remove(
                "loading"
            );


            button.querySelector(
                "span"
            ).textContent =
                "Sign In";

        }

    }
);
