
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import Base, engine, SessionLocal, Appointment

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="QueueCare API",
    description="Smart Clinic Appointment and Live Queue Management",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR.parent / "frontend"

app.mount(
    "/static",
    StaticFiles(directory=FRONTEND_DIR),
    name="static"
)

# Data received from frontend
class AppointmentCreate(BaseModel):
    patient_name: str
    doctor_name: str
    appointment_time: str

@app.get("/")
def home():
    return FileResponse(FRONTEND_DIR / "index.html")

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Save a new appointment
@app.post("/appointments")
def create_appointment(appointment: AppointmentCreate):
    db: Session = SessionLocal()

    try:
        new_appointment = Appointment(
            patient_name=appointment.patient_name,
            doctor_name=appointment.doctor_name,
            appointment_time=appointment.appointment_time,
            status="Scheduled"
        )

        db.add(new_appointment)
        db.commit()
        db.refresh(new_appointment)

        return {
            "id": new_appointment.id,
            "patient_name": new_appointment.patient_name,
            "doctor_name": new_appointment.doctor_name,
            "appointment_time": new_appointment.appointment_time,
            "status": new_appointment.status
        }
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not save appointment"
        )
    finally:
        db.close()

# Retrieve saved appointments
@app.get("/appointments")
def get_appointments():
    db: Session = SessionLocal()

    try:
        appointments = db.query(Appointment).order_by(
            Appointment.id.desc()
        ).all()

        return [
            {
                "id": item.id,
                "patient_name": item.patient_name,
                "doctor_name": item.doctor_name,
                "appointment_time": item.appointment_time,
                "status": item.status
            }
            for item in appointments
        ]
    finally:
        db.close()



        
# Update appointment status
class AppointmentStatusUpdate(BaseModel):
    status: str

@app.patch("/appointments/{appointment_id}/status")
def update_appointment_status(
    appointment_id: int,
    update: AppointmentStatusUpdate
):
    allowed_statuses = [
        "Scheduled",
        "Waiting",
        "In Progress",
        "Completed"
    ]

    if update.status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid appointment status"
        )

    db: Session = SessionLocal()

    try:
        appointment = db.query(Appointment).filter(
            Appointment.id == appointment_id
        ).first()

        if appointment is None:
            raise HTTPException(
                status_code=404,
                detail="Appointment not found"
            )

        appointment.status = update.status
        db.commit()
        db.refresh(appointment)

        return {
            "message": "Appointment status updated",
            "id": appointment.id,
            "patient_name": appointment.patient_name,
            "doctor_name": appointment.doctor_name,
            "appointment_time": appointment.appointment_time,
            "status": appointment.status
        }

    finally:
        db.close()

        
# Dashboard statistics
@app.get("/stats")
def get_dashboard_stats():
    db: Session = SessionLocal()

    try:
        total = db.query(Appointment).count()

        completed = db.query(Appointment).filter(
            Appointment.status == "Completed"
        ).count()

        waiting = db.query(Appointment).filter(
            Appointment.status == "Waiting"
        ).count()

        doctors = db.query(Appointment.doctor_name).distinct().count()

        return {
            "total_appointments": total,
            "completed": completed,
            "waiting": waiting,
            "available_doctors": doctors
        }

    finally:
        db.close()