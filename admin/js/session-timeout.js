/*
 * ======================================================
 * SECUREPRO ADMIN — 15 MINUTE INACTIVITY TIMEOUT
 * ======================================================
 */

(function () {

    "use strict";


    // ==================================================
    // SETTINGS
    // ==================================================

    const INACTIVITY_LIMIT =
        15 * 60 * 1000; // 15 minutes


    const LOGIN_PAGE =
        "login.html";


    const TOKEN_KEY =
        "securepro_admin_token";


    const USER_KEY =
        "securepro_admin_user";


    // ==================================================
    // CHECK AUTHENTICATION
    // ==================================================

    const token =
        localStorage.getItem(TOKEN_KEY);


    if (!token) {

        return;

    }


    // ==================================================
    // TIMER
    // ==================================================

    let inactivityTimer = null;


    function resetInactivityTimer() {

        clearTimeout(
            inactivityTimer
        );


        inactivityTimer =
            setTimeout(
                logoutUser,
                INACTIVITY_LIMIT
            );

    }


    // ==================================================
    // AUTO LOGOUT
    // ==================================================

    function logoutUser() {

        clearTimeout(
            inactivityTimer
        );


        localStorage.removeItem(
            TOKEN_KEY
        );


        localStorage.removeItem(
            USER_KEY
        );


        // Prevent returning to protected page
        // using browser history.

        window.location.replace(
            LOGIN_PAGE
        );

    }


    // ==================================================
    // USER ACTIVITY
    // ==================================================

    const activityEvents = [
        "click",
        "mousemove",
        "mousedown",
        "keydown",
        "scroll",
        "touchstart",
        "touchmove"
    ];


    activityEvents.forEach(
        eventName => {

            document.addEventListener(
                eventName,
                resetInactivityTimer,
                {
                    passive: true
                }
            );

        }
    );


    // ==================================================
    // START TIMER
    // ==================================================

    resetInactivityTimer();


})();