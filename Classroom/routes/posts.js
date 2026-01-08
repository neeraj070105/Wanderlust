const express = require("express");
const router = express.Router();

// POSTS Route

// Index - posts
router.get("/", (req, res) => {
    res.send("GET for posts");
});

// SHOW - posts
router.get("/:id", (req, res) => {
    res.send("GET for posts id");
});

// POST - posts
router.post("/", (req, res) => {
    res.send("POST for users");
});

// DELETE - posts
router.delete("/:id", (req, res) => {
    res.send("DELETE for posts id");
});

module.exports = router;
