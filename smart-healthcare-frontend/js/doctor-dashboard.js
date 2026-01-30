/* ================= KEY EXCHANGE (ADDED) ================= */
// ❌ import removed – keyExchange.js is loaded via <script> in HTML

console.log("doctor-dashboard.js loaded");

// 🔐 START KEY EXCHANGE IMMEDIATELY (GLOBAL FUNCTION)
if (typeof startKeyExchange === "function") {
  console.log("Starting key exchange...");
  startKeyExchange();
}

/* ================= AUTH CHECK ================= */
const user = JSON.parse(localStorage.getItem("user"));

if (!user || user.role !== "doctor") {
  window.location.href = "login.html";
}

/* ================= UI INIT ================= */
const welcomeEl = document.getElementById("welcome");
const profileNameEl = document.getElementById("profileName");
const profileCircleEl = document.getElementById("profileCircle");

if (welcomeEl) welcomeEl.innerText = `Welcome back, Dr. ${user.name}`;
if (profileNameEl) profileNameEl.innerText = user.name;
if (profileCircleEl)
  profileCircleEl.innerText = user.name.charAt(0).toUpperCase();

let selectedAppointmentId = null;
let allAppointments = [];
let currentFilter = 'all';

/* ================= HELPER FUNCTIONS ================= */
function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isTodayAppointment(appointmentDate) {
  const today = getTodayDate();
  return appointmentDate === today;
}

/* ================= UPDATE STATISTICS ================= */
function updateStatistics(appointments) {
  const today = getTodayDate();
  
  const totalPatients = new Set(appointments.map(app => app.patientEmail)).size;
  const todayAppointments = appointments.filter(app => app.date === today).length;
  const pendingAppointments = appointments.filter(app => 
    app.status !== "Completed" && app.status !== "Cancelled"
  ).length;
  const completedToday = appointments.filter(app => 
    app.date === today && app.status === "Completed"
  ).length;

  // Update stat cards
  const totalPatientsEl = document.getElementById("totalPatients");
  const todayAppointmentsEl = document.getElementById("todayAppointments");
  const pendingAppointmentsEl = document.getElementById("pendingAppointments");
  const completedTodayEl = document.getElementById("completedToday");

  if (totalPatientsEl) totalPatientsEl.innerText = totalPatients;
  if (todayAppointmentsEl) todayAppointmentsEl.innerText = todayAppointments;
  if (pendingAppointmentsEl) pendingAppointmentsEl.innerText = pendingAppointments;
  if (completedTodayEl) completedTodayEl.innerText = completedToday;
}

/* ================= FILTER APPOINTMENTS ================= */
function filterAppointments(filterType) {
  currentFilter = filterType;
  
  // Update active button
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  
  displayAppointments(allAppointments, filterType);
}

function displayAppointments(appointments, filter = 'all') {
  const container = document.getElementById("doctorAppointments");
  if (!container) return;

  const today = getTodayDate();
  let filteredAppointments = appointments;

  // Apply filters
  if (filter === 'today') {
    filteredAppointments = appointments.filter(app => app.date === today);
  } else if (filter === 'pending') {
    filteredAppointments = appointments.filter(app => 
      app.status !== "Completed" && app.status !== "Cancelled"
    );
  }

  const visibleAppointments = filteredAppointments.filter(
    app => app.status !== "Cancelled"
  );

  if (visibleAppointments.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <p>No ${filter === 'all' ? '' : filter} appointments found</p>
      </div>
    `;
    return;
  }

  container.innerHTML = "";

  const upcomingSection = document.createElement("div");
  const completedSection = document.createElement("div");

  upcomingSection.innerHTML = "<h3 style='margin-bottom: 1rem; color: var(--text-primary);'>Upcoming Appointments</h3>";
  completedSection.innerHTML = "<h3 style='margin-bottom: 1rem; color: var(--text-primary);'>Completed Appointments</h3>";

  let hasUpcoming = false;
  let hasCompleted = false;

  visibleAppointments.forEach(app => {
    const isCompleted = app.status === "Completed";
    const isRevoked = app.prescription?.isRevoked === true;
    const isToday = isTodayAppointment(app.date);

    const card = document.createElement("div");
    card.className = "appointment-item";
    card.style.cssText = `
      background: white;
      border: 2px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.25rem;
      margin-bottom: 1rem;
      transition: all 0.3s;
      ${isToday ? 'border-left: 4px solid var(--primary-color);' : ''}
      ${isCompleted ? 'opacity: 0.8;' : ''}
    `;

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
        <div>
          <strong style="font-size: 1.1rem; color: var(--text-primary);">👤 ${app.patientName}</strong>
          <p style="color: var(--text-secondary); margin: 0.25rem 0;">
            📅 ${app.date} at ⏰ ${app.time}
          </p>
          <span style="
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 999px;
            font-size: 0.85rem;
            font-weight: 600;
            margin-top: 0.5rem;
            ${app.status === 'Completed' 
              ? 'background: rgba(16, 185, 129, 0.1); color: var(--secondary-color);'
              : 'background: rgba(245, 158, 11, 0.1); color: var(--accent-orange);'
            }
          ">
            ${app.status}
          </span>
          ${isToday ? '<span style="margin-left: 0.5rem; padding: 0.25rem 0.75rem; background: rgba(37, 99, 235, 0.1); color: var(--primary-color); border-radius: 999px; font-size: 0.85rem; font-weight: 600;">Today</span>' : ''}
        </div>
      </div>

      ${
        isRevoked
          ? `<p style="color: var(--danger-color); font-weight: bold; padding: 0.75rem; background: rgba(239, 68, 68, 0.1); border-radius: var(--radius-md); margin: 0.75rem 0;">
               ⚠️ Prescription Revoked by Admin
             </p>`
          : ""
      }

      <div style="display: flex; gap: 0.75rem; margin-top: 1rem; flex-wrap: wrap;">
        ${
          isCompleted
            ? `
              <button 
                onclick="openEditPrescription('${app._id}')"
                ${isRevoked ? "disabled" : ""}
                style="
                  flex: 1;
                  min-width: 120px;
                  padding: 0.625rem 1rem;
                  background: var(--primary-color);
                  color: white;
                  border: none;
                  border-radius: var(--radius-md);
                  font-weight: 600;
                  cursor: pointer;
                  transition: all 0.2s;
                  ${isRevoked ? 'opacity: 0.5; cursor: not-allowed;' : ''}
                "
                ${!isRevoked ? 'onmouseover="this.style.background=\'var(--primary-dark)\'" onmouseout="this.style.background=\'var(--primary-color)\'"' : ''}
              >
                ✏️ Edit Prescription
              </button>

              <button 
                onclick="downloadPrescription('${app._id}')"
                ${isRevoked ? "disabled" : ""}
                style="
                  flex: 1;
                  min-width: 120px;
                  padding: 0.625rem 1rem;
                  background: var(--secondary-color);
                  color: white;
                  border: none;
                  border-radius: var(--radius-md);
                  font-weight: 600;
                  cursor: pointer;
                  transition: all 0.2s;
                  ${isRevoked ? 'opacity: 0.5; cursor: not-allowed;' : ''}
                "
                ${!isRevoked ? 'onmouseover="this.style.background=\'#059669\'" onmouseout="this.style.background=\'var(--secondary-color)\'"' : ''}
              >
                📥 Download PDF
              </button>
            `
            : `
              <button 
                onclick="openNewPrescription('${app._id}')"
                style="
                  flex: 1;
                  padding: 0.625rem 1rem;
                  background: var(--primary-color);
                  color: white;
                  border: none;
                  border-radius: var(--radius-md);
                  font-weight: 600;
                  cursor: pointer;
                  transition: all 0.2s;
                "
                onmouseover="this.style.background='var(--primary-dark)'"
                onmouseout="this.style.background='var(--primary-color)'"
              >
                📝 Write Prescription
              </button>
            `
        }
      </div>
    `;

    // Add hover effect
    card.onmouseenter = function() {
      this.style.boxShadow = 'var(--shadow-md)';
      this.style.transform = 'translateY(-2px)';
    };
    card.onmouseleave = function() {
      this.style.boxShadow = 'none';
      this.style.transform = 'translateY(0)';
    };

    if (isCompleted) {
      completedSection.appendChild(card);
      hasCompleted = true;
    } else {
      upcomingSection.appendChild(card);
      hasUpcoming = true;
    }
  });

  if (!hasUpcoming) {
    upcomingSection.innerHTML += "<p style='color: var(--text-secondary); font-style: italic;'>No upcoming appointments</p>";
  }

  if (!hasCompleted) {
    completedSection.innerHTML += "<p style='color: var(--text-secondary); font-style: italic;'>No completed appointments</p>";
  }

  container.appendChild(upcomingSection);
  container.appendChild(completedSection);
}

/* ================= LOAD APPOINTMENTS ================= */
async function loadDoctorAppointments() {
  const container = document.getElementById("doctorAppointments");
  if (!container) return;

  container.innerHTML = "<p class='loading'>Loading appointments...</p>";

  try {
    const res = await fetch(
      `http://localhost:5000/api/appointments/doctor/${encodeURIComponent(
        user.email
      )}`
    );
    const data = await res.json();

    if (!data.success || data.appointments.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <p>No appointments found</p>
        </div>
      `;
      updateStatistics([]);
      return;
    }

    allAppointments = data.appointments;
    
    // Update statistics
    updateStatistics(allAppointments);
    
    // Display appointments with current filter
    displayAppointments(allAppointments, currentFilter);

  } catch (err) {
    console.error(err);
    container.innerHTML = "<p style='color: var(--danger-color);'>Error loading appointments</p>";
  }
}

/* ================= PRESCRIPTION MODAL ================= */
function openNewPrescription(id) {
  // Find the appointment
  const appointment = allAppointments.find(app => app._id === id);
  
  if (!appointment) {
    alert("Appointment not found");
    return;
  }

  // Check if appointment is today
  if (!isTodayAppointment(appointment.date)) {
    alert("You can only write prescriptions for today's appointments!");
    return;
  }

  selectedAppointmentId = id;

  // Set patient name (read-only)
  const patientNameEl = document.getElementById("patientName");
  if (patientNameEl) {
    patientNameEl.value = appointment.patientName;
  }

  document.getElementById("diag").value = "";
  document.getElementById("meds").value = "";
  document.getElementById("advice").value = "";
  
  const followupDateEl = document.getElementById("followupDate");
  if (followupDateEl) {
    followupDateEl.value = "";
  }

  document.getElementById("prescriptionModal").style.display = "flex";
}

async function openEditPrescription(id) {
  selectedAppointmentId = id;

  try {
    const res = await fetch(
      `http://localhost:5000/api/appointments/doctor/${encodeURIComponent(
        user.email
      )}`
    );
    const data = await res.json();

    const app = data.appointments.find(a => a._id === id);
    if (!app || !app.prescription) {
      alert("Prescription not found");
      return;
    }

    if (app.prescription.isRevoked) {
      alert("This prescription was revoked by admin and cannot be edited.");
      return;
    }

    // Check if appointment is today for editing
    if (!isTodayAppointment(app.date)) {
      alert("You can only edit prescriptions for today's appointments!");
      return;
    }

    const looksEncrypted = (val) =>
      typeof val === "string" &&
      val.length > 40 &&
      /^[a-f0-9]+$/i.test(val);

    // Set patient name (read-only)
    const patientNameEl = document.getElementById("patientName");
    if (patientNameEl) {
      patientNameEl.value = app.patientName;
    }

    document.getElementById("diag").value =
      looksEncrypted(app.prescription.diagnosis)
        ? ""
        : app.prescription.diagnosis;

    document.getElementById("meds").value =
      looksEncrypted(app.prescription.medicines)
        ? ""
        : app.prescription.medicines;

    document.getElementById("advice").value =
      looksEncrypted(app.prescription.advice)
        ? ""
        : (app.prescription.advice || "");

    const followupDateEl = document.getElementById("followupDate");
    if (followupDateEl && app.prescription.followupDate) {
      followupDateEl.value = app.prescription.followupDate;
    }

    document.getElementById("prescriptionModal").style.display = "flex";

  } catch (err) {
    console.error(err);
    alert("Error loading prescription");
  }
}

function closePrescription() {
  document.getElementById("prescriptionModal").style.display = "none";
}

/* ================= SUBMIT PRESCRIPTION ================= */
async function submitPrescription(e) {
  e.preventDefault();

  const diagnosis = document.getElementById("diag").value.trim();
  const medicines = document.getElementById("meds").value.trim();
  const advice = document.getElementById("advice").value.trim();
  
  const followupDateEl = document.getElementById("followupDate");
  const followupDate = followupDateEl ? followupDateEl.value : "";

  if (!diagnosis || !medicines) {
    alert("Diagnosis and medicines are required");
    return;
  }

  try {
    const payload = { diagnosis, medicines, advice };
    if (followupDate) {
      payload.followupDate = followupDate;
    }

    const res = await fetch(
      `http://localhost:5000/api/appointments/prescription/${selectedAppointmentId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

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

/* ================= PDF DOWNLOAD ================= */
function downloadPrescription(id) {
  window.open(
    `http://localhost:5000/api/appointments/prescription/pdf/${id}`,
    "_blank"
  );
}

/* ================= PROFILE DROPDOWN ================= */
const profileCircle = document.getElementById("profileCircle");
const profileMenu = document.getElementById("profileMenu");

profileCircle.onclick = (e) => {
  e.stopPropagation();
  profileMenu.style.display =
    profileMenu.style.display === "flex" ? "none" : "flex";
};

document.addEventListener("click", () => {
  if (profileMenu) profileMenu.style.display = "none";
});

/* ================= EDIT PROFILE ================= */
function openEditProfile() {
  document.getElementById("editProfileModal").style.display = "flex";

  document.getElementById("docName").value = user.name || "";
  document.getElementById("docSpecialization").value =
    user.specialization || "";
  document.getElementById("docHospital").value = user.hospital || "";
  document.getElementById("docExperience").value =
    user.experience || "";
  
  const docContactEl = document.getElementById("docContact");
  const docEmailEl = document.getElementById("docEmail");
  
  if (docContactEl) docContactEl.value = user.contact || "";
  if (docEmailEl) docEmailEl.value = user.email || "";
}

function closeEditProfile() {
  document.getElementById("editProfileModal").style.display = "none";
}

function saveProfile(e) {
  e.preventDefault();

  user.name = document.getElementById("docName").value.trim();
  user.specialization = document
    .getElementById("docSpecialization")
    .value.trim();
  user.hospital = document.getElementById("docHospital").value.trim();
  user.experience = document
    .getElementById("docExperience")
    .value.trim();

  const docContactEl = document.getElementById("docContact");
  const docEmailEl = document.getElementById("docEmail");
  
  if (docContactEl) user.contact = docContactEl.value.trim();
  if (docEmailEl) user.email = docEmailEl.value.trim();

  localStorage.setItem("user", JSON.stringify(user));

  profileNameEl.innerText = user.name;
  profileCircleEl.innerText =
    user.name.charAt(0).toUpperCase();
  welcomeEl.innerText = `Welcome back, Dr. ${user.name}`;

  closeEditProfile();
  alert("Profile updated successfully");
}

/* ================= NEW DASHBOARD FUNCTIONS ================= */

// New Appointment Modal
function openNewAppointment() {
  alert("New Appointment feature - integrate with your appointment booking system");
  // TODO: Add modal for creating new appointment
}

// Quick Prescription
function openQuickPrescription() {
  alert("Quick Prescription feature - select a patient first from today's appointments");
  // TODO: Add quick prescription modal
}

// View Schedule
function viewSchedule() {
  alert("Schedule feature - showing your calendar view");
  // TODO: Navigate to schedule page or open modal
  window.location.href = "#schedule";
}

// View Patients
function viewPatients() {
  alert("Patients feature - showing your patient list");
  // TODO: Navigate to patients page or open modal
  window.location.href = "#patients";
}

// Settings
function openSettings() {
  alert("Settings feature - configure your preferences");
  // TODO: Navigate to settings page or open modal
  window.location.href = "#settings";
}

// Today's Schedule
function viewTodaySchedule() {
  // Auto-filter to today's appointments
  currentFilter = 'today';
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.textContent === 'Today') {
      btn.classList.add('active');
    }
  });
  displayAppointments(allAppointments, 'today');
}

// View Reports
function viewReports() {
  alert("Reports feature - showing analytics and reports");
  // TODO: Navigate to reports page or open modal
  window.location.href = "#reports";
}

// Messaging
function openMessaging() {
  alert("Messaging feature - communicate with patients");
  // TODO: Navigate to messaging page or open modal
  window.location.href = "#messages";
}

/* ================= LOGOUT ================= */
function logout() {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("user");
    window.location.href = "login.html";
  }
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", loadDoctorAppointments);