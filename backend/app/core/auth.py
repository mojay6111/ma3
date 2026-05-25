from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.db.models import ManagerAccount
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)

async def get_current_manager(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> ManagerAccount:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        manager_id: str = payload.get("sub")
        if manager_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(
        select(ManagerAccount).where(ManagerAccount.id == manager_id)
    )
    manager = result.scalar_one_or_none()
    if manager is None or not manager.is_active:
        raise credentials_exception
    return manager

async def require_superadmin(
    current: ManagerAccount = Depends(get_current_manager)
) -> ManagerAccount:
    if current.role != "superadmin":
        raise HTTPException(status_code=403, detail="Superadmin only")
    return current

async def require_sacco_admin(
    current: ManagerAccount = Depends(get_current_manager)
) -> ManagerAccount:
    if current.role not in ("superadmin", "sacco_admin", "sacco_ops"):
        raise HTTPException(status_code=403, detail="SACCO access required")
    return current
