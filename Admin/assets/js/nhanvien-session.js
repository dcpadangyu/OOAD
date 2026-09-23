class EmployeeSession {
  constructor() {
    this.sessionKey = "nvLoggedIn";
    this.usernameKey = "nvUsername";
    this.fullNameKey = "nvFullName";
    this.chucVuKey = "nvChucVu";
    this.loginTimeKey = "nvLoginTime";
    this.sessionTimeout = 24 * 60 * 60 * 1000;
  }

  login(employee) {
    sessionStorage.setItem(this.sessionKey, "true");
    sessionStorage.setItem(this.usernameKey, employee.username);
    sessionStorage.setItem(this.fullNameKey, employee.tenNhanVien);
    sessionStorage.setItem(this.chucVuKey, employee.chucVu);
    sessionStorage.setItem(this.loginTimeKey, new Date().toISOString());
  }

  isLoggedIn() {
    const loggedIn = sessionStorage.getItem(this.sessionKey);
    const loginTime = sessionStorage.getItem(this.loginTimeKey);
    if (!loggedIn || loggedIn !== "true") return false;
    if (loginTime) {
      const timeDiff = Date.now() - new Date(loginTime).getTime();
      if (timeDiff > this.sessionTimeout) {
        this.logout();
        return false;
      }
    }
    return true;
  }

  getCurrentEmployee() {
    if (!this.isLoggedIn()) return null;
    const username = sessionStorage.getItem(this.usernameKey);
    return {
      username: username,
      tenNhanVien: sessionStorage.getItem(this.fullNameKey),
      chucVu: sessionStorage.getItem(this.chucVuKey),
      loginTime: sessionStorage.getItem(this.loginTimeKey)
    };
  }

  logout() {
    sessionStorage.removeItem(this.sessionKey);
    sessionStorage.removeItem(this.usernameKey);
    sessionStorage.removeItem(this.fullNameKey);
    sessionStorage.removeItem(this.chucVuKey);
    sessionStorage.removeItem(this.loginTimeKey);
  }
}

window.EmployeeSession = EmployeeSession;
window.employeeSession = new EmployeeSession();