from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Household(Base):
    __tablename__ = "households"

    id = Column(Integer, primary_key=True, index=True)
    household_size = Column(Integer)
    home_type = Column(String)

    utilities = relationship("Utility", back_populates="household")

class Utility(Base):
    __tablename__ = "utilities"

    id = Column(Integer, primary_key=True, index=True)
    household_id = Column(Integer, ForeignKey("households.id"))
    month = Column(String)
    electricity = Column(Float)
    water = Column(Float)
    gas = Column(Float)
    ai_recommendation = Column(String)

    household = relationship("Household", back_populates="utilities")
