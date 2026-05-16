from pydantic import BaseModel
from typing import Optional

class HouseholdBase(BaseModel):
    household_size: int
    home_type: str

class HouseholdCreate(HouseholdBase):
    pass

class Household(HouseholdBase):
    id: int

    class Config:
        orm_mode = True

class UtilityBase(BaseModel):
    month: str
    electricity: float
    water: float
    gas: float

class UtilityCreate(UtilityBase):
    household_id: int

class UtilityUpdate(BaseModel):
    electricity: Optional[float] = None
    water: Optional[float] = None
    gas: Optional[float] = None

class Utility(UtilityBase):
    id: int
    household_id: int
    ai_recommendation: Optional[str] = None

    class Config:
        orm_mode = True
