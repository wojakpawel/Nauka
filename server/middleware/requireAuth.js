const { verifyToken } = require("../lib/jwt");

function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const payload = verifyToken(header.slice(7));
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: "Not authenticated" });
  }
}

module.exports = {
  requireAuth,
};
