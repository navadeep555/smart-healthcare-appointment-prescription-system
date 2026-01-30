console.log("dashboard.js loaded");

/* ================= AUTH CHECK ================= */
const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
  window.location.href = "login.html";
}

/* ================= WELCOME ================= */
const welcomeEl = document.getElementById("welcome");
if (welcomeEl) {
  welcomeEl.innerText = `Welcome back, ${user.name}!`;
}

/* ================= PROFILE DISPLAY ================= */
const profileCircle = document.getElementById("profileCircle");
const profileName = document.getElementById("profileName");

if (profileCircle) {
  profileCircle.innerText = user.name.charAt(0).toUpperCase();
}

if (profileName) {
  profileName.innerText = user.name;
}

/* ================= PROFILE DROPDOWN ================= */
profileCircle.onclick = (e) => {
  e.stopPropagation();
  const menu = document.getElementById("profileMenu");
  menu.style.display = menu.style.display === "flex" ? "none" : "flex";
};

document.addEventListener("click", () => {
  const menu = document.getElementById("profileMenu");
  if (menu) menu.style.display = "none";
});

/* ================= UPDATE STATISTICS ================= */
function updateStatistics(appointments) {
  const total = appointments.length;
  const completed = appointments.filter(app => app.status === "Completed").length;
  const upcoming = appointments.filter(app => app.status === "Booked").length;
  const prescriptions = appointments.filter(app => app.status === "Completed" && app.prescription).length;

  const totalAppointmentsEl = document.getElementById("totalAppointments");
  const completedAppointmentsEl = document.getElementById("completedAppointments");
  const upcomingAppointmentsEl = document.getElementById("upcomingAppointments");
  const totalPrescriptionsEl = document.getElementById("totalPrescriptions");

  if (totalAppointmentsEl) totalAppointmentsEl.innerText = total;
  if (completedAppointmentsEl) completedAppointmentsEl.innerText = completed;
  if (upcomingAppointmentsEl) upcomingAppointmentsEl.innerText = upcoming;
  if (totalPrescriptionsEl) totalPrescriptionsEl.innerText = prescriptions;

  // Update notification badge
  const notificationBadge = document.getElementById("notificationBadge");
  if (notificationBadge) {
    notificationBadge.innerText = upcoming;
    notificationBadge.style.display = upcoming > 0 ? 'block' : 'none';
  }
}

/* ================= EDIT PROFILE ================= */
function openEditProfile() {
  document.getElementById("editProfileModal").style.display = "flex";
  document.getElementById("editName").value = user.name || "";
  document.getElementById("editEmail").value = user.email || "";
  
  // Load additional fields if they exist
  const editPhoneEl = document.getElementById("editPhone");
  const editDOBEl = document.getElementById("editDOB");
  const editBloodGroupEl = document.getElementById("editBloodGroup");
  const editAddressEl = document.getElementById("editAddress");
  
  if (editPhoneEl) editPhoneEl.value = user.phone || "";
  if (editDOBEl) editDOBEl.value = user.dob || "";
  if (editBloodGroupEl) editBloodGroupEl.value = user.bloodGroup || "";
  if (editAddressEl) editAddressEl.value = user.address || "";
}

function closeEditProfile() {
  document.getElementById("editProfileModal").style.display = "none";
}

function saveProfile(e) {
  e.preventDefault();

  user.name = document.getElementById("editName").value.trim();
  user.email = document.getElementById("editEmail").value.trim();

  // Save additional fields if they exist
  const editPhoneEl = document.getElementById("editPhone");
  const editDOBEl = document.getElementById("editDOB");
  const editBloodGroupEl = document.getElementById("editBloodGroup");
  const editAddressEl = document.getElementById("editAddress");
  
  if (editPhoneEl) user.phone = editPhoneEl.value.trim();
  if (editDOBEl) user.dob = editDOBEl.value;
  if (editBloodGroupEl) user.bloodGroup = editBloodGroupEl.value;
  if (editAddressEl) user.address = editAddressEl.value.trim();

  localStorage.setItem("user", JSON.stringify(user));

  profileCircle.innerText = user.name.charAt(0).toUpperCase();
  profileName.innerText = user.name;

  if (welcomeEl) {
    welcomeEl.innerText = `Welcome back, ${user.name}!`;
  }

  closeEditProfile();
  alert("Profile updated successfully!");
}

/* ================= LOGOUT ================= */
function logout() {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("user");
    window.location.href = "login.html";
  }
}

/* ================= LOAD DATA ================= */
document.addEventListener("DOMContentLoaded", () => {
  loadAppointments();
  loadPrescriptions();
});

/* ================= LOAD UPCOMING APPOINTMENTS ================= */
async function loadAppointments() {
  const container = document.getElementById("appointments");
  if (!container) return;

  container.innerHTML = "<p class='loading'>Loading appointments...</p>";

  try {
    const res = await fetch(
      `http://localhost:5000/api/appointments/my/${user.email}`
    );
    const data = await res.json();

    if (!data.success || data.appointments.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📅</div>
          <p>No appointments found</p>
        </div>
      `;
      updateStatistics([]);
      return;
    }

    // Update statistics with all appointments
    updateStatistics(data.appointments);

    const upcoming = data.appointments.filter(
      app => app.status === "Booked"
    );

    if (upcoming.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📅</div>
          <p>No upcoming appointments</p>
        </div>
      `;
      return;
    }

    container.innerHTML = "";

    upcoming.forEach(app => {
      const div = document.createElement("div");
      div.className = "appointment-item";
      div.style.cssText = `
        background: white;
        border: 2px solid var(--border-color);
        border-radius: var(--radius-lg);
        padding: 1.25rem;
        margin-bottom: 1rem;
        transition: all 0.3s;
        border-left: 4px solid var(--primary-color);
      `;

      div.innerHTML = `
        <div class="appointment-info">
          <strong style="font-size: 1.1rem; color: var(--text-primary);">
            👨‍⚕️ Dr. ${app.doctor.name}
          </strong>
          <span style="
            display: block;
            color: var(--text-secondary);
            font-size: 0.9rem;
            margin: 0.25rem 0;
          ">
            ${app.doctor.specialization}
          </span>
          <p style="
            color: var(--text-primary);
            margin: 0.5rem 0;
            font-weight: 500;
          ">
            📅 ${app.date} at ⏰ ${app.time}
          </p>
        </div>

        <button class="btn-cancel"
          style="
            margin-top: 1rem;
            padding: 0.625rem 1.5rem;
            background: var(--danger-color);
            color: white;
            border: none;
            border-radius: var(--radius-md);
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          "
          onmouseover="this.style.background='#dc2626'"
          onmouseout="this.style.background='var(--danger-color)'"
          onclick="cancelAppointment('${app._id}')">
          ❌ Cancel Appointment
        </button>
      `;

      // Add hover effect
      div.onmouseenter = function() {
        this.style.boxShadow = 'var(--shadow-md)';
        this.style.transform = 'translateY(-2px)';
      };
      div.onmouseleave = function() {
        this.style.boxShadow = 'none';
        this.style.transform = 'translateY(0)';
      };

      container.appendChild(div);
    });

  } catch (err) {
    console.error(err);
    container.innerHTML = "<p style='color: var(--danger-color);'>Error loading appointments</p>";
  }
}

/* ================= LOAD RECENT PRESCRIPTIONS ================= */
async function loadPrescriptions() {
  const container = document.getElementById("prescriptions");
  if (!container) return;

  container.innerHTML = "<p class='loading'>Loading prescriptions...</p>";

  try {
    const res = await fetch(
      `http://localhost:5000/api/appointments/my/${user.email}`
    );
    const data = await res.json();

    if (!data.success) {
      container.innerHTML = "<p style='color: var(--danger-color);'>Error loading prescriptions</p>";
      return;
    }

    const completed = data.appointments.filter(
      app => app.status === "Completed" && app.prescription
    );

    if (completed.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">💊</div>
          <p>No prescriptions yet</p>
        </div>
      `;
      return;
    }

    container.innerHTML = "";

    // Show only the 3 most recent prescriptions
    const recentPrescriptions = completed.slice(0, 3);

    recentPrescriptions.forEach(app => {
      const div = document.createElement("div");
      div.className = "prescription-item";
      div.style.cssText = `
        background: white;
        border: 2px solid var(--border-color);
        border-radius: var(--radius-lg);
        padding: 1.25rem;
        margin-bottom: 1rem;
        transition: all 0.3s;
      `;

      /* ================= HANDLE REVOKED (ADDED) ================= */
      if (app.prescription.isRevoked) {
        div.innerHTML = `
          <strong style="font-size: 1.1rem; color: var(--text-primary);">
            👨‍⚕️ Dr. ${app.doctor.name}
          </strong>
          <p style="
            color: var(--danger-color);
            font-weight: bold;
            padding: 0.75rem;
            background: rgba(239, 68, 68, 0.1);
            border-radius: var(--radius-md);
            margin-top: 0.75rem;
          ">
            ❌ Prescription revoked by Admin
          </p>
        `;
        
        // Add hover effect
        div.onmouseenter = function() {
          this.style.boxShadow = 'var(--shadow-sm)';
        };
        div.onmouseleave = function() {
          this.style.boxShadow = 'none';
        };
        
        container.appendChild(div);
        return;
      }

      /* ================= NORMAL PRESCRIPTION (ENHANCED) ================= */
      div.innerHTML = `
        <div style="margin-bottom: 1rem;">
          <strong style="font-size: 1.1rem; color: var(--text-primary);">
            👨‍⚕️ Dr. ${app.doctor.name}
          </strong>
          <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.25rem;">
            📅 ${app.date}
          </p>
        </div>

        <div style="
          background: var(--bg-light);
          padding: 1rem;
          border-radius: var(--radius-md);
          margin-bottom: 1rem;
        ">
          <p style="margin-bottom: 0.75rem;">
            <b style="color: var(--text-primary);">📋 Diagnosis:</b>
            <span style="color: var(--text-secondary); display: block; margin-top: 0.25rem;">
              ${app.prescription.diagnosis}
            </span>
          </p>
          <p style="margin-bottom: 0.75rem;">
            <b style="color: var(--text-primary);">💊 Medicines:</b>
            <span style="color: var(--text-secondary); display: block; margin-top: 0.25rem;">
              ${app.prescription.medicines}
            </span>
          </p>
          <p>
            <b style="color: var(--text-primary);">💡 Advice:</b>
            <span style="color: var(--text-secondary); display: block; margin-top: 0.25rem;">
              ${app.prescription.advice || "-"}
            </span>
          </p>
        </div>

        <button class="btn-dark"
          style="
            width: 100%;
            padding: 0.75rem;
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
          onclick="downloadPrescription('${app._id}')">
          📄 Download Prescription (PDF)
        </button>
      `;

      // Add hover effect
      div.onmouseenter = function() {
        this.style.boxShadow = 'var(--shadow-md)';
        this.style.transform = 'translateY(-2px)';
      };
      div.onmouseleave = function() {
        this.style.boxShadow = 'none';
        this.style.transform = 'translateY(0)';
      };

      container.appendChild(div);
    });

  } catch (err) {
    console.error(err);
    container.innerHTML = "<p style='color: var(--danger-color);'>Error loading prescriptions</p>";
  }
}

/* ================= DOWNLOAD PRESCRIPTION PDF ================= */
function downloadPrescription(appointmentId) {
  window.open(
    `http://localhost:5000/api/appointments/prescription/pdf/${appointmentId}`,
    "_blank"
  );
}

/* ================= CANCEL APPOINTMENT ================= */
async function cancelAppointment(appointmentId) {
  if (!confirm("Are you sure you want to cancel this appointment?")) return;

  try {
    const res = await fetch(
      `http://localhost:5000/api/appointments/cancel/${appointmentId}`,
      { method: "PUT" }
    );

    const data = await res.json();

    if (data.success) {
      alert("Appointment cancelled successfully");
      loadAppointments();
      loadPrescriptions();
    } else {
      alert(data.message || "Failed to cancel appointment");
    }

  } catch (err) {
    console.error(err);
    alert("Server error while cancelling appointment");
  }
}

/* ================= NEW DASHBOARD FUNCTIONS ================= */

// View Prescription History
function viewPrescriptionHistory() {
  alert("Prescription History - Redirecting to full prescription list");
  // TODO: Create a dedicated prescription history page
  window.location.href = "#prescriptions";
}

// View Lab Reports
function viewLabReports() {
  alert("Lab Reports feature - View all your lab test results");
  // TODO: Integrate with lab reports system
  window.location.href = "#lab-reports";
}

// Health Metrics
function openHealthMetrics() {
  alert("Health Metrics - Track your vitals and health indicators");
  // TODO: Create health metrics dashboard
  window.location.href = "#health-metrics";
}

// Settings
function openSettings() {
  alert("Settings - Configure your preferences");
  // TODO: Create settings page
  window.location.href = "#settings";
}

// Emergency Contact Modal
function openEmergencyContact() {
  document.getElementById("emergencyModal").style.display = "flex";
}

function closeEmergencyContact() {
  document.getElementById("emergencyModal").style.display = "none";
}

/* ================= CLOSE MODALS ON OUTSIDE CLICK ================= */
window.onclick = function(event) {
  const editModal = document.getElementById("editProfileModal");
  const emergencyModal = document.getElementById("emergencyModal");
  
  if (event.target === editModal) {
    closeEditProfile();
  }
  
  if (event.target === emergencyModal) {
    closeEmergencyContact();
  }
}