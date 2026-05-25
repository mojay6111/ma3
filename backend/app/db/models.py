from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship, declarative_base
import uuid
from datetime import datetime

Base = declarative_base()

def gen_uuid():
    return str(uuid.uuid4())

class Route(Base):
    __tablename__ = "routes"
    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    sacco = Column(String, nullable=False)
    fare_kes = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    stops = relationship("Stop", back_populates="route", cascade="all, delete-orphan")
    vehicles = relationship("Vehicle", back_populates="route")

class Stop(Base):
    __tablename__ = "stops"
    id = Column(String, primary_key=True, default=gen_uuid)
    route_id = Column(String, ForeignKey("routes.id"), nullable=False)
    name = Column(String, nullable=False)
    sequence = Column(Integer, nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    route = relationship("Route", back_populates="stops")

class Driver(Base):
    __tablename__ = "drivers"
    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    phone = Column(String, unique=True, nullable=False)
    license_no = Column(String, unique=True, nullable=False)
    wallet_kes = Column(Float, default=0.0)
    score = Column(Float, default=100.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    vehicles = relationship("Vehicle", back_populates="driver")
    trips = relationship("Trip", back_populates="driver")

class Vehicle(Base):
    __tablename__ = "vehicles"
    id = Column(String, primary_key=True, default=gen_uuid)
    plate = Column(String, unique=True, nullable=False)
    driver_id = Column(String, ForeignKey("drivers.id"), nullable=True)
    route_id = Column(String, ForeignKey("routes.id"), nullable=True)
    capacity = Column(Integer, default=14)
    is_active = Column(Boolean, default=True)
    last_lat = Column(Float, nullable=True)
    last_lng = Column(Float, nullable=True)
    last_stop = Column(String, nullable=True)
    last_seen = Column(DateTime, nullable=True)
    driver = relationship("Driver", back_populates="vehicles")
    route = relationship("Route", back_populates="vehicles")
    trips = relationship("Trip", back_populates="vehicle")
    telemetry = relationship("Telemetry", back_populates="vehicle")

class Trip(Base):
    __tablename__ = "trips"
    id = Column(String, primary_key=True, default=gen_uuid)
    vehicle_id = Column(String, ForeignKey("vehicles.id"), nullable=False)
    driver_id = Column(String, ForeignKey("drivers.id"), nullable=False)
    route_id = Column(String, ForeignKey("routes.id"), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    pax_count = Column(Integer, default=0)
    fare_collected_kes = Column(Float, default=0.0)
    vehicle = relationship("Vehicle", back_populates="trips")
    driver = relationship("Driver", back_populates="trips")
    fares = relationship("Fare", back_populates="trip")

class Telemetry(Base):
    __tablename__ = "telemetry"
    id = Column(String, primary_key=True, default=gen_uuid)
    vehicle_id = Column(String, ForeignKey("vehicles.id"), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    speed_kmh = Column(Float, default=0.0)
    heading = Column(Float, default=0.0)
    stop_name = Column(String, nullable=True)
    pax_count = Column(Integer, default=0)
    recorded_at = Column(DateTime, default=datetime.utcnow)
    vehicle = relationship("Vehicle", back_populates="telemetry")

class Fare(Base):
    __tablename__ = "fares"
    id = Column(String, primary_key=True, default=gen_uuid)
    trip_id = Column(String, ForeignKey("trips.id"), nullable=False)
    commuter_phone = Column(String, nullable=False)
    amount_kes = Column(Float, nullable=False)
    mpesa_ref = Column(String, nullable=True)
    paid_at = Column(DateTime, default=datetime.utcnow)
    trip = relationship("Trip", back_populates="fares")


# ── AUTH & SACCO PORTAL ──────────────────────────────────────

class SaccoProfile(Base):
    __tablename__ = "sacco_profiles"
    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    registration_no = Column(String, unique=True, nullable=False)
    county = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    email = Column(String, nullable=False)
    logo_url = Column(String, nullable=True)
    cover_url = Column(String, nullable=True)
    description = Column(String, nullable=True)
    is_approved = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    managers = relationship("ManagerAccount", back_populates="sacco")


class ManagerAccount(Base):
    __tablename__ = "manager_accounts"
    id = Column(String, primary_key=True, default=gen_uuid)
    sacco_id = Column(String, ForeignKey("sacco_profiles.id"), nullable=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    phone = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="sacco_admin")
    # roles: superadmin | sacco_admin | sacco_ops
    is_primary = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    otp_code = Column(String, nullable=True)
    otp_expires = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    sacco = relationship("SaccoProfile", back_populates="managers")


class TransferRequest(Base):
    __tablename__ = "transfer_requests"
    id = Column(String, primary_key=True, default=gen_uuid)
    sacco_id = Column(String, ForeignKey("sacco_profiles.id"), nullable=False)
    from_manager_id = Column(String, ForeignKey("manager_accounts.id"), nullable=False)
    to_email = Column(String, nullable=False)
    token = Column(String, nullable=False)
    is_completed = Column(Boolean, default=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
