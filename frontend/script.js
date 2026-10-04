
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

document.querySelector(".welcome > div")?.appendChild(apiStatus);

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


// 3. Create doctor-wise queue container
function getDoctorQueueContainer() {
    let container = document.getElementById("doctorWiseQueue");

    if (container) return container;

    container = document.createElement("div");
    container.id = "doctorWiseQueue";

    container.style.cssText =
        "display:grid;grid-template-columns:" +
        "repeat(auto-fit,minmax(230px,1fr));" +
        "gap:16px;margin-top:20px;";

    const queueDetails = document.querySelector(".queue-details");

    if (queueDetails) {
        queueDetails.insertAdjacentElement("afterend", container);
    } else {
        const queueWaiting = document.getElementById("queueWaiting");
        if (queueWaiting?.parentElement?.parentElement) {
            queueWaiting.parentElement.parentElement
                .insertAdjacentElement("afterend", container);
        }
    }

    return container;
}


// 4. Update doctor-wise Live Queue
function updateLiveQueue(appointments) {
    const consulting = appointments.filter(
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

    // Update overall queue summary
    if (currentQueueNumber) {
        currentQueueNumber.textContent = consulting.length
            ? `${consulting.length} active`
            : "—";
    }

    if (currentDoctor) {
        currentDoctor.textContent = consulting.length
            ? "Patients currently consulting"
            : "No patient in consultation";
    }

    if (queueWaiting) {
        queueWaiting.textContent = waiting.length;
    }

    if (estimatedWait) {
        estimatedWait.textContent = `${waiting.length * 10} min`;
    }

    // Group patients by doctor
    const doctors = new Map();

    appointments.forEach(appointment => {
        const doctorName = (appointment.doctor_name || "Unknown Doctor").trim();
        const doctorKey = doctorName.toLowerCase();

        if (!doctors.has(doctorKey)) {
            doctors.set(doctorKey, {
                name: doctorName,
                consulting: [],
                waiting: []
            });
        }

        const doctor = doctors.get(doctorKey);

        if (appointment.status === "In Progress") {
            doctor.consulting.push(appointment);
        } else if (appointment.status === "Waiting") {
            doctor.waiting.push(appointment);
        }
    });

    // Show only doctors with active or waiting patients
    const activeDoctors = [...doctors.values()].filter(
        doctor => doctor.consulting.length > 0 ||
                  doctor.waiting.length > 0
    );

    const container = getDoctorQueueContainer();
    if (!container) return;

    container.innerHTML = "";

    const heading = document.createElement("h3");
    heading.textContent = "Doctor-wise Live Queue";
    heading.style.cssText = "grid-column:1/-1;margin:0 0 4px;";
    container.appendChild(heading);

    if (activeDoctors.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "No patients currently in the active queue.";
        empty.style.color = "#7b8994";
        container.appendChild(empty);
        return;
    }

    activeDoctors.forEach(doctor => {
        const card = document.createElement("div");
        card.style.cssText =
            "border:1px solid #e0e0e0;border-radius:12px;" +
            "padding:16px;background:var(--card-bg,#fff);" +
            "min-width:0;";

        const title = document.createElement("h4");
        title.textContent = doctor.name;
        title.style.cssText = "margin:0 0 12px;font-size:16px;";
        card.appendChild(title);

        const consultingTitle = document.createElement("p");
        consultingTitle.textContent = "Now consulting";
        consultingTitle.style.cssText =
            "font-size:12px;color:#7b8994;margin:0 0 8px;";
        card.appendChild(consultingTitle);

        if (doctor.consulting.length > 0) {
            doctor.consulting.forEach(patient => {
                const patientRow = document.createElement("div");
                patientRow.style.cssText =
                    "padding:8px;background:#eaf7ef;" +
                    "border-radius:8px;margin-bottom:6px;";

                const patientName = document.createElement("strong");
                patientName.textContent = patient.patient_name;
                patientName.style.cssText =
                    "display:block;color:#16834a;font-size:14px;";

                const patientId = document.createElement("small");
                patientId.textContent =
                    `Appointment #${String(patient.id).padStart(2, "0")}`;
                patientId.style.color = "#52715e";

                patientRow.append(patientName, patientId);
                card.appendChild(patientRow);
            });
        } else {
            const none = document.createElement("p");
            none.textContent = "No patient consulting";
            none.style.cssText =
                "font-size:13px;color:#7b8994;margin:0 0 12px;";
            card.appendChild(none);
        }

        const waitingTitle = document.createElement("p");
        waitingTitle.textContent =
            `Waiting list (${doctor.waiting.length})`;
        waitingTitle.style.cssText =
            "font-size:13px;font-weight:600;margin:12px 0 8px;";
        card.appendChild(waitingTitle);

        if (doctor.waiting.length > 0) {
            doctor.waiting.forEach((patient, index) => {
                const waitingRow = document.createElement("p");
                waitingRow.textContent =
                    `${index + 1}. ${patient.patient_name}`;
                waitingRow.style.cssText =
                    "font-size:13px;margin:5px 0;color:var(--text-color,#333);";
                card.appendChild(waitingRow);
            });
        } else {
            const noneWaiting = document.createElement("p");
            noneWaiting.textContent = "No patients waiting";
            noneWaiting.style.cssText =
                "font-size:13px;color:#7b8994;margin:0;";
            card.appendChild(noneWaiting);
        }

        const waitTime = document.createElement("p");
        waitTime.textContent =
            `Estimated wait: ${doctor.waiting.length * 10} min`;
        waitTime.style.cssText =
            "font-size:12px;color:#7b8994;margin:12px 0 0;";
        card.appendChild(waitTime);

        container.appendChild(card);
    });
}


// 5. Load appointments from SQLite
async function loadAppointments() {
    try {
        const response = await fetch(`${API_URL}/appointments`);

        if (!response.ok) {
            throw new Error("Could not load appointments");
        }

        const appointments = await response.json();

        appointmentList.innerHTML = "";
        appointments.forEach(displayAppointment);

        totalElement.textContent = appointments.length;

        updateLiveQueue(appointments);

    } catch (error) {
        console.error("Loading appointments failed:", error);
    }
}


// 6. Load dashboard statistics
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


// 7. Initial dashboard load
loadAppointments();
loadStats();


// 8. Automatically refresh every 10 seconds
setInterval(async () => {
    await loadAppointments();
    await loadStats();
}, 10000);


// 9. Save a new appointment
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

            if (!response.ok) {
                throw new Error("Could not save appointment");
            }

            await response.json();

            await loadAppointments();
            await loadStats();

            alert("Appointment saved successfully!");

        } catch (error) {
            console.error("Booking error:", error);
            alert("Appointment could not be saved.");
        }
    });


// 10. Update appointment status in SQLite
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

        if (!response.ok) {
            throw new Error("Status update failed");
        }

        await response.json();

        await loadAppointments();
        await loadStats();

        alert("Appointment status updated successfully!");

    } catch (error) {
        console.error("Status update error:", error);
        select.value = oldStatus;
        alert("Could not update status. Please try again.");
    } finally {
        select.disabled = false;
    }
});


// 11. View doctor-wise Live Queue
document.getElementById("viewQueue")
    .addEventListener("click", async function () {
        try {
            const response = await fetch(`${API_URL}/appointments`);

            if (!response.ok) {
                throw new Error("Could not load queue");
            }

            const appointments = await response.json();

            updateLiveQueue(appointments);

            const doctors = new Map();

            appointments.forEach(appointment => {
                const doctorName =
                    (appointment.doctor_name || "Unknown Doctor").trim();
                const doctorKey = doctorName.toLowerCase();

                if (!doctors.has(doctorKey)) {
                    doctors.set(doctorKey, {
                        name: doctorName,
                        consulting: [],
                        waiting: []
                    });
                }

                const doctor = doctors.get(doctorKey);

                if (appointment.status === "In Progress") {
                    doctor.consulting.push(appointment);
                } else if (appointment.status === "Waiting") {
                    doctor.waiting.push(appointment);
                }
            });

            const activeDoctors = [...doctors.values()].filter(
                doctor => doctor.consulting.length > 0 ||
                          doctor.waiting.length > 0
            );

            const queueText = activeDoctors.length > 0
                ? activeDoctors.map(doctor => {
                    const consultingText = doctor.consulting.length > 0
                        ? doctor.consulting.map(patient =>
                            `  - ${patient.patient_name} (#${patient.id})`
                        ).join("\n")
                        : "  - No patient consulting";

                    const waitingText = doctor.waiting.length > 0
                        ? doctor.waiting.map((patient, index) =>
                            `  ${index + 1}. ${patient.patient_name}`
                        ).join("\n")
                        : "  No patients waiting";

                    return (
                        `${doctor.name}\n` +
                        `Now consulting:\n${consultingText}\n` +
                        `Waiting (${doctor.waiting.length}):\n${waitingText}\n` +
                        `Estimated wait: ${doctor.waiting.length * 10} minutes`
                    );
                }).join("\n\n")
                : "No patients in the active queue.";

            alert(
                "QueueCare - Doctor-wise Live Queue\n\n" +
                queueText
            );

        } catch (error) {
            console.error("Live Queue error:", error);
            alert("Could not load the live queue. Check the backend.");
        }
    });