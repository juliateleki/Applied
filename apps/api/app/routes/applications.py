from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_session
from app.models import Application, ApplicationEvent

router = APIRouter(prefix="/applications", tags=["applications"])

class ApplicationCreate(BaseModel):
    company_name: str = Field(min_length=1, max_length=200)
    role_title: str = Field(min_length=1, max_length=200)
    status: str = Field(default="applied", max_length=50)
    note: str | None = Field(default=None, max_length=2000)

class ApplicationOut(BaseModel):
    id: int
    company_name: str
    role_title: str
    status: str

class StatusChangeIn(BaseModel):
    to_status: str = Field(min_length=1, max_length=50)
    note: str | None = Field(default=None, max_length=2000)

class EventOut(BaseModel):
    id: int
    event_type: str
    from_status: str | None
    to_status: str | None
    note: str | None
    occurred_at: str

@router.get("", response_model=list[ApplicationOut])
def list_applications():
    with get_session() as db:
        rows = db.execute(select(Application).order_by(Application.updated_at.desc())).scalars().all()
        return [ApplicationOut(id=a.id, company_name=a.company_name, role_title=a.role_title, status=a.status) for a in rows]

@router.post("", response_model=ApplicationOut)
def create_application(payload: ApplicationCreate):
    with get_session() as db:
        app = Application(company_name=payload.company_name, role_title=payload.role_title, status=payload.status)
        db.add(app)
        db.flush()

        created_note = payload.note
        db.add(
            ApplicationEvent(
                application_id=app.id,
                event_type="created",
                from_status=None,
                to_status=payload.status,
                note=created_note,
            )
        )
        db.commit()
        db.refresh(app)
        return ApplicationOut(id=app.id, company_name=app.company_name, role_title=app.role_title, status=app.status)

@router.post("/{application_id}/status", response_model=ApplicationOut)
def change_status(application_id: int, payload: StatusChangeIn):
    with get_session() as db:
        app = db.get(Application, application_id)
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")

        from_status = app.status
        app.status = payload.to_status

        db.add(
            ApplicationEvent(
                application_id=app.id,
                event_type="status_change",
                from_status=from_status,
                to_status=payload.to_status,
                note=payload.note,
            )
        )
        db.commit()
        db.refresh(app)
        return ApplicationOut(id=app.id, company_name=app.company_name, role_title=app.role_title, status=app.status)

@router.get("/{application_id}/events", response_model=list[EventOut])
def list_events(application_id: int):
    with get_session() as db:
        app = db.get(Application, application_id)
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")

        events = db.execute(
            select(ApplicationEvent).where(ApplicationEvent.application_id == application_id).order_by(ApplicationEvent.occurred_at.asc())
        ).scalars().all()

        return [
            EventOut(
                id=e.id,
                event_type=e.event_type,
                from_status=e.from_status,
                to_status=e.to_status,
                note=e.note,
                occurred_at=e.occurred_at.isoformat(),
            )
            for e in events
        ]
