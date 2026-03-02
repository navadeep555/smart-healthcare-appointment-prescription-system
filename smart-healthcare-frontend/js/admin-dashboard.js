
/* ================= AUTH CHECK ================= */
const user = JSON.parse(localStorage.getItem("user"));
const token = localStorage.getItem("token");

if (!user || user.role !== "admin" || !token) {
  alert("Unauthorized access");
  window.location.href = "login.html";
}

/* ================= DOM ELEMENTS ================= */
const usersEl = document.getElementById("users");
const doctorsEl = document.getElementById("doctors");
const patientsEl = document.getElementById("patients");
const appointmentsEl = document.getElementById("appointments");
const prescriptionTable = document.getElementById("prescriptionTable");

// Additional stat elements
const activePrescriptionsEl = document.getElementById("activePrescriptions");
const revokedPrescriptionsEl = document.getElementById("revokedPrescriptions");
const invalidSignaturesEl = document.getElementById("invalidSignatures");
const todayAppointmentsEl = document.getElementById("todayAppointments");
const todayCompletedEl = document.getElementById("todayCompleted");
const todayCancelledEl = document.getElementById("todayCancelled");

// Store all prescriptions for filtering
let allPrescriptions = [];

function formatDoctorName(name) {
  if (!name) return "";
  const trimmed = name.trim();
  if (trimmed.toLowerCase().startsWith("dr.") || trimmed.toLowerCase().startsWith("dr ")) {
    return trimmed;
  }
  return `Dr. ${trimmed}`;
}

/* ================= PROFILE SETUP ================= */
const profileCircle = document.getElementById("profileCircle");
const profileName = document.getElementById("profileName");
const profileMenu = document.getElementById("profileMenu");

if (profileCircle && user) {
  profileCircle.innerText = user.name ? user.name.charAt(0).toUpperCase() : "A";
}

if (profileName && user) {
  profileName.innerText = user.name || "Admin";
}

// Profile dropdown toggle
if (profileCircle) {
  profileCircle.onclick = (e) => {
    e.stopPropagation();
    if (profileMenu) {
      profileMenu.style.display =
        profileMenu.style.display === "flex" ? "none" : "flex";
    }
  };
}

// Close dropdown when clicking outside
document.addEventListener("click", () => {
  if (profileMenu) profileMenu.style.display = "none";
});

/* ================= LOAD DASHBOARD DATA ================= */
async function loadAdminDashboard() {
  try {
    await loadStats();
    await loadPrescriptionAudit();

    // Check which tab is active and load its data
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab.id === 'users-tab') loadUserManagement();
    if (activeTab.id === 'appointments-tab') loadAppointmentManagement();
    if (activeTab.id === 'analytics-tab') loadAnalytics();

  } catch (err) {
    console.error("ADMIN DASHBOARD ERROR:", err);
  }
}

/* ================= LOAD STATS ================= */
async function loadStats() {
  try {
    /* -------- USERS / DOCTORS / PATIENTS -------- */
    const usersRes = await fetch(`${BASE_URL}/api/admin/users-v2`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const usersData = await usersRes.json();

    if (usersData.success) {
      usersEl.innerText = usersData.total;
      doctorsEl.innerText = usersData.doctors;
      patientsEl.innerText = usersData.patients;
    }

    /* -------- APPOINTMENTS -------- */
    const appRes = await fetch(`${BASE_URL}/api/admin/appointments-v2`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const appData = await appRes.json();

    if (appData.success) {
      appointmentsEl.innerText = appData.total;

      // Calculate today's stats
      const today = new Date().toISOString().split('T')[0];
      const todayApps = appData.appointments?.filter(app =>
        app.date === today
      ) || [];

      if (todayAppointmentsEl) todayAppointmentsEl.innerText = todayApps.length;
      if (todayCompletedEl) {
        todayCompletedEl.innerText = todayApps.filter(app =>
          app.status === "Completed"
        ).length;
      }
      if (todayCancelledEl) {
        todayCancelledEl.innerText = todayApps.filter(app =>
          app.status === "Cancelled"
        ).length;
      }
    }

  } catch (err) {
    console.error("STATS ERROR:", err);
  }
}

/* ================= PRESCRIPTION AUDIT ================= */
async function loadPrescriptionAudit() {
  prescriptionTable.innerHTML =
    "<tr><td colspan='6' style='text-align: center;'><p class='loading'>Loading prescriptions...</p></td></tr>";

  try {
    const res = await fetch(
      `${BASE_URL}/api/admin/prescriptions-v2`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await res.json();

    if (!data.success || data.prescriptions.length === 0) {
      prescriptionTable.innerHTML =
        "<tr><td colspan='6' style='text-align: center;'><div class='empty-state'><div class='empty-state-icon'><i class='fa-solid fa-clipboard-list'></i></div><p>No prescriptions found</p></div></td></tr>";
      return;
    }

    // Store prescriptions for filtering
    allPrescriptions = data.prescriptions;

    // Update additional stats
    updatePrescriptionStats(allPrescriptions);

    // Display prescriptions
    displayPrescriptions(allPrescriptions);

  } catch (err) {
    console.error("AUDIT ERROR:", err);
    prescriptionTable.innerHTML =
      "<tr><td colspan='6' style='text-align: center; color: var(--danger-color);'>Error loading prescription data</td></tr>";
  }
}

/* ================= UPDATE PRESCRIPTION STATISTICS ================= */
function updatePrescriptionStats(prescriptions) {
  const active = prescriptions.filter(p => !p.isRevoked).length;
  const revoked = prescriptions.filter(p => p.isRevoked).length;
  const invalid = prescriptions.filter(p => !p.isValid && !p.isRevoked).length;

  if (activePrescriptionsEl) activePrescriptionsEl.innerText = active;
  if (revokedPrescriptionsEl) revokedPrescriptionsEl.innerText = revoked;
  if (invalidSignaturesEl) invalidSignaturesEl.innerText = invalid;

  // Update notification badge
  const notificationBadge = document.getElementById("adminNotificationBadge");
  if (notificationBadge) {
    const alertCount = invalid + revoked;
    notificationBadge.innerText = alertCount;
    notificationBadge.style.display = alertCount > 0 ? 'block' : 'none';
  }
}

/* ================= DISPLAY PRESCRIPTIONS ================= */
function displayPrescriptions(prescriptions) {
  if (prescriptions.length === 0) {
    prescriptionTable.innerHTML =
      "<tr><td colspan='6' style='text-align: center;'><div class='empty-state'><div class='empty-state-icon'><i class='fa-solid fa-clipboard-list'></i></div><p>No prescriptions match the filters</p></div></td></tr>";
    return;
  }

  prescriptionTable.innerHTML = "";

  prescriptions.forEach(p => {
    const row = document.createElement("tr");
    row.style.transition = "all 0.2s";

    row.innerHTML = `
      <td>
        <strong>${p.patientName}</strong>
      </td>
      <td>
        <strong>${formatDoctorName(p.doctorName)}</strong>
      </td>
      <td>${new Date(p.date).toLocaleDateString()}</td>

      <!-- Signature Status (FIXED LOGIC) -->
      <td class="${p.isRevoked ? "invalid" : p.isValid ? "valid" : "invalid"
      }">
        ${p.isRevoked
        ? "[Revoked]"
        : p.isValid
          ? "Verified"
          : "Invalid"
      }
      </td>

      <!-- Revocation Status -->
      <td>
        ${p.isRevoked
        ? "<span style='color: var(--danger-color); font-weight: bold; padding: 0.25rem 0.75rem; background: rgba(239, 68, 68, 0.1); border-radius: 999px; font-size: 0.85rem;'>Revoked</span>"
        : "<span style='color: var(--secondary-color); font-weight: bold; padding: 0.25rem 0.75rem; background: rgba(16, 185, 129, 0.1); border-radius: 999px; font-size: 0.85rem;'>Active</span>"
      }
      </td>

      <!-- Admin Actions -->
      <td>
        <button 
          onclick="viewPrescriptionDetails('${p._id}')"
          class="admin-btn view-btn"
          title="View Details"
        >
          <i class="fa-solid fa-eye"></i> View
        </button>

        <button 
          onclick="editPrescription('${p._id}', ${p.isRevoked})"
          class="admin-btn edit-btn"
          ${p.isRevoked ? "disabled" : ""}
          title="Edit Prescription"
        >
          <i class="fa-solid fa-pen"></i> Edit
        </button>

        <button 
          onclick="revokePrescription('${p._id}')"
          class="admin-btn delete-btn"
          ${p.isRevoked ? "disabled" : ""}
          title="${p.isRevoked ? 'Already Revoked' : 'Revoke Prescription'}"
        >
          ${p.isRevoked ? "Revoked" : "Revoke"}
        </button>
      </td>
    `;

    prescriptionTable.appendChild(row);
  });
}

/* ================= FILTER PRESCRIPTIONS ================= */
function applyFilters() {
  const statusFilter = document.getElementById("filterStatus").value;
  const dateFrom = document.getElementById("filterDateFrom").value;
  const dateTo = document.getElementById("filterDateTo").value;

  let filtered = [...allPrescriptions];

  // Status filter
  if (statusFilter !== "all") {
    if (statusFilter === "active") {
      filtered = filtered.filter(p => !p.isRevoked);
    } else if (statusFilter === "revoked") {
      filtered = filtered.filter(p => p.isRevoked);
    } else if (statusFilter === "invalid") {
      filtered = filtered.filter(p => !p.isValid && !p.isRevoked);
    }
  }

  // Date filters
  if (dateFrom) {
    filtered = filtered.filter(p =>
      new Date(p.date) >= new Date(dateFrom)
    );
  }

  if (dateTo) {
    filtered = filtered.filter(p =>
      new Date(p.date) <= new Date(dateTo)
    );
  }

  displayPrescriptions(filtered);
}

function clearFilters() {
  document.getElementById("filterStatus").value = "all";
  document.getElementById("filterDateFrom").value = "";
  document.getElementById("filterDateTo").value = "";
  displayPrescriptions(allPrescriptions);
}

/* ================= VIEW PRESCRIPTION DETAILS ================= */
async function viewPrescriptionDetails(id) {
  const modal = document.getElementById("prescriptionDetailsModal");
  const content = document.getElementById("prescriptionDetailsContent");

  if (!modal || !content) return;

  modal.style.display = "flex";
  content.innerHTML = "<p class='loading'>Loading prescription details...</p>";

  try {
    // Find prescription from allPrescriptions
    const prescription = allPrescriptions.find(p => p._id === id);

    if (!prescription) {
      content.innerHTML = "<p style='color: var(--danger-color);'>Prescription not found</p>";
      return;
    }

    content.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <div>
          <h3 style="color: var(--text-primary); margin-bottom: 0.5rem;">Patient Information</h3>
          <p><strong>Name:</strong> ${prescription.patientName}</p>
          <p><strong>Email:</strong> ${prescription.patientEmail || 'N/A'}</p>
        </div>
        
        <div>
          <h3 style="color: var(--text-primary); margin-bottom: 0.5rem;">Doctor Information</h3>
          <p><strong>Name:</strong> ${formatDoctorName(prescription.doctorName)}</p>
          <p><strong>Email:</strong> ${prescription.doctorEmail || 'N/A'}</p>
        </div>
        
        <div>
          <h3 style="color: var(--text-primary); margin-bottom: 0.5rem;">Prescription Details</h3>
          <p><strong>Date:</strong> ${new Date(prescription.date).toLocaleDateString()}</p>
          <p><strong>Diagnosis:</strong> ${prescription.diagnosis || 'N/A'}</p>
          <p><strong>Medicines:</strong> ${prescription.medicines || 'N/A'}</p>
          <p><strong>Advice:</strong> ${prescription.advice || 'N/A'}</p>
        </div>
        
        <div>
          <h3 style="color: var(--text-primary); margin-bottom: 0.5rem;">Status</h3>
          <p><strong>Signature:</strong> 
            <span class="${prescription.isValid ? 'valid' : 'invalid'}">
              ${prescription.isValid ? 'Verified' : 'Invalid'}
            </span>
          </p>
          <p><strong>Revocation Status:</strong> 
            <span style="color: ${prescription.isRevoked ? 'var(--danger-color)' : 'var(--secondary-color)'};">
              ${prescription.isRevoked ? 'Revoked' : 'Active'}
            </span>
          </p>
        </div>
      </div>
    `;
  } catch (err) {
    console.error("Error loading prescription details:", err);
    content.innerHTML = "<p style='color: var(--danger-color);'>Error loading details</p>";
  }
}

function closePrescriptionDetails() {
  const modal = document.getElementById("prescriptionDetailsModal");
  if (modal) modal.style.display = "none";
}

/* ================= ADMIN ACTIONS ================= */

// Edit prescription (admin override)
async function editPrescription(id, isRevoked) {

  if (isRevoked) {
    alert("This prescription has been revoked and cannot be edited.");
    return;
  }

  const newDiagnosis = prompt("Enter updated diagnosis:");
  if (newDiagnosis === null) return; // User cancelled

  const newMedicines = prompt("Enter updated medicines:");
  if (newMedicines === null) return; // User cancelled

  const newAdvice = prompt("Enter updated advice:");
  if (newAdvice === null) return; // User cancelled

  if (!newDiagnosis || !newMedicines) {
    alert("Diagnosis and medicines are required");
    return;
  }

  try {
    const res = await fetch(
      `${BASE_URL}/api/admin/prescription/edit/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          diagnosis: newDiagnosis,
          medicines: newMedicines,
          advice: newAdvice
        })
      }
    );

    const data = await res.json();
    alert(data.message || "Prescription updated successfully");

    loadPrescriptionAudit();
  } catch (err) {
    console.error("Edit error:", err);
    alert("Failed to edit prescription");
  }
}

// Revoke prescription
async function revokePrescription(id) {
  if (!confirm("Are you sure you want to revoke this prescription? This action cannot be undone.")) return;

  try {
    const res = await fetch(
      `${BASE_URL}/api/admin/prescription/revoke/${id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await res.json();
    alert(data.message || "Prescription revoked successfully");

    loadPrescriptionAudit();
  } catch (err) {
    console.error("Revoke error:", err);
    alert("Failed to revoke prescription");
  }
}

/* ================= TAB SWITCHING ================= */
function switchTab(tabName) {
  // Hide all tab contents
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });

  // Remove active class from all tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
  });

  // Show selected tab content
  const selectedTab = document.getElementById(`${tabName}-tab`);
  if (selectedTab) {
    selectedTab.classList.add('active');
  }

  // Add active class to clicked tab
  if (event && event.target) {
    event.target.classList.add('active');
  }

  // Load specific tab data
  if (tabName === 'users') loadUserManagement();
  if (tabName === 'appointments') loadAppointmentManagement();
  if (tabName === 'analytics') loadAnalytics();
  if (tabName === 'prescriptions') loadPrescriptionAudit();
}

/* ================= USER MANAGEMENT LOGIC ================= */
async function loadUserManagement() {
  const tableBody = document.getElementById("userTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading users...</td></tr>';

  try {
    const res = await fetch(`${BASE_URL}/api/admin/users-list`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    if (data.success) {
      tableBody.innerHTML = "";
      data.users.forEach(u => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${u.name}</td>
          <td>${u.email}</td>
          <td><span class="tag role-${u.role}">${u.role}</span></td>
          <td>
            <button class="admin-btn delete-btn" onclick="deleteUser('${u._id}', '${u.role}')">
              <i class="fa-solid fa-trash"></i> Delete
            </button>
          </td>
        `;
        tableBody.appendChild(row);
      });
    }
  } catch (err) {
    tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">Error loading users</td></tr>';
  }
}

async function deleteUser(id, role) {
  if (!confirm(`Are you sure you want to delete this ${role}?`)) return;

  try {
    const endpoint = role === 'doctor' ? `doctor/${id}` : `patient/${id}`;
    const res = await fetch(`${BASE_URL}/api/admin/${endpoint}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    if (data.success) {
      alert(data.message);
      loadUserManagement();
      loadStats();
    }
  } catch (err) {
    alert("Error deleting user");
  }
}

/* ================= APPOINTMENT MANAGEMENT LOGIC ================= */
async function loadAppointmentManagement() {
  const tableBody = document.getElementById("appointmentTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading appointments...</td></tr>';

  try {
    const res = await fetch(`${BASE_URL}/api/admin/appointments-v2`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    if (data.success) {
      tableBody.innerHTML = "";
      data.appointments.forEach(a => {
        const row = document.createElement("tr");
        const statusColor = a.status === 'Cancelled' ? 'red' : a.status === 'Completed' ? 'green' : 'blue';
        row.innerHTML = `
          <td>${a.patientName}</td>
          <td>${formatDoctorName(a.doctor?.name)}</td>
          <td>${a.date} | ${a.time}</td>
          <td><b style="color:${statusColor}">${a.status}</b></td>
          <td>
             <button class="admin-btn view-btn" onclick="viewPrescriptionDetails('${a._id}')">
               <i class="fa-solid fa-eye"></i> View
             </button>
          </td>
        `;
        tableBody.appendChild(row);
      });
    }
  } catch (err) {
    tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Error loading appointments</td></tr>';
  }
}

/* ================= ANALYTICS LOGIC ================= */
async function loadAnalytics() {
  const container = document.getElementById("analyticsContent");
  if (!container) return;

  container.innerHTML = '<p style="text-align:center;">Generating insights...</p>';

  try {
    const [usersRes, appsRes, prescriptionsRes] = await Promise.all([
      fetch(`${BASE_URL}/api/admin/users-v2`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${BASE_URL}/api/admin/appointments-v2`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${BASE_URL}/api/admin/prescriptions-v2`, { headers: { Authorization: `Bearer ${token}` } })
    ]);

    const usersData = await usersRes.json();
    const appsData = await appsRes.json();
    const prescriptionsData = await prescriptionsRes.json();

    const activePrescriptions = prescriptionsData.prescriptions.filter(p => !p.isRevoked).length;
    const revokedPrescriptions = prescriptionsData.prescriptions.filter(p => p.isRevoked).length;

    container.innerHTML = `
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
        <div class="chart-card">
          <h3>User Population</h3>
          <p>Doctors: <strong>${usersData.doctors}</strong></p>
          <p>Patients: <strong>${usersData.patients}</strong></p>
          <p>Ratio: <strong>${(usersData.patients / (usersData.doctors || 1)).toFixed(1)} patients per doctor</strong></p>
        </div>
        <div class="chart-card">
          <h3>Prescription Audit</h3>
          <p>Total Issued: <strong>${prescriptionsData.prescriptions.length}</strong></p>
          <p>Active: <strong style="color:green;">${activePrescriptions}</strong></p>
          <p>Revoked: <strong style="color:red;">${revokedPrescriptions}</strong></p>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = '<p style="text-align:center; color:red;">Error loading analytics</p>';
  }
}

/* ================= NEW DASHBOARD FUNCTIONS ================= */

// Refresh Dashboard
function refreshDashboard() {
  loadAdminDashboard();
  alert("Dashboard refreshed successfully!");
}

// Export Data
function exportData() {
  alert("Export Data feature - Download CSV/Excel reports");
  // TODO: Implement data export functionality
}

// View System Logs
function viewSystemLogs() {
  alert("System Logs - View system activity and error logs");
  // TODO: Navigate to system logs page
  window.location.href = "#system-logs";
}

// View User Management
function viewUserManagement() {
  switchTab('users');
  // Highlight the Users tab
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
    if (tab.textContent.includes('User Management')) {
      tab.classList.add('active');
    }
  });
}

// View Reports
function viewReports() {
  switchTab('analytics');
  // Highlight the Analytics tab
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
    if (tab.textContent.includes('Analytics')) {
      tab.classList.add('active');
    }
  });
}

// Settings
function openSettings() {
  alert("Settings - Configure system preferences");
  // TODO: Open settings modal or navigate to settings page
}

/* ================= LOGOUT ================= */
function logout() {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "login.html";
  }
}

/* ================= CLOSE MODALS ON OUTSIDE CLICK ================= */
window.onclick = function (event) {
  const modal = document.getElementById("prescriptionDetailsModal");
  if (event.target === modal) {
    closePrescriptionDetails();
  }
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", loadAdminDashboard);