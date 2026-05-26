const logService = require("../services/logService");

exports.getLogs = async (req, res) => {
    try {
        const logs = await logService.getLogs();
        res.json(logs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.getObservationList = async (req, res) => {
    try {
        const observations = await logService.getObservationList();
        res.json(observations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.resolveObservation = async (req, res) => {
    try {
        const updated = await logService.resolveObservation(req.params.id);
        res.json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};