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
    try {
        // Get encoded ID from URL (set when QR is generated)
        const encodedId = getUrlParameter("id");

        if (!encodedId) {
            showError("Invalid prescription link. No ID provided.");
            return;
        }

        // Decode the Base64 appointment ID
        const appointmentId = decodeBase64(encodedId);

        if (!appointmentId) {
            showError("Invalid prescription ID format.");
            return;
        }

        // Fetch appointment directly by ID using the dedicated public route
        const response = await fetch(
            `http://localhost:5000/api/appointments/by-id/${appointmentId}`
        );

        const data = await response.json();

        if (!data.success) {
            // Surface the specific message from the backend (revoked, not found, etc.)
            showError(data.message || "Failed to load prescription data.");
            return;
        }

        // Display the prescription
        displayPrescription(data.appointment);

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
    document.getElementById("patientName").textContent =
        appointment.patientName || "N/A";
    document.getElementById("patientEmail").textContent =
        appointment.patientEmail || "N/A";

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

    // Update verification badge based on digital signature check
    if (appointment.prescription.isValid) {
        verificationBadge.classList.add("verified");
        verificationBadge.innerHTML = `
            <span class="badge-icon"><i class="fa-solid fa-check"></i></span>
            <span class="badge-text">Verified</span>
        `;
    } else {
        verificationBadge.classList.add("unverified");
        verificationBadge.innerHTML = `
            <span class="badge-icon"><i class="fa-solid fa-triangle-exclamation"></i></span>
            <span class="badge-text">Invalid</span>
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
