/* ================= GLOBAL CONFIG ================= */
/* Update the production URL below with your actual Render backend URL once deployed */
const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const BASE_URL = isLocal ? "http://localhost:5000" : "https://smart-healthcare-appointment-0bnh.onrender.com";
