import { CODE_LAYER } from "../../data/constants";
import {
  toPascalCase,
  toCamelCase,
  getPrimaryKeyField,
  mapSqlTypeToTsType,
} from "./shared";

function generateTsEntity(table) {
  const interfaceName = toPascalCase(table.name);
  const tableComment = table.comment ? `// ${table.comment}\n` : "";

  const fields = table.fields
    .map((field) => {
      const tsType = mapSqlTypeToTsType(field.type);
      const fieldName = toCamelCase(field.name);
      const optional = !field.notNull && !field.primary;
      const optionalMark = optional ? "?" : "";
      const comment = field.comment ? ` // ${field.comment}` : "";

      return `${fieldName}${optionalMark}: ${tsType};${comment}`;
    })
    .join("\n  ");

  return `${tableComment}export interface ${interfaceName} {
  ${fields}
}
`;
}

function generateTsDTO(table) {
  const interfaceName = toPascalCase(table.name);
  const primaryKeyField = getPrimaryKeyField(table);

  const createFields = table.fields
    .filter((f) => !(f.primary && f.increment))
    .map((field) => {
      const tsType = mapSqlTypeToTsType(field.type);
      const fieldName = toCamelCase(field.name);
      const optional = !field.notNull;
      const optionalMark = optional ? "?" : "";
      const comment = field.comment ? ` // ${field.comment}` : "";

      return `${fieldName}${optionalMark}: ${tsType};${comment}`;
    })
    .join("\n  ");

  const updateFields = table.fields
    .filter((f) => !(f.primary && f.increment))
    .map((field) => {
      const tsType = mapSqlTypeToTsType(field.type);
      const fieldName = toCamelCase(field.name);
      const comment = field.comment ? ` // ${field.comment}` : "";

      return `${fieldName}?: ${tsType};${comment}`;
    })
    .join("\n  ");

  return `import { ${interfaceName} } from '../entities/${table.name.toLowerCase()}';

export interface Create${interfaceName}DTO {
  ${createFields}
}

export interface Update${interfaceName}DTO {
  ${updateFields}
}

export interface ${interfaceName}Response extends ${interfaceName} {}
`;
}

function generateTsService(table) {
  const interfaceName = toPascalCase(table.name);
  const varName = toCamelCase(table.name);
  const pluralVarName = varName + "s";
  const primaryKeyField = getPrimaryKeyField(table);
  const pkFieldName = primaryKeyField
    ? toCamelCase(primaryKeyField.name)
    : "id";

  const tableComment = table.comment
    ? `// ${table.comment} 服务层\n`
    : "";

  return `import { ${interfaceName}, Create${interfaceName}DTO, Update${interfaceName}DTO } from '../types/dto';
import { ApiService } from './api';

${tableComment}export class ${interfaceName}Service {
  private api: ApiService;
  private readonly baseUrl = '/api/${table.name.toLowerCase()}';

  constructor(api: ApiService) {
    this.api = api;
  }

  async getAll(): Promise<${interfaceName}[]> {
    return this.api.get<${interfaceName}[]>(this.baseUrl);
  }

  async getById(${pkFieldName}: number | string): Promise<${interfaceName}> {
    return this.api.get<${interfaceName}>(\`\${this.baseUrl}/\${${pkFieldName}}\`);
  }

  async create(data: Create${interfaceName}DTO): Promise<${interfaceName}> {
    return this.api.post<${interfaceName}>(this.baseUrl, data);
  }

  async update(${pkFieldName}: number | string, data: Update${interfaceName}DTO): Promise<${interfaceName}> {
    return this.api.put<${interfaceName}>(\`\${this.baseUrl}/\${${pkFieldName}}\`, data);
  }

  async delete(${pkFieldName}: number | string): Promise<void> {
    return this.api.delete(\`\${this.baseUrl}/\${${pkFieldName}}\`);
  }
}
`;
}

function generateTsController(table) {
  const interfaceName = toPascalCase(table.name);
  const varName = toCamelCase(table.name);
  const primaryKeyField = getPrimaryKeyField(table);
  const pkFieldName = primaryKeyField
    ? toCamelCase(primaryKeyField.name)
    : "id";

  const tableComment = table.comment
    ? `// ${table.comment} 控制器 (Express/NestJS 风格)\n`
    : "";

  return `import { Request, Response, NextFunction } from 'express';
import { ${interfaceName}Service } from '../services/${varName}.service';
import { Create${interfaceName}DTO, Update${interfaceName}DTO } from '../types/dto';

${tableComment}export class ${interfaceName}Controller {
  private service: ${interfaceName}Service;

  constructor(service: ${interfaceName}Service) {
    this.service = service;
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const ${varName}s = await this.service.getAll();
      res.json(${varName}s);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const ${varName} = await this.service.getById(req.params.${pkFieldName});
      res.json(${varName});
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data: Create${interfaceName}DTO = req.body;
      const ${varName} = await this.service.create(data);
      res.status(201).json(${varName});
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data: Update${interfaceName}DTO = req.body;
      const ${varName} = await this.service.update(req.params.${pkFieldName}, data);
      res.json(${varName});
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await this.service.delete(req.params.${pkFieldName});
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
`;
}

function generateTsMapper(table) {
  const interfaceName = toPascalCase(table.name);
  const varName = toCamelCase(table.name);

  return `import { ${interfaceName} } from '../entities/${varName}';
import { Create${interfaceName}DTO, Update${interfaceName}DTO } from '../types/dto';

export class ${interfaceName}Mapper {
  static toEntity(dto: Create${interfaceName}DTO | Update${interfaceName}DTO): Partial<${interfaceName}> {
    return {
      // 自动映射字段
      ...dto,
    };
  }

  static toDTO(entity: ${interfaceName}): ${interfaceName} {
    return {
      ...entity,
    };
  }

  static mergeEntity(
    entity: ${interfaceName},
    updates: Update${interfaceName}DTO
  ): ${interfaceName} {
    return {
      ...entity,
      ...updates,
    };
  }
}
`;
}

function generateTsDAO(table) {
  const interfaceName = toPascalCase(table.name);
  const varName = toCamelCase(table.name);
  const primaryKeyField = getPrimaryKeyField(table);
  const pkFieldName = primaryKeyField
    ? toCamelCase(primaryKeyField.name)
    : "id";

  return `import { ${interfaceName} } from '../entities/${varName}';

export interface ${interfaceName}DAO {
  findAll(): Promise<${interfaceName}[]>;
  findById(${pkFieldName}: number | string): Promise<${interfaceName} | null>;
  create(entity: Omit<${interfaceName}, '${pkFieldName}'>): Promise<${interfaceName}>;
  update(${pkFieldName}: number | string, updates: Partial<${interfaceName}>): Promise<${interfaceName} | null>;
  delete(${pkFieldName}: number | string): Promise<boolean>;
}
`;
}

export function generateTypeScriptCode(tables) {
  const result = {};

  tables.forEach((table) => {
    const tableResult = {};
    tableResult[CODE_LAYER.ENTITY] = generateTsEntity(table);
    tableResult[CODE_LAYER.DAO] = generateTsDAO(table);
    tableResult[CODE_LAYER.MAPPER] = generateTsMapper(table);
    tableResult[CODE_LAYER.SERVICE] = generateTsService(table);
    tableResult[CODE_LAYER.CONTROLLER] = generateTsController(table);
    result[table.name] = tableResult;
  });

  return result;
}
