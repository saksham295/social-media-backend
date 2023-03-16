import chai from "chai";
import chaiHttp from "chai-http";
import app from "../index.js";
import User from "../models/User.js";
import Post from "../models/Post.js";
import mongoose from "mongoose";

chai.use(chaiHttp);
const expect = chai.expect;

describe("Add post", () => {
  let token;
  before(async () => {
    const testUser = new User({
      name: "Test User",
      email: "testuser@example.com",
      password: "$2a$10$U84FdlAr6gXTrX87CUv6oeideFCWuvHxImslR69BVe4/xoFCRwcEm",
      following: [],
      followers: [],
    });

    await testUser.save();

    const res = await chai.request(app).post("/api/authenticate").send({
      email: "testuser@example.com",
      password: "password",
    });
    token = res.body.token;
  });

  after(async () => {
    await User.deleteOne({ email: "testuser@example.com" });
  });

  it("should add a post with valid data", async () => {
    const res = await chai
      .request(app)
      .post("/api/posts")
      .set("x-auth-token", `${token}`)
      .send({
        title: "Test post",
        description: "This is a test post",
      });

    expect(res).to.have.status(200);
    expect(res.body.PostID).to.be.a("string");
    expect(res.body.Title).to.equal("Test post");
    expect(res.body.Description).to.equal("This is a test post");
    expect(res.body["Created Time"]).to.be.a("string");

    await Post.deleteOne({ _id: res.body.PostID });
  });

  it("should return an error when title is missing", async () => {
    const res = await chai
      .request(app)
      .post("/api/posts")
      .set("x-auth-token", `${token}`)
      .send({
        description: "This is a test post",
      });

    expect(res).to.have.status(400);
    expect(res.body.message).to.equal("Please submit all the required fields.");
  });

  it("should return an error when description is missing", async () => {
    const res = await chai
      .request(app)
      .post("/api/posts")
      .set("x-auth-token", `${token}`)
      .send({
        title: "Test post",
      });

    expect(res).to.have.status(400);
    expect(res.body.message).to.equal("Please submit all the required fields.");
  });
});

describe("Delete Post", () => {
  let token;
  let postId;

  before(async () => {
    const testUser = new User({
      name: "Test User",
      email: "testuser@example.com",
      password: "$2a$10$U84FdlAr6gXTrX87CUv6oeideFCWuvHxImslR69BVe4/xoFCRwcEm",
      following: [],
      followers: [],
    });

    await testUser.save();

    const res = await chai.request(app).post("/api/authenticate").send({
      email: "testuser@example.com",
      password: "password",
    });
    token = res.body.token;

    const post = new Post({
      title: "Test Post",
      description: "This is a test post for the delete endpoint",
      postedBy: testUser._id,
      likes: [],
      comments: [],
    });
    await post.save();

    postId = post._id;
  });

  after(async () => {
    await Post.deleteOne({ _id: postId });
    await User.deleteOne({ email: "testuser@example.com" });
  });

  it("should return an error message if post ID is invalid", async () => {
    const res = await chai
      .request(app)
      .delete("/api/posts/invalidID")
      .set("x-auth-token", `${token}`);
    chai.expect(res.status).to.equal(400);
    chai.expect(res.body.message).to.equal("Invalid ID");
  });

  it("should return an error message if post is not found", async () => {
    const someId = new mongoose.Types.ObjectId();
    const res = await chai
      .request(app)
      .delete(`/api/posts/${someId}`)
      .set("x-auth-token", `${token}`);
    chai.expect(res.status).to.equal(400);
    chai.expect(res.body.message).to.equal("Post not found");
  });

  it("should return an error message if user is not the owner of the post", async () => {
    const otherUser = new User({
      name: "Other User",
      email: "otheruser@example.com",
      password: "$2a$10$U84FdlAr6gXTrX87CUv6oeideFCWuvHxImslR69BVe4/xoFCRwcEm",
      following: [],
      followers: [],
    });

    await otherUser.save();

    const generateToken = await chai
      .request(app)
      .post("/api/authenticate")
      .send({
        email: "otheruser@example.com",
        password: "password",
      });
    const otherUserToken = generateToken.body.token;

    const res = await chai
      .request(app)
      .delete(`/api/posts/${postId}`)
      .set("x-auth-token", `${otherUserToken}`);

    chai.expect(res.status).to.equal(400);
    chai
      .expect(res.body.message)
      .to.equal("You are not authorized to delete this post");

    await User.deleteOne({ email: "otheruser@example.com" });
  });

  it("should delete the post successfully if user is the owner", async () => {
    const res = await chai
      .request(app)
      .delete(`/api/posts/${postId}`)
      .set("x-auth-token", `${token}`);
    chai.expect(res.status).to.equal(200);
    chai.expect(res.body.message).to.equal("Post deleted successfully");
    const updatedPost = await Post.findOne({ _id: postId });
    expect(updatedPost).to.be.a("null");
  });
});

describe("Like Post", () => {
  let user, post, token;

  before(async () => {
    user = new User({
      name: "Test User",
      email: "testuser@example.com",
      password: "$2a$10$U84FdlAr6gXTrX87CUv6oeideFCWuvHxImslR69BVe4/xoFCRwcEm",
      following: [],
      followers: [],
    });

    await user.save();

    const res = await chai.request(app).post("/api/authenticate").send({
      email: "testuser@example.com",
      password: "password",
    });
    token = res.body.token;

    post = new Post({
      title: "Test Post",
      description: "This is a test post for the like endpoint",
      postedBy: user._id,
      likes: [],
      comments: [],
    });
    await post.save();
  });

  after(async () => {
    await Post.deleteOne({ _id: post._id });
    await User.deleteOne({ email: "testuser@example.com" });
  });

  it("should like a post", async () => {
    const res = await chai
      .request(app)
      .post(`/api/like/${post._id}`)
      .set("x-auth-token", `${token}`);
    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal("Post liked successfully");

    const updatedPost = await Post.findOne({ _id: post._id });
    expect(updatedPost.likes).to.include(user._id);
  });

  it("should not like a post that has already been liked", async () => {
    const res = await chai
      .request(app)
      .post(`/api/like/${post._id}`)
      .set("x-auth-token", `${token}`);
    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal("Post already liked");
  });

  it("should return an error when the post is not found", async () => {
    const someId = new mongoose.Types.ObjectId();
    const res = await chai
      .request(app)
      .post(`/api/like/${someId}`)
      .set("x-auth-token", `${token}`);
    chai.expect(res.status).to.equal(400);
    chai.expect(res.body.message).to.equal("Post not found");
  });
});

describe("Unlike Post", () => {
  let user, post, token;

  before(async () => {
    user = new User({
      name: "Test User",
      email: "testuser@example.com",
      password: "$2a$10$U84FdlAr6gXTrX87CUv6oeideFCWuvHxImslR69BVe4/xoFCRwcEm",
      following: [],
      followers: [],
    });

    await user.save();

    const res = await chai.request(app).post("/api/authenticate").send({
      email: "testuser@example.com",
      password: "password",
    });
    token = res.body.token;

    post = new Post({
      title: "Test Post",
      description: "This is a test post for the like endpoint",
      postedBy: user._id,
      likes: [user._id],
      comments: [],
    });
    await post.save();
  });

  after(async () => {
    await Post.deleteOne({ _id: post._id });
    await User.deleteOne({ email: "testuser@example.com" });
  });

  it("should unlike a post", async () => {
    const res = await chai
      .request(app)
      .post(`/api/unlike/${post._id}`)
      .set("x-auth-token", `${token}`);
    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal("Post unliked successfully");

    const updatedPost = await Post.findOne({ _id: post._id });
    expect(updatedPost.likes).to.not.include(user._id);
  });

  it("should return an error if the post is not liked", async () => {
    const res = await chai
      .request(app)
      .post(`/api/unlike/${post._id}`)
      .set("x-auth-token", `${token}`);
    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal("Post not liked");
  });

  it("should return an error when the post is not found", async () => {
    const someId = new mongoose.Types.ObjectId();
    const res = await chai
      .request(app)
      .post(`/api/unlike/${someId}`)
      .set("x-auth-token", `${token}`);
    chai.expect(res.status).to.equal(400);
    chai.expect(res.body.message).to.equal("Post not found");
  });
});

describe("Add Comment", () => {
  let user;
  let token;
  let post;

  before(async () => {
    user = new User({
      name: "Test User",
      email: "testuser@example.com",
      password: "$2a$10$U84FdlAr6gXTrX87CUv6oeideFCWuvHxImslR69BVe4/xoFCRwcEm",
      following: [],
      followers: [],
    });

    await user.save();

    const res = await chai.request(app).post("/api/authenticate").send({
      email: "testuser@example.com",
      password: "password",
    });
    token = res.body.token;

    post = new Post({
      title: "Test Post",
      description: "This is a test post for the add comment endpoint",
      postedBy: user._id,
      likes: [],
      comments: [],
    });
    await post.save();
  });

  after(async () => {
    await Post.deleteOne({ _id: post._id });
    await User.deleteOne({ email: "testuser@example.com" });
  });

  it("should add a comment to the post", async () => {
    const res = await chai
      .request(app)
      .post(`/api/comment/${post._id}`)
      .set("x-auth-token", `${token}`)
      .send({ comment: "Test comment" });
    expect(res.status).to.equal(200);
    expect(res.body.commentID).to.exist;
  });

  it("should return 400 if post not found", async () => {
    const someId = new mongoose.Types.ObjectId();
    const res = await chai
      .request(app)
      .post(`/api/comment/${someId}`)
      .set("x-auth-token", `${token}`)
      .send({ comment: "Test comment" });
    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal("Post not found");
  });

  it("should return 400 if comment is empty", async () => {
    const res = await chai
      .request(app)
      .post(`/api/comment/${post._id}`)
      .set("x-auth-token", `${token}`)
      .send({ comment: "" });
    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal("Please add some text");
  });
});

describe("Get post by ID", () => {
  let post, user;

  before(async () => {
    user = new User({
      name: "Test User",
      email: "testuser@example.com",
      password: "$2a$10$U84FdlAr6gXTrX87CUv6oeideFCWuvHxImslR69BVe4/xoFCRwcEm",
      following: [],
      followers: [],
    });
    await user.save();

    post = new Post({
      title: "Test Post",
      description: "This is a test post for the add comment endpoint",
      postedBy: user._id,
      likes: [],
      comments: [],
    });
    await post.save();
  });

  after(async () => {
    await Post.deleteOne({ _id: post._id });
    await User.deleteOne({ email: "testuser@example.com" });
  });

  it("should get a post", async () => {
    const res = await chai.request(app).get(`/api/posts/${post._id}`);

    expect(res).to.have.status(200);
    expect(res.body).to.be.an("object");
    expect(res.body).to.have.property("title", post.title);
    expect(res.body).to.have.property("description", post.description);
    expect(res.body).to.have.property("postedBy", post.postedBy.toString());
    expect(res.body).to.have.property("likes", post.likes.length);
    expect(res.body).to.have.property("comments").to.be.a("array");
    expect(res.body).to.have.property("createdAt");
  });

  it("should return 400 if post ID is invalid", async () => {
    const someId = new mongoose.Types.ObjectId();
    const res = await chai.request(app).get(`/api/posts/${someId}`);

    expect(res).to.have.status(400);
    expect(res.body).to.have.property("message", "Post not found");
  });
});

describe("Get User Posts", () => {
  let token;
  let user;
  let post1, post2;

  before(async () => {
    user = new User({
      name: "Test User",
      email: "testuser@example.com",
      password: "$2a$10$U84FdlAr6gXTrX87CUv6oeideFCWuvHxImslR69BVe4/xoFCRwcEm",
      following: [],
      followers: [],
    });

    await user.save();

    const res = await chai.request(app).post("/api/authenticate").send({
      email: "testuser@example.com",
      password: "password",
    });
    token = res.body.token;

    post1 = new Post({
      title: "Post 1",
      description: "Description for Post 1",
      postedBy: user._id,
      likes: [],
      comments: [],
    });
    await post1.save();
    post2 = new Post({
      title: "Post 2",
      description: "Description for Post 2",
      postedBy: user._id,
      likes: [],
      comments: [],
    });
    await post2.save();
  });

  after(async () => {
    await Post.deleteMany({ postedBy: { $in: user._id } });
    await User.deleteOne({ _id: user._id });
  });

  it("should return all posts created by the user", async () => {
    const res = await chai
      .request(app)
      .get("/api/all_posts")
      .set("x-auth-token", `${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.posts.length).to.equal(2);
    expect(res.body.posts[0]).to.have.property("id");
    expect(res.body.posts[0]).to.have.property("title", "Post 2");
    expect(res.body.posts[0]).to.have.property(
      "description",
      "Description for Post 2"
    );
    expect(res.body.posts[0]).to.have.property("likes", 0);
    expect(res.body.posts[0]).to.have.property("comments").to.be.an("array");
    expect(res.body.posts[0]).to.have.property("createdAt").to.be.a("string");
  });

  it("should return empty array if user has no posts", async () => {
    await Post.deleteMany({ postedBy: { $in: user._id } });

    const res = await chai
      .request(app)
      .get("/api/all_posts")
      .set("x-auth-token", `${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.posts).to.be.an("array").that.is.empty;
  });
});
