require("dotenv").config();
const { ApolloServer, gql } = require("apollo-server");
const mongoose = require("mongoose");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// Mongoose Models
const User = mongoose.model(
  "User",
  new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    age: Number,
    profession: String,
    address: String,
  })
);

const Post = mongoose.model(
  "Post",
  new mongoose.Schema(
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      title: String,
      content: String,
      createdAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
  )
);

// GraphQL Schema
const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    phone: String
    age: Int
    profession: String
    address: String
  }

  type Post {
    id: ID!
    title: String!
    content: String!
    userId: ID!
    createdAt: String!
  }

  type MetaData {
    totalCount: Int!
  }

  type UserList {
    data: [User!]!
    meta: MetaData!
  }

  input UserInput {
    name: String!
    email: String!
    phone: String!
    age: Int
    profession: String
    address: String
  }

  input PostInput {
    title: String!
    content: String!
    userId: ID!
  }

  input PageQueryOptions {
    paginate: PaginateOptions
  }

  input PaginateOptions {
    page: Int
    limit: Int
  }

  type Query {
    getUser(id: ID!): User
    getAllUsers(options: PageQueryOptions): UserList!
    getPostsByUser(userId: ID!): [Post!]!
  }

  type Mutation {
    createUser(input: UserInput!): User
    updateUser(id: ID!, input: UserInput!): User
    deleteUser(id: ID!): Boolean

    createPost(input: PostInput!): Post
  }
`;

// Resolvers
const resolvers = {
  Query: {
    getUser: async (_, { id }) => await User.findById(id),

    getAllUsers: async (_, { options }) => {
      const page = options?.paginate?.page || 1;
      const limit = options?.paginate?.limit || 10;
      const skip = (page - 1) * limit;

      const users = await User.find().skip(skip).limit(limit);
      const totalCount = await User.countDocuments();

      return {
        data: users,
        meta: { totalCount },
      };
    },

    getPostsByUser: async (_, { userId }) => {
      return await Post.find({ userId }).sort({ createdAt: -1 });
    },
  },

  Mutation: {
    createUser: async (_, { input }) => {
      const user = new User(input);
      return await user.save();
    },

    updateUser: async (_, { id, input }) => {
      return await User.findByIdAndUpdate(id, input, { new: true });
    },

    deleteUser: async (_, { id }) => {
      const result = await User.findByIdAndDelete(id);
      return !!result;
    },

    createPost: async (_, { input }) => {
      const post = new Post(input);
      return await post.save();
    },
  },

  Post: {
    createdAt: (post) => {
      return post.createdAt instanceof Date
        ? post.createdAt.toISOString()
        : new Date(post.createdAt).toISOString();
    },
  },
};

// Server Setup
const PORT = 4000;
const HOST = "192.168.1.4";

const server = new ApolloServer({
  typeDefs,
  resolvers,
  cors: {
    origin: "*",
    credentials: true,
  },
});

server.listen({ port: PORT, host: HOST }).then(({ url }) => {
  console.log(`🚀 GraphQL server ready at ${url}`);
});
