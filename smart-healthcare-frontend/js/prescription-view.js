/* ================= GET URL PARAMETER ================= */
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

/* ================= DECODE BASE64 ================= */
function decodeBase64(encoded) {
    try {
        return atob(encoded);
    } catch (e) {
        console.error("Failed to decode base64:", e);
        return null;
    }
}

/* ================= LOAD PRESCRIPTION ================= */
async function loadPrescription() {
    const loadingState = document.getElementById("loadingState");
    const errorState = document.getElementById("errorState");
    const prescriptionContent = document.getElementById("prescriptionContent");
    const errorMessage = document.getElementById("errorMessage");

    try {
        // Get encoded ID from URL
        const encodedId = getUrlParameter("id");

        if (!encodedId) {
            showError("Invalid prescription link. No ID provided.");
            return;
        }

        // Decode the ID
        const appointmentId = decodeBase64(encodedId);

        if (!appointmentId) {
            showError("Invalid prescription ID format.");
            return;
        }

        // Fetch prescription data
        const response = await fetch(
            `http://localhost:5000/api/appointments/my/temp@example.com`
        );

        const data = await response.json();

        if (!data.success) {
            showError("Failed to load prescription data.");
            return;
        }

        // Find the specific appointment
        const appointment = data.appointments.find(
            app => app._id === appointmentId || app.encodedId === encodedId
        );

        if (!appointment) {
            // Try direct fetch using the decoded ID
            const directResponse = await fetch(
                `http://localhost:5000/api/appointments/prescription/pdf/${appointmentId}`
            );

            if (!directResponse.ok) {
                showError("Prescription not found.");
                return;
            }

            // Since we can't easily parse the PDF, let's use a different approach
            // We'll fetch from the patient's appointments list
            showError("Unable to retrieve prescription details. Please use the patient dashboard.");
            return;
        }

        if (!appointment.prescription) {
            showError("No prescription found for this appointment.");
            return;
        }

        if (appointment.prescription.isRevoked) {
            showError("This prescription has been revoked by the administrator.");
            return;
        }

        // Display the prescription
        displayPrescription(appointment);

    } catch (err) {
        console.error("Error loading prescription:", err);
        showError("An error occurred while loading the prescription. Please try again.");
    }
}

/* ================= DISPLAY PRESCRIPTION ================= */
function displayPrescription(appointment) {
    const loadingState = document.getElementById("loadingState");
    const prescriptionContent = document.getElementById("prescriptionContent");
    const verificationBadge = document.getElementById("verificationBadge");

    // Hide loading, show content
    loadingState.style.display = "none";
    prescriptionContent.style.display = "block";

    // Populate patient information
    document.getElementById("patientName").textContent = appointment.patientName;
    document.getElementById("patientEmail").textContent = appointment.patientEmail;

    // Populate doctor information
    document.getElementById("doctorName").textContent =
        appointment.doctor?.name || "Unknown Doctor";
    document.getElementById("doctorSpecialization").textContent =
        appointment.doctor?.specialization || "-";
    document.getElementById("prescriptionDate").textContent =
        appointment.date || "-";

    // Populate prescription details
    document.getElementById("diagnosis").textContent =
        appointment.prescription.diagnosis || "-";
    document.getElementById("medicines").textContent =
        appointment.prescription.medicines || "-";
    document.getElementById("advice").textContent =
        appointment.prescription.advice || "No additional advice provided";

    // Update verification badge
    if (appointment.prescription.isValid !== false) {
        verificationBadge.classList.add("verified");
        verificationBadge.innerHTML = `
      <span class="badge-icon">✓</span>
      <span class="badge-text">Verified</span>
    `;
    } else {
        verificationBadge.classList.add("unverified");
        verificationBadge.innerHTML = `
      <span class="badge-icon">⚠</span>
      <span class="badge-text">Unverified</span>
    `;
    }
}

/* ================= SHOW ERROR ================= */
function showError(message) {
    const loadingState = document.getElementById("loadingState");
    const errorState = document.getElementById("errorState");
    const errorMessage = document.getElementById("errorMessage");

    loadingState.style.display = "none";
    errorState.style.display = "block";
    errorMessage.textContent = message;
}

/* ================= INITIALIZE ================= */
document.addEventListener("DOMContentLoaded", loadPrescription);
