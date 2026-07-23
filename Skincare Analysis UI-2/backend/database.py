# backend/database.py
import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

SQLITE_URL = "sqlite:///./skincare_app.db"

engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ---------------------------------------------------------
# DATABASE TABLES
# ---------------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, default="user")  # 'user' or 'admin'
    detected_skin_type = Column(String, default="Pending Scan")
    age = Column(Integer, nullable=True)
    status = Column(String, default="Active")  # 'Active', 'Suspended'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    analyses = relationship("Analysis", back_populates="owner")
    feedbacks = relationship("Feedback", back_populates="owner")

class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    image_url = Column(String, nullable=True)
    overall_score = Column(Float, nullable=False)
    
    # Store scores & predictions as JSON
    scores_json = Column(JSON, nullable=False)  # {"Acne": 45.0, "Redness": 10.0, ...}
    concerns_json = Column(JSON, nullable=False) # ["Acne", "Oily Skin"]
    routine_json = Column(JSON, nullable=False)  # Day and Night routines
    ingredients_json = Column(JSON, nullable=False) # Key ingredients recommended
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="analyses")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    brand = Column(String, nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)  # Cleanser, Serum, Moisturizer, Sunscreen
    target_condition = Column(String, nullable=False) # Acne, Dryness, etc.
    intensity = Column(String, default="harsh") # 'harsh' or 'mild'

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
    status = Column(String, default="Open")  # 'Open', 'Resolved'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="feedbacks")

# Initialize tables
def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()