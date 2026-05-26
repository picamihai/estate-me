import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getAll,
  add,
  remove,
  update,
  getById,
  getStats,
} from "../services/propertyService";

const mockProperties = [
  {
    id: "1",
    title: "A",
    description: "",
    price: 100,
    location: "X",
    status: "AVAILABLE",
  },
  {
    id: "2",
    title: "B",
    description: "",
    price: 200,
    location: "Y",
    status: "SOLD",
  },
];

beforeEach(() => {
  vi.clearAllMocks();

  const store = {
    token: "fake-token",
    user: JSON.stringify({
      id: "admin-id",
      username: "admin",
      role: "ADMIN",
      permissions: [
        "CREATE_PROPERTY",
        "READ_PROPERTY",
        "UPDATE_PROPERTY",
        "DELETE_PROPERTY",
      ],
    }),
  };

  vi.stubGlobal("localStorage", {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
  });

  vi.stubGlobal(
      "fetch",
      vi.fn(async (_url, options) => {
        const body = JSON.parse(options.body);
        const query = body.query;

        if (query.includes("properties(page:")) {
          return {
            json: async () => ({
              data: {
                properties: mockProperties,
              },
            }),
          };
        }

        if (query.includes("property(id:")) {
          return {
            json: async () => ({
              data: {
                property: mockProperties[0],
              },
            }),
          };
        }

        if (query.includes("addProperty")) {
          return {
            json: async () => ({
              data: {
                addProperty: {
                  id: "999",
                  title: body.variables.title,
                  description: body.variables.description,
                  price: body.variables.price,
                  location: body.variables.location,
                  status: body.variables.status || "AVAILABLE",
                },
              },
            }),
          };
        }

        if (query.includes("updateProperty")) {
          return {
            json: async () => ({
              data: {
                updateProperty: {
                  id: body.variables.id,
                  title: body.variables.title,
                  description: body.variables.description,
                  price: body.variables.price,
                  location: body.variables.location,
                  status: body.variables.status,
                },
              },
            }),
          };
        }

        if (query.includes("deleteProperty")) {
          return {
            json: async () => ({
              data: {
                deleteProperty: "Deleted",
              },
            }),
          };
        }

        if (query.includes("stats")) {
          return {
            json: async () => ({
              data: {
                stats: {
                  total: 2,
                  totalValue: 300,
                  average: 150,
                  available: 1,
                  sold: 1,
                },
              },
            }),
          };
        }

        return {
          json: async () => ({
            errors: [{ message: "Unknown query" }],
          }),
        };
      })
  );
});

describe("Property Service GraphQL API", () => {
  it("should return all properties", async () => {
    const result = await getAll();

    expect(result.data.length).toBe(2);
    expect(result.data[0].title).toBe("A");
    expect(result.data[1].title).toBe("B");
  });

  it("should get property by id", async () => {
    const property = await getById("1");

    expect(property.id).toBe("1");
    expect(property.title).toBe("A");
  });

  it("should add a property", async () => {
    const created = await add({
      title: "New",
      description: "",
      price: 300,
      location: "Z",
      status: "AVAILABLE",
    });

    expect(created.id).toBe("999");
    expect(created.title).toBe("New");
    expect(created.price).toBe(300);
    expect(created.location).toBe("Z");
  });

  it("should update a property", async () => {
    const updated = await update({
      id: "2",
      title: "Updated",
      description: "",
      price: 999,
      location: "Y",
      status: "SOLD",
    });

    expect(updated.id).toBe("2");
    expect(updated.title).toBe("Updated");
    expect(updated.price).toBe(999);
  });

  it("should delete a property", async () => {
    await expect(remove("1")).resolves.toBeUndefined();

    expect(fetch).toHaveBeenCalled();
  });

  it("should get statistics", async () => {
    const stats = await getStats();

    expect(stats.total).toBe(2);
    expect(stats.totalValue).toBe(300);
    expect(stats.average).toBe(150);
    expect(stats.available).toBe(1);
    expect(stats.sold).toBe(1);
  });

  it("should throw when GraphQL returns errors", async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({
        errors: [{ message: "GraphQL failed" }],
      }),
    });

    await expect(getAll()).rejects.toThrow("GraphQL failed");
  });
});