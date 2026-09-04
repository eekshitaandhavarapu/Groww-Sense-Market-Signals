"""Lightweight demo auth router — email-based demo user registration and login."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.watchlist_service import get_or_create_user_by_email

router = APIRouter(prefix="/auth", tags=["auth"])


class DemoAuthRequest(BaseModel):
    email: str


class DemoAuthResponse(BaseModel):
    user_id: str
    email: str


@router.post("/demo", response_model=DemoAuthResponse)
async def demo_auth(body: DemoAuthRequest, db: AsyncSession = Depends(get_db)):
    """Find or create a demo user by email and return their UUID."""
    email = body.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Please enter a valid email address")

    user = await get_or_create_user_by_email(db, email)
    return DemoAuthResponse(user_id=str(user.id), email=user.email)
