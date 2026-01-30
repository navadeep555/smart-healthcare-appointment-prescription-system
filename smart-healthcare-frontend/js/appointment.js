console.log("appointment.js loaded");

/* ================= FIND DOCTORS ================= */
async function findDoctors() {
  const diseaseInput = document.getElementById("disease");
  const select = document.getElementById("doctorSelect");

  const disease = diseaseInput.value.trim();

  if (!disease) {
    alert("Please enter a disease or problem");
    return;
  }

  // Reset dropdown
  select.innerHTML = `<option value="">Loading...</option>`;

  try {
    const res = await fetch(
      `http://localhost:5000/api/doctors/by-disease?disease=${encodeURIComponent(disease)}`
    );

    const data = await res.json();

    // Clear dropdown and add default option
    select.innerHTML = `<option value="">Select Doctor</option>`;

    if (!data.success || !data.doctors || data.doctors.length === 0) {
      select.innerHTML = `<option value="">No doctors found</option>`;
      return;
    }

    data.doctors.forEach(doc => {
      const option = document.createElement("option");

      // 🔴 THIS IS CRITICAL
      option.value = doc._id;   // must NOT be empty
      option.textContent = `${doc.name} (${doc.specialization})`;

      select.appendChild(option);
    });

  } catch (error) {
    console.error("Error fetching doctors:", error);
    alert("Failed to fetch doctors");
    select.innerHTML = `<option value="">Error loading doctors</option>`;
  }
}

/* ================= BOOK APPOINTMENT ================= */
async function bookAppointment() {
  const doctorId = document.getElementById("doctorSelect").value;
  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;
  const disease = document.getElementById("disease").value.trim();

  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    alert("Please login again");
    window.location.href = "login.html";
    return;
  }

  if (!doctorId || !date || !time || !disease) {
    alert("All fields are required");
    return;
  }

  try {
    const res = await fetch(
      "http://localhost:5000/api/appointments/book",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: user.name,        // ✅ FIX
          patientEmail: user.email,      // ✅ FIX
          doctorId,
          date,
          time,
          disease
        })
      }
    );

    const data = await res.json();

    if (data.success) {
      alert("✅ Appointment booked successfully");
      window.location.href = "dashboard.html";
    } else {
      alert(data.message || "Booking failed");
    }

  } catch (err) {
    console.error(err);
    alert("Server error while booking appointment");
  }
}
