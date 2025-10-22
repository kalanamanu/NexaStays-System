"use strict";

/**
 * Minimal JSON 404 and error handlers for Express.
 * Place this file at: backend/middleware/errorHandler.js
 */

function notFoundHandler(req, res, next) {
    res.status(404).json({ success: false, error: "Not Found" });
}

function errorHandler(err, req, res, next) {
    // eslint-disable-next-line no-console
    console.error(err && err.stack ? err.stack : err);
    const status = err && err.status ? err.status : 500;
    const message = err && err.message ? err.message : "Internal Server Error";
    res.status(status).json({ success: false, error: message });
}

module.exports = { notFoundHandler, errorHandler };