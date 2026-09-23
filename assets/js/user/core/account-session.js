// Shared User account/session helpers.
(function () {
  "use strict";

  const DEFAULT_AVATAR = "assets/img/Avatar/avtuser.jpg";

  function parseJSON(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return value ?? fallback;
    } catch (_) {
      return fallback;
    }
  }

  function normalizeUser(user) {
    if (!user || typeof user !== "object") return null;
    const normalized = { ...user };
    normalized.userName = String(user.userName || user.username || user.name || "").trim();
    normalized.email = String(user.email || "").trim();
    normalized.phone = String(user.phone || "").trim();
    normalized.address = String(user.address || "").trim();
    normalized.avatar = user.avatar || DEFAULT_AVATAR;
    normalized.addresses = Array.isArray(user.addresses) ? user.addresses : [];
    if (!normalized.id) {
      const identity = (normalized.email || normalized.userName || "user").toLowerCase();
      normalized.id = `user_${identity.replace(/[^a-z0-9]+/g, "_")}`;
    }
    return normalized;
  }

  function getCurrentUser() {
    return normalizeUser(parseJSON("currentUser", null));
  }

  function getUserList() {
    const users = parseJSON("userList", []);
    return Array.isArray(users) ? users.map(normalizeUser).filter(Boolean) : [];
  }

  function userMatches(a, b) {
    if (!a || !b) return false;
    if (a.id && b.id && a.id === b.id) return true;
    const aEmail = String(a.email || "").trim().toLowerCase();
    const bEmail = String(b.email || "").trim().toLowerCase();
    if (aEmail && bEmail && aEmail === bEmail) return true;
    const aName = String(a.userName || a.username || a.name || "").trim().toLowerCase();
    const bName = String(b.userName || b.username || b.name || "").trim().toLowerCase();
    return !!aName && !!bName && aName === bName;
  }

  function setCurrentUser(user) {
    const normalized = normalizeUser(user);
    if (!normalized) {
      localStorage.removeItem("currentUser");
      return null;
    }
    localStorage.setItem("currentUser", JSON.stringify(normalized));
    return normalized;
  }

  function saveUser(user, previousIdentity) {
    const normalized = normalizeUser(user);
    if (!normalized) return null;
    const users = getUserList();
    const index = previousIdentity
      ? users.findIndex((u) => userMatches(u, previousIdentity))
      : users.findIndex((u) => userMatches(u, normalized));
    if (index >= 0) users[index] = normalized;
    else users.push(normalized);
    localStorage.setItem("userList", JSON.stringify(users));
    setCurrentUser(normalized);
    return normalized;
  }

  function clearSession() {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("selectedAddress");
  }

  window.UserSession = Object.freeze({
    DEFAULT_AVATAR,
    parseJSON,
    normalizeUser,
    getCurrentUser,
    getUserList,
    userMatches,
    setCurrentUser,
    saveUser,
    clearSession
  });
  window.getCurrentUser = getCurrentUser;
})();
