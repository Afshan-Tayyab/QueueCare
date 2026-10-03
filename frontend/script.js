
// ======================================
// QueueCare - Frontend JavaScript
// ======================================

const API_URL = "http://127.0.0.1:8000";

// 1. Check backend connection
const apiStatus = document.createElement("p");
apiStatus.textContent = "Checking backend connection...";
apiStatus.style.cssText = `
    color: #7b8994;
    font-size: 12px;
    margin-top: 10px;
`;

document.querySelector(".welcome > div").appendChild(apiStatus);

fetch(`${API_URL}/health`)
    .then(response => {
        if (!response.ok) {
            throw new Error("Backend is not responding");
        }
        return response.json();
    })
    .then(data => {
        apiStatus.textContent = data.status === "healthy"
            ? "● Backend connected"
            : "● Backend disconnected";
        apiStatus.style.color = data.status === "healthy"
            ? "#16834a"
            : "#c0392b";
    })
    .catch(error => {
        apiStatus.textContent = "● Backend disconnected";
        apiStatus.style.color = "#c0392b";
        console.error("API connection error:", error);
    });


// 2. Display appointments saved in SQLite
const appointmentList = document.getElementById("appointmentList");
const totalElement = document.getElementById("totalAppointments");

function displayAppointment(appointment) {
    const row = document.createElement("tr");

    const patientCell = document.createElement("td");
    const patientDiv = document.createElement("div");
    patientDiv.className = "patient";

    const avatar = document.createElement("span");
    avatar.className = "patient-avatar";

    avatar.textContent = appointment.patient_name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(word => word.charAt(0).toUpperCase())
        .join("");

    const name = document.createElement("span");
    name.textContent = appointment.patient_name;

    patientDiv.appendChild(avatar);
    patientDiv.appendChild(name);
    patientCell.appendChild(patientDiv);

    const doctorCell = document.createElement("td");
    doctorCell.textContent = appointment.doctor_name;

    const timeCell = document.createElement("td");
    timeCell.textContent = appointment.appointment_time;

    const statusCell = document.createElement("td");
    const status = document.createElement("span");
    status.className = "status scheduled";
    status.textContent = appointment.status;
    statusCell.appendChild(status);

    row.appendChild(patientCell);
    row.appendChild(doctorCell);
    row.appendChild(timeCell);
    row.appendChild(statusCell);

    appointmentList.appendChild(row);
}

// Fetch appointments from the database
async function loadAppointments() {
    try {
        const response = await fetch(`${API_URL}/appointments`);

        if (!response.ok) {
            throw new Error("Could not load appointments");
        }

        const appointments = await response.json();

        // Remove hardcoded sample rows and show saved appointments
        appointmentList.innerHTML = "";

        appointments.forEach(displayAppointment);

        totalElement.textContent = appointments.length;
    } catch (error) {
        console.error("Loading appointments failed:", error);
        alert("Could not load appointments. Please check the backend.");
    }
}

loadAppointments();


// 3. Book and save a new appointment
const bookButton = document.getElementById("bookAppointment");

bookButton.addEventListener("click", async function () {
    const patientName = prompt("Enter patient name:");

    if (patientName === null || patientName.trim() === "") {
        return;
    }

    const doctorName = prompt("Enter doctor name:");

    if (doctorName === null || doctorName.trim() === "") {
        return;
    }

    const appointmentTime = prompt(
        "Enter appointment time:",
        "12:00 PM"
    );

    if (appointmentTime === null || appointmentTime.trim() === "") {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/appointments`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                patient_name: patientName.trim(),
                doctor_name: doctorName.trim(),
                appointment_time: appointmentTime.trim()
            })
        });

        if (!response.ok) {
            throw new Error("Could not save appointment");
        }

        const savedAppointment = await response.json();

        displayAppointment(savedAppointment);

        totalElement.textContent =
            Number(totalElement.textContent) + 1;

        alert("Appointment saved successfully!");

    } catch (error) {
        console.error("Booking error:", error);
        alert("Appointment could not be saved. Please check the backend.");
    }
});


// 4. View the current sample queue
const viewQueueButton = document.getElementById("viewQueue");

viewQueueButton.addEventListener("click", function () {
    alert(
        "QueueCare Live Queue\n\n" +
        "Now consulting: Patient #03\n" +
        "Doctor: Dr. Reddy\n" +
        "Patients waiting: 06\n" +
        "Estimated wait time: 30 minutes\n\n" +
        "These are sample values for the dashboard."
    );
});