# backend/main.py
import os
import sys
import shutil
import datetime
from typing import Optional, List
from fastapi import FastAPI, Depends, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, EmailStr

sys.path.append(os.path.join(os.path.dirname(__file__), "ai"))

from predict import analyze_skin_and_recommend
from database import (
    init_db, get_db, User, Analysis, Product, Ingredient, Feedback,
    RoutineLog, Notification,
)

RESCAN_DAYS = 7

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
    status: str

class UserStatusUpdate(BaseModel):
    status: str

class RoutineToggle(BaseModel):
    period: str  # am | pm
    step: int
    done: bool
    analysis_id: Optional[int] = None
    date: Optional[str] = None  # YYYY-MM-DD, defaults today


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


def today_str():
    return datetime.datetime.utcnow().strftime("%Y-%m-%d")


def map_routine_steps(backend_routine):
    mapped = []
    if not backend_routine or not isinstance(backend_routine, dict):
        return mapped
    order = [
        ("step_1_cleanser", "Cleanser"),
        ("step_2_treatment", "Treatment"),
        ("step_3_moisturizer", "Moisturize"),
        ("step_4_sunscreen", "Sun Protection"),
    ]
    step = 1
    for key, note in order:
        item = backend_routine.get(key)
        if not item:
            continue
        name = item.get("name") if isinstance(item, dict) else str(item)
        mapped.append({"step": step, "product": name, "note": note})
        step += 1
    return mapped


def map_concerns(scores):
    concerns = []
    for key, val in (scores or {}).items():
        try:
            num = float(val)
        except (TypeError, ValueError):
            continue
        if num > 25:
            severity = "Severe" if num > 85 else ("Moderate" if num > 65 else "Mild")
            concerns.append({
                "name": key,
                "severity": severity,
                "tip": "Addressed via your personalized routine.",
            })
    return concerns


def map_ingredients(raw):
    out = []
    for item in (raw or []):
        if isinstance(item, dict):
            out.append({
                "name": item.get("name", "Ingredient"),
                "benefit": item.get("benefit") or item.get("purpose") or "Recommended for your skin",
                "when": item.get("when", "As directed"),
                "essential": bool(item.get("essential", True)),
            })
        else:
            out.append({
                "name": str(item),
                "benefit": "Tailored by AI to your condition",
                "when": "As directed",
                "essential": True,
            })
    if not out:
        out = [
            {"name": "Specific Actives", "benefit": "Tailored by AI to your condition", "when": "As directed", "essential": True},
            {"name": "Moisturizer", "benefit": "Barrier repair", "when": "AM + PM", "essential": True},
            {"name": "SPF", "benefit": "Daily UV protection", "when": "Morning", "essential": True},
        ]
    return out


def analysis_ui_payload(scan: Analysis):
    scores = scan.scores_json or {}
    routine = scan.routine_json or {}
    dominant = "Normal"
    if scores:
        dominant = max(scores, key=lambda k: float(scores.get(k) or 0))
    created = scan.created_at or datetime.datetime.utcnow()
    days_since = (datetime.datetime.utcnow() - created).days
    days_until = max(0, RESCAN_DAYS - days_since)
    return {
        "analysis_id": scan.id,
        "score": scan.overall_score,
        "skinType": dominant,
        "concerns": map_concerns(scores),
        "ingredients": map_ingredients(scan.ingredients_json),
        "amRoutine": map_routine_steps(routine.get("day") or routine.get("day_routine")),
        "pmRoutine": map_routine_steps(routine.get("night") or routine.get("night_routine")),
        "scores": scores,
        "created_at": created.strftime("%Y-%m-%d"),
        "days_since": days_since,
        "days_until_rescan": days_until,
        "can_rescan": days_since >= RESCAN_DAYS,
        "rescan_days": RESCAN_DAYS,
        "imagePreview": None,
    }


def add_notification(db: Session, user_id: int, title: str, body: str, ntype: str = "info", color: str = "#6B3A52"):
    row = Notification(
        user_id=user_id,
        title=title,
        body=body,
        type=ntype,
        color=color,
        is_read=False,
    )
    db.add(row)
    return row


def relative_time(dt: datetime.datetime):
    if not dt:
        return ""
    delta = datetime.datetime.utcnow() - dt
    secs = int(delta.total_seconds())
    if secs < 60:
        return "Just now"
    if secs < 3600:
        return f"{secs // 60} min ago"
    if secs < 86400:
        return f"{secs // 3600} hr ago"
    days = secs // 86400
    if days == 1:
        return "Yesterday"
    return f"{days} days ago"


def compute_streak(db: Session, user_id: int):
    logs = (
        db.query(RoutineLog)
        .filter(RoutineLog.user_id == user_id)
        .all()
    )
    days_with_any = {log.log_date for log in logs if log.completed_steps}
    if not days_with_any:
        return 0
    streak = 0
    day = datetime.datetime.utcnow().date()
    while day.strftime("%Y-%m-%d") in days_with_any:
        streak += 1
        day = day - datetime.timedelta(days=1)
    return streak


app = FastAPI(title="Skincare AI & Admin System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


@app.post("/api/auth/register")
def register_user(user_data: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email is already registered.")

    # Admins are seeded only — public registration is always a normal user
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password=user_data.password,
        age=user_data.age,
        detected_skin_type=user_data.skin_type,
        role="user",
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    add_notification(
        db, new_user.id,
        "Welcome to Lumina",
        "Upload your first selfie to get a personalized skin analysis and daily routine.",
        "reminder",
        "#6B8EAF",
    )
    db.commit()

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
# USER: ANALYZE + LATEST + ROUTINE + NOTIFICATIONS
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

    latest = (
        db.query(Analysis)
        .filter(Analysis.user_id == user_id)
        .order_by(Analysis.created_at.desc())
        .first()
    )
    previous_scores = latest.scores_json if latest else None
    is_first = latest is None
    is_force_rescan = bool(user.force_rescan)
    is_weekly = False
    if latest and latest.created_at:
        days = (datetime.datetime.utcnow() - latest.created_at).days
        is_weekly = days >= RESCAN_DAYS

    os.makedirs("temp_uploads", exist_ok=True)
    safe_name = os.path.basename(file.filename or "selfie.jpg")
    temp_path = os.path.join("temp_uploads", f"temp_{user_id}_{safe_name}")
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        ai_res = analyze_skin_and_recommend(temp_path, previous_scores=previous_scores)
        if ai_res.get("status") == "error":
            raise HTTPException(status_code=400, detail=ai_res.get("message"))

        scores = ai_res["scores"]
        # Weighted score: dominant condition has 60% weight, avg has 40%
        # This ensures different selfies with different dominant conditions
        # produce meaningfully different scores instead of always ~80.
        score_values = list(scores.values())
        avg_score = sum(score_values) / len(score_values)
        dominant_score = max(score_values)
        raw_severity = dominant_score * 0.6 + avg_score * 0.4
        overall_health_score = round(max(0.0, min(100.0, 100.0 - raw_severity)), 1)
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
        user.force_rescan = False

        if is_first:
            add_notification(
                db, user.id,
                "Analysis ready",
                f"Your first skin score is {overall_health_score}. Check your daily AM/PM routine checklist.",
                "analysis",
                "#6B3A52",
            )
        elif is_force_rescan and previous_scores is not None:
            prev = latest.overall_score if latest else overall_health_score
            delta = round(overall_health_score - prev, 1)
            direction = "up" if delta >= 0 else "down"
            add_notification(
                db, user.id,
                "Force scan complete",
                f"New score {overall_health_score} ({direction} {abs(delta)} pts). Your routine has been refreshed and the 7-day timer restarted.",
                "analysis",
                "#7A9E87" if delta >= 0 else "#C4859A",
            )
        elif is_weekly and previous_scores is not None:
            prev = latest.overall_score if latest else overall_health_score
            delta = round(overall_health_score - prev, 1)
            direction = "up" if delta >= 0 else "down"
            add_notification(
                db, user.id,
                "Weekly check-in complete",
                f"New score {overall_health_score} ({direction} {abs(delta)} pts). Your routine was updated for the next 7 days.",
                "progress",
                "#7A9E87" if delta >= 0 else "#C4859A",
            )
        else:
            add_notification(
                db, user.id,
                "Analysis updated",
                f"Your skin score is now {overall_health_score}. Follow this week's routine checklist.",
                "analysis",
                "#6B3A52",
            )

        db.commit()
        db.refresh(new_scan)

        return {
            "analysis_id": new_scan.id,
            "overall_score": overall_health_score,
            "scores": scores,
            "recommendation": rec,
            "ui": analysis_ui_payload(new_scan),
        }
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@app.get("/api/user/{user_id}/latest")
def get_latest_analysis(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    scan = (
        db.query(Analysis)
        .filter(Analysis.user_id == user_id)
        .order_by(Analysis.created_at.desc())
        .first()
    )
    if not scan:
        return {
            "has_analysis": False,
            "can_rescan": True,
            "needs_first_scan": True,
            "analysis": None,
        }

    payload = analysis_ui_payload(scan)
    streak = compute_streak(db, user_id)
    days_until = max(0, RESCAN_DAYS - max(payload["days_since"], streak))
    if user.force_rescan:
        payload["can_rescan"] = True
        payload["days_until_rescan"] = 0
    else:
        payload["can_rescan"] = days_until <= 0
        payload["days_until_rescan"] = days_until

    return {
        "has_analysis": True,
        "needs_first_scan": False,
        "can_rescan": payload["can_rescan"],
        "force_rescan": bool(user.force_rescan),
        "days_until_rescan": payload["days_until_rescan"],
        "days_since": payload["days_since"],
        "analysis": payload,
    }


@app.get("/api/user/{user_id}/progress")
def get_user_progress(user_id: int, db: Session = Depends(get_db)):
    scans = (
        db.query(Analysis)
        .filter(Analysis.user_id == user_id)
        .order_by(Analysis.created_at.asc())
        .all()
    )
    history = [
        {
            "id": scan.id,
            "date": scan.created_at.strftime("%Y-%m-%d") if scan.created_at else "N/A",
            "overall_score": scan.overall_score,
            "score": scan.overall_score,
            "scores": scan.scores_json,
            "skinType": max(scan.scores_json, key=scan.scores_json.get) if scan.scores_json else "Unknown",
        }
        for scan in scans
    ]

    current = history[-1]["score"] if history else 0
    first = history[0]["score"] if history else 0
    gain = round(current - first, 1) if history else 0

    # Routine adherence in last 7 days
    since = (datetime.datetime.utcnow() - datetime.timedelta(days=7)).strftime("%Y-%m-%d")
    week_logs = (
        db.query(RoutineLog)
        .filter(RoutineLog.user_id == user_id, RoutineLog.log_date >= since)
        .all()
    )
    periods_logged = len([l for l in week_logs if l.completed_steps])
    # 7 days * 2 periods = 14 possible
    adherence = round((periods_logged / 14) * 100, 1) if periods_logged else 0.0

    streak_days = compute_streak(db, user_id)
    latest = history[-1] if history else None
    days_since = 0
    days_until = RESCAN_DAYS
    if scans:
        days_since = (datetime.datetime.utcnow() - scans[-1].created_at).days
        days_until = max(0, RESCAN_DAYS - max(days_since, streak_days))

    user = db.query(User).filter(User.id == user_id).first()
    if user and user.force_rescan:
        can_rescan_flag = True
        days_until = 0
    else:
        can_rescan_flag = days_until <= 0 if scans else True

    return {
        "history": history,
        "summary": {
            "current_score": current,
            "first_score": first,
            "gain": gain,
            "scan_count": len(history),
            "routine_adherence_7d": adherence,
            "streak_days": streak_days,
            "days_since_last_scan": days_since,
            "days_until_rescan": days_until,
            "can_rescan": can_rescan_flag,
            "skin_type": latest["skinType"] if latest else "Pending Scan",
        },
    }


@app.get("/api/user/{user_id}/routine/today")
def get_today_routine(user_id: int, date: Optional[str] = None, db: Session = Depends(get_db)):
    log_date = date or today_str()
    scan = (
        db.query(Analysis)
        .filter(Analysis.user_id == user_id)
        .order_by(Analysis.created_at.desc())
        .first()
    )
    if not scan:
        return {"date": log_date, "am": [], "pm": [], "am_done": [], "pm_done": [], "analysis_id": None}

    ui = analysis_ui_payload(scan)
    streak = compute_streak(db, user_id)
    days_until = max(0, RESCAN_DAYS - max(ui["days_since"], streak))
    
    user = db.query(User).filter(User.id == user_id).first()
    if user and user.force_rescan:
        ui["days_until_rescan"] = 0
        ui["can_rescan"] = True
    else:
        ui["days_until_rescan"] = days_until
        ui["can_rescan"] = days_until <= 0

    logs = (
        db.query(RoutineLog)
        .filter(
            RoutineLog.user_id == user_id,
            RoutineLog.log_date == log_date,
        )
        .all()
    )
    am_done = next((l.completed_steps or [] for l in logs if l.period == "am"), [])
    pm_done = next((l.completed_steps or [] for l in logs if l.period == "pm"), [])

    return {
        "date": log_date,
        "analysis_id": scan.id,
        "am": ui["amRoutine"],
        "pm": ui["pmRoutine"],
        "am_done": am_done,
        "pm_done": pm_done,
        "can_rescan": ui["can_rescan"],
        "days_until_rescan": ui["days_until_rescan"],
    }


@app.post("/api/user/{user_id}/routine/toggle")
def toggle_routine_step(user_id: int, payload: RoutineToggle, db: Session = Depends(get_db)):
    if payload.period not in ("am", "pm"):
        raise HTTPException(status_code=400, detail="period must be am or pm")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    log_date = payload.date or today_str()
    analysis_id = payload.analysis_id
    if not analysis_id:
        latest = (
            db.query(Analysis)
            .filter(Analysis.user_id == user_id)
            .order_by(Analysis.created_at.desc())
            .first()
        )
        analysis_id = latest.id if latest else None

    row = (
        db.query(RoutineLog)
        .filter(
            RoutineLog.user_id == user_id,
            RoutineLog.log_date == log_date,
            RoutineLog.period == payload.period,
        )
        .first()
    )
    if not row:
        row = RoutineLog(
            user_id=user_id,
            analysis_id=analysis_id,
            log_date=log_date,
            period=payload.period,
            completed_steps=[],
        )
        db.add(row)

    steps = list(row.completed_steps or [])
    if payload.done and payload.step not in steps:
        steps.append(payload.step)
    if not payload.done and payload.step in steps:
        steps = [s for s in steps if s != payload.step]
    row.completed_steps = sorted(steps)
    row.updated_at = datetime.datetime.utcnow()

    # Notify when a full period is completed
    latest = (
        db.query(Analysis)
        .filter(Analysis.user_id == user_id)
        .order_by(Analysis.created_at.desc())
        .first()
    )
    if latest:
        ui = analysis_ui_payload(latest)
        total = len(ui["amRoutine"] if payload.period == "am" else ui["pmRoutine"])
        if total > 0 and len(steps) == total:
            label = "Morning" if payload.period == "am" else "Evening"
            add_notification(
                db, user_id,
                f"{label} routine complete",
                f"Nice work — you finished all {total} {label.lower()} steps for {log_date}.",
                "routine",
                "#D4A843",
            )

    db.commit()
    return {"success": True, "period": payload.period, "completed_steps": row.completed_steps, "date": log_date}


@app.get("/api/user/{user_id}/notifications")
def list_notifications(user_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(Notification)
        .filter(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .limit(30)
        .all()
    )
    return [
        {
            "id": n.id,
            "title": n.title,
            "body": n.body,
            "type": n.type,
            "color": n.color or "#6B3A52",
            "unread": not n.is_read,
            "time": relative_time(n.created_at),
            "created_at": n.created_at.isoformat() if n.created_at else None,
        }
        for n in rows
    ]


@app.patch("/api/user/{user_id}/notifications/{notification_id}/read")
def mark_notification_read(user_id: int, notification_id: int, db: Session = Depends(get_db)):
    row = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == user_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Notification not found")
    row.is_read = True
    db.commit()
    return {"success": True}


@app.patch("/api/user/{user_id}/notifications/read-all")
def mark_all_notifications_read(user_id: int, db: Session = Depends(get_db)):
    db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False,  # noqa: E712
    ).update({"is_read": True})
    db.commit()
    return {"success": True}


@app.post("/api/user/{user_id}/force_rescan")
def user_force_rescan(user_id: int, db: Session = Depends(get_db)):
    """User-initiated force rescan — enables rescan and resets timer on next upload."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.force_rescan = True
    add_notification(
        db, user.id,
        "Force scan enabled",
        "Upload a new selfie to get updated analysis and a refreshed routine.",
        "reminder",
        "#6B8EAF",
    )
    db.commit()
    return {"success": True}


# ---------------------------------------------------------
# ADMIN DASHBOARD + CRUD
# (School focus: Dashboard analytics + Users + Analyses + Products)
# Products table feeds the AI recommender routines.
# ---------------------------------------------------------

class UserUpdate(BaseModel):
    status: Optional[str] = None
    age: Optional[int] = None
    name: Optional[str] = None
    password: Optional[str] = None


def _dominant_from_scores(scores):
    if not scores:
        return "Unknown"
    try:
        return max(scores, key=lambda k: float(scores.get(k) or 0))
    except Exception:
        return "Unknown"


def _age_group(age):
    if age is None:
        return "Unknown"
    if age < 18:
        return "Under 18"
    if age <= 24:
        return "18–24"
    if age <= 34:
        return "25–34"
    if age <= 44:
        return "35–44"
    return "45+"


@app.get("/api/admin/dashboard")
def get_admin_dashboard(
    skin_type: Optional[str] = None,
    age_min: Optional[int] = None,
    age_max: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """Real analytics from analyses + users. Optional filters for charts."""
    total_users = db.query(User).filter(User.role == "user").count()
    total_products = db.query(Product).count()
    total_analyses = db.query(Analysis).count()

    # Join-ish filtering in Python (SQLite + JSON kept simple for school project)
    analyses = (
        db.query(Analysis)
        .order_by(Analysis.created_at.asc())
        .all()
    )

    filtered = []
    for a in analyses:
        user = a.owner
        if not user:
            continue
        dominant = user.detected_skin_type or _dominant_from_scores(a.scores_json)
        age = user.age
        if skin_type and skin_type.lower() not in str(dominant).lower():
            continue
        if age_min is not None and (age is None or age < age_min):
            continue
        if age_max is not None and (age is None or age > age_max):
            continue
        filtered.append({
            "id": a.id,
            "user_id": a.user_id,
            "user": user.name,
            "age": age,
            "skinType": dominant,
            "score": a.overall_score,
            "scores": a.scores_json or {},
            "date": a.created_at.strftime("%Y-%m-%d") if a.created_at else "N/A",
            "datetime": a.created_at.strftime("%Y-%m-%d %H:%M") if a.created_at else "N/A",
        })

    scores = [row["score"] for row in filtered]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0

    # Score buckets
    buckets = {"0–40": 0, "41–60": 0, "61–75": 0, "76–90": 0, "91–100": 0}
    for s in scores:
        if s <= 40:
            buckets["0–40"] += 1
        elif s <= 60:
            buckets["41–60"] += 1
        elif s <= 75:
            buckets["61–75"] += 1
        elif s <= 90:
            buckets["76–90"] += 1
        else:
            buckets["91–100"] += 1
    score_distribution = [{"range": k, "count": v} for k, v in buckets.items()]

    # By skin type
    by_skin = {}
    for row in filtered:
        key = row["skinType"] or "Unknown"
        by_skin.setdefault(key, {"skinType": key, "count": 0, "avg_score": 0.0, "_sum": 0.0})
        by_skin[key]["count"] += 1
        by_skin[key]["_sum"] += float(row["score"] or 0)
    by_skin_type = []
    for v in by_skin.values():
        v["avg_score"] = round(v["_sum"] / v["count"], 1) if v["count"] else 0
        del v["_sum"]
        by_skin_type.append(v)
    by_skin_type.sort(key=lambda x: x["count"], reverse=True)

    # By age group
    by_age = {}
    for row in filtered:
        key = _age_group(row["age"])
        by_age.setdefault(key, {"age_group": key, "count": 0, "avg_score": 0.0, "_sum": 0.0})
        by_age[key]["count"] += 1
        by_age[key]["_sum"] += float(row["score"] or 0)
    order = ["Under 18", "18–24", "25–34", "35–44", "45+", "Unknown"]
    by_age_group = []
    for key in order:
        if key in by_age:
            v = by_age[key]
            v["avg_score"] = round(v["_sum"] / v["count"], 1) if v["count"] else 0
            del v["_sum"]
            by_age_group.append(v)

    # Average AI condition severity across filtered analyses
    condition_sums = {}
    condition_counts = {}
    for row in filtered:
        for cond, val in (row["scores"] or {}).items():
            try:
                num = float(val)
            except (TypeError, ValueError):
                continue
            condition_sums[cond] = condition_sums.get(cond, 0.0) + num
            condition_counts[cond] = condition_counts.get(cond, 0) + 1
    condition_averages = [
        {"condition": k, "avg": round(condition_sums[k] / condition_counts[k], 1)}
        for k in condition_sums
    ]
    condition_averages.sort(key=lambda x: x["avg"], reverse=True)

    timeline = [
        {"date": row["date"], "score": row["score"], "user": row["user"], "skinType": row["skinType"]}
        for row in filtered
    ]

    return {
        "metrics": {
            "total_users": total_users,
            "total_analyses": total_analyses,
            "filtered_analyses": len(filtered),
            "avg_score": avg_score,
            "total_products": total_products,
        },
        "score_distribution": score_distribution,
        "by_skin_type": by_skin_type,
        "by_age_group": by_age_group,
        "condition_averages": condition_averages,
        "timeline": timeline,
        "analyses": list(reversed(filtered)),  # newest first for table
        "filters": {
            "skin_type": skin_type,
            "age_min": age_min,
            "age_max": age_max,
        },
    }


@app.get("/api/admin/users")
def get_admin_users(q: Optional[str] = None, db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    rows = []
    for u in users:
        row = {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "skinType": getattr(u, "detected_skin_type", "Pending Scan"),
            "age": u.age,
            "joined": u.created_at.strftime("%Y-%m-%d") if u.created_at else "N/A",
            "analyses": len(u.analyses) if u.analyses else 0,
            "status": u.status,
            "role": u.role,
        }
        if q:
            blob = f"{row['name']} {row['email']} {row['skinType']} {row['status']} {row['role']}".lower()
            if q.lower() not in blob:
                continue
        rows.append(row)
    return rows


@app.post("/api/admin/users/{user_id}/force_rescan")
def admin_force_rescan(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.force_rescan = True
        add_notification(
            db, user.id,
            "Rescan requested by admin",
            "An admin has allowed you to upload a new selfie. Please upload one to refresh your routine.",
            "reminder",
            "#D4A843",
        )
        db.commit()
    return {"success": True}


@app.patch("/api/admin/users/{user_id}")
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    data = payload.model_dump(exclude_unset=True)
    if "status" in data and data["status"] not in ("Active", "Suspended"):
        raise HTTPException(status_code=400, detail="status must be Active or Suspended")
    for field, value in data.items():
        setattr(user, field, value)
    db.commit()
    return {"success": True, "user": user_payload(user)}


@app.delete("/api/admin/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete admin accounts")
    db.query(RoutineLog).filter(RoutineLog.user_id == user_id).delete()
    db.query(Notification).filter(Notification.user_id == user_id).delete()
    db.query(Analysis).filter(Analysis.user_id == user_id).delete()
    db.query(Feedback).filter(Feedback.user_id == user_id).delete()
    db.delete(user)
    db.commit()
    return {"success": True}


@app.post("/api/admin/users/{user_id}/reset-rescan")
def admin_reset_rescan(user_id: int, db: Session = Depends(get_db)):
    """
    Testing/Demo only: backdates the user's latest analysis by 8 days,
    making can_rescan=True so teachers can demo a fresh upload right away.
    The 7-day cycle logic is unchanged — this just simulates time passing.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    latest = (
        db.query(Analysis)
        .filter(Analysis.user_id == user_id)
        .order_by(Analysis.created_at.desc())
        .first()
    )
    if not latest:
        raise HTTPException(status_code=404, detail="User has no analyses to reset")
    # Backdate by 8 days so the 7-day gate opens immediately
    latest.created_at = datetime.datetime.utcnow() - datetime.timedelta(days=8)
    db.commit()
    return {"success": True, "message": f"Rescan timer reset for {user.name}. They can now upload a new selfie."}


@app.get("/api/admin/analyses")
def get_admin_analyses(q: Optional[str] = None, db: Session = Depends(get_db)):
    analyses = db.query(Analysis).order_by(Analysis.created_at.desc()).all()
    result = []
    for a in analyses:
        scores = a.scores_json or {}
        concerns = [k for k, v in scores.items() if isinstance(v, (int, float)) and v > 25]
        dominant = _dominant_from_scores(scores)
        row = {
            "id": a.id,
            "user_id": a.user_id,
            "user": a.owner.name if a.owner else f"User {a.user_id}",
            "age": a.owner.age if a.owner else None,
            "date": a.created_at.strftime("%Y-%m-%d %H:%M") if a.created_at else "N/A",
            "score": a.overall_score,
            "skinType": dominant,
            "concerns": len(concerns),
            "concern_list": concerns,
            "scores": scores,
            "status": "Completed",
        }
        if q:
            blob = f"{row['user']} {row['skinType']} {row['date']} {row['score']}".lower()
            if q.lower() not in blob:
                continue
        result.append(row)
    return result


@app.delete("/api/admin/analyses/{analysis_id}")
def delete_analysis(analysis_id: int, db: Session = Depends(get_db)):
    row = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Analysis not found")
    db.query(RoutineLog).filter(RoutineLog.analysis_id == analysis_id).delete()
    db.delete(row)
    db.commit()
    return {"success": True}


@app.get("/api/admin/products")
def list_products(q: Optional[str] = None, db: Session = Depends(get_db)):
    rows = db.query(Product).order_by(Product.id.desc()).all()
    out = []
    for p in rows:
        row = {
            "id": p.id,
            "name": p.name,
            "brand": p.brand,
            "category": p.category,
            "target_condition": p.target_condition,
            "intensity": p.intensity,
        }
        if q:
            blob = f"{row['name']} {row['brand']} {row['category']} {row['target_condition']} {row['intensity']}".lower()
            if q.lower() not in blob:
                continue
        out.append(row)
    return out


@app.post("/api/admin/products")
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    row = Product(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return {
        "id": row.id,
        "name": row.name,
        "brand": row.brand,
        "category": row.category,
        "target_condition": row.target_condition,
        "intensity": row.intensity,
    }


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


@app.get("/api/health")
def health():
    return {"status": "ok"}
