# backend/default_products.py

PRODUCT_CATALOG = {
    "Acne": {
        "harsh": {
            "cleanser": [
                {"brand": "CeraVe", "name": "Acne Foaming Cream Cleanser (4% Benzoyl Peroxide)"},
                {"brand": "La Roche-Posay", "name": "Effaclar Gel Cleanser"},
                {"brand": "PanOxyl", "name": "Acne Foaming Wash 10% Benzoyl Peroxide"}
            ],
            "day_treatment": [
                {"brand": "The Ordinary", "name": "Niacinamide 10% + Zinc 1%"},
                {"brand": "Paula's Choice", "name": "2% BHA Liquid Exfoliant"},
                {"brand": "CosRX", "name": "BHA Blackhead Power Liquid"}
            ],
            "night_treatment": [
                {"brand": "Differin", "name": "Adapalene Gel 0.1% Acne Treatment"},
                {"brand": "The Ordinary", "name": "Salicylic Acid 2% Solution"},
                {"brand": "Inkey List", "name": "Beta Hydroxy Acid (BHA)"}
            ]
        },
        "mild": {
            "cleanser": [
                {"brand": "CeraVe", "name": "Hydrating Facial Cleanser"},
                {"brand": "Cetaphil", "name": "Gentle Skin Cleanser"},
                {"brand": "Vanicream", "name": "Gentle Facial Cleanser"}
            ],
            "day_treatment": [
                {"brand": "The Inkey List", "name": "Niacinamide Serum"},
                {"brand": "Beauty of Joseon", "name": "Glow Serum (Propolis + Niacinamide)"}
            ],
            "night_treatment": [
                {"brand": "Paula's Choice", "name": "1% BHA Lotion Exfoliant (Mild)"},
                {"brand": "CosRX", "name": "Centella Blemish Cream"}
            ]
        }
    },
    "Dryness": {
        "harsh": {
            "cleanser": [
                {"brand": "CeraVe", "name": "Hydrating Cleanser"},
                {"brand": "La Roche-Posay", "name": "Toleriane Hydrating Gentle Cleanser"}
            ],
            "day_treatment": [
                {"brand": "The Ordinary", "name": "Hyaluronic Acid 2% + B5"},
                {"brand": "The Inkey List", "name": "Polyglutamic Acid Serum"}
            ],
            "night_treatment": [
                {"brand": "Laneige", "name": "Water Sleeping Mask"},
                {"brand": "CosRX", "name": "Advanced Snail 96 Mucin Power Essence"}
            ]
        },
        "mild": {
            "cleanser": [
                {"brand": "Cetaphil", "name": "Gentle Skin Cleanser"}
            ],
            "day_treatment": [
                {"brand": "The Ordinary", "name": "Natural Moisturizing Factors + HA"}
            ],
            "night_treatment": [
                {"brand": "CeraVe", "name": "Skin Renewing Night Cream"}
            ]
        }
    },
    "Oily Skin": {
        "harsh": {
            "cleanser": [
                {"brand": "La Roche-Posay", "name": "Effaclar Purifying Foaming Gel"},
                {"brand": "CeraVe", "name": "Foaming Facial Cleanser"}
            ],
            "day_treatment": [
                {"brand": "The Ordinary", "name": "Niacinamide 10% + Zinc 1%"}
            ],
            "night_treatment": [
                {"brand": "Paula's Choice", "name": "Clear Core BHA"}
            ]
        },
        "mild": {
             "cleanser": [
                {"brand": "Cetaphil", "name": "Daily Facial Cleanser"}
            ],
            "day_treatment": [
                {"brand": "The Inkey List", "name": "Niacinamide"}
            ],
            "night_treatment": [
                {"brand": "CosRX", "name": "BHA Blackhead Power Liquid"}
            ]
        }
    },
    "Dark Spots": {
        "harsh": {
            "cleanser": [
                {"brand": "CeraVe", "name": "Renewing SA Cleanser"}
            ],
            "day_treatment": [
                {"brand": "Maelove", "name": "Glow Maker Vitamin C Serum"}
            ],
            "night_treatment": [
                {"brand": "Good Molecules", "name": "Discoloration Correcting Serum"}
            ]
        },
        "mild": {
             "cleanser": [
                {"brand": "Vanicream", "name": "Gentle Facial Cleanser"}
            ],
            "day_treatment": [
                {"brand": "The Ordinary", "name": "Ascorbyl Glucoside Solution 12%"}
            ],
            "night_treatment": [
                {"brand": "Beauty of Joseon", "name": "Glow Deep Serum"}
            ]
        }
    },
    "Wrinkles": {
        "harsh": {
            "cleanser": [
                {"brand": "La Roche-Posay", "name": "Toleriane Hydrating Cleanser"}
            ],
            "day_treatment": [
                {"brand": "Timeless", "name": "20% Vitamin C + E Ferulic"}
            ],
            "night_treatment": [
                {"brand": "RoC", "name": "Retinol Correxion Deep Wrinkle Night Cream"}
            ]
        },
        "mild": {
             "cleanser": [
                {"brand": "CeraVe", "name": "Hydrating Cleanser"}
            ],
            "day_treatment": [
                {"brand": "The Inkey List", "name": "Q10 Antioxidant Serum"}
            ],
            "night_treatment": [
                {"brand": "Olay", "name": "Regenerist Retinol 24 Night Moisturizer"}
            ]
        }
    }
}

MOISTURIZERS = [
    {"brand": "CeraVe", "name": "PM Facial Moisturizing Lotion"},
    {"brand": "La Roche-Posay", "name": "Toleriane Double Repair Face Moisturizer"},
    {"brand": "Neutrogena", "name": "Hydro Boost Water Gel"},
    {"brand": "SoonJung", "name": "2x Barrier Intensive Cream"}
]

SUNSCREENS = [
    {"brand": "Beauty of Joseon", "name": "Relief Sun: Rice + Probiotics SPF 50+"},
    {"brand": "La Roche-Posay", "name": "Anthelios Melt-in Milk Sunscreen SPF 60"},
    {"brand": "EltaMD", "name": "UV Clear Broad-Spectrum SPF 46"},
    {"brand": "Skin1004", "name": "Hyalu-Cica Water-Fit Sun Serum SPF 50+"}
]
