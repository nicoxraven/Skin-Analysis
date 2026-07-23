# backend/main.py
import os
import sys
import shutil
from typing import Optional, List
from fastapi import FastAPI, Depends, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, EmailStr

sys.path.append(os.path.join(os.path.dirname(__file__), "ai"))

from predict import analyze_skin_and_recommend
from database import init_db, get_db, User, Analysis, Product, Ingredient, Feedback

# ---------------------------------------------------------
# PYDANTIC SCHEMAS
# ---------------------------------------------------------

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    skin_type: Optional[str] = "Combination"
    age: int = 22
    role: Optional[str] = "user"
    admin_code: Optional[str] = ""

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ProductCreate(BaseModel):
    brand: str
    name: str
    category: str
    target_condition: str
    intensity: str = "mild"

class ProductUpdate(BaseModel):
    brand: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    target_condition: Optional[str] = None
    intensity: Optional[str] = None

class IngredientCreate(BaseModel):
    name: str
    purpose: str
    suitable_for: str

class IngredientUpdate(BaseModel):
    name: Optional[str] = None
    purpose: Optional[str] = None
    suitable_for: Optional[str] = None

class FeedbackCreate(BaseModel):
    user_id: int
    subject: str
    message: str

class FeedbackStatusUpdate(BaseModel):
    status: str  # Open | Resolved

class UserStatusUpdate(BaseModel):
    status: str  # Active | Suspended

def user_payload(user: User):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "age": user.age,
        "role": user.role,
        "skin_type": user.detected_skin_type,
        "status": user.status,
    }

app = FastAPI(title="Skincare AI & Admin System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# STARTUP
# ---------------------------------------------------------

@app.on_event("startup")
def on_startup():
    init_db()
    db = next(get_db())

    demo_user = db.query(User).filter(User.email == "demo@example.com").first()
    if not demo_user:
        db.add(User(
            name="Demo Student",
            email="demo@example.com",
            password="password123",
            age=22,
            role="user",
        ))

    admin_user = db.query(User).filter(User.email == "admin@lumina.com").first()
    if not admin_user:
        db.add(User(
            name="Lumina Admin",
            email="admin@lumina.com",
            password="admin123",
            age=30,
            role="admin",
        ))

    db.commit()
    print("SQLite database ready!")

# ---------------------------------------------------------
# AUTH
# ---------------------------------------------------------

@app.post("/api/auth/register")
def register_user(user_data: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email is already registered.")

    user_role = "user"
    if user_data.role == "admin":
        if user_data.admin_code != "admin123":
            raise HTTPException(status_code=400, detail="Invalid admin secret code")
        user_role = "admin"

    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password=user_data.password,
        age=user_data.age,
        detected_skin_type=user_data.skin_type,
        role=user_role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "status": "success",
        "message": "User registered successfully!",
        "user": user_payload(new_user),
    }

@app.post("/api/auth/login")
def login_user(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        User.email == credentials.email,
        User.password == credentials.password,
    ).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    return {"status": "success", "user": user_payload(user)}

# ---------------------------------------------------------
# USER: ANALYZE + PROGRESS
# ---------------------------------------------------------

@app.post("/api/user/analyze")
async def user_analyze_skin(
    user_id: Optional[int] = Form(default=1),
    user_age: Optional[int] = Form(default=None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")

    if user_age is not None:
        user.age = user_age

    os.makedirs("temp_uploads", exist_ok=True)
    safe_name = os.path.basename(file.filename or "selfie.jpg")
    temp_path = os.path.join("temp_uploads", f"temp_{user_id}_{safe_name}")
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        ai_res = analyze_skin_and_recommend(temp_path)
        if ai_res.get("status") == "error":
            raise HTTPException(status_code=400, detail=ai_res.get("message"))

        scores = ai_res["scores"]
        overall_health_score = round(100.0 - (sum(scores.values()) / len(scores)), 1)
        rec = ai_res["recommendation"]

        new_scan = Analysis(
            user_id=user.id,
            image_url=f"/uploads/{safe_name}",
            overall_score=overall_health_score,
            scores_json=scores,
            concerns_json=rec.get("routine_type", []),
            routine_json={
                "day": rec["day_routine"],
                "night": rec["night_routine"],
            },
            ingredients_json=["Salicylic Acid", "Niacinamide", "Hyaluronic Acid"],
        )
        db.add(new_scan)

        dominant_condition = max(scores, key=scores.get)
        user.detected_skin_type = dominant_condition

        db.commit()
        db.refresh(new_scan)

        return {
            "analysis_id": new_scan.id,
            "overall_score": overall_health_score,
            "scores": scores,
            "recommendation": rec,
        }
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.get("/api/user/{user_id}/progress")
def get_user_progress(user_id: int, db: Session = Depends(get_db)):
    scans = (
        db.query(Analysis)
        .filter(Analysis.user_id == user_id)
        .order_by(Analysis.created_at.asc())
        .all()
    )
    return [
        {
            "date": scan.created_at.strftime("%Y-%m-%d") if scan.created_at else "N/A",
            "overall_score": scan.overall_score,
            "scores": scan.scores_json,
        }
        for scan in scans
    ]

# ---------------------------------------------------------
# ADMIN DASHBOARD + CRUD
# ---------------------------------------------------------

@app.get("/api/admin/dashboard")
def get_admin_dashboard(db: Session = Depends(get_db)):
    total_users = db.query(User).filter(User.role == "user").count()
    total_analyses = db.query(Analysis).count()
    avg_score = db.query(func.avg(Analysis.overall_score)).scalar() or 0.0
    open_feedback = db.query(Feedback).filter(Feedback.status == "Open").count()

    recent_analyses = (
        db.query(Analysis)
        .order_by(Analysis.created_at.desc())
        .limit(5)
        .all()
    )

    return {
        "metrics": {
            "total_users": total_users,
            "total_analyses": total_analyses,
            "avg_score": round(float(avg_score), 1),
            "open_feedback": open_feedback,
        },
        "recent_analyses": [
            {
                "id": a.id,
                "user_id": a.user_id,
                "user": a.owner.name if a.owner else f"User {a.user_id}",
                "overall_score": a.overall_score,
                "score": a.overall_score,
                "date": a.created_at.strftime("%Y-%m-%d %H:%M") if a.created_at else "N/A",
                "status": "Completed",
            }
            for a in recent_analyses
        ],
    }

@app.get("/api/admin/users")
def get_admin_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "skinType": getattr(u, "detected_skin_type", "Combination"),
            "age": u.age,
            "joined": u.created_at.strftime("%Y-%m-%d") if u.created_at else "N/A",
            "analyses": len(u.analyses) if u.analyses else 0,
            "status": u.status,
            "role": u.role,
        }
        for u in users
    ]

@app.patch("/api/admin/users/{user_id}")
def update_user_status(user_id: int, payload: UserStatusUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if payload.status not in ("Active", "Suspended"):
        raise HTTPException(status_code=400, detail="status must be Active or Suspended")
    user.status = payload.status
    db.commit()
    return {"success": True, "user": user_payload(user)}

@app.delete("/api/admin/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete admin accounts")
    db.query(Analysis).filter(Analysis.user_id == user_id).delete()
    db.query(Feedback).filter(Feedback.user_id == user_id).delete()
    db.delete(user)
    db.commit()
    return {"success": True}

@app.get("/api/admin/analyses")
def get_admin_analyses(db: Session = Depends(get_db)):
    analyses = db.query(Analysis).order_by(Analysis.created_at.desc()).all()
    result = []
    for a in analyses:
        scores = a.scores_json or {}
        concerns = [k for k, v in scores.items() if isinstance(v, (int, float)) and v > 25]
        result.append({
            "id": a.id,
            "user": a.owner.name if a.owner else f"User {a.user_id}",
            "date": a.created_at.strftime("%Y-%m-%d") if a.created_at else "N/A",
            "score": a.overall_score,
            "skinType": a.owner.detected_skin_type if a.owner else "Unknown",
            "concerns": len(concerns),
            "status": "Completed",
        })
    return result

@app.delete("/api/admin/analyses/{analysis_id}")
def delete_analysis(analysis_id: int, db: Session = Depends(get_db)):
    row = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Analysis not found")
    db.delete(row)
    db.commit()
    return {"success": True}

# Skin conditions the AI model can detect (reference data for admin UI)
SKIN_CONDITIONS = [
    {"name": "Acne", "category": "Inflammatory", "prevalence": "High", "description": "Clogged pores with inflammation and breakouts."},
    {"name": "Redness", "category": "Sensitivity", "prevalence": "Medium", "description": "Facial erythema and reactive skin."},
    {"name": "Dryness", "category": "Barrier", "prevalence": "High", "description": "Dehydrated or flaky skin barrier."},
    {"name": "Oiliness", "category": "Sebum", "prevalence": "High", "description": "Excess sebum production, shiny T-zone."},
    {"name": "Wrinkles", "category": "Aging", "prevalence": "Medium", "description": "Fine lines and loss of firmness."},
    {"name": "Dark Spots", "category": "Pigmentation", "prevalence": "Medium", "description": "Hyperpigmentation and uneven tone."},
]

@app.get("/api/admin/conditions")
def get_conditions():
    return SKIN_CONDITIONS

@app.get("/api/admin/ingredients")
def list_ingredients(db: Session = Depends(get_db)):
    rows = db.query(Ingredient).all()
    return [
        {
            "id": i.id,
            "name": i.name,
            "category": "Active",
            "evidence": "Clinical",
            "suitableFor": i.suitable_for,
            "purpose": i.purpose,
        }
        for i in rows
    ]

@app.post("/api/admin/ingredients")
def create_ingredient(payload: IngredientCreate, db: Session = Depends(get_db)):
    row = Ingredient(name=payload.name, purpose=payload.purpose, suitable_for=payload.suitable_for)
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"id": row.id, "name": row.name, "purpose": row.purpose, "suitableFor": row.suitable_for}

@app.put("/api/admin/ingredients/{ingredient_id}")
def update_ingredient(ingredient_id: int, payload: IngredientUpdate, db: Session = Depends(get_db)):
    row = db.query(Ingredient).filter(Ingredient.id == ingredient_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        if field == "suitable_for":
            row.suitable_for = value
        else:
            setattr(row, field, value)
    db.commit()
    return {"success": True}

@app.delete("/api/admin/ingredients/{ingredient_id}")
def delete_ingredient(ingredient_id: int, db: Session = Depends(get_db)):
    row = db.query(Ingredient).filter(Ingredient.id == ingredient_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    db.delete(row)
    db.commit()
    return {"success": True}

@app.get("/api/admin/products")
def list_products(db: Session = Depends(get_db)):
    rows = db.query(Product).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "brand": p.brand,
            "category": p.category,
            "target_condition": p.target_condition,
            "intensity": p.intensity,
            "price": "—",
            "rating": 4.5,
            "inStock": True,
        }
        for p in rows
    ]

@app.post("/api/admin/products")
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    row = Product(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"id": row.id, "name": row.name, "brand": row.brand}

@app.put("/api/admin/products/{product_id}")
def update_product(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)):
    row = db.query(Product).filter(Product.id == product_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Product not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(row, field, value)
    db.commit()
    return {"success": True}

@app.delete("/api/admin/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    row = db.query(Product).filter(Product.id == product_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(row)
    db.commit()
    return {"success": True}

@app.get("/api/admin/feedback")
def list_feedback(db: Session = Depends(get_db)):
    rows = db.query(Feedback).order_by(Feedback.created_at.desc()).all()
    return [
        {
            "id": f.id,
            "user": f.owner.name if f.owner else f"User {f.user_id}",
            "date": f.created_at.strftime("%Y-%m-%d") if f.created_at else "N/A",
            "rating": 4,
            "category": f.subject,
            "comment": f.message,
            "resolved": f.status == "Resolved",
            "status": f.status,
        }
        for f in rows
    ]

@app.post("/api/admin/feedback")
def create_feedback(payload: FeedbackCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    row = Feedback(user_id=payload.user_id, subject=payload.subject, message=payload.message)
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"id": row.id, "status": row.status}

@app.patch("/api/admin/feedback/{feedback_id}")
def update_feedback_status(feedback_id: int, payload: FeedbackStatusUpdate, db: Session = Depends(get_db)):
    row = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Feedback not found")
    if payload.status not in ("Open", "Resolved"):
        raise HTTPException(status_code=400, detail="status must be Open or Resolved")
    row.status = payload.status
    db.commit()
    return {"success": True}

@app.delete("/api/admin/feedback/{feedback_id}")
def delete_feedback(feedback_id: int, db: Session = Depends(get_db)):
    row = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Feedback not found")
    db.delete(row)
    db.commit()
    return {"success": True}

@app.get("/api/health")
def health():
    return {"status": "ok"}
