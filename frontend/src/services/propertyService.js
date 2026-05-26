import { GRAPHQL_URL } from "../config/api";

function logoutExpiredSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
}

export async function graphqlRequest(query, variables = {}) {
    const token = localStorage.getItem("token");

    const res = await fetch(GRAPHQL_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ query, variables }),
    });

    if (res.status === 401) {
        logoutExpiredSession();
        throw new Error("Session expired. Please log in again.");
    }

    const result = await res.json();

    if (result.errors) {
        const message = result.errors[0].message;

        if (message === "Not authenticated" || message === "Invalid or expired token") {
            logoutExpiredSession();
        }

        console.error("GraphQL ERROR:", result.errors);
        throw new Error(message);
    }

    return result.data;
}

export async function getAll(page = 0, size = 5) {
    const data = await graphqlRequest(
        `
        query ($page: Int, $size: Int) {
            properties(page: $page, size: $size) {
                id
                title
                description
                price
                location
                status
            }
        }
        `,
        { page, size }
    );

    return { data: data.properties };
}

export async function getById(id) {
    const data = await graphqlRequest(
        `
        query ($id: String!) {
            property(id: $id) {
                id
                title
                description
                price
                location
                status
                viewings {
                    id
                    propertyId
                    date
                    client
                    status
                    requestedById
                    requestedByUsername
                }
            }
        }
        `,
        { id: String(id) }
    );

    return data.property;
}

export async function add(property) {
    const data = await graphqlRequest(
        `
        mutation ($title: String!, $description: String, $price: Int!, $location: String!, $status: String) {
            addProperty(
                title: $title,
                description: $description,
                price: $price,
                location: $location,
                status: $status
            ) {
                id
                title
                description
                price
                location
                status
            }
        }
        `,
        {
            ...property,
            price: Number(property.price),
        }
    );

    return data.addProperty;
}

export async function update(property) {
    const data = await graphqlRequest(
        `
        mutation ($id: String!, $title: String, $description: String, $price: Int, $location: String, $status: String) {
            updateProperty(
                id: $id,
                title: $title,
                description: $description,
                price: $price,
                location: $location,
                status: $status
            ) {
                id
                title
                description
                price
                location
                status
            }
        }
        `,
        {
            ...property,
            id: String(property.id),
            price: Number(property.price),
        }
    );

    return data.updateProperty;
}

export async function remove(id) {
    await graphqlRequest(
        `
        mutation ($id: String!) {
            deleteProperty(id: $id)
        }
        `,
        { id: String(id) }
    );
}

export async function getStats() {
    const data = await graphqlRequest(`
        query {
            stats {
                total
                totalValue
                average
                available
                sold
            }
        }
    `);

    return data.stats;
}

export async function getViewings() {
    const data = await graphqlRequest(`
        query {
            viewings {
                id
                propertyId
                date
                client
                status
                requestedById
                requestedByUsername
            }
        }
    `);

    return data.viewings;
}

export async function requestViewing({ propertyId, date, client }) {
    const data = await graphqlRequest(
        `
        mutation ($propertyId: String!, $date: String!, $client: String!) {
            requestViewing(
                propertyId: $propertyId,
                date: $date,
                client: $client
            ) {
                id
                propertyId
                date
                client
                status
                requestedById
                requestedByUsername
            }
        }
        `,
        {
            propertyId: String(propertyId),
            date: String(date),
            client: String(client),
        }
    );

    return data.requestViewing;
}

export async function addViewing({ propertyId, date, client }) {
    const data = await graphqlRequest(
        `
        mutation ($propertyId: String!, $date: String!, $client: String!) {
            addViewing(
                propertyId: $propertyId,
                date: $date,
                client: $client
            ) {
                id
                propertyId
                date
                client
                status
                requestedById
                requestedByUsername
            }
        }
        `,
        {
            propertyId: String(propertyId),
            date: String(date),
            client: String(client),
        }
    );

    return data.addViewing;
}

export async function updateViewing({ id, propertyId, date, client }) {
    const data = await graphqlRequest(
        `
        mutation ($id: String!, $propertyId: String!, $date: String!, $client: String!) {
            updateViewing(
                id: $id,
                propertyId: $propertyId,
                date: $date,
                client: $client
            ) {
                id
                propertyId
                date
                client
                status
                requestedById
                requestedByUsername
            }
        }
        `,
        {
            id: String(id),
            propertyId: String(propertyId),
            date: String(date),
            client: String(client),
        }
    );

    return data.updateViewing;
}

export async function approveViewing(id) {
    const data = await graphqlRequest(
        `
        mutation ($id: String!) {
            approveViewing(id: $id) {
                id
                propertyId
                date
                client
                status
                requestedById
                requestedByUsername
            }
        }
        `,
        { id: String(id) }
    );

    return data.approveViewing;
}

export async function rejectViewing(id) {
    const data = await graphqlRequest(
        `
        mutation ($id: String!) {
            rejectViewing(id: $id) {
                id
                propertyId
                date
                client
                status
                requestedById
                requestedByUsername
            }
        }
        `,
        { id: String(id) }
    );

    return data.rejectViewing;
}

export async function completeViewing(id) {
    const data = await graphqlRequest(
        `
        mutation ($id: String!) {
            completeViewing(id: $id) {
                id
                propertyId
                date
                client
                status
                requestedById
                requestedByUsername
            }
        }
        `,
        { id: String(id) }
    );

    return data.completeViewing;
}

export async function deleteViewing(id) {
    await graphqlRequest(
        `
        mutation ($id: String!) {
            deleteViewing(id: $id)
        }
        `,
        {
            id: String(id),
        }
    );
}