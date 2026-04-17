import { CODE_LAYER } from "../../data/constants";

function toPascalCase(str) {
  return str
    .replace(/^[a-z]/, (match) => match.toUpperCase())
    .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function toCamelCase(str) {
  return str
    .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function toSnakeCase(str) {
  return str
    .replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
    .replace(/^_/, "");
}

function getPrimaryKeyField(table) {
  return table.fields.find((field) => field.primary);
}

function mapSqlTypeToJavaType(sqlType) {
  const typeMap = {
    INT: "Integer",
    INTEGER: "Integer",
    TINYINT: "Byte",
    SMALLINT: "Short",
    BIGINT: "Long",
    DECIMAL: "BigDecimal",
    NUMERIC: "BigDecimal",
    FLOAT: "Float",
    DOUBLE: "Double",
    REAL: "Float",
    CHAR: "String",
    VARCHAR: "String",
    VARCHAR2: "String",
    TEXT: "String",
    TINYTEXT: "String",
    MEDIUMTEXT: "String",
    LONGTEXT: "String",
    NCHAR: "String",
    NVARCHAR: "String",
    NVARCHAR2: "String",
    NTEXT: "String",
    DATE: "LocalDate",
    TIME: "LocalTime",
    TIMESTAMP: "LocalDateTime",
    DATETIME: "LocalDateTime",
    TIMETZ: "OffsetTime",
    TIMESTAMPTZ: "OffsetDateTime",
    DATETIMEOFFSET: "OffsetDateTime",
    SMALLDATETIME: "LocalDateTime",
    YEAR: "Integer",
    BOOLEAN: "Boolean",
    BIT: "Boolean",
    BINARY: "byte[]",
    VARBINARY: "byte[]",
    BLOB: "byte[]",
    TINYBLOB: "byte[]",
    MEDIUMBLOB: "byte[]",
    LONGBLOB: "byte[]",
    CLOB: "String",
    NCLOB: "String",
    JSON: "String",
    JSONB: "String",
    UUID: "UUID",
    UNIQUEIDENTIFIER: "UUID",
    ENUM: "String",
    SET: "String",
  };
  return typeMap[sqlType.toUpperCase()] || "String";
}

function mapSqlTypeToPythonType(sqlType) {
  const typeMap = {
    INT: "int",
    INTEGER: "int",
    TINYINT: "int",
    SMALLINT: "int",
    BIGINT: "int",
    DECIMAL: "Decimal",
    NUMERIC: "Decimal",
    FLOAT: "float",
    DOUBLE: "float",
    REAL: "float",
    CHAR: "str",
    VARCHAR: "str",
    VARCHAR2: "str",
    TEXT: "str",
    TINYTEXT: "str",
    MEDIUMTEXT: "str",
    LONGTEXT: "str",
    NCHAR: "str",
    NVARCHAR: "str",
    NVARCHAR2: "str",
    NTEXT: "str",
    DATE: "date",
    TIME: "time",
    TIMESTAMP: "datetime",
    DATETIME: "datetime",
    TIMETZ: "time",
    TIMESTAMPTZ: "datetime",
    DATETIMEOFFSET: "datetime",
    SMALLDATETIME: "datetime",
    YEAR: "int",
    BOOLEAN: "bool",
    BIT: "bool",
    BINARY: "bytes",
    VARBINARY: "bytes",
    BLOB: "bytes",
    TINYBLOB: "bytes",
    MEDIUMBLOB: "bytes",
    LONGBLOB: "bytes",
    CLOB: "str",
    NCLOB: "str",
    JSON: "dict",
    JSONB: "dict",
    UUID: "UUID",
    UNIQUEIDENTIFIER: "UUID",
    ENUM: "str",
    SET: "str",
  };
  return typeMap[sqlType.toUpperCase()] || "str";
}

function mapSqlTypeToGoType(sqlType) {
  const typeMap = {
    INT: "int",
    INTEGER: "int",
    TINYINT: "int8",
    SMALLINT: "int16",
    BIGINT: "int64",
    DECIMAL: "decimal.Decimal",
    NUMERIC: "decimal.Decimal",
    FLOAT: "float32",
    DOUBLE: "float64",
    REAL: "float32",
    CHAR: "string",
    VARCHAR: "string",
    VARCHAR2: "string",
    TEXT: "string",
    TINYTEXT: "string",
    MEDIUMTEXT: "string",
    LONGTEXT: "string",
    NCHAR: "string",
    NVARCHAR: "string",
    NVARCHAR2: "string",
    NTEXT: "string",
    DATE: "time.Time",
    TIME: "time.Time",
    TIMESTAMP: "time.Time",
    DATETIME: "time.Time",
    TIMETZ: "time.Time",
    TIMESTAMPTZ: "time.Time",
    DATETIMEOFFSET: "time.Time",
    SMALLDATETIME: "time.Time",
    YEAR: "int",
    BOOLEAN: "bool",
    BIT: "bool",
    BINARY: "[]byte",
    VARBINARY: "[]byte",
    BLOB: "[]byte",
    TINYBLOB: "[]byte",
    MEDIUMBLOB: "[]byte",
    LONGBLOB: "[]byte",
    CLOB: "string",
    NCLOB: "string",
    JSON: "string",
    JSONB: "string",
    UUID: "uuid.UUID",
    UNIQUEIDENTIFIER: "uuid.UUID",
    ENUM: "string",
    SET: "string",
  };
  return typeMap[sqlType.toUpperCase()] || "string";
}

function mapSqlTypeToTsType(sqlType) {
  const typeMap = {
    INT: "number",
    INTEGER: "number",
    TINYINT: "number",
    SMALLINT: "number",
    BIGINT: "number",
    DECIMAL: "number",
    NUMERIC: "number",
    FLOAT: "number",
    DOUBLE: "number",
    REAL: "number",
    CHAR: "string",
    VARCHAR: "string",
    VARCHAR2: "string",
    TEXT: "string",
    TINYTEXT: "string",
    MEDIUMTEXT: "string",
    LONGTEXT: "string",
    NCHAR: "string",
    NVARCHAR: "string",
    NVARCHAR2: "string",
    NTEXT: "string",
    DATE: "Date",
    TIME: "Date",
    TIMESTAMP: "Date",
    DATETIME: "Date",
    TIMETZ: "Date",
    TIMESTAMPTZ: "Date",
    DATETIMEOFFSET: "Date",
    SMALLDATETIME: "Date",
    YEAR: "number",
    BOOLEAN: "boolean",
    BIT: "boolean",
    BINARY: "Buffer",
    VARBINARY: "Buffer",
    BLOB: "Buffer",
    TINYBLOB: "Buffer",
    MEDIUMBLOB: "Buffer",
    LONGBLOB: "Buffer",
    CLOB: "string",
    NCLOB: "string",
    JSON: "any",
    JSONB: "any",
    UUID: "string",
    UNIQUEIDENTIFIER: "string",
    ENUM: "string",
    SET: "string",
  };
  return typeMap[sqlType.toUpperCase()] || "string";
}

function getJavaImports(fields) {
  const imports = new Set();
  fields.forEach((field) => {
    const javaType = mapSqlTypeToJavaType(field.type);
    if (javaType === "BigDecimal") {
      imports.add("import java.math.BigDecimal;");
    } else if (javaType === "LocalDate") {
      imports.add("import java.time.LocalDate;");
    } else if (javaType === "LocalTime") {
      imports.add("import java.time.LocalTime;");
    } else if (javaType === "LocalDateTime") {
      imports.add("import java.time.LocalDateTime;");
    } else if (javaType === "OffsetTime") {
      imports.add("import java.time.OffsetTime;");
    } else if (javaType === "OffsetDateTime") {
      imports.add("import java.time.OffsetDateTime;");
    } else if (javaType === "UUID") {
      imports.add("import java.util.UUID;");
    }
  });
  return Array.from(imports).join("\n");
}

function getPythonImports(fields) {
  const imports = new Set();
  fields.forEach((field) => {
    const pyType = mapSqlTypeToPythonType(field.type);
    if (pyType === "Decimal") {
      imports.add("from decimal import Decimal");
    } else if (pyType === "date" || pyType === "time" || pyType === "datetime") {
      imports.add("from datetime import date, time, datetime");
    } else if (pyType === "UUID") {
      imports.add("from uuid import UUID");
    }
  });
  return Array.from(imports).join("\n");
}

function getGoImports(fields) {
  const imports = new Set();
  fields.forEach((field) => {
    const goType = mapSqlTypeToGoType(field.type);
    if (goType === "time.Time") {
      imports.add("\"time\"");
    } else if (goType === "decimal.Decimal") {
      imports.add("\"github.com/shopspring/decimal\"");
    } else if (goType === "uuid.UUID") {
      imports.add("\"github.com/google/uuid\"");
    }
  });
  return Array.from(imports);
}

export {
  toPascalCase,
  toCamelCase,
  toSnakeCase,
  getPrimaryKeyField,
  mapSqlTypeToJavaType,
  mapSqlTypeToPythonType,
  mapSqlTypeToGoType,
  mapSqlTypeToTsType,
  getJavaImports,
  getPythonImports,
  getGoImports,
};
