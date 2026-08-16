# Lumina: Skincare Analysis Application

## Overview
Lumina is an AI-powered skincare application designed to analyze user selfies, detect skin conditions, and provide personalized daily AM/PM routines based on a curated product database. The platform supports a tiered membership system and provides administrative controls for managing users, scans, and products.

## Tech Stack
-   **Frontend**: React (with Vite), Tailwind CSS, Lucide Icons, Recharts (for progress charting).
-   **Backend**: Python, FastAPI, SQLAlchemy (SQLite database).
-   **AI Integration**: Pydantic for schemas, placeholder logic for dummy image analysis/feature extraction.

## Features

### User Facing
-   **Onboarding**: Users register with email, password, full name, age, and phone number (KBZ Pay).
-   **Selfie Analysis**: 
    - AI analyzes the selfie to generate an overall health score, detect skin concerns (Acne, Wrinkles, etc.), and classify skin type.
-   **Routine Management**: 
    - The AI builds a 7-day AM/PM checklist routine generated from products in the database.
    - Users check off steps to build completion streaks and adherence stats.
-   **Progress Tracking**:
    - Users see their condition score tracked over multiple weeks via a chart.
-   **Tiered Membership System**:
    - **Free Tier**: 1 scan per week. Trial expires 30 days after registration; past 30 days, users enter read-only mode and must upgrade to premium for further scans.
    - **Premium Tier**: Up to 3 scans per week (on a rolling 7-day window). Unlock continuous progress tracking.
-   **Notifications**: Users are alerted about finished scans, admin actions, and completion streaks.

### Administrator Facing
-   **Admin Dashboard**: Overview of system statistics (total users, analyses run, average health score).
-   **User Management**: View all users, reset passwords, suspend/activate accounts, and manage premium requests.
-   **Analysis Management**: Inspect historical scans and scores.
-   **Product Management**: CRUD interface for adding products and ingredients to the database system for AI routine building.

## Tier & Scan Limitations Engine
-   Uploads are managed by checking `tier` and timestamps.
-   A user with a free account has limited scan availability; the frontend UI locks the upload option based on `days_since_last_scan` and account age (`created_at`).
-   If a user requests a premium upgrade, an alert is sent to the Admin Panel, where it can be confirmed to switch the tier over. User can optionally request a "Force Rescan" out of cycle, which also alerts the Admin.

## Future Plans (for SRS Document)
When constructing the Software Requirements Specification (SRS), reference this document for the core workflow:
1. Registration / Authentication Flow
2. The AI Facial Analysis Sequence Diagram
3. Rate Limiting / Tier Subscription Boundaries
4. Admin Interface Capabilities
