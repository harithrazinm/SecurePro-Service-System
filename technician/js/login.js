const API_BASE =
    "http://localhost:5001/api";


const existingToken =
    localStorage.getItem(
        "securepro_technician_token"
    );


if (existingToken) {

    window.location.href =
        "dashboard.html";

}


function showError(message) {

    const error =
        document.querySelector(
            "#loginError"
        );

    error.textContent =
        message ||
        "Unable to sign in.";

    error.hidden = false;

}


function hideError() {

    const error =
        document.querySelector(
            "#loginError"
        );

    error.textContent = "";

    error.hidden = true;

}


document.querySelector(
    "#loginForm"
).addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        hideError();


        const email =
            document.querySelector(
                "#email"
            ).value.trim();


        const password =
            document.querySelector(
                "#password"
            ).value;


        const button =
            document.querySelector(
                "#loginButton"
            );


        button.disabled = true;

        button.textContent =
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
                    "Invalid email or password."
                );

            }


            const user =
                result.data?.user;


            if (
                !user ||
                user.role !==
                    "technician"
            ) {

                throw new Error(
                    "This account is not a technician account."
                );

            }


            localStorage.setItem(
                "securepro_technician_token",
                result.data.token
            );


            localStorage.setItem(
                "securepro_technician_user",
                JSON.stringify(user)
            );


            window.location.href =
                "dashboard.html";


        } catch (error) {

            console.error(
                "Technician login error:",
                error
            );


            showError(
                error.message
            );


            button.disabled =
                false;

            button.textContent =
                "Sign In";

        }

    }
);
