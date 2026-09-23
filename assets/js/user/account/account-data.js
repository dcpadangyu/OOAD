// Seed the User-side demo accounts without overwriting real user data.
(function () {
  "use strict";

  const DATA_VERSION = "v2";
  const DEFAULT_AVATAR = "assets/img/Avatar/avtuser.jpg";
  const defaultUsers = [
    { id: "user_admin_example", userName: "admin", email: "admin@example.com", password: "Admin123", address: "Hà Nội", phone: "0909000001", avatar: "assets/img/Avatar/ava1.jpg", isLoggedIn: false },
    { id: "user_demo_example", userName: "demo", email: "demo@example.com", password: "Demo1234", address: "TP. Hồ Chí Minh", phone: "0909000002", avatar: "assets/img/Avatar/ava2.jpg", isLoggedIn: false },
    { id: "user_john_example", userName: "john", email: "john@example.com", password: "John1234", address: "Đà Nẵng", phone: "0909000003", avatar: "assets/img/Avatar/ava3.jpg", isLoggedIn: false }
  ];

  let users = window.UserSession?.getUserList?.() || [];
  defaultUsers.forEach((demoUser) => {
    const exists = users.some((user) =>
      (user.id && user.id === demoUser.id) ||
      (user.email && user.email.toLowerCase() === demoUser.email.toLowerCase()) ||
      (user.userName && user.userName.toLowerCase() === demoUser.userName.toLowerCase())
    );
    if (!exists) users.push({ ...demoUser, avatar: demoUser.avatar || DEFAULT_AVATAR });
  });
  users = users.map((user) => window.UserSession?.normalizeUser?.(user) || user);
  localStorage.setItem("userList", JSON.stringify(users));
  localStorage.setItem("dataVersion", DATA_VERSION);
})();
