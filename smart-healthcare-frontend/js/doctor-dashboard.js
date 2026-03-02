// Auth Check
const user = JSON.parse(localStorage.getItem("user"));
if (!user || user.role !== "doctor") {
  window.location.href = "login.html";
}

// State
let allAppointments = [];
let selectedAppointmentId = null;

// Helpers
function formatDoctorName(name) {
  if (!name) return "";
  const trimmed = name.trim();
  if (trimmed.toLowerCase().startsWith("dr.") || trimmed.toLowerCase().startsWith("dr ")) {
    return trimmed;
  }
  return `Dr. ${trimmed}`;
}

function looksEncrypted(str) {
  /* Backend now always decrypts before sending — this function is kept
     for safety but will not trigger under normal operation. */
  if (!str) return false;
  return str.length > 50 && !str.includes(" ");
}

/* ================= LOAD APPOINTMENTS ================= */
async function loadDoctorAppointments() {
  try {
    const res = await fetch(`${BASE_URL}/api/appointments/doctor/${user.email}`);
    const data = await res.json();

    if (data.success) {
      allAppointments = data.appointments;
      updateStats(allAppointments);
      displayAppointments(allAppointments);
      updateRecentActivity(allAppointments);
    }
  } catch (err) {
    console.error(err);
    document.getElementById("doctorAppointments").innerHTML = "<p>Error loading appointments</p>";
  }
}

/* ================= UPDATE UI STATS ================= */
function updateStats(appointments) {
  const today = new Date().toISOString().split('T')[0];

  const total = new Set(appointments.map(a => a.patientEmail)).size;
  const todayApps = appointments.filter(a => a.date === today).length;
  const pending = appointments.filter(a => a.status === "Pending").length;
  const completedToday = appointments.filter(a => a.date === today && a.status === "Completed").length;

  document.getElementById("totalPatients").innerText = total;
  document.getElementById("todayAppointments").innerText = todayApps;
  document.getElementById("pendingAppointments").innerText = pending;
  document.getElementById("completedToday").innerText = completedToday;

  // Header Welcome
  const welcomeEl = document.getElementById("welcome");
  const profileNameEl = document.getElementById("profileName");
  const profileCircleEl = document.getElementById("profileCircle");

  if (welcomeEl) welcomeEl.innerText = `Welcome back, ${formatDoctorName(user.name)}`;
  if (profileNameEl) profileNameEl.innerText = formatDoctorName(user.name);
  if (profileCircleEl) profileCircleEl.innerText = user.name.charAt(0).toUpperCase();
}

/* ================= DISPLAY LIST ================= */
function displayAppointments(appointments) {
  const container = document.getElementById("doctorAppointments");
  if (!container) return;

  if (appointments.length === 0) {
    container.innerHTML = "<p>No appointments found</p>";
    return;
  }

  container.innerHTML = appointments.map(app => `
    <div class="appointment-item">
      <div class="appointment-info">
        <h3>${app.patientName}</h3>
        <p><i class="fa-solid fa-calendar"></i> ${app.date} | <i class="fa-solid fa-clock"></i> ${app.time}</p>
        <p><i class="fa-solid fa-envelope"></i> ${app.patientEmail}</p>
      </div>
      <div class="appointment-status">
        <span class="status-tag status-${app.status.toLowerCase()}">${app.status}</span>
        ${app.prescription && app.prescription.isValid ? `
          <div style="font-size: 0.75rem; color: #10b981; margin-top: 5px; display: flex; align-items: center; gap: 4px;">
            <i class="fa-solid fa-check-double"></i> Verified
          </div>
        ` : ""}
        <div class="appointment-actions">
          ${app.status === "Booked" ? `
            <button class="btn-primary" onclick="openPrescription('${app._id}', '${app.patientName}', 'Booked')">
              <i class="fa-solid fa-file-signature"></i> Prescribe
            </button>
          ` : `
            <button class="btn-primary" onclick="openPrescription('${app._id}', '${app.patientName}', 'Completed')">
              <i class="fa-solid fa-file-signature"></i> Re-Prescribe
            </button>
            <button class="btn-secondary" onclick="downloadPrescription('${app._id}')">
              <i class="fa-solid fa-download"></i> PDF
            </button>
          `}
        </div>
      </div>
    </div>
  `).join("");
}

/* ================= PRESCRIPTION MODAL ================= */
// status: 'Booked' = fresh write, 'Completed' = view/re-write existing
async function openPrescription(id, pName, status = "Booked") {
  selectedAppointmentId = id;
  document.getElementById("patientName").value = pName;

  // Always clear the form first
  document.getElementById("diag").value = "";
  document.getElementById("meds").value = "";
  document.getElementById("advice").value = "";
  if (document.getElementById("followupDate")) {
    document.getElementById("followupDate").value = "";
  }

  // Always remove any old badge first
  const oldBadge = document.getElementById("verificationBadge");
  if (oldBadge) oldBadge.remove();

  // For Completed appointments, load existing prescription data and show signature status
  if (status !== "Booked" && id) {
    const app = allAppointments.find(a => a._id === id);

    if (app && app.prescription) {
      // Only populate fields if the values are actual strings (not undefined/encrypted hex)
      const diag = app.prescription.diagnosis;
      const meds = app.prescription.medicines;
      const adv = app.prescription.advice;

      document.getElementById("diag").value = (diag && !looksEncrypted(diag)) ? diag : "";
      document.getElementById("meds").value = (meds && !looksEncrypted(meds)) ? meds : "";
      document.getElementById("advice").value = (adv && !looksEncrypted(adv)) ? adv : "";

      // Show digital signature verification banner
      const badge = document.createElement("div");
      badge.id = "verificationBadge";
      badge.style.cssText = `padding: 10px 20px; background: ${app.prescription.isValid ? '#ecfdf5' : '#fef2f2'}; border-bottom: 1px solid ${app.prescription.isValid ? '#10b981' : '#ef4444'}; color: ${app.prescription.isValid ? '#065f46' : '#991b1b'}; font-size: 0.85rem; font-weight: 600;`;
      badge.innerHTML = `<i class="fa-solid ${app.prescription.isValid ? 'fa-shield-check' : 'fa-triangle-exclamation'}"></i> ${app.prescription.isValid
        ? 'DIGITALLY SIGNED & VERIFIED'
        : 'OLD SIGNATURE INVALID — RE-SUBMIT TO REFRESH'
        }`;
      document.getElementById("prescriptionModal").querySelector(".modal-header").after(badge);
    }
  }

  document.getElementById("prescriptionModal").style.display = "flex";
}

function closePrescription() {
  document.getElementById("prescriptionModal").style.display = "none";
}

async function submitPrescription(e) {
  e.preventDefault();

  const diagnosis = document.getElementById("diag").value.trim();
  const medicines = document.getElementById("meds").value.trim();
  const advice = document.getElementById("advice").value.trim();
  const followupDate = document.getElementById("followupDate")?.value || "";

  if (!diagnosis || !medicines) {
    alert("Diagnosis and medicines are required");
    return;
  }

  try {
    const payload = { diagnosis, medicines, advice, followupDate };

    // Check if we have a session key for encryption
    const sessionKey = localStorage.getItem("sessionKey");
    // Note: PDF generation on backend handles its own encryption/decryption 
    // but the API endpoint usually expects plaintext if it's going to re-encrypt

    const res = await fetch(`${BASE_URL}/api/appointments/prescription/${selectedAppointmentId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
      alert("Prescription saved successfully");
      closePrescription();
      loadDoctorAppointments();
    } else {
      alert(data.message || "Failed to save prescription");
    }
  } catch (err) {
    console.error(err);
    alert("Server error");
  }
}

function downloadPrescription(id) {
  window.open(`${BASE_URL}/api/appointments/prescription/pdf/${id}`, "_blank");
}

/* ================= PROFILE ================= */
function openEditProfile() {
  document.getElementById("editProfileModal").style.display = "flex";
  document.getElementById("docName").value = user.name || "";
  document.getElementById("docSpecialization").value = user.specialization || "";
  document.getElementById("docHospital").value = user.hospital || "";
  document.getElementById("docExperience").value = user.experience || "";
  document.getElementById("docEmail").value = user.email || "";
}

function closeEditProfile() {
  document.getElementById("editProfileModal").style.display = "none";
}

function saveProfile(e) {
  e.preventDefault();
  user.name = document.getElementById("docName").value;
  user.specialization = document.getElementById("docSpecialization").value;
  user.hospital = document.getElementById("docHospital").value;
  user.experience = document.getElementById("docExperience").value;
  localStorage.setItem("user", JSON.stringify(user));
  updateStats(allAppointments);
  closeEditProfile();
  alert("Profile updated locally");
}

/* ================= DASHBOARD FEATURES ================= */

function filterAppointments(status) {
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  if (event && event.target && event.target.className.includes('filter-btn')) {
    event.target.classList.add('active');
  }

  if (status === 'all') displayAppointments(allAppointments);
  else if (status === 'today') {
    const today = new Date().toISOString().split('T')[0];
    displayAppointments(allAppointments.filter(a => a.date === today));
  }
  else if (status === 'pending') displayAppointments(allAppointments.filter(a => a.status === 'Pending'));
}

function viewTodaySchedule() {
  filterAppointments('today');
}

function viewPatients() {
  const modal = document.getElementById("patientsModal");
  const tableBody = document.getElementById("patientsTableBody");
  if (!modal || !tableBody) return;

  modal.style.display = "flex";
  const uniquePatients = {};
  allAppointments.forEach(a => {
    if (!uniquePatients[a.patientName]) {
      uniquePatients[a.patientName] = { name: a.patientName, lastVisit: a.date };
    } else if (new Date(a.date) > new Date(uniquePatients[a.patientName].lastVisit)) {
      uniquePatients[a.patientName].lastVisit = a.date;
    }
  });

  tableBody.innerHTML = Object.values(uniquePatients).map(p => `
    <tr>
      <td style="padding: 1rem;">${p.name}</td>
      <td style="padding: 1rem;">${p.lastVisit}</td>
      <td style="padding: 1rem;">
        <button class="btn-secondary" onclick="openQuickPrescription('${p.name}')">Prescribe</button>
      </td>
    </tr>
  `).join("") || '<tr><td colspan="3" style="text-align:center;">No patients found</td></tr>';
}

function closePatients() {
  document.getElementById("patientsModal").style.display = "none";
}

function viewReports() {
  const modal = document.getElementById("reportsModal");
  const content = document.getElementById("reportsContent");
  if (!modal || !content) return;

  modal.style.display = "flex";
  const completed = allAppointments.filter(a => a.status === 'Completed').length;
  content.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:10px;">
      <p>Total Appointments: <strong>${allAppointments.length}</strong></p>
      <p>Completed: <strong style="color:green;">${completed}</strong></p>
      <p>Completion Rate: <strong>${allAppointments.length ? ((completed / allAppointments.length) * 100).toFixed(1) : 0}%</strong></p>
    </div>
  `;
}

function closeReports() {
  document.getElementById("reportsModal").style.display = "none";
}

function openNewAppointment() {
  alert("Redirecting to online appointment booking portal...");
  window.location.href = "appointment.html";
}

function openQuickPrescription(pName = "") {
  if (pName) openPrescription("", pName);
  else alert("Please select a patient from the appointments list.");
}

function openNewPrescription() {
  alert("Please select an appointment from the list below.");
}

function openMessaging() {
  alert("Secure messaging module - Connect with patients.");
}

function openSettings() {
  alert("Dashboard Settings - Customize your view and preferences.");
}

function updateRecentActivity(appointments) {
  const container = document.getElementById("recentActivity");
  if (!container) return;
  const recent = appointments.slice(0, 3);
  if (recent.length === 0) {
    container.innerHTML = '<p style="text-align:center; padding:1rem;">No recent activity</p>';
    return;
  }
  container.innerHTML = recent.map(app => `
    <div class="activity-item">
      <div class="activity-icon"><i class="fa-solid ${app.status === 'Completed' ? 'fa-check-circle' : 'fa-calendar'}"></i></div>
      <div class="activity-details">
        <p class="activity-title">${app.status === 'Completed' ? 'Completed' : 'Upcoming'}: ${app.patientName}</p>
        <p class="activity-time">${app.date}</p>
      </div>
    </div>
  `).join("");
}

function logout() {
  if (confirm("Are you sure?")) {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "login.html";
  }
}

// Close dropdown/modals on click outside
window.onclick = function (e) {
  const profileMenu = document.getElementById("profileMenu");
  if (profileMenu) profileMenu.style.display = "none";

  const editModal = document.getElementById("editProfileModal");
  const prescriptionModal = document.getElementById("prescriptionModal");
  const patientsModal = document.getElementById("patientsModal");
  const reportsModal = document.getElementById("reportsModal");

  if (e.target === editModal) closeEditProfile();
  if (e.target === prescriptionModal) closePrescription();
  if (e.target === patientsModal) closePatients();
  if (e.target === reportsModal) closeReports();
  if (e.target === document.getElementById("messagingModal")) closeMessaging();
  if (e.target === document.getElementById("uploadReportModal")) closeUploadReport();
};

// Messaging Logic
async function openMessaging() {
  document.getElementById("messagingModal").style.display = "flex";
  const recipientSelect = document.getElementById("messageRecipient");
  recipientSelect.innerHTML = '<option value="">Select Patient</option>';

  // Load patient emails from allAppointments
  const patients = [...new Set(allAppointments.map(a => JSON.stringify({ email: a.patientEmail, name: a.patientName })))].map(s => JSON.parse(s));
  patients.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.email;
    opt.textContent = p.name;
    recipientSelect.appendChild(opt);
  });

  loadMessages();
  window.messageInterval = setInterval(loadMessages, 10000);
}

function closeMessaging() {
  document.getElementById("messagingModal").style.display = "none";
  if (window.messageInterval) clearInterval(window.messageInterval);
}

async function loadMessages() {
  const history = document.getElementById("messageHistory");
  if (!history) return;

  try {
    const res = await fetch(`${BASE_URL}/api/messages/my/${user.email}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });
    const data = await res.json();
    if (data.success && data.messages) {
      if (data.messages.length === 0) {
        history.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No messages yet</p>';
        return;
      }
      history.innerHTML = data.messages.map(msg => `
        <div style="margin-bottom: 0.75rem; text-align: ${msg.senderEmail === user.email ? 'right' : 'left'}">
          <div style="display: inline-block; padding: 0.5rem 0.75rem; border-radius: 12px; background: ${msg.senderEmail === user.email ? 'var(--primary-color)' : 'white'}; color: ${msg.senderEmail === user.email ? 'white' : 'var(--text-primary)'}; border: ${msg.senderEmail === user.email ? 'none' : '1px solid var(--border-color)'}; max-width: 80%;">
            <p style="margin:0; font-size: 0.95rem;">${msg.content}</p>
            <span style="font-size: 0.7rem; opacity: 0.8;">${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      `).join('');
      history.scrollTop = history.scrollHeight;
    }
  } catch (err) {
    console.error("Load messages error:", err);
  }
}

async function sendMessage() {
  const recipient = document.getElementById("messageRecipient").value;
  const content = document.getElementById("messageContent").value.trim();

  if (!recipient || !content) return;

  try {
    const res = await fetch(`${BASE_URL}/api/messages/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ receiverEmail: recipient, content })
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById("messageContent").value = "";
      loadMessages();
    }
  } catch (err) {
    alert("Error sending message");
  }
}

// Medical Report Upload Logic
function openUploadReport() {
  document.getElementById("uploadReportModal").style.display = "flex";
  const patientSelect = document.getElementById("reportPatientEmail");
  patientSelect.innerHTML = '<option value="">Select Patient</option>';

  const patients = [...new Set(allAppointments.map(a => JSON.stringify({ email: a.patientEmail, name: a.patientName })))].map(s => JSON.parse(s));
  patients.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.email;
    opt.textContent = p.name;
    patientSelect.appendChild(opt);
  });
}

function closeUploadReport() {
  document.getElementById("uploadReportModal").style.display = "none";
}

async function saveMedicalReport(e) {
  e.preventDefault();
  const patientEmail = document.getElementById("reportPatientEmail").value;
  const reportName = document.getElementById("reportName").value;
  const description = document.getElementById("reportDesc").value;
  const date = new Date().toISOString().split('T')[0];

  if (!patientEmail || !reportName) return;

  try {
    const res = await fetch(`${BASE_URL}/api/medical-reports/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ patientEmail, reportName, description, date })
    });
    const data = await res.json();
    if (data.success) {
      alert("Medical report uploaded!");
      closeUploadReport();
    }
  } catch (err) {
    alert("Error uploading report");
  }
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  loadDoctorAppointments();

  // Profile dropdown toggle
  const circle = document.getElementById("profileCircle");
  if (circle) {
    circle.addEventListener("click", (e) => {
      e.stopPropagation();
      const menu = document.getElementById("profileMenu");
      menu.style.display = menu.style.display === "flex" ? "none" : "flex";
    });
  }
});