# backend/seed.py
import os
import sys

# Ensure backend imports work
sys.path.append(os.path.dirname(__file__))

from database import init_db, get_db, Product, Ingredient
from default_products import PRODUCT_CATALOG, MOISTURIZERS, SUNSCREENS

def seed_database():
    init_db()
    db = next(get_db())
    
    # Check if products already exist
    existing_count = db.query(Product).count()
    if existing_count > 0:
        print(f"Database already contains {existing_count} products. Skipping seed.")
        return

    print("Seeding database with products...")
    
    products_to_add = []

    # Insert Condition-Specific Products
    for condition, intensities in PRODUCT_CATALOG.items():
        for intensity, categories in intensities.items():
            for category, items in categories.items():
                for item in items:
                    products_to_add.append(
                        Product(
                            brand=item["brand"],
                            name=item["name"],
                            category=category,
                            target_condition=condition,
                            intensity=intensity
                        )
                    )

    # Insert General Moisturizers
    for item in MOISTURIZERS:
        products_to_add.append(
            Product(
                brand=item["brand"],
                name=item["name"],
                category="moisturizer",
                target_condition="All",
                intensity="mild"
            )
        )

    # Insert General Sunscreens
    for item in SUNSCREENS:
        products_to_add.append(
            Product(
                brand=item["brand"],
                name=item["name"],
                category="sunscreen",
                target_condition="All",
                intensity="mild"
            )
        )

    db.add_all(products_to_add)
    
    # Add dummy Ingredients for Analysis JSON references
    ingredients_list = [
        {"name": "Salicylic Acid", "purpose": "Unclogs pores, reduces acne", "suitable_for": "Acne, Oily Skin"},
        {"name": "Niacinamide", "purpose": "Reduces redness, minimizes pores", "suitable_for": "All"},
        {"name": "Hyaluronic Acid", "purpose": "Deep hydration", "suitable_for": "Dryness"},
        {"name": "Retinol", "purpose": "Anti-aging, texture improvement", "suitable_for": "Wrinkles"},
        {"name": "Vitamin C", "purpose": "Brightening, uneven tone", "suitable_for": "Dark Spots"}
    ]
    
    for ing in ingredients_list:
        db.add(Ingredient(**ing))

    db.commit()
    print("Successfully seeded all products and ingredients!")

if __name__ == "__main__":
    seed_database()
