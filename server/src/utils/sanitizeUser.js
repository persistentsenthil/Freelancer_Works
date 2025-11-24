function sanitizeUser(user) {
  if (!user) return null;
  const plain =
    typeof user.toObject === 'function'
      ? user.toObject({ getters: true, virtuals: true })
      : { ...user };
  delete plain.passwordHash;
  delete plain.__v;
  return plain;
}

function sanitizeUsers(users = []) {
  return users.map(sanitizeUser);
}

module.exports = { sanitizeUser, sanitizeUsers };

