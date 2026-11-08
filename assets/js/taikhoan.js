// assets/js/taikhoan.js
(() => {
  const DATA_VERSION = "v1";
  const savedVersion = localStorage.getItem("dataVersion");

  // Nếu cần reset data khi version thay đổi, uncomment dòng dưới
  // if (savedVersion !== DATA_VERSION) { localStorage.removeItem("userList"); localStorage.setItem("dataVersion", DATA_VERSION); }

  const DEFAULT_AVATAR = "./assets/img/Avatar/avtuser.jpg";

  const defaultUsers = [
    {
      userName: "admin",
      email: "admin@example.com",
      password: "Admin123",
      address: "Hà Nội",
      phone: "0909000001",
      avatar: "./assets/img/Avatar/ava1.jpg",
      isLoggedIn: false,
    },
    {
      userName: "demo",
      email: "demo@example.com",
      password: "Demo1234",
      address: "TP. Hồ Chí Minh",
      phone: "0909000002",
      avatar: "./assets/img/Avatar/ava2.jpg",
      isLoggedIn: false,
    },
    {
      userName: "john",
      email: "john@example.com",
      password: "John1234",
      address: "Đà Nẵng",
      phone: "0909000003",
      avatar: "./assets/img/Avatar/ava3.jpg",
      isLoggedIn: false,
    },
  ];

  // for(var key in defaultUsers) {
  //   console.log(defaultUsers[key]);
  // }
  let userList = JSON.parse(localStorage.getItem("userList")) || [];

  defaultUsers.forEach((du) => {
    const exists = userList.some(
      (u) =>
        (u.email && du.email && u.email.toLowerCase() === du.email.toLowerCase()) ||
        (u.userName && du.userName && u.userName === du.userName)
    );
    if (!exists) {
      const toAdd = { ...du, avatar: du.avatar || DEFAULT_AVATAR };
      userList.push(toAdd);
    }
  });

  userList = userList.map((u) => ({
    ...u,
    avatar: u.avatar || DEFAULT_AVATAR,
  }));

  localStorage.setItem("userList", JSON.stringify(userList));

  if (!localStorage.getItem("dataVersion"))
    localStorage.setItem("dataVersion", DATA_VERSION);
})();
