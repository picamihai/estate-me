const authService = require("../services/authService");

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                error: "Username and password required",
            });
        }

        const result = await authService.login(username, password);

        if (!result) {
            return res.status(401).json({
                error: "Invalid credentials",
            });
        }

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Server error",
        });
    }
};

exports.verifyLogin = async (req, res) => {
    try {
        const { loginSessionId, code } = req.body;

        if (!loginSessionId || !code) {
            return res.status(400).json({
                error: "Session id and code required",
            });
        }

        const result = await authService.verifyLoginCode(loginSessionId, code);

        if (!result) {
            return res.status(401).json({
                error: "Invalid or expired verification code",
            });
        }

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Server error",
        });
    }
};

exports.register = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                error: "Username and password required",
            });
        }

        if (username.trim().length < 3) {
            return res.status(400).json({
                error: "Username must be at least 3 characters",
            });
        }

        if (password.length < 4) {
            return res.status(400).json({
                error: "Password must be at least 4 characters",
            });
        }

        const result = await authService.register(username, password);

        if (result.error) {
            return res.status(400).json({
                error: result.error,
            });
        }

        res.status(201).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Server error",
        });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({
                error: "Username required",
            });
        }

        const result = await authService.forgotPassword(username);

        if (result.error) {
            return res.status(404).json({
                error: result.error,
            });
        }

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Server error",
        });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { username, code, newPassword } = req.body;

        if (!username || !code || !newPassword) {
            return res.status(400).json({
                error: "Username, code and new password required",
            });
        }

        if (newPassword.length < 4) {
            return res.status(400).json({
                error: "Password must be at least 4 characters",
            });
        }

        const result = await authService.resetPassword(username, code, newPassword);

        if (result.error) {
            return res.status(400).json({
                error: result.error,
            });
        }

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Server error",
        });
    }
};