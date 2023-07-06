require("dotenv").config();
const request = require("supertest");
const app = require("../app");

let token = `Bearer ${process.env.ACCESS_TOKEN}`;
describe("GET /", () => {
  test('should return "Hello"', async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Hello");
  });
});

describe("GET /get_current_user", () => {
  test("should return user info if access token is provided", async () => {
    const response = await request(app)
      .get("/get_current_user")
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body.id).toBeDefined();
    expect(response.body.name).toBeDefined();
  });

  test("should return unauthorized error if access token is missing", async () => {
    const response = await request(app).get("/get_current_user");
    expect(response.status).toBe(400);
    expect(response.text).toBe("access_token is required");
  });
});

describe("GET /get_friends", () => {
  test("should return friends list if access token is provided", async () => {
    const response = await request(app)
      .get("/get_friends")
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(Number),
          name: expect.any(String),
        }),
      ])
    );
  });

  test("should return error if access token is missing", async () => {
    const response = await request(app).get("/get_friends");
    expect(response.status).toBe(400);
    expect(response.text).toBe("access_token is required");
  });
});


// Example:
describe("POST /create_expense", () => {
  test("should create an expense", async () => {
    const expenseData = {};
    const response = await request(app)
      .post("/create_expense")
      .set("Authorization", token)
      .send({ expense: expenseData });

    expect(response.status).toBe(400);
  });
});

describe("GET /get_groups", () => {
  test("should return groups if access token is provided", async () => {
    const response = await request(app)
      .get("/get_groups")
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(Number),
          name: expect.any(String),
          members: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(Number),
              name: expect.any(String),
            }),
          ]),
        }),
      ])
    );
  });

  test("should return error if access token is missing", async () => {
    const response = await request(app).get("/get_groups");

    expect(response.status).toBe(400);
    expect(response.text).toBe("access_token is required");
  });
});

// Ensure to test other endpoints in a similar manner
