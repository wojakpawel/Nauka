const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,32}$/;

function validateUsername(username) {
  if (typeof username !== "string" || !USERNAME_PATTERN.test(username)) {
    return "Username must be 3-32 characters and contain only letters, digits, or underscores.";
  }

  return null;
}

function validatePassword(password) {
  if (typeof password !== "string" || password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  return null;
}

module.exports = {
  validateUsername,
  validatePassword,
};
