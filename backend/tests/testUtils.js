const request = require("supertest");
const app = require("../app");

async function loginAndGetToken(username, password) {
    const login = await request(app)
        .post("/auth/login")
        .send({
            username,
            password,
        });

    if (!login.body.loginSessionId || !login.body.devCode) {
        throw new Error(
            `Login failed for ${username}: ${JSON.stringify(login.body)}`
        );
    }

    const verify = await request(app)
        .post("/auth/login/verify")
        .send({
            loginSessionId: login.body.loginSessionId,
            code: login.body.devCode,
        });

    if (!verify.body.token) {
        throw new Error(
            `Verify failed for ${username}: ${JSON.stringify(verify.body)}`
        );
    }

    return verify.body.token;
}

async function getAdminToken() {
    return loginAndGetToken("admin", "admin");
}

async function getUserToken() {
    return loginAndGetToken("user", "user123");
}

module.exports = {
    getAdminToken,
    getUserToken,
};