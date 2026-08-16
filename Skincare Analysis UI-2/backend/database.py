# backend/database.py
import datetime
from sqlalchemy import (
    create_engine, Column, Integer, String, Float, DateTime,
    ForeignKey, Text, JSON, Boolean, UniqueConstraint,
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

SQLITE_URL = "sqlite:///./skincare_app.db"

engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, default="user")
    tier = Column(String, default="premium")
    phone_number = Column(String, nullable=True)
    tier_expires_at = Column(DateTime, nullable=True)
    daily_scan_count = Column(Integer, default=0)
    daily_scan_date = Column(String, nullable=True)
    premium_requested = Column(Boolean, default=False)
    detected_skin_type = Column(String, default="Pending Scan")
    age = Column(Integer, nullable=True)
    status = Column(String, default="Active")
    force_rescan = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    analyses = relationship("Analysis", back_populates="owner")
    feedbacks = relationship("Feedback", back_populates="owner")
    routine_logs = relationship("RoutineLog", back_populates="owner")
    notifications = relationship("Notification", back_populates="owner")


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    image_url = Column(String, nullable=True)
    overall_score = Column(Float, nullable=False)
    scores_json = Column(JSON, nullable=False)
    concerns_json = Column(JSON, nullable=False)
    routine_json = Column(JSON, nullable=False)
    ingredients_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="analyses")


class RoutineLog(Base):
    """Daily AM/PM checklist completion for the active analysis cycle."""
    __tablename__ = "routine_logs"
    __table_args__ = (
        UniqueConstraint("user_id", "log_date", "period", name="uq_user_date_period"),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    analysis_id = Column(Integer, ForeignKey("analyses.id"), nullable=True)
    log_date = Column(String, nullable=False)  # YYYY-MM-DD
    period = Column(String, nullable=False)  # am | pm
    completed_steps = Column(JSON, default=list)  # [1, 2, 3]
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="routine_logs")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    type = Column(String, default="info")  # analysis | routine | progress | reminder
    color = Column(String, default="#6B3A52")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="notifications")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    brand = Column(String, nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    target_condition = Column(String, nullable=False)
    intensity = Column(String, default="harsh")


class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    purpose = Column(String, nullable=False)
    suitable_for = Column(String, nullable=False)


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    subject = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String, default="Open")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="feedbacks")


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
