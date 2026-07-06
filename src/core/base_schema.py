from typing import TypeVar, Generic, Optional
from pydantic import BaseModel

"""
通用响应 Schema
"""

T = TypeVar("T")


class ResponseSchema(BaseModel, Generic[T]):
    code: int = 200
    message: str = "success"
    data: Optional[T] = None