import { useState, useMemo } from "react";
import {
  Tabs,
  TabPane,
  Button,
  Checkbox,
  Tag,
  Select,
} from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";
import {
  generateCode,
  getFileExtension,
  getLayerDirectory,
  CODE_LANGUAGE,
  CODE_LAYER,
} from "../../../utils/codeGenerator";
import CodeEditor from "../../CodeEditor";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { toPascalCase } from "../../../utils/codeGenerator/shared";

const layerLabels = {
  [CODE_LAYER.ENTITY]: "Entity",
  [CODE_LAYER.DAO]: "DAO",
  [CODE_LAYER.MAPPER]: "Mapper",
  [CODE_LAYER.SERVICE]: "Service",
  [CODE_LAYER.CONTROLLER]: "Controller",
};

const languageOptions = [
  { value: CODE_LANGUAGE.JAVA, label: "Java" },
  { value: CODE_LANGUAGE.PYTHON, label: "Python" },
  { value: CODE_LANGUAGE.GO, label: "Go" },
  { value: CODE_LANGUAGE.TYPESCRIPT, label: "TypeScript" },
];

export default function CodeGenerator({
  selectedTables,
  allTables,
  onClose,
}) {
  const { t } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(CODE_LANGUAGE.JAVA);
  const [activeTable, setActiveTable] = useState(
    selectedTables.length > 0 ? selectedTables[0] : null,
  );
  const [activeLayer, setActiveLayer] = useState(CODE_LAYER.ENTITY);
  const [bulkSelectedTables, setBulkSelectedTables] = useState(
    selectedTables.map((t) => t.name),
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const generatedCode = useMemo(() => {
    if (!selectedLanguage) return {};
    const tablesToGenerate = allTables.filter((t) =>
      bulkSelectedTables.includes(t.name),
    );
    if (tablesToGenerate.length === 0) return {};
    return generateCode(selectedLanguage, tablesToGenerate);
  }, [selectedLanguage, bulkSelectedTables, allTables]);

  const currentCode = useMemo(() => {
    if (!activeTable || !generatedCode[activeTable.name]) return "";
    return generatedCode[activeTable.name][activeLayer] || "";
  }, [activeTable, activeLayer, generatedCode]);

  const availableLayers = useMemo(() => {
    if (!activeTable || !generatedCode[activeTable.name]) return [];
    return Object.keys(generatedCode[activeTable.name]).filter(
      (layer) => generatedCode[activeTable.name][layer] !== "",
    );
  }, [activeTable, generatedCode]);

  const handleLanguageChange = (value) => {
    setSelectedLanguage(value);
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 300);
  };

  const handleTableToggle = (tableName) => {
    setBulkSelectedTables((prev) => {
      if (prev.includes(tableName)) {
        return prev.filter((name) => name !== tableName);
      } else {
        return [...prev, tableName];
      }
    });
  };

  const handleSelectAll = () => {
    if (bulkSelectedTables.length === allTables.length) {
      setBulkSelectedTables([]);
    } else {
      setBulkSelectedTables(allTables.map((t) => t.name));
    }
  };

  const handleExport = async () => {
    const zip = new JSZip();
    const ext = getFileExtension(selectedLanguage);

    Object.entries(generatedCode).forEach(([tableName, tableCode]) => {
      Object.entries(tableCode).forEach(([layer, code]) => {
        if (!code) return;
        const dir = getLayerDirectory(selectedLanguage, layer);
        const fileName = `${toPascalCase(tableName)}.${ext}`;
        const path = `${dir}/${fileName}`;
        zip.file(path, code);
      });
    });

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `generated_code_${selectedLanguage}.zip`);
  };

  const getEditorLanguage = () => {
    switch (selectedLanguage) {
      case CODE_LANGUAGE.JAVA:
        return "java";
      case CODE_LANGUAGE.PYTHON:
        return "python";
      case CODE_LANGUAGE.GO:
        return "go";
      case CODE_LANGUAGE.TYPESCRIPT:
        return "typescript";
      default:
        return "javascript";
    }
  };

  const currentFileName = () => {
    if (!activeTable) return "";
    const dir = getLayerDirectory(selectedLanguage, activeLayer);
    const ext = getFileExtension(selectedLanguage);
    return `${dir}/${toPascalCase(activeTable.name)}.${ext}`;
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold">编程语言:</span>
            <Select
              value={selectedLanguage}
              onChange={handleLanguageChange}
              style={{ width: 150 }}
            >
              {languageOptions.map((opt) => (
                <Select.Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Select.Option>
              ))}
            </Select>
          </div>
        </div>
        <Button
          type="primary"
          onClick={handleExport}
          disabled={bulkSelectedTables.length === 0}
        >
          <i className="bi bi-download me-1" />
          导出代码
        </Button>
      </div>

      <div className="flex gap-4 flex-1 overflow-hidden">
        <div className="w-64 border border-gray-300 rounded-lg p-3 overflow-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">选择表</span>
            <Button
              type="tertiary"
              size="small"
              onClick={handleSelectAll}
            >
              {bulkSelectedTables.length === allTables.length
                ? "取消全选"
                : "全选"}
            </Button>
          </div>
          <div className="space-y-1">
            {allTables.map((table) => (
              <div
                key={table.id}
                className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100 ${
                  activeTable?.id === table.id ? "bg-blue-50 border border-blue-200" : ""
                }`}
                onClick={() => setActiveTable(table)}
              >
                <Checkbox
                  checked={bulkSelectedTables.includes(table.name)}
                  onChange={() => handleTableToggle(table.name)}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="flex-1 text-sm">{table.name}</span>
                {table.comment && (
                  <Tag size="small" color="blue">
                    {table.comment}
                  </Tag>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col border border-gray-300 rounded-lg overflow-hidden">
          {activeTable && availableLayers.length > 0 ? (
            <>
              <Tabs
                activeKey={activeLayer}
                onChange={setActiveLayer}
                type="line"
              >
                {availableLayers.map((layer) => (
                  <TabPane
                    tab={layerLabels[layer] || layer}
                    itemKey={layer}
                    key={layer}
                  >
                    <div className="h-[400px]">
                      <CodeEditor
                        value={currentCode}
                        language={getEditorLanguage()}
                        filename={currentFileName()}
                        options={{ readOnly: true }}
                        showCopyButton={true}
                      />
                    </div>
                  </TabPane>
                ))}
              </Tabs>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              {bulkSelectedTables.length === 0
                ? "请选择至少一个表"
                : "请从左侧选择一个表查看代码"}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <span>
          已选择 <strong>{bulkSelectedTables.length}</strong> 个表
        </span>
        <span>
          {isGenerating ? "正在生成代码..." : "代码已生成，可预览后导出"}
        </span>
      </div>
    </div>
  );
}
