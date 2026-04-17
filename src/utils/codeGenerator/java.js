import { CODE_LAYER } from "../../data/constants";
import {
  toPascalCase,
  toCamelCase,
  getPrimaryKeyField,
  mapSqlTypeToJavaType,
  getJavaImports,
} from "./shared";

function generateJavaEntity(table, packageName) {
  const className = toPascalCase(table.name);
  const tableName = table.name;
  const primaryKeyField = getPrimaryKeyField(table);

  const imports = [
    "import lombok.Data;",
    "import lombok.NoArgsConstructor;",
    "import lombok.AllArgsConstructor;",
    "import lombok.Builder;",
    "import jakarta.persistence.*;",
    getJavaImports(table.fields),
  ]
    .filter(Boolean)
    .join("\n");

  const fields = table.fields
    .map((field) => {
      const javaType = mapSqlTypeToJavaType(field.type);
      const fieldName = toCamelCase(field.name);
      const annotations = [];

      if (field.primary) {
        annotations.push("@Id");
        if (field.increment) {
          annotations.push(
            "@GeneratedValue(strategy = GenerationType.IDENTITY)",
          );
        }
      }

      if (field.unique) {
        annotations.push(
          `@Column(name = "${field.name}", unique = true)`,
        );
      } else if (field.notNull && !field.primary) {
        annotations.push(`@Column(name = "${field.name}", nullable = false)`);
      } else {
        annotations.push(`@Column(name = "${field.name}")`);
      }

      if (field.comment) {
        annotations.push(`/** ${field.comment} */`);
      }

      return `${annotations.join("\n  ")}\n  private ${javaType} ${fieldName};`;
    })
    .join("\n\n  ");

  const tableComment = table.comment
    ? `\n/**\n * ${table.comment}\n */`
    : "";

  return `${imports}

${tableComment}
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "${tableName}")
public class ${className} {

  ${fields}
}
`;
}

function generateJavaRepository(table, packageName) {
  const className = toPascalCase(table.name);
  const primaryKeyField = getPrimaryKeyField(table);
  const pkType = primaryKeyField
    ? mapSqlTypeToJavaType(primaryKeyField.type)
    : "Long";

  const imports = [
    `import ${packageName}.entity.${className};`,
    "import org.springframework.data.jpa.repository.JpaRepository;",
    "import org.springframework.stereotype.Repository;",
  ].join("\n");

  const tableComment = table.comment
    ? `\n/**\n * ${table.comment} 数据访问层\n */`
    : "";

  return `${imports}

${tableComment}
@Repository
public interface ${className}Repository extends JpaRepository<${className}, ${pkType}> {
}
`;
}

function generateJavaService(table, packageName) {
  const className = toPascalCase(table.name);
  const varName = toCamelCase(table.name);
  const primaryKeyField = getPrimaryKeyField(table);
  const pkType = primaryKeyField
    ? mapSqlTypeToJavaType(primaryKeyField.type)
    : "Long";
  const pkFieldName = primaryKeyField
    ? toCamelCase(primaryKeyField.name)
    : "id";

  const imports = [
    `import ${packageName}.entity.${className};`,
    `import ${packageName}.repository.${className}Repository;`,
    "import org.springframework.beans.factory.annotation.Autowired;",
    "import org.springframework.stereotype.Service;",
    "import org.springframework.transaction.annotation.Transactional;",
    "import java.util.List;",
    "import java.util.Optional;",
  ].join("\n");

  const tableComment = table.comment
    ? `\n/**\n * ${table.comment} 服务层\n */`
    : "";

  return `${imports}

${tableComment}
@Service
@Transactional
public class ${className}Service {

  @Autowired
  private ${className}Repository ${varName}Repository;

  public List<${className}> findAll() {
    return ${varName}Repository.findAll();
  }

  public Optional<${className}> findById(${pkType} ${pkFieldName}) {
    return ${varName}Repository.findById(${pkFieldName});
  }

  public ${className} save(${className} ${varName}) {
    return ${varName}Repository.save(${varName});
  }

  public void deleteById(${pkType} ${pkFieldName}) {
    ${varName}Repository.deleteById(${pkFieldName});
  }

  public ${className} update(${pkType} ${pkFieldName}, ${className} updated${className}) {
    return ${varName}Repository.findById(${pkFieldName})
        .map(existing -> {
          updated${className}.set${toPascalCase(pkFieldName)}(${pkFieldName});
          return ${varName}Repository.save(updated${className});
        })
        .orElseThrow(() -> new RuntimeException("${className} not found"));
  }
}
`;
}

function generateJavaController(table, packageName) {
  const className = toPascalCase(table.name);
  const varName = toCamelCase(table.name);
  const primaryKeyField = getPrimaryKeyField(table);
  const pkType = primaryKeyField
    ? mapSqlTypeToJavaType(primaryKeyField.type)
    : "Long";
  const pkFieldName = primaryKeyField
    ? toCamelCase(primaryKeyField.name)
    : "id";

  const imports = [
    `import ${packageName}.entity.${className};`,
    `import ${packageName}.service.${className}Service;`,
    "import org.springframework.beans.factory.annotation.Autowired;",
    "import org.springframework.http.ResponseEntity;",
    "import org.springframework.web.bind.annotation.*;",
    "import java.util.List;",
  ].join("\n");

  const tableComment = table.comment
    ? `\n/**\n * ${table.comment} 控制器\n */`
    : "";

  return `${imports}

${tableComment}
@RestController
@RequestMapping("/api/${table.name.toLowerCase()}")
public class ${className}Controller {

  @Autowired
  private ${className}Service ${varName}Service;

  @GetMapping
  public List<${className}> getAll${className}s() {
    return ${varName}Service.findAll();
  }

  @GetMapping("/{${pkFieldName}}")
  public ResponseEntity<${className}> get${className}ById(@PathVariable ${pkType} ${pkFieldName}) {
    return ${varName}Service.findById(${pkFieldName})
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
  }

  @PostMapping
  public ${className} create${className}(@RequestBody ${className} ${varName}) {
    return ${varName}Service.save(${varName});
  }

  @PutMapping("/{${pkFieldName}}")
  public ResponseEntity<${className}> update${className}(
      @PathVariable ${pkType} ${pkFieldName},
      @RequestBody ${className} ${varName}) {
    return ResponseEntity.ok(${varName}Service.update(${pkFieldName}, ${varName}));
  }

  @DeleteMapping("/{${pkFieldName}}")
  public ResponseEntity<Void> delete${className}(@PathVariable ${pkType} ${pkFieldName}) {
    ${varName}Service.deleteById(${pkFieldName});
    return ResponseEntity.noContent().build();
  }
}
`;
}

function generateJavaMapper(table, packageName) {
  const className = toPascalCase(table.name);

  const imports = [
    `import ${packageName}.entity.${className};`,
    "import org.apache.ibatis.annotations.Mapper;",
    "import org.apache.ibatis.annotations.Param;",
    "import java.util.List;",
    "import java.util.Optional;",
  ].join("\n");

  const tableComment = table.comment
    ? `\n/**\n * ${table.comment} MyBatis Mapper\n */`
    : "";

  return `${imports}

${tableComment}
@Mapper
public interface ${className}Mapper {

  List<${className}> findAll();

  Optional<${className}> findById(@Param("id") Long id);

  int insert(${className} ${toCamelCase(table.name)});

  int update(${className} ${toCamelCase(table.name)});

  int deleteById(@Param("id") Long id);
}
`;
}

export function generateJavaCode(tables, packageName = "com.example") {
  const result = {};

  tables.forEach((table) => {
    const tableResult = {};
    tableResult[CODE_LAYER.ENTITY] = generateJavaEntity(table, packageName);
    tableResult[CODE_LAYER.DAO] = generateJavaRepository(table, packageName);
    tableResult[CODE_LAYER.MAPPER] = generateJavaMapper(table, packageName);
    tableResult[CODE_LAYER.SERVICE] = generateJavaService(table, packageName);
    tableResult[CODE_LAYER.CONTROLLER] = generateJavaController(
      table,
      packageName,
    );
    result[table.name] = tableResult;
  });

  return result;
}
