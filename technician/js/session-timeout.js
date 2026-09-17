/*
 * ======================================================
 * SECUREPRO TECHNICIAN — 15 MINUTE INACTIVITY TIMEOUT
 * ======================================================
 */

(function () {

    "use strict";


    const INACTIVITY_LIMIT =
        15 * 60 * 1000;


    const TOKEN_KEY =
        "securepro_technician_token";


    const USER_KEY =
        "securepro_technician_user";


    const LOGIN_PAGE =
        "login.html";


    // ==============================================
    // CHECK LOGIN
    // ==============================================

    const token =
        localStorage.getItem(TOKEN_KEY);


    if (!token) {
        return;
    }


    // ==============================================
    // TIMER
    // ==============================================

    let inactivityTimer;


    function resetTimer() {

        clearTimeout(
            inactivityTimer
        );


        inactivityTimer =
            setTimeout(
                logout,
                INACTIVITY_LIMIT
            );

    }


    // ==============================================
    // LOGOUT
    // ==============================================

    function logout() {

        clearTimeout(
            inactivityTimer
        );


        localStorage.removeItem(
            TOKEN_KEY
        );


        localStorage.removeItem(
            USER_KEY
        );


        window.location.replace(
            LOGIN_PAGE
        );

    }


    // ==============================================
    // USER ACTIVITY
    // ==============================================

    const events = [
        "click",
        "mousemove",
        "mousedown",
        "keydown",
        "scroll",
        "touchstart",
        "touchmove"
    ];


    events.forEach(
        eventName => {

            document.addEventListener(
                eventName,
                resetTimer,
                {
                    passive: true
                }
            );

        }
    );


    // ==============================================
    // START
    // ==============================================

    resetTimer();


})();