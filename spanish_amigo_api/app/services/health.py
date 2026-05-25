from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session


def check_database_health(db: Session) -> tuple[bool, str]:
    """
    Execute a lightweight database ping.
    Returns a boolean status with an error message when unhealthy.
    """
    try:
        db.execute(text("SELECT 1"))
        return True, ""
    except SQLAlchemyError as exc:
        return False, str(exc)
