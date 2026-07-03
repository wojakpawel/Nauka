const jwt = require("jsonwebtoken");

const secret = process.env.JWT_SECRET;
const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

function signToken(userId) {
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign({ sub: userId }, secret, { expiresIn });
}

function verifyToken(token) {
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.verify(token, secret);
}

module.exports = {
  signToken,
  verifyToken,
};
