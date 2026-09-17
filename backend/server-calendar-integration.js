// ======================================================
// WORK CALENDAR ROUTES
// ======================================================

const scheduleRoutes =
    require("./routes/scheduleRoutes");

// Place this AFTER express.json()/express.urlencoded()
// and before the 404 handler.
app.use(
    "/api/schedules",
    scheduleRoutes
);
