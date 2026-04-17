import { CODE_LAYER } from "../../data/constants";
import {
  toPascalCase,
  toSnakeCase,
  getPrimaryKeyField,
  mapSqlTypeToGoType,
  getGoImports,
} from "./shared";

function generateGoModel(table, moduleName) {
  const structName = toPascalCase(table.name);
  const tableName = table.name;

  const goImports = getGoImports(table.fields);
  const imports = ["\"gorm.io/gorm\""];
  if (goImports.length > 0) {
    imports.push(...goImports);
  }

  const fields = table.fields
    .map((field) => {
      const goType = mapSqlTypeToGoType(field.type);
      const fieldName = toPascalCase(field.name);
      const dbFieldName = field.name;

      const tags = [];
      tags.push(`gorm:"column:${dbFieldName}`);

      if (field.primary) {
        tags.push("primaryKey");
      }
      if (field.unique) {
        tags.push("unique");
      }
      if (!field.notNull && !field.primary) {
        tags.push("default:null");
      }
      if (field.comment) {
        tags.push(`comment:${field.comment}`);
      }

      tags.push('"');
      const tagStr = tags.join(";");

      let fieldDef = "";
      if (field.comment) {
        fieldDef = `${fieldName} ${goType} ${tagStr} // ${field.comment}`;
      } else {
        fieldDef = `${fieldName} ${goType} ${tagStr}`;
      }

      return fieldDef;
    })
    .join("\n\t");

  const tableComment = table.comment
    ? `\n// ${table.comment}`
    : "";

  return `package models

${imports.length > 0 ? `import (\n\t${imports.join("\n\t")}\n)` : ""}

${tableComment}
type ${structName} struct {
\t${fields}
}

func (${structName}) TableName() string {
\treturn "${tableName}"
}
`;
}

function generateGoRepository(table, moduleName) {
  const structName = toPascalCase(table.name);
  const repoName = `${structName}Repository`;
  const varName = table.name.toLowerCase();
  const primaryKeyField = getPrimaryKeyField(table);
  const pkType = primaryKeyField
    ? mapSqlTypeToGoType(primaryKeyField.type)
    : "uint";
  const pkFieldName = primaryKeyField
    ? toPascalCase(primaryKeyField.name)
    : "ID";

  const imports = [
    `"gorm.io/gorm"`,
    `"${moduleName}/internal/models"`,
  ];

  const tableComment = table.comment
    ? `\n// ${table.comment} 数据访问层`
    : "";

  return `package repository

import (
\t${imports.join("\n\t")}
)

${tableComment}
type ${repoName} struct {
\tdb *gorm.DB
}

func New${repoName}(db *gorm.DB) *${repoName} {
\treturn &${repoName}{db: db}
}

func (r *${repoName}) FindAll() ([]models.${structName}, error) {
\tvar ${varName}s []models.${structName}
\terr := r.db.Find(&${varName}s).Error
\treturn ${varName}s, err
}

func (r *${repoName}) FindByID(id ${pkType}) (*models.${structName}, error) {
\tvar ${varName} models.${structName}
\terr := r.db.First(&${varName}, id).Error
\tif err != nil {
\t\treturn nil, err
\t}
\treturn &${varName}, nil
}

func (r *${repoName}) Create(${varName} *models.${structName}) error {
\treturn r.db.Create(${varName}).Error
}

func (r *${repoName}) Update(${varName} *models.${structName}) error {
\treturn r.db.Save(${varName}).Error
}

func (r *${repoName}) Delete(id ${pkType}) error {
\treturn r.db.Delete(&models.${structName}{}, id).Error
}
`;
}

function generateGoService(table, moduleName) {
  const structName = toPascalCase(table.name);
  const serviceName = `${structName}Service`;
  const varName = table.name.toLowerCase();
  const primaryKeyField = getPrimaryKeyField(table);
  const pkType = primaryKeyField
    ? mapSqlTypeToGoType(primaryKeyField.type)
    : "uint";

  const imports = [
    `"${moduleName}/internal/models"`,
    `"${moduleName}/internal/repository"`,
  ];

  const tableComment = table.comment
    ? `\n// ${table.comment} 服务层`
    : "";

  return `package service

import (
\t${imports.join("\n\t")}
)

${tableComment}
type ${serviceName} struct {
\trepo *repository.${structName}Repository
}

func New${serviceName}(repo *repository.${structName}Repository) *${serviceName} {
\treturn &${serviceName}{repo: repo}
}

func (s *${serviceName}) GetAll() ([]models.${structName}, error) {
\treturn s.repo.FindAll()
}

func (s *${serviceName}) GetByID(id ${pkType}) (*models.${structName}, error) {
\treturn s.repo.FindByID(id)
}

func (s *${serviceName}) Create(${varName} *models.${structName}) error {
\treturn s.repo.Create(${varName})
}

func (s *${serviceName}) Update(${varName} *models.${structName}) error {
\treturn s.repo.Update(${varName})
}

func (s *${serviceName}) Delete(id ${pkType}) error {
\treturn s.repo.Delete(id)
}
`;
}

function generateGoHandler(table, moduleName) {
  const structName = toPascalCase(table.name);
  const handlerName = `${structName}Handler`;
  const varName = table.name.toLowerCase();
  const primaryKeyField = getPrimaryKeyField(table);
  const pkType = primaryKeyField
    ? mapSqlTypeToGoType(primaryKeyField.type)
    : "uint";

  const imports = [
    `"net/http"`,
    `"strconv"`,
    `"${moduleName}/internal/models"`,
    `"${moduleName}/internal/service"`,
    `"github.com/gin-gonic/gin"`,
  ];

  const tableComment = table.comment
    ? `\n// ${table.comment} 处理器`
    : "";

  return `package handler

import (
\t${imports.join("\n\t")}
)

${tableComment}
type ${handlerName} struct {
\tservice *service.${structName}Service
}

func New${handlerName}(s *service.${structName}Service) *${handlerName} {
\treturn &${handlerName}{service: s}
}

func (h *${handlerName}) GetAll(c *gin.Context) {
\t${varName}s, err := h.service.GetAll()
\tif err != nil {
\t\tc.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
\t\treturn
\t}
\tc.JSON(http.StatusOK, ${varName}s)
}

func (h *${handlerName}) GetByID(c *gin.Context) {
\tidStr := c.Param("id")
\tid, err := strconv.ParseUint(idStr, 10, 64)
\tif err != nil {
\t\tc.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
\t\treturn
\t}

\t${varName}, err := h.service.GetByID(${pkType}(id))
\tif err != nil {
\t\tc.JSON(http.StatusNotFound, gin.H{"error": "${structName} not found"})
\t\treturn
\t}
\tc.JSON(http.StatusOK, ${varName})
}

func (h *${handlerName}) Create(c *gin.Context) {
\tvar ${varName} models.${structName}
\tif err := c.ShouldBindJSON(&${varName}); err != nil {
\t\tc.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
\t\treturn
\t}

\tif err := h.service.Create(&${varName}); err != nil {
\t\tc.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
\t\treturn
\t}
\tc.JSON(http.StatusCreated, ${varName})
}

func (h *${handlerName}) Update(c *gin.Context) {
\tidStr := c.Param("id")
\tid, err := strconv.ParseUint(idStr, 10, 64)
\tif err != nil {
\t\tc.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
\t\treturn
\t}

\tvar ${varName} models.${structName}
\tif err := c.ShouldBindJSON(&${varName}); err != nil {
\t\tc.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
\t\treturn
\t}

\tif err := h.service.Update(&${varName}); err != nil {
\t\tc.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
\t\treturn
\t}
\tc.JSON(http.StatusOK, ${varName})
}

func (h *${handlerName}) Delete(c *gin.Context) {
\tidStr := c.Param("id")
\tid, err := strconv.ParseUint(idStr, 10, 64)
\tif err != nil {
\t\tc.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
\t\treturn
\t}

\tif err := h.service.Delete(${pkType}(id)); err != nil {
\t\tc.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
\t\treturn
\t}
\tc.JSON(http.StatusNoContent, nil)
}

func (h *${handlerName}) RegisterRoutes(router *gin.RouterGroup) {
\t${varName}Router := router.Group("/${varName}")
\t{
\t\t${varName}Router.GET("/", h.GetAll)
\t\t${varName}Router.GET("/:id", h.GetByID)
\t\t${varName}Router.POST("/", h.Create)
\t\t${varName}Router.PUT("/:id", h.Update)
\t\t${varName}Router.DELETE("/:id", h.Delete)
\t}
}
`;
}

function generateGoMapper(table, moduleName) {
  const structName = toPascalCase(table.name);
  const varName = table.name.toLowerCase();

  const imports = [
    `"${moduleName}/internal/dto"`,
    `"${moduleName}/internal/models"`,
  ];

  return `package mapper

import (
\t${imports.join("\n\t")}
)

func To${structName}DTO(${varName} *models.${structName}) *dto.${structName}DTO {
\tif ${varName} == nil {
\t\treturn nil
\t}
\treturn &dto.${structName}DTO{
\t\t// TODO: 映射字段
\t}
}

func To${structName}Entity(dto *dto.${structName}DTO) *models.${structName} {
\tif dto == nil {
\t\treturn nil
\t}
\treturn &models.${structName}{
\t\t// TODO: 映射字段
\t}
}

func To${structName}DTOList(${varName}s []models.${structName}) []dto.${structName}DTO {
\tresult := make([]dto.${structName}DTO, len(${varName}s))
\tfor i, ${varName} := range ${varName}s {
\t\tresult[i] = *To${structName}DTO(&${varName})
\t}
\treturn result
}
`;
}

export function generateGoCode(tables, moduleName = "example") {
  const result = {};

  tables.forEach((table) => {
    const tableResult = {};
    tableResult[CODE_LAYER.ENTITY] = generateGoModel(table, moduleName);
    tableResult[CODE_LAYER.DAO] = generateGoRepository(table, moduleName);
    tableResult[CODE_LAYER.MAPPER] = generateGoMapper(table, moduleName);
    tableResult[CODE_LAYER.SERVICE] = generateGoService(table, moduleName);
    tableResult[CODE_LAYER.CONTROLLER] = generateGoHandler(table, moduleName);
    result[table.name] = tableResult;
  });

  return result;
}
