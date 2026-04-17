import { CODE_LAYER } from "../../data/constants";
import {
  toPascalCase,
  toSnakeCase,
  getPrimaryKeyField,
  mapSqlTypeToPythonType,
  getPythonImports,
} from "./shared";

function generatePythonModel(table) {
  const className = toPascalCase(table.name);
  const tableName = table.name;
  const primaryKeyField = getPrimaryKeyField(table);

  const imports = [
    "from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Time, Numeric, Text, ForeignKey",
    "from sqlalchemy.ext.declarative import declarative_base",
    "from sqlalchemy.orm import relationship",
    getPythonImports(table.fields),
  ]
    .filter(Boolean)
    .join("\n");

  const fields = table.fields
    .map((field) => {
      const fieldName = toSnakeCase(field.name);
      const pyType = mapSqlTypeToPythonType(field.type);

      let columnType = "";
      switch (pyType) {
        case "int":
          columnType = "Integer";
          break;
        case "str":
          if (
            field.type.toUpperCase().includes("TEXT") ||
            field.type.toUpperCase() === "JSON"
          ) {
            columnType = "Text";
          } else {
            columnType = `String(${field.size || 255})`;
          }
          break;
        case "bool":
          columnType = "Boolean";
          break;
        case "date":
          columnType = "Date";
          break;
        case "time":
          columnType = "Time";
          break;
        case "datetime":
          columnType = "DateTime";
          break;
        case "Decimal":
          columnType = `Numeric(${field.size || "10,2"})`;
          break;
        default:
          columnType = "String(255)";
      }

      const columnArgs = [columnType];
      if (field.primary) {
        columnArgs.push("primary_key=True");
      }
      if (field.unique) {
        columnArgs.push("unique=True");
      }
      if (!field.notNull && !field.primary) {
        columnArgs.push("nullable=True");
      } else if (field.notNull) {
        columnArgs.push("nullable=False");
      }
      if (field.comment) {
        columnArgs.push(`comment="${field.comment}"`);
      }

      return `${fieldName} = Column(${columnArgs.join(", ")})`;
    })
    .join("\n    ");

  const tableComment = table.comment
    ? `\n    \"\"\"${table.comment}\"\"\"\n`
    : "";

  return `${imports}

Base = declarative_base()


class ${className}(Base):
    __tablename__ = "${tableName}"
${tableComment}
    ${fields}
`;
}

function generatePythonSchema(table) {
  const className = toPascalCase(table.name);
  const primaryKeyField = getPrimaryKeyField(table);
  const pkFieldName = primaryKeyField
    ? toSnakeCase(primaryKeyField.name)
    : "id";

  const imports = [
    "from pydantic import BaseModel",
    "from typing import Optional",
    "from datetime import date, time, datetime",
    "from decimal import Decimal",
    "from uuid import UUID",
  ].join("\n");

  const createFields = table.fields
    .filter((f) => !(f.primary && f.increment))
    .map((field) => {
      const fieldName = toSnakeCase(field.name);
      const pyType = mapSqlTypeToPythonType(field.type);
      const optional = !field.notNull && !field.primary;
      const typeAnnotation = optional ? `Optional[${pyType}]` : pyType;
      const defaultVal = optional ? " = None" : "";
      return `${fieldName}: ${typeAnnotation}${defaultVal}`;
    })
    .join("\n    ");

  const updateFields = table.fields
    .filter((f) => !(f.primary && f.increment))
    .map((field) => {
      const fieldName = toSnakeCase(field.name);
      const pyType = mapSqlTypeToPythonType(field.type);
      return `${fieldName}: Optional[${pyType}] = None`;
    })
    .join("\n    ");

  const responseFields = table.fields
    .map((field) => {
      const fieldName = toSnakeCase(field.name);
      const pyType = mapSqlTypeToPythonType(field.type);
      const optional = !field.notNull;
      const typeAnnotation = optional ? `Optional[${pyType}]` : pyType;
      return `${fieldName}: ${typeAnnotation}`;
    })
    .join("\n    ");

  return `${imports}


class ${className}Create(BaseModel):
    ${createFields}


class ${className}Update(BaseModel):
    ${updateFields}


class ${className}Response(BaseModel):
    ${responseFields}

    class Config:
        from_attributes = True
`;
}

function generatePythonService(table) {
  const className = toPascalCase(table.name);
  const varName = table.name.toLowerCase();
  const primaryKeyField = getPrimaryKeyField(table);
  const pkType = primaryKeyField
    ? mapSqlTypeToPythonType(primaryKeyField.type)
    : "int";
  const pkFieldName = primaryKeyField
    ? toSnakeCase(primaryKeyField.name)
    : "id";

  const tableComment = table.comment
    ? `\n    \"\"\"${table.comment} 服务层\"\"\"\n`
    : "";

  return `from typing import List, Optional
from sqlalchemy.orm import Session
from models.${varName} import ${className}
from schemas.${varName} import ${className}Create, ${className}Update


class ${className}Service:
${tableComment}
    def __init__(self, db: Session):
        self.db = db

    def get_all(self) -> List[${className}]:
        return self.db.query(${className}).all()

    def get_by_${pkFieldName}(self, ${pkFieldName}: ${pkType}) -> Optional[${className}]:
        return self.db.query(${className}).filter(
            ${className}.${pkFieldName} == ${pkFieldName}
        ).first()

    def create(self, ${varName}_data: ${className}Create) -> ${className}:
        db_${varName} = ${className}(**${varName}_data.dict())
        self.db.add(db_${varName})
        self.db.commit()
        self.db.refresh(db_${varName})
        return db_${varName}

    def update(self, ${pkFieldName}: ${pkType}, ${varName}_data: ${className}Update) -> Optional[${className}]:
        db_${varName} = self.get_by_${pkFieldName}(${pkFieldName})
        if db_${varName}:
            update_data = ${varName}_data.dict(exclude_unset=True)
            for key, value in update_data.items():
                setattr(db_${varName}, key, value)
            self.db.commit()
            self.db.refresh(db_${varName})
        return db_${varName}

    def delete(self, ${pkFieldName}: ${pkType}) -> bool:
        db_${varName} = self.get_by_${pkFieldName}(${pkFieldName})
        if db_${varName}:
            self.db.delete(db_${varName})
            self.db.commit()
            return True
        return False
`;
}

function generatePythonRouter(table) {
  const className = toPascalCase(table.name);
  const varName = table.name.toLowerCase();
  const primaryKeyField = getPrimaryKeyField(table);
  const pkType = primaryKeyField
    ? mapSqlTypeToPythonType(primaryKeyField.type)
    : "int";
  const pkFieldName = primaryKeyField
    ? toSnakeCase(primaryKeyField.name)
    : "id";

  const tableComment = table.comment
    ? `\n    \"\"\"${table.comment} 路由层\"\"\"\n`
    : "";

  return `from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from schemas.${varName} import ${className}Create, ${className}Update, ${className}Response
from services.${varName} import ${className}Service

router = APIRouter(prefix="/api/${varName}", tags=["${className}"])

${tableComment}
@router.get("/", response_model=List[${className}Response])
def get_all_${varName}s(db: Session = Depends(get_db)):
    service = ${className}Service(db)
    return service.get_all()


@router.get("/{${pkFieldName}}", response_model=${className}Response)
def get_${varName}_by_id(${pkFieldName}: ${pkType}, db: Session = Depends(get_db)):
    service = ${className}Service(db)
    ${varName} = service.get_by_${pkFieldName}(${pkFieldName})
    if not ${varName}:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="${className} not found"
        )
    return ${varName}


@router.post("/", response_model=${className}Response, status_code=status.HTTP_201_CREATED)
def create_${varName}(${varName}_data: ${className}Create, db: Session = Depends(get_db)):
    service = ${className}Service(db)
    return service.create(${varName}_data)


@router.put("/{${pkFieldName}}", response_model=${className}Response)
def update_${varName}(
    ${pkFieldName}: ${pkType},
    ${varName}_data: ${className}Update,
    db: Session = Depends(get_db)
):
    service = ${className}Service(db)
    ${varName} = service.update(${pkFieldName}, ${varName}_data)
    if not ${varName}:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="${className} not found"
        )
    return ${varName}


@router.delete("/{${pkFieldName}}", status_code=status.HTTP_204_NO_CONTENT)
def delete_${varName}(${pkFieldName}: ${pkType}, db: Session = Depends(get_db)):
    service = ${className}Service(db)
    if not service.delete(${pkFieldName}):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="${className} not found"
        )
`;
}

function generatePythonDAO(table) {
  const className = toPascalCase(table.name);
  const varName = table.name.toLowerCase();
  const primaryKeyField = getPrimaryKeyField(table);
  const pkType = primaryKeyField
    ? mapSqlTypeToPythonType(primaryKeyField.type)
    : "int";
  const pkFieldName = primaryKeyField
    ? toSnakeCase(primaryKeyField.name)
    : "id";

  return `from typing import List, Optional
from sqlalchemy.orm import Session
from models.${varName} import ${className}


class ${className}DAO:
    \"\"\"数据访问层\"\"\"

    def __init__(self, db: Session):
        self.db = db

    def find_all(self) -> List[${className}]:
        return self.db.query(${className}).all()

    def find_by_${pkFieldName}(self, ${pkFieldName}: ${pkType}) -> Optional[${className}]:
        return self.db.query(${className}).filter(
            ${className}.${pkFieldName} == ${pkFieldName}
        ).first()

    def save(self, ${varName}: ${className}) -> ${className}:
        self.db.add(${varName})
        self.db.commit()
        self.db.refresh(${varName})
        return ${varName}

    def delete(self, ${varName}: ${className}) -> None:
        self.db.delete(${varName})
        self.db.commit()
`;
}

export function generatePythonCode(tables) {
  const result = {};

  tables.forEach((table) => {
    const tableResult = {};
    tableResult[CODE_LAYER.ENTITY] = generatePythonModel(table);
    tableResult[CODE_LAYER.DAO] = generatePythonDAO(table);
    tableResult[CODE_LAYER.MAPPER] = "";
    tableResult[CODE_LAYER.SERVICE] = generatePythonService(table);
    tableResult[CODE_LAYER.CONTROLLER] = generatePythonRouter(table);
    result[table.name] = tableResult;
  });

  return result;
}
