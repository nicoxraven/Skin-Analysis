# backend/ai/recommender.py
import os
import sys
import random

# Add parent directory to path to import database
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from database import SessionLocal, Product

def pick_random(product_list):
    if not product_list:
        return {"brand": "Generic", "name": "Standard Product"}
    return random.choice(product_list)

def fetch_products(db, condition, intensity, category):
    items = db.query(Product).filter(
        Product.target_condition == condition,
        Product.intensity == intensity,
        Product.category == category
    ).all()
    if not items:
        # Fallback to general condition products
        items = db.query(Product).filter(
            Product.target_condition == "All",
            Product.category == category
        ).all()
    
    # Map to dictionary format expected by the frontend
    return [{"brand": i.brand, "name": i.name} for i in items]

# ---------------------------------------------------------
# 2. Progress Tracker Logic
# ---------------------------------------------------------
def analyze_progress(previous_scores, current_scores):
    if not previous_scores:
        return {"status": "first_scan", "message": "First analysis recorded. Welcome to your skincare journey!"}

    improvements = []
    regressions = []

    for condition, current_val in current_scores.items():
        prev_val = previous_scores.get(condition, current_val)
        diff = prev_val - current_val

        if diff >= 10.0:
            improvements.append(condition)
        elif diff <= -10.0:
            regressions.append(condition)

    if improvements:
        msg = f"Great progress! Your {', '.join(improvements)} has improved noticeably."
        if regressions:
            msg += f" However, we noticed a flare-up in {', '.join(regressions)}."
        return {"status": "improved", "message": msg, "improved_areas": improvements}
    elif regressions:
        return {"status": "worsened", "message": f"Your skin experienced a slight flare-up in {', '.join(regressions)}. We adjusted your routine to soothe it."}
    else:
        return {"status": "stable", "message": "Your skin condition is stable! Keeping routine steady."}

# ---------------------------------------------------------
# 3. Main Routine Builder
# ---------------------------------------------------------
CONDITION_ALIASES = {
    "Dry Skin": "Dryness",
    "Dryness": "Dryness",
    "Acne": "Acne",
    "Oily Skin": "Oily Skin",
    "Dark Spots": "Dark Spots",
    "Wrinkles": "Wrinkles",
}

def normalize_condition(name):
    return CONDITION_ALIASES.get(name, name)

def generate_routine(current_scores, previous_scores=None):
    progress = analyze_progress(previous_scores, current_scores)
    
    active_conditions = [cond for cond, score in current_scores.items() if score >= 40.0]
    primary_condition = normalize_condition(active_conditions[0] if active_conditions else "Dryness")

    intensity = "mild" if progress["status"] == "improved" else "harsh"

    db = SessionLocal()
    try:
        # Fetch categories from DB dynamically
        cleansers = fetch_products(db, primary_condition, intensity, "cleanser")
        day_treatments = fetch_products(db, primary_condition, intensity, "day_treatment")
        night_treatments = fetch_products(db, primary_condition, intensity, "night_treatment")
        
        # General items
        moisturizers = fetch_products(db, "All", "mild", "moisturizer")
        sunscreens = fetch_products(db, "All", "mild", "sunscreen")
        
        day_routine = {
            "step_1_cleanser": pick_random(cleansers),
            "step_2_treatment": pick_random(day_treatments),
            "step_3_moisturizer": pick_random(moisturizers),
            "step_4_sunscreen": pick_random(sunscreens)
        }

        night_routine = {
            "step_1_cleanser": pick_random(cleansers),
            "step_2_treatment": pick_random(night_treatments),
            "step_3_moisturizer": pick_random(moisturizers)
        }
    finally:
        db.close()

    return {
        "progress_report": progress,
        "routine_type": f"{intensity.capitalize()} Routine for {primary_condition}",
        "day_routine": day_routine,
        "night_routine": night_routine
    }