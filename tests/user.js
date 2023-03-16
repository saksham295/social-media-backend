import chai from "chai";
import chaiHttp from "chai-http";
import app from "../index.js";
import User from "../models/User.js";

chai.use(chaiHttp);
const expect = chai.expect;

describe("Login User", () => {
  before(async () => {
    const testUser = new User({
      name: "Test User",
      email: "testuser@example.com",
      password: "$2a$10$U84FdlAr6gXTrX87CUv6oeideFCWuvHxImslR69BVe4/xoFCRwcEm",
      following: [],
      followers: [],
    });

    await testUser.save();
  });

  after(async () => {
    await User.deleteOne({ email: "testuser@example.com" });
  });

  it("should return a token if valid credentials are provided", async () => {
    const user = {
      email: "testuser@example.com",
      password: "password",
    };

    const res = await chai.request(app).post("/api/authenticate").send(user);

    expect(res).to.have.status(200);
    expect(res.body).to.have.property("token");
  });

  it("should return an error message if user does not exist", async () => {
    const user = {
      email: "nonexistent@example.com",
      password: "password",
    };

    const res = await chai.request(app).post("/api/authenticate").send(user);

    expect(res).to.have.status(400);
    expect(res.body.message).to.equal("User does not exists");
  });

  it("should return an error message if invalid credentials are provided", async () => {
    const user = {
      email: "testuser@example.com",
      password: "wrongpassword",
    };

    const res = await chai.request(app).post("/api/authenticate").send(user);

    expect(res).to.have.status(400);
    expect(res.body.message).to.equal("Invalid Credentials");
  });
});

describe("Follow User", () => {
  let token;
  let userId;
  let userToFollowId;

  before(async () => {
    const testUser = new User({
      name: "Test User",
      email: "testuser@example.com",
      password: "$2a$10$U84FdlAr6gXTrX87CUv6oeideFCWuvHxImslR69BVe4/xoFCRwcEm",
      following: [],
      followers: [],
    });

    await testUser.save();

    const res = await chai
      .request(app)
      .post("/api/authenticate")
      .send({ email: "testuser@example.com", password: "password" });

    token = res.body.token;
    userId = testUser._id;

    const userToFollow = new User({
      name: "User to follow",
      email: "followuser@example.com",
      password: "testpassword",
      following: [],
      followers: [],
    });

    await userToFollow.save();

    userToFollowId = userToFollow._id;
  });

  after(async () => {
    await User.deleteMany({
      email: { $in: ["testuser@example.com", "followuser@example.com"] },
    });
  });

  it("should return 401 error when no token is provided", async () => {
    const res = await chai.request(app).post(`/api/follow/${userToFollowId}`);

    expect(res).to.have.status(401);
    expect(res.body)
      .to.have.property("message")
      .equals("A token is required for authentication");
  });

  it("should return 401 error when an invalid token is provided", async () => {
    const res = await chai
      .request(app)
      .post(`/api/follow/${userToFollowId}`)
      .set("x-auth-token", "invalid-token");

    expect(res).to.have.status(401);
    expect(res.body).to.have.property("message").equals("Invalid Token");
  });

  it("should return 400 error when user to follow does not exist", async () => {
    const res = await chai
      .request(app)
      .post(`/api/follow/123456789012345678901234`)
      .set("x-auth-token", `${token}`);

    expect(res).to.have.status(400);
    expect(res.body)
      .to.have.property("message")
      .equals("User to follow does not exist");
  });

  it("should return 400 error when user is already following the user to follow", async () => {
    await User.updateOne(
      { _id: userToFollowId },
      { $push: { followers: userId } }
    );

    const res = await chai
      .request(app)
      .post(`/api/follow/${userToFollowId}`)
      .set("x-auth-token", `${token}`);

    expect(res).to.have.status(400);
    expect(res.body)
      .to.have.property("message")
      .equals(`You already follow User to follow`);

    await User.updateOne(
      { _id: userToFollowId },
      { $pull: { followers: userId } }
    );
  });

  it("should make the user follow the user to follow", async () => {
    const res = await chai
      .request(app)
      .post(`/api/follow/${userToFollowId}`)
      .set("x-auth-token", `${token}`);

    expect(res).to.have.status(200);
    expect(res.body)
      .to.have.property("message")
      .equals(`You started following User to follow`);

    const updatedUserToFollow = await User.findOne({ _id: userToFollowId });
    expect(updatedUserToFollow.followers).to.include(userId);
  });

  it("should add the user to the followers list of the user to follow", async () => {
    await chai
      .request(app)
      .post(`/api/follow/${userToFollowId}`)
      .set("x-auth-token", `${token}`);
    const updatedUserToFollow = await User.findOne({ _id: userToFollowId });
    expect(updatedUserToFollow.followers).to.include(userId);
  });
});

describe("Unfollow User", () => {
  let token, userToUnfollow, user;

  before(async () => {
    userToUnfollow = new User({
      name: "User To Unfollow",
      email: "unfollow@example.com",
      password: "password",
      following: [],
      followers: [],
    });
    await userToUnfollow.save();

    user = new User({
      name: "Test User",
      email: "testuser@example.com",
      password: "$2a$10$U84FdlAr6gXTrX87CUv6oeideFCWuvHxImslR69BVe4/xoFCRwcEm",
      following: [userToUnfollow._id],
      followers: [],
    });
    await user.save();

    const res = await chai
      .request(app)
      .post("/api/authenticate")
      .send({ email: "testuser@example.com", password: "password" });

    token = res.body.token;
  });

  after(async () => {
    await User.deleteMany({
      email: { $in: ["testuser@example.com", "unfollow@example.com"] },
    });
  });

  it("should return an error if user to unfollow does not exist", async () => {
    const res = await chai
      .request(app)
      .post("/api/unfollow/60ad0999b1d10e00120fc697")
      .set("x-auth-token", `${token}`);

    expect(res).to.have.status(400);
    expect(res.body).to.have.property(
      "message",
      "User to unfollow does not exist"
    );
  });

  it("should return 401 error when no token is provided", async () => {
    const res = await chai
      .request(app)
      .post(`/api/unfollow/${userToUnfollow._id}`);

    expect(res).to.have.status(401);
    expect(res.body)
      .to.have.property("message")
      .equals("A token is required for authentication");
  });

  it("should return 401 error when an invalid token is provided", async () => {
    const res = await chai
      .request(app)
      .post(`/api/unfollow/${userToUnfollow._id}`)
      .set("x-auth-token", "invalid-token");

    expect(res).to.have.status(401);
    expect(res.body).to.have.property("message").equals("Invalid Token");
  });

  it("should return an error if user to unfollow is not being followed", async () => {
    const res = await chai
      .request(app)
      .post(`/api/unfollow/${userToUnfollow._id}`)
      .set("x-auth-token", `${token}`);

    expect(res).to.have.status(400);
    expect(res.body).to.have.property(
      "message",
      `You don't follow ${userToUnfollow.name}`
    );
  });

  it("should unfollow the user and return a success message", async () => {
    await chai
      .request(app)
      .post(`/api/follow/${userToUnfollow._id}`)
      .set("x-auth-token", `${token}`);

    const res = await chai
      .request(app)
      .post(`/api/unfollow/${userToUnfollow._id}`)
      .set("x-auth-token", `${token}`);

    expect(res).to.have.status(200);
    expect(res.body).to.have.property(
      "message",
      `You unfollowed ${userToUnfollow.name}`
    );
    const updatedUserToUnfollow = await User.findOne({ _id: userToUnfollow });
    expect(updatedUserToUnfollow.followers).to.not.include(user._id);
  });
});

describe("Get User", () => {
  let user;
  let token;

  before(async () => {
    user = new User({
      name: "Test User",
      email: "testuser@example.com",
      password: "$2a$10$U84FdlAr6gXTrX87CUv6oeideFCWuvHxImslR69BVe4/xoFCRwcEm",
      following: [],
      followers: [],
    });
    await user.save();

    const res = await chai
      .request(app)
      .post("/api/authenticate")
      .send({ email: "testuser@example.com", password: "password" });

    token = res.body.token;
  });

  after(async () => {
    await User.deleteOne({ email: "testuser@example.com" });
  });

  it("should return user details", async () => {
    const res = await chai
      .request(app)
      .get("/api/user")
      .set("x-auth-token", `${token}`);

    expect(res).to.have.status(200);
    expect(res.body).to.be.an("object");
    expect(res.body).to.have.property("Name", user.name);
    expect(res.body).to.have.property("Followers", user.followers.length);
    expect(res.body).to.have.property("Following", user.following.length);
  });

  it("should return 401 error when no token is provided", async () => {
    const res = await chai.request(app).get("/api/user");

    expect(res).to.have.status(401);
    expect(res.body)
      .to.have.property("message")
      .equals("A token is required for authentication");
  });

  it("should return 401 error when an invalid token is provided", async () => {
    const res = await chai
      .request(app)
      .get("/api/user")
      .set("x-auth-token", "invalid-token");

    expect(res).to.have.status(401);
    expect(res.body).to.have.property("message").equals("Invalid Token");
  });
});
