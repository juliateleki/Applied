from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select

from app.db import get_session
from app.models import Application, ApplicationEvent

router = APIRouter(prefix="/applications", tags=["applications"])


class ApplicationCreate(BaseModel):
    company_name: str = Field(min_length=1, max_length=200)
    role_title: str = Field(min_length=1, max_length=200)
    status: str = Field(default="applied", max_length=50)
    note: str | None = Field(default=None, max_length=2000)

    job_url: str | None = Field(default=None, max_length=1000)
    job_description: str | None = Field(default=None, max_length=20000)


class ApplicationOut(BaseModel):
    id: int
    company_name: str
    role_title: str
    status: str
    created_at: str
    updated_at: str

    job_url: str | None
    job_description: str | None


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


def to_out(a: Application) -> ApplicationOut:
    return ApplicationOut(
        id=a.id,
        company_name=a.company_name,
        role_title=a.role_title,
        status=a.status,
        created_at=a.created_at.isoformat() if a.created_at else "",
        updated_at=a.updated_at.isoformat() if a.updated_at else "",
        job_url=a.job_url,
        job_description=a.job_description,
    )


@router.get("", response_model=list[ApplicationOut])
def list_applications():
    with get_session() as db:
        rows = db.execute(select(Application).order_by(Application.updated_at.desc())).scalars().all()
        return [to_out(a) for a in rows]


@router.get("/{application_id}", response_model=ApplicationOut)
def get_application(application_id: int):
    with get_session() as db:
        app = db.get(Application, application_id)
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")
        return to_out(app)


@router.post("", response_model=ApplicationOut)
def create_application(payload: ApplicationCreate):
    with get_session() as db:
        app = Application(
            company_name=payload.company_name,
            role_title=payload.role_title,
            status=payload.status,
            job_url=(payload.job_url.strip() if payload.job_url and payload.job_url.strip() else None),
            job_description=(payload.job_description if payload.job_description and payload.job_description.strip() else None),
        )
        db.add(app)
        db.flush()

        db.add(
            ApplicationEvent(
                application_id=app.id,
                event_type="created",
                from_status=None,
                to_status=payload.status,
                note=(payload.note if payload.note and payload.note.strip() else None),
            )
        )

        db.commit()
        db.refresh(app)
        return to_out(app)


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
                note=(payload.note if payload.note and payload.note.strip() else None),
            )
        )

        db.commit()
        db.refresh(app)
        return to_out(app)


@router.get("/{application_id}/events", response_model=list[EventOut])
def list_events(application_id: int):
    with get_session() as db:
        app = db.get(Application, application_id)
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")

        events = db.execute(
            select(ApplicationEvent)
            .where(ApplicationEvent.application_id == application_id)
            .order_by(ApplicationEvent.occurred_at.asc())
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
