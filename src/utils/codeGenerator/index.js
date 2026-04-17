import { CODE_LANGUAGE, CODE_LAYER } from "../../data/constants";
import { generateJavaCode } from "./java";
import { generatePythonCode } from "./python";
import { generateGoCode } from "./go";
import { generateTypeScriptCode } from "./typescript";

export { CODE_LANGUAGE, CODE_LAYER };

export function generateCode(language, tables, options = {}) {
  switch (language) {
    case CODE_LANGUAGE.JAVA:
      return generateJavaCode(tables, options.packageName || "com.example");
    case CODE_LANGUAGE.PYTHON:
      return generatePythonCode(tables);
    case CODE_LANGUAGE.GO:
      return generateGoCode(tables, options.moduleName || "example");
    case CODE_LANGUAGE.TYPESCRIPT:
      return generateTypeScriptCode(tables);
    default:
      return {};
  }
}

export function getFileExtension(language) {
  switch (language) {
    case CODE_LANGUAGE.JAVA:
      return "java";
    case CODE_LANGUAGE.PYTHON:
      return "py";
    case CODE_LANGUAGE.GO:
      return "go";
    case CODE_LANGUAGE.TYPESCRIPT:
      return "ts";
    default:
      return "txt";
  }
}

export function getLayerDirectory(language, layer) {
  const javaDirMap = {
    [CODE_LAYER.ENTITY]: "entity",
    [CODE_LAYER.DAO]: "repository",
    [CODE_LAYER.MAPPER]: "mapper",
    [CODE_LAYER.SERVICE]: "service",
    [CODE_LAYER.CONTROLLER]: "controller",
  };

  const pythonDirMap = {
    [CODE_LAYER.ENTITY]: "models",
    [CODE_LAYER.DAO]: "dao",
    [CODE_LAYER.MAPPER]: "mapper",
    [CODE_LAYER.SERVICE]: "services",
    [CODE_LAYER.CONTROLLER]: "routers",
  };

  const goDirMap = {
    [CODE_LAYER.ENTITY]: "models",
    [CODE_LAYER.DAO]: "repository",
    [CODE_LAYER.MAPPER]: "mapper",
    [CODE_LAYER.SERVICE]: "service",
    [CODE_LAYER.CONTROLLER]: "handler",
  };

  const tsDirMap = {
    [CODE_LAYER.ENTITY]: "entities",
    [CODE_LAYER.DAO]: "dao",
    [CODE_LAYER.MAPPER]: "mapper",
    [CODE_LAYER.SERVICE]: "services",
    [CODE_LAYER.CONTROLLER]: "controllers",
  };

  switch (language) {
    case CODE_LANGUAGE.JAVA:
      return javaDirMap[layer] || layer;
    case CODE_LANGUAGE.PYTHON:
      return pythonDirMap[layer] || layer;
    case CODE_LANGUAGE.GO:
      return goDirMap[layer] || layer;
    case CODE_LANGUAGE.TYPESCRIPT:
      return tsDirMap[layer] || layer;
    default:
      return layer;
  }
}
