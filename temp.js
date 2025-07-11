require("dotenv").config();

const { ApolloServer, gql } = require("apollo-server");
const mongoose = require("mongoose");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// Mongoose Model
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

  input UserInput {
    name: String!
    email: String!
    phone: String!
    age: Int
    profession: String
    address: String
  }

  type Query {
    getUser(id: ID!): User
    getAllUsers: [User!]!
  }

  type Mutation {
    createUser(input: UserInput!): User
    updateUser(id: ID!, input: UserInput!): User
    deleteUser(id: ID!): Boolean
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
        meta: {
          totalCount,
        },
      };
    },
  },
  Mutation: {
    createUser: async (_, { input }) => {
      console.log("📥 createUser input:", input);
      const user = new User(input);
      const saved = await user.save();
      console.log("✅ User saved:", saved);
      return saved;
    },
    updateUser: async (_, { id, input }) => {
      console.log(`✏️ Updating user ${id}`);
      return await User.findByIdAndUpdate(id, input, { new: true });
    },
    deleteUser: async (_, { id }) => {
      console.log(`🗑️ Deleting user ${id}`);
      const result = await User.findByIdAndDelete(id);
      return !!result;
    },
  },
};

// Server setup
const PORT = 4000;
const HOST = "192.168.1.4";

const server = new ApolloServer({
  typeDefs,
  resolvers,
  cors: {
    origin: "*", // Allow all (good for development)
    credentials: true,
  },
});

// Start the server
server.listen({ port: PORT, host: HOST }).then(({ url }) => {
  console.log(`🚀 GraphQL server ready at ${url}`);
});
