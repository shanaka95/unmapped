"""Seed the database with an admin user. Run once: python seed_admin.py"""

from sqlalchemy import select

from app.database import SessionLocal
from app.models.user import User
from app.utils.security import hash_password


def seed_admin() -> None:
    db = SessionLocal()
    try:
        existing = db.execute(
            select(User).where(User.email == "admin@unmapped.dev")
        ).scalar_one_or_none()

        if existing:
            print("Admin user already exists.")
            return

        admin = User(
            name="Admin",
            email="admin@unmapped.dev",
            password_hash=hash_password("Admin123"),
            is_active=True,
            is_verified=True,
            role="admin",
        )
        db.add(admin)
        db.commit()
        print(f"Admin user created: {admin.email} (id={admin.id})")
    finally:
        db.close()


if __name__ == "__main__":
    seed_admin()
