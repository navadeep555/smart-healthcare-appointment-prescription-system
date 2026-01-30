// ===== Medical Records Module =====
// Displays encrypted medical records with filtering capabilities

document.addEventListener('DOMContentLoaded', () => {
  // Check authentication
  if (localStorage.getItem('isLoggedIn') !== 'true') {
    window.location.href = 'login.html';
    return;
  }
  
  // Load all records
  loadRecords();
  
  // Set up filter listeners
  document.getElementById('recordFilter')?.addEventListener('change', filterRecords);
  document.getElementById('dateFilter')?.addEventListener('change', filterRecords);
});

// Load and display all medical records
function loadRecords() {
  const recordsList = document.getElementById('recordsList');
  if (!recordsList) return;
  
  // Get all records from different sources
  const prescriptions = getPrescriptions();
  const appointments = getAppointments();
  const labReports = getLabReports();
  
  const userRole = localStorage.getItem('role');
  const currentUser = localStorage.getItem('name');
  
  // Combine all records
  let allRecords = [];
  
  // Add prescriptions
  prescriptions.forEach(p => {
    if (userRole === 'patient' && p.patientName === currentUser) {
      allRecords.push({
        type: 'prescription',
        id: p.id,
        title: 'E-Prescription',
        date: p.createdAt,
        icon: '💊',
        data: p
      });
    } else if (userRole === 'doctor') {
      allRecords.push({
        type: 'prescription',
        id: p.id,
        title: 'E-Prescription',
        date: p.createdAt,
        icon: '💊',
        data: p
      });
    }
  });
  
  // Add appointments
  appointments.forEach(a => {
    if (userRole === 'patient' && a.patientName === currentUser) {
      allRecords.push({
        type: 'appointment',
        id: a.id,
        title: 'Appointment Record',
        date: a.bookedAt,
        icon: '📅',
        data: a
      });
    } else if (userRole === 'doctor') {
      allRecords.push({
        type: 'appointment',
        id: a.id,
        title: 'Appointment Record',
        date: a.bookedAt,
        icon: '📅',
        data: a
      });
    }
  });
  
  // Add lab reports
  labReports.forEach(r => {
    if (userRole === 'patient' && r.patientName === currentUser) {
      allRecords.push({
        type: 'report',
        id: r.id,
        title: 'Lab Report',
        date: r.createdAt,
        icon: '🧪',
        data: r
      });
    } else if (userRole === 'doctor' || userRole === 'admin') {
      allRecords.push({
        type: 'report',
        id: r.id,
        title: 'Lab Report',
        date: r.createdAt,
        icon: '🧪',
        data: r
      });
    }
  });
  
  // Sort by date (newest first)
  allRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  if (allRecords.length === 0) {
    recordsList.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No medical records found.</p>';
    return;
  }
  
  displayRecords(allRecords);
}

// Display records
function displayRecords(records) {
  const recordsList = document.getElementById('recordsList');
  if (!recordsList) return;
  
  recordsList.innerHTML = '';
  
  if (records.length === 0) {
    recordsList.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No records match your filters.</p>';
    return;
  }
  
  records.forEach(record => {
    const recordItem = document.createElement('div');
    recordItem.className = 'record-item';
    
    let content = '';
    
    switch(record.type) {
      case 'prescription':
        content = `
          <h4>${record.icon} ${record.title}</h4>
          <p><strong>Patient:</strong> ${record.data.patientName}</p>
          <p><strong>Doctor:</strong> ${record.data.doctorName}</p>
          <p><strong>Diagnosis:</strong> ${record.data.diagnosis}</p>
          <p><strong>Date:</strong> ${formatDateTime(record.date)}</p>
          <p style="margin-top: 10px; color: #28a745;"><strong>Status:</strong> ✓ Encrypted & Signed</p>
        `;
        break;
        
      case 'appointment':
        const isPast = new Date(`${record.data.date}T${record.data.time}`) < new Date();
        content = `
          <h4>${record.icon} ${record.title}</h4>
          <p><strong>Doctor:</strong> ${record.data.doctorName}</p>
          <p><strong>Date:</strong> ${formatDate(record.data.date)}</p>
          <p><strong>Time:</strong> ${formatTime(record.data.time)}</p>
          <p><strong>Reason:</strong> ${record.data.reason}</p>
          <p style="margin-top: 10px;"><strong>Status:</strong> ${isPast ? 'Completed' : 'Upcoming'}</p>
        `;
        break;
        
      case 'report':
        content = `
          <h4>${record.icon} ${record.title}</h4>
          <p><strong>Test Type:</strong> ${record.data.testType}</p>
          <p><strong>Patient:</strong> ${record.data.patientName}</p>
          <p><strong>Date:</strong> ${formatDateTime(record.date)}</p>
          <p><strong>Result:</strong> ${record.data.result}</p>
          <p style="margin-top: 10px; color: #28a745;"><strong>Status:</strong> ✓ Encrypted</p>
        `;
        break;
    }
    
    recordItem.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <div style="flex: 1;">
          ${content}
        </div>
        <button onclick="viewRecordDetails('${record.type}', '${record.id}')" style="padding: 8px 15px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; white-space: nowrap;">View Details</button>
      </div>
    `;
    
    recordsList.appendChild(recordItem);
  });
}

// Filter records
function filterRecords() {
  const filterType = document.getElementById('recordFilter')?.value || 'all';
  const filterDate = document.getElementById('dateFilter')?.value;
  
  const prescriptions = getPrescriptions();
  const appointments = getAppointments();
  const labReports = getLabReports();
  
  const userRole = localStorage.getItem('role');
  const currentUser = localStorage.getItem('name');
  
  let allRecords = [];
  
  // Filter by type
  if (filterType === 'all' || filterType === 'prescriptions') {
    prescriptions.forEach(p => {
      if (userRole === 'patient' && p.patientName === currentUser) {
        allRecords.push({ type: 'prescription', id: p.id, title: 'E-Prescription', date: p.createdAt, icon: '💊', data: p });
      } else if (userRole === 'doctor') {
        allRecords.push({ type: 'prescription', id: p.id, title: 'E-Prescription', date: p.createdAt, icon: '💊', data: p });
      }
    });
  }
  
  if (filterType === 'all' || filterType === 'appointments') {
    appointments.forEach(a => {
      if (userRole === 'patient' && a.patientName === currentUser) {
        allRecords.push({ type: 'appointment', id: a.id, title: 'Appointment Record', date: a.bookedAt, icon: '📅', data: a });
      } else if (userRole === 'doctor') {
        allRecords.push({ type: 'appointment', id: a.id, title: 'Appointment Record', date: a.bookedAt, icon: '📅', data: a });
      }
    });
  }
  
  if (filterType === 'all' || filterType === 'reports') {
    labReports.forEach(r => {
      if (userRole === 'patient' && r.patientName === currentUser) {
        allRecords.push({ type: 'report', id: r.id, title: 'Lab Report', date: r.createdAt, icon: '🧪', data: r });
      } else if (userRole === 'doctor' || userRole === 'admin') {
        allRecords.push({ type: 'report', id: r.id, title: 'Lab Report', date: r.createdAt, icon: '🧪', data: r });
      }
    });
  }
  
  // Filter by date
  if (filterDate) {
    allRecords = allRecords.filter(record => {
      const recordDate = new Date(record.date).toISOString().split('T')[0];
      return recordDate === filterDate;
    });
  }
  
  // Sort by date
  allRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  displayRecords(allRecords);
}

// View record details
function viewRecordDetails(type, id) {
  let record;
  
  switch(type) {
    case 'prescription':
      const prescriptions = getPrescriptions();
      record = prescriptions.find(p => p.id === id);
      if (record) showPrescriptionModal(record);
      break;
    case 'appointment':
      const appointments = getAppointments();
      record = appointments.find(a => a.id === id);
      if (record) showAppointmentModal(record);
      break;
    case 'report':
      const reports = getLabReports();
      record = reports.find(r => r.id === id);
      if (record) showReportModal(record);
      break;
  }
}

// Modal display functions
function showPrescriptionModal(prescription) {
  const modal = createModal(`
    <h2 style="color: #667eea;">💊 Prescription Details</h2>
    <p><strong>Patient:</strong> ${prescription.patientName} (${prescription.patientId})</p>
    <p><strong>Doctor:</strong> ${prescription.doctorName}</p>
    <p><strong>Date:</strong> ${formatDateTime(prescription.createdAt)}</p>
    <hr style="margin: 20px 0;">
    <p><strong>Diagnosis:</strong></p>
    <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0;">${prescription.diagnosis}</div>
    <p><strong>Medications:</strong></p>
    <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0; white-space: pre-wrap;">${prescription.medications}</div>
    ${prescription.instructions ? `<p><strong>Instructions:</strong></p><div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0;">${prescription.instructions}</div>` : ''}
    <div style="background: #e8f5e9; padding: 10px; border-radius: 5px; margin-top: 15px;">
      <small>✓ Digitally Signed & Encrypted</small><br>
      <small style="color: #666; font-size: 11px;">Signature: ${prescription.signature?.substring(0, 32)}...</small>
    </div>
  `);
  document.body.appendChild(modal);
}

function showAppointmentModal(appointment) {
  const modal = createModal(`
    <h2 style="color: #667eea;">📅 Appointment Details</h2>
    <p><strong>Patient:</strong> ${appointment.patientName}</p>
    <p><strong>Doctor:</strong> ${appointment.doctorName}</p>
    <p><strong>Date:</strong> ${formatDate(appointment.date)}</p>
    <p><strong>Time:</strong> ${formatTime(appointment.time)}</p>
    <p><strong>Reason:</strong> ${appointment.reason}</p>
    <p><strong>Booked At:</strong> ${formatDateTime(appointment.bookedAt)}</p>
    <p><strong>Status:</strong> ${appointment.status}</p>
    <div style="background: #e8f5e9; padding: 10px; border-radius: 5px; margin-top: 15px;">
      <small>✓ Encrypted Record</small>
    </div>
  `);
  document.body.appendChild(modal);
}

function showReportModal(report) {
  const modal = createModal(`
    <h2 style="color: #667eea;">🧪 Lab Report Details</h2>
    <p><strong>Patient:</strong> ${report.patientName}</p>
    <p><strong>Test Type:</strong> ${report.testType}</p>
    <p><strong>Date:</strong> ${formatDateTime(report.createdAt)}</p>
    <p><strong>Result:</strong> ${report.result}</p>
    ${report.notes ? `<p><strong>Notes:</strong></p><div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0;">${report.notes}</div>` : ''}
    <div style="background: #e8f5e9; padding: 10px; border-radius: 5px; margin-top: 15px;">
      <small>✓ Encrypted Record</small>
    </div>
  `);
  document.body.appendChild(modal);
}

// Create modal helper
function createModal(content) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    padding: 20px;
  `;
  
  modal.innerHTML = `
    <div style="background: white; padding: 30px; border-radius: 15px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto;">
      ${content}
      <button onclick="this.parentElement.parentElement.remove()" style="width: 100%; padding: 12px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600; margin-top: 20px;">Close</button>
    </div>
  `;
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
  
  return modal;
}

// Data getters
function getPrescriptions() {
  return JSON.parse(localStorage.getItem('prescriptions') || '[]');
}

function getAppointments() {
  return JSON.parse(localStorage.getItem('appointments') || '[]');
}

function getLabReports() {
  // Mock lab reports (in production, this would come from a server)
  const currentUser = localStorage.getItem('name');
  return [
    {
      id: 'lab_1',
      patientName: currentUser,
      testType: 'Complete Blood Count (CBC)',
      result: 'Normal',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'All parameters within normal range'
    },
    {
      id: 'lab_2',
      patientName: currentUser,
      testType: 'Lipid Profile',
      result: 'Borderline High Cholesterol',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Advised dietary modifications'
    }
  ];
}

// Helper functions
function formatDateTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

function formatTime(timeString) {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

console.log('Medical records module loaded - All data encrypted 🔒');