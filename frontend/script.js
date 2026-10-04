
// ======================================
// QueueCare - Frontend JavaScript
// ======================================

const API_URL = "http://127.0.0.1:8000";

const appointmentList = document.getElementById("appointmentList");
const totalElement = document.getElementById("totalAppointments");

// 1. Check backend connection
const apiStatus = document.createElement("p");
apiStatus.textContent = "Checking backend connection...";
apiStatus.style.cssText =
    "color:#7b8994;font-size:12px;margin-top:10px;";

document.querySelector(".welcome > div").appendChild(apiStatus);

fetch(`${API_URL}/health`)
    .then(response => {
        if (!response.ok) throw new Error("Backend unavailable");
        return response.json();
    })
    .then(data => {
        apiStatus.textContent = data.status === "healthy"
            ? "● Backend connected"
            : "● Backend disconnected";
        apiStatus.style.color = data.status === "healthy"
            ? "#16834a" : "#c0392b";
    })
    .catch(error => {
        apiStatus.textContent = "● Backend disconnected";
        apiStatus.style.color = "#c0392b";
        console.error(error);
    });


// 2. Create an appointment row
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

    patientDiv.append(avatar, name);
    patientCell.appendChild(patientDiv);

    const doctorCell = document.createElement("td");
    doctorCell.textContent = appointment.doctor_name;

    const timeCell = document.createElement("td");
    timeCell.textContent = appointment.appointment_time;

    const statusCell = document.createElement("td");

    const statusLabel = document.createElement("span");
    statusLabel.className = "status";
    statusLabel.textContent = appointment.status;

    const statusSelect = document.createElement("select");
    statusSelect.className = "status-select";
    statusSelect.dataset.id = appointment.id;

    statusSelect.style.cssText =
        "margin-left:6px;padding:5px;border-radius:6px;" +
        "border:1px solid #ccc;max-width:130px;";

    const statuses = [
        "Scheduled",
        "Waiting",
        "In Progress",
        "Completed"
    ];

    statuses.forEach(status => {
        const option = document.createElement("option");
        option.value = status;
        option.textContent = status;
        if (status === appointment.status) {
            option.selected = true;
        }
        statusSelect.appendChild(option);
    });

    statusCell.append(statusLabel, statusSelect);
    row.append(patientCell, doctorCell, timeCell, statusCell);

    appointmentList.appendChild(row);
}


// 3. Update Live Queue using real appointments
function updateLiveQueue(appointments) {
    const current = appointments.find(
        appointment => appointment.status === "In Progress"
    );

    const waiting = appointments.filter(
        appointment => appointment.status === "Waiting"
    );

    const currentQueueNumber =
        document.getElementById("currentQueueNumber");
    const currentDoctor =
        document.getElementById("currentDoctor");
    const queueWaiting =
        document.getElementById("queueWaiting");
    const estimatedWait =
        document.getElementById("estimatedWait");

    if (currentQueueNumber) {
        currentQueueNumber.textContent = current
            ? `#${String(current.id).padStart(2, "0")}`
            : "—";
    }

    if (currentDoctor) {
        currentDoctor.textContent = current
            ? current.doctor_name
            : "No patient in consultation";
    }

    if (queueWaiting) {
        queueWaiting.textContent = waiting.length;
    }

    if (estimatedWait) {
        estimatedWait.textContent = `${waiting.length * 10} min`;
    }
}


// 4. Load appointments from SQLite
async function loadAppointments() {
    try {
        const response = await fetch(`${API_URL}/appointments`);
        if (!response.ok) throw new Error("Could not load appointments");

        const appointments = await response.json();
        appointmentList.innerHTML = "";

        appointments.forEach(displayAppointment);
        totalElement.textContent = appointments.length;

        // Refresh Live Queue
        updateLiveQueue(appointments);

    } catch (error) {
        console.error("Loading appointments failed:", error);
        alert("Could not load appointments. Check the backend.");
    }
}


// 5. Load dashboard statistics from backend
async function loadStats() {
    try {
        const response = await fetch(`${API_URL}/stats`);

        if (!response.ok) {
            throw new Error("Could not load statistics");
        }

        const stats = await response.json();

        document.getElementById("totalAppointments").textContent =
            stats.total_appointments;

        document.getElementById("completedAppointments").textContent =
            stats.completed;

        document.getElementById("waitingAppointments").textContent =
            stats.waiting;

        document.getElementById("availableDoctors").textContent =
            stats.available_doctors;

    } catch (error) {
        console.error("Loading statistics failed:", error);
    }
}


// Load appointments and statistics when the page opens
loadAppointments();
loadStats();


// 6. Save a new appointment
document.getElementById("bookAppointment")
    .addEventListener("click", async function () {
        const patientName = prompt("Enter patient name:");
        if (!patientName || !patientName.trim()) return;

        const doctorName = prompt("Enter doctor name:");
        if (!doctorName || !doctorName.trim()) return;

        const appointmentTime = prompt(
            "Enter appointment time:", "12:00 PM"
        );
        if (!appointmentTime || !appointmentTime.trim()) return;

        try {
            const response = await fetch(`${API_URL}/appointments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    patient_name: patientName.trim(),
                    doctor_name: doctorName.trim(),
                    appointment_time: appointmentTime.trim()
                })
            });

            if (!response.ok) throw new Error("Could not save appointment");

            const savedAppointment = await response.json();
            displayAppointment(savedAppointment);

            totalElement.textContent =
                Number(totalElement.textContent) + 1;

            // Refresh dashboard statistics and Live Queue
            await loadStats();
            await loadAppointments();

            alert("Appointment saved successfully!");
        } catch (error) {
            console.error("Booking error:", error);
            alert("Appointment could not be saved.");
        }
    });


// 7. Update appointment status in SQLite
appointmentList.addEventListener("change", async function (event) {
    const select = event.target;

    if (!select.matches(".status-select")) return;

    const appointmentId = select.dataset.id;
    const newStatus = select.value;
    const statusLabel = select.parentElement.querySelector(".status");
    const oldStatus = statusLabel.textContent;

    select.disabled = true;

    try {
        const response = await fetch(
            `${API_URL}/appointments/${appointmentId}/status`,
            {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            }
        );

        if (!response.ok) throw new Error("Status update failed");

        const updatedAppointment = await response.json();
        statusLabel.textContent = updatedAppointment.status;

        // Refresh dashboard statistics and Live Queue
        await loadStats();
        await loadAppointments();

        alert("Appointment status updated successfully!");
    } catch (error) {
        console.error("Status update error:", error);
        select.value = oldStatus;
        alert("Could not update status. Please try again.");
    } finally {
        select.disabled = false;
    }
});


// 8. View Live Queue
document.getElementById("viewQueue")
    .addEventListener("click", async function () {
        try {
            const response = await fetch(`${API_URL}/appointments`);

            if (!response.ok) {
                throw new Error("Could not load queue");
            }

            const appointments = await response.json();

            const current = appointments.find(
                appointment => appointment.status === "In Progress"
            );

            const waiting = appointments.filter(
                appointment => appointment.status === "Waiting"
            );

            const waitingList = waiting.length > 0
                ? waiting.map((appointment, index) =>
                    `${index + 1}. ${appointment.patient_name} - ${appointment.doctor_name}`
                ).join("\n")
                : "No patients waiting.";

            alert(
                "QueueCare Live Queue\n\n" +
                "Now consulting: " +
                (current ? current.patient_name : "No patient") + "\n" +
                "Doctor: " +
                (current ? current.doctor_name : "—") + "\n\n" +
                "Patients waiting: " + waiting.length + "\n" +
                "Estimated wait time: " + (waiting.length * 10) + " minutes\n\n" +
                "Waiting List:\n" + waitingList
            );

        } catch (error) {
            console.error("Live Queue error:", error);
            alert("Could not load the live queue. Check the backend.");
        }
    });

