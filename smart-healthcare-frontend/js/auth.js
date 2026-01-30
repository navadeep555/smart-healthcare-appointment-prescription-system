console.log("auth.js loaded");

/* ================= REGISTER ================= */
async function register(e) {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const role = document.getElementById("role").value;

  if (!name || !email || !password || !role) {
    alert("All fields are required");
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role })
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.message || "Registration failed");
      return;
    }

    alert("Registration successful. Please login.");
    window.location.href = "login.html";
  } catch (err) {
    console.error(err);
    alert("Server error. Try again later.");
  }
}

/* ================= LOGIN → SEND OTP ================= */
async function login(e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Email and password are required");
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.message || "Invalid credentials");
      return;
    }

    // Save email for OTP verification
    localStorage.setItem("otpEmail", data.email);

    alert("OTP sent to your email");
    window.location.href = "otp.html";
  } catch (err) {
    console.error(err);
    alert("Server error. Try again later.");
  }
}

/* ================= VERIFY OTP (ROLE BASED REDIRECT) ================= */
async function verifyOTP(e) {
  e.preventDefault();

  const otp = document.getElementById("otp").value.trim();
  const email = localStorage.getItem("otpEmail");

  if (!email) {
    alert("Session expired. Please login again.");
    window.location.href = "login.html";
    return;
  }

  if (!otp) {
    alert("Enter OTP");
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp })
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.message || "Invalid or expired OTP");
      return;
    }

    // Save logged in user
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("token", data.token);   // ✅ ADDED (DO NOT REMOVE)
    localStorage.removeItem("otpEmail");

    // 🔥 ROLE BASED DASHBOARD
    if (data.user.role === "admin") {
      window.location.href = "admin-dashboard.html";
    } else if (data.user.role === "doctor") {
      window.location.href = "doctor-dashboard.html";
    } else {
      window.location.href = "dashboard.html";
    }

  } catch (err) {
    console.error(err);
    alert("Server error. Try again later.");
  }
}

/* ================= RESEND OTP ================= */
async function resendOTP() {
  const email = localStorage.getItem("otpEmail");

  if (!email) {
    alert("Session expired. Please login again.");
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/auth/resend-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.message || "Failed to resend OTP");
      return;
    }

    alert("OTP resent to your email");
  } catch (err) {
    console.error(err);
    alert("Server error. Try again later.");
  }
}

/* ================= FORGOT PASSWORD ================= */
async function sendResetOTP(e) {
  e.preventDefault();

  const email = document.getElementById("resetEmail").value.trim();

  if (!email) {
    alert("Enter your email");
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.message || "Email not registered");
      return;
    }

    localStorage.setItem("resetEmail", email);
    alert("OTP sent to your email");
    window.location.href = "reset-password.html";
  } catch (err) {
    console.error(err);
    alert("Server error. Try again later.");
  }
}

/* ================= RESET PASSWORD ================= */
async function resetPassword(e) {
  e.preventDefault();

  const email = localStorage.getItem("resetEmail");
  const otp = document.getElementById("resetOtp").value.trim();
  const newPassword = document.getElementById("newPassword").value.trim();

  if (!email) {
    alert("Session expired. Please try again.");
    window.location.href = "forgot-password.html";
    return;
  }

  if (!otp || !newPassword) {
    alert("All fields are required");
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, newPassword })
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.message || "Invalid or expired OTP");
      return;
    }

    localStorage.removeItem("resetEmail");
    alert("Password reset successful");
    window.location.href = "login.html";
  } catch (err) {
    console.error(err);
    alert("Server error. Try again later.");
  }
}
