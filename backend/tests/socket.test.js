const { setIo, getIo } = require("../socket");

describe("Socket helper", () => {
    it("stores and returns io instance", () => {
        const fakeIo = {
            emit: jest.fn(),
        };

        setIo(fakeIo);

        expect(getIo()).toBe(fakeIo);
    });

    it("can replace io instance", () => {
        const firstIo = {
            emit: jest.fn(),
        };

        const secondIo = {
            emit: jest.fn(),
        };

        setIo(firstIo);
        expect(getIo()).toBe(firstIo);

        setIo(secondIo);
        expect(getIo()).toBe(secondIo);
    });
});