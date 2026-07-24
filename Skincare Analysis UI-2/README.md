# Lumina — AI Skin Analysis + Database CRUD

School project focused on **AI analysis** and **SQLite CRUD**.

## What matters

| Role | Features |
|------|----------|
| **User** | First selfie → AI scores + routine. Daily AM/PM checklist. Weekly rescan. Real progress + notifications. |
| **Admin** | Dashboard charts (filter by age / skin). Users CRUD. Analyses list/delete. **Products CRUD** (feeds AI recommendations). |

### Removed on purpose
- Skin Conditions tab (AI labels are fixed in the model)
- Ingredients tab (not used by the recommender)
- Feedback tab (not needed for AI/DB focus)
- Admin self-registration (admin is seeded only)

### Why Products stay
`backend/ai/recommender.py` queries the `products` table by `target_condition`, `intensity`, and `category` to build day/night routines. Admin product CRUD changes what users get recommended.

## Run

```bash
# Backend
cd backend
source myenv/bin/activate
python seed.py   # products catalog (first time)
uvicorn main:app --reload --port 8000

# Frontend
cd ..
npm install
npm run dev
```

| Account | Email | Password |
|---------|-------|----------|
| User | demo@example.com | password123 |
| Admin | admin@lumina.com | admin123 |
