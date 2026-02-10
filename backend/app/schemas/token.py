from typing import Optional, Union
from pydantic import BaseModel, EmailStr, validator

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[Union[str, int]] = None
