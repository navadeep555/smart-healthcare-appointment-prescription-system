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

function formatDoctorName(name) {
  if (!name) return "";
  const trimmed = name.trim();
  if (trimmed.toLowerCase().startsWith("dr.") || trimmed.toLowerCase().startsWith("dr ")) {
    return trimmed;
  }
  return `Dr. ${trimmed}`;
}

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
document.addEventListener("DOMContentLoaded", async () => {
  const appointments = await loadAppointments();
  loadPrescriptions();
  if (appointments) updateRecentActivity(appointments);
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
          <div class="empty-state-icon"><i class="fa-solid fa-calendar-alt"></i></div>
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
          <div class="empty-state-icon"><i class="fa-solid fa-calendar-check"></i></div>
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
            <i class="fa-solid fa-user-md"></i> ${formatDoctorName(app.doctor.name)}
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
            <i class="fa-solid fa-calendar"></i> ${app.date} at <i class="fa-solid fa-clock"></i> ${app.time}
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
          <i class="fa-solid fa-times"></i> Cancel Appointment
        </button>
      `;

      // Add hover effect
      div.onmouseenter = function () {
        this.style.boxShadow = 'var(--shadow-md)';
        this.style.transform = 'translateY(-2px)';
      };
      div.onmouseleave = function () {
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
          <div class="empty-state-icon"><i class="fa-solid fa-pills"></i></div>
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
          <i class="fa-solid fa-user-md"></i> ${formatDoctorName(app.doctor.name)}
        </strong>
        <p style="
          color: var(--danger-color);
          font-weight: bold;
          padding: 0.75rem;
          background: rgba(239, 68, 68, 0.1);
          border-radius: var(--radius-md);
          margin-top: 0.75rem;
        ">
          <i class="fa-solid fa-times-circle"></i> Prescription revoked by Admin
        </p>
        `;

        // Add hover effect
        div.onmouseenter = function () {
          this.style.boxShadow = 'var(--shadow-sm)';
        };
        div.onmouseleave = function () {
          this.style.boxShadow = 'none';
        };

        container.appendChild(div);
        return;
      }

      /* ================= NORMAL PRESCRIPTION (ENHANCED) ================= */
      div.innerHTML = `
        <div style="margin-bottom: 1rem;">
          <strong style="font-size: 1.1rem; color: var(--text-primary);">
            <i class="fa-solid fa-user-md"></i> ${formatDoctorName(app.doctor.name)}
          </strong>
          <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.25rem;">
            <i class="fa-solid fa-calendar"></i> ${app.date}
          </p>
        </div>

        <div style="
          background: var(--bg-light);
          padding: 1rem;
          border-radius: var(--radius-md);
          margin-bottom: 1rem;
        ">
          <p style="margin-bottom: 0.75rem;">
            <b style="color: var(--text-primary);"><i class="fa-solid fa-clipboard-check"></i> Diagnosis:</b>
            <span style="color: var(--text-secondary); display: block; margin-top: 0.25rem;">
              ${app.prescription.diagnosis}
            </span>
          </p>
          <p style="margin-bottom: 0.75rem;">
            <b style="color: var(--text-primary);"><i class="fa-solid fa-pills"></i> Medicines:</b>
            <span style="color: var(--text-secondary); display: block; margin-top: 0.25rem;">
              ${app.prescription.medicines}
            </span>
          </p>
          <p>
            <b style="color: var(--text-primary);"><i class="fa-solid fa-lightbulb"></i> Advice:</b>
            <span style="color: var(--text-secondary); display: block; margin-top: 0.25rem;">
              ${app.prescription.advice || "-"}
            </span>
          </p>
        </div>

        <div style="
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 1rem;
          padding: 8px 12px;
          background: ${app.prescription.isValid ? '#ecfdf5' : '#fef2f2'};
          border-radius: var(--radius-md);
          border: 1px solid ${app.prescription.isValid ? '#10b981' : '#ef4444'};
        ">
          <i class="fa-solid ${app.prescription.isValid ? 'fa-shield-check' : 'fa-triangle-exclamation'}" 
             style="color: ${app.prescription.isValid ? '#10b981' : '#ef4444'}"></i>
          <span style="font-size: 0.85rem; font-weight: 600; color: ${app.prescription.isValid ? '#10b981' : '#ef4444'}">
            ${app.prescription.isValid ? 'INTEGRITY VERIFIED (Digital Signature Valid)' : 'SIGNATURE MISMATCH / MODIFIED'}
          </span>
        </div>

        <div style="margin-top: 1rem;">
          <button class="btn-primary"
            style="
              padding: 0.75rem;
              background: var(--primary-color);
              color: white;
              border: none;
              border-radius: var(--radius-md);
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s;
              width: 100%;
            "
            onmouseover="this.style.background='var(--primary-dark)'"
            onmouseout="this.style.background='var(--primary-color)'"
            onclick="downloadPrescription('${app._id}')">
            <i class="fa-solid fa-file-pdf"></i> Download PDF
          </button>
        </div>
      `;

      // Add hover effect
      div.onmouseenter = function () {
        this.style.boxShadow = 'var(--shadow-md)';
        this.style.transform = 'translateY(-2px)';
      };
      div.onmouseleave = function () {
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

// Health Metrics
async function openHealthMetrics() {
  document.getElementById("healthMetricsModal").style.display = "flex";

  try {
    const res = await fetch(`http://localhost:5000/api/health-metrics/my/${user.email}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });
    const data = await res.json();

    if (data.success && data.metrics) {
      document.getElementById("metricWeight").value = data.metrics.weight || "";
      document.getElementById("metricBP").value = data.metrics.bloodPressure || "";
      document.getElementById("metricBloodGroup").value = data.metrics.bloodGroup || "";
      document.getElementById("metricSugar").value = data.metrics.bloodSugar || "";
    }
  } catch (err) {
    console.error("Error loading metrics:", err);
  }
}

function closeHealthMetrics() {
  document.getElementById("healthMetricsModal").style.display = "none";
}

async function saveHealthMetrics(e) {
  e.preventDefault();

  const payload = {
    email: user.email,
    weight: document.getElementById("metricWeight").value,
    bloodPressure: document.getElementById("metricBP").value,
    bloodGroup: document.getElementById("metricBloodGroup").value,
    bloodSugar: document.getElementById("metricSugar").value
  };

  try {
    const res = await fetch("http://localhost:5000/api/health-metrics/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
      alert("Health metrics updated!");
      closeHealthMetrics();
      // Update local storage if blood group changed
      if (payload.bloodGroup) {
        user.bloodGroup = payload.bloodGroup;
        localStorage.setItem("user", JSON.stringify(user));
      }
    }
  } catch (err) {
    alert("Error updating metrics");
  }
}

// Prescription History
async function viewPrescriptionHistory() {
  document.getElementById("prescriptionHistoryModal").style.display = "flex";
  const content = document.getElementById("prescriptionHistoryContent");
  content.innerHTML = '<p class="loading">Fetching your medical history...</p>';

  try {
    const res = await fetch(`http://localhost:5000/api/appointments/my/${user.email}`);
    const data = await res.json();

    if (data.success) {
      const completed = data.appointments.filter(app => app.status === "Completed" && app.prescription);

      if (completed.length === 0) {
        content.innerHTML = '<p>No past prescriptions found.</p>';
        return;
      }

      content.innerHTML = completed.map(app => `
        <div style="border: 1px solid var(--border-color); padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.5rem;">
            <strong>${formatDoctorName(app.doctor.name)}</strong>
            <span style="font-size: 0.85rem; color: var(--text-secondary);">${app.date}</span>
          </div>
          <p><b>Diagnosis:</b> ${app.prescription.diagnosis}</p>
          <p><b>Medicines:</b> ${app.prescription.medicines}</p>
          <div style="display: flex; align-items: center; gap: 6px; font-size: 0.8rem; margin: 0.5rem 0; color: ${app.prescription.isValid ? '#10b981' : '#ef4444'}">
            <i class="fa-solid ${app.prescription.isValid ? 'fa-check-double' : 'fa-times-circle'}"></i>
            <b>${app.prescription.isValid ? 'Verified Signature' : 'Invalid Signature'}</b>
          </div>
          <button class="btn-secondary" onclick="downloadPrescription('${app._id}')" style="margin-top: 0.5rem; padding: 0.4rem 1rem; font-size: 0.85rem;">
            <i class="fa-solid fa-download"></i> PDF
          </button>
        </div>
      `).join('');
    }
  } catch (err) {
    content.innerHTML = '<p style="color:red;">Error loading history.</p>';
  }
}

function closePrescriptionHistory() {
  document.getElementById("prescriptionHistoryModal").style.display = "none";
}

// Update Recent Activity
function updateRecentActivity(appointments) {
  const container = document.getElementById("recentActivity");
  if (!container) return;

  const recent = appointments.slice(0, 3);
  if (recent.length === 0) {
    container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 1rem;">No recent activity</p>';
    return;
  }

  container.innerHTML = "";
  recent.forEach(app => {
    let icon = '<i class="fa-solid fa-calendar-check" style="color: var(--primary-color)"></i>';
    let title = `Appointment booked with ${formatDoctorName(app.doctor.name)}`;

    if (app.status === "Completed") {
      icon = '<i class="fa-solid fa-check-circle" style="color: var(--secondary-color)"></i>';
      title = `Prescription received from ${formatDoctorName(app.doctor.name)}`;
    }

    const item = document.createElement("div");
    item.className = "activity-item";
    item.innerHTML = `
      <div class="activity-icon">${icon}</div>
      <div class="activity-details">
        <p class="activity-title">${title}</p>
        <p class="activity-time">${app.date}</p>
      </div>
    `;
    container.appendChild(item);
  });
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
window.onclick = function (event) {
  const editModal = document.getElementById("editProfileModal");
  const emergencyModal = document.getElementById("emergencyModal");

  if (event.target === editModal) {
    closeEditProfile();
  }

  if (event.target === emergencyModal) {
    closeEmergencyContact();
  }

  if (event.target === document.getElementById("healthMetricsModal")) {
    closeHealthMetrics();
  }

  if (event.target === document.getElementById("prescriptionHistoryModal")) {
    closePrescriptionHistory();
  }

  if (event.target === document.getElementById("labReportsModal")) {
    closeLabReports();
  }

  if (event.target === document.getElementById("messagingModal")) {
    closeMessaging();
  }
}

// Lab Reports
async function viewLabReports() {
  document.getElementById("labReportsModal").style.display = "flex";
  const content = document.getElementById("labReportsContent");
  content.innerHTML = '<p class="loading">Fetching your reports...</p>';

  try {
    const res = await fetch(`http://localhost:5000/api/medical-reports/patient/${user.email}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });
    const data = await res.json();

    if (data.success && data.reports.length > 0) {
      content.innerHTML = data.reports.map(rep => `
        <div style="border: 1px solid var(--border-color); padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1rem; background: white;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.5rem;">
            <strong>${rep.reportName}</strong>
            <span style="font-size: 0.85rem; color: var(--text-secondary);">${rep.date}</span>
          </div>
          <p style="font-size: 0.9rem; color: var(--text-secondary);">${rep.description || "No description"}</p>
          <p style="font-size: 0.85rem; margin-top: 0.5rem;">Uploaded by: <b>${formatDoctorName(rep.doctorEmail)}</b></p>
        </div>
      `).join('');
    } else {
      content.innerHTML = '<p style="text-align:center; padding: 2rem;">No lab reports found.</p>';
    }
  } catch (err) {
    content.innerHTML = '<p style="color:red;">Error loading reports.</p>';
  }
}

function closeLabReports() {
  document.getElementById("labReportsModal").style.display = "none";
}

// Messaging Logic
async function openMessaging() {
  document.getElementById("messagingModal").style.display = "flex";

  // Load Doctors into select (We can get them from appointments)
  const recipientSelect = document.getElementById("messageRecipient");
  recipientSelect.innerHTML = '<option value="">Select Doctor</option>';

  try {
    // Ideally we should have a list-doctors API, but for now we'll use doctors from appointments
    const res = await fetch(`http://localhost:5000/api/appointments/my/${user.email}`);
    const data = await res.json();
    if (data.success) {
      const doctors = [...new Set(data.appointments.map(a => JSON.stringify({ email: a.doctor.email, name: a.doctor.name })))].map(s => JSON.parse(s));
      doctors.forEach(doc => {
        const opt = document.createElement("option");
        opt.value = doc.email;
        opt.textContent = formatDoctorName(doc.name);
        recipientSelect.appendChild(opt);
      });
    }

    loadMessages();
    // Auto-refresh messages every 10 seconds while modal is open
    window.messageInterval = setInterval(loadMessages, 10000);
  } catch (err) {
    console.error("Messaging init error:", err);
  }
}

function closeMessaging() {
  document.getElementById("messagingModal").style.display = "none";
  if (window.messageInterval) clearInterval(window.messageInterval);
}

async function loadMessages() {
  const history = document.getElementById("messageHistory");
  if (!history) return;

  try {
    const res = await fetch(`http://localhost:5000/api/messages/my/${user.email}`, {
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
    const res = await fetch("http://localhost:5000/api/messages/send", {
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


