const getRequiredEnv = (name) => {
    const value = process.env[name];

    if (!value) {
        throw new Error(`${name} is missing`);
    }

    return value;
};

const getOptionalEnv = (name, fallback) => {
    return process.env[name] || fallback;
};

module.exports = {
    getRequiredEnv,
    getOptionalEnv,
};