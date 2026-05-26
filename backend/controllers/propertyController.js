const service = require("../services/propertyService");
const logService = require("../services/logService");

const validate = (data) => {
    const { title, price, location } = data;

    if (!title || title.trim().length < 3) return false;

    const numericPrice = Number(price);
    if (price === undefined || Number.isNaN(numericPrice) || numericPrice < 0) {
        return false;
    }

    if (!location || location.trim().length < 2) return false;

    if (data.status && !["AVAILABLE", "SOLD"].includes(data.status)) {
        return false;
    }

    return true;
};

const mapProperty = (property) => {
    if (!property) return null;

    return {
        id: property.id,
        title: property.title,
        description: property.description,
        price: property.price,
        status: property.status,
        createdAt: property.createdAt,
        location: property.location?.city || "",
        address: property.location?.address || "",
    };
};

const getUserLogData = (req) => ({
    userId: req.user?.id,
    username: req.user?.username,
    groupId: req.user?.roleId,
    role: req.user?.role?.name,
    ipAddress: req.ip,
});

exports.getAll = async (req, res) => {
    try {
        let page = Number(req.query.page) || 0;
        let size = Number(req.query.size) || 5;

        if (page < 0) page = 0;
        if (size <= 0) size = 5;

        const filters = {
            status: req.query.status,
            location: req.query.location,
            minPrice: req.query.minPrice,
            maxPrice: req.query.maxPrice,
        };

        const result = await service.getAll(page, size, filters);

        res.json({
            data: result.map(mapProperty),
            page,
            size,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.getById = async (req, res) => {
    try {
        const item = await service.getById(req.params.id);

        if (!item) {
            return res.status(404).json({ error: "Not found" });
        }

        res.json(mapProperty(item));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.create = async (req, res) => {
    try {
        if (!validate(req.body)) {
            return res.status(400).json({ error: "Invalid data" });
        }

        const newItem = await service.create(req.body);

        await logService.logAction({
            ...getUserLogData(req),
            actionInformation: "CREATE_PROPERTY",
            resource: "Property",
            resourceId: newItem.id,
        });

        res.status(201).json(mapProperty(newItem));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.update = async (req, res) => {
    try {
        if (!validate(req.body)) {
            return res.status(400).json({ error: "Invalid data" });
        }

        const updated = await service.update(req.params.id, req.body);

        if (!updated) {
            return res.status(404).json({ error: "Not found" });
        }

        await logService.logAction({
            ...getUserLogData(req),
            actionInformation: "UPDATE_PROPERTY",
            resource: "Property",
            resourceId: updated.id,
        });

        res.json(mapProperty(updated));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.remove = async (req, res) => {
    try {
        const ok = await service.remove(req.params.id);

        if (!ok) {
            return res.status(404).json({ error: "Not found" });
        }

        await logService.logAction({
            ...getUserLogData(req),
            actionInformation: "DELETE_PROPERTY",
            resource: "Property",
            resourceId: req.params.id,
        });

        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.stats = async (req, res) => {
    try {
        const stats = await service.getStats();
        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.startGenerator = async (req, res) => {
    try {
        const success = service.startGenerator();

        if (!success) {
            return res.status(400).json({ error: "Running" });
        }

        await logService.logAction({
            ...getUserLogData(req),
            actionInformation: "START_GENERATOR",
            resource: "Generator",
        });

        res.json({ message: "Started" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.stopGenerator = async (req, res) => {
    try {
        const success = service.stopGenerator();

        if (!success) {
            return res.status(400).json({ error: "Not running" });
        }

        await logService.logAction({
            ...getUserLogData(req),
            actionInformation: "STOP_GENERATOR",
            resource: "Generator",
        });

        res.json({ message: "Stopped" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};