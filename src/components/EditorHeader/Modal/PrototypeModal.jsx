import { useState } from "react";
import {
  Input,
  Table,
  Tag,
  Spin,
  Toast,
  Button,
} from "@douyinfe/semi-ui";
import { useDiagram, usePrototype } from "../../../hooks";
import { generatePrototype, downloadPrototype } from "../../../utils/prototypeGenerator";

export default function PrototypeModal({ onClose }) {
  const { tables } = useDiagram();
  const {
    prototypeStatus,
    startGeneration,
    updateProgress,
    completeGeneration,
    failGeneration,
    minimize,
    reset,
  } = usePrototype();

  const [prototypeName, setPrototypeName] = useState("my_prototype");
  const [isGenerating, setIsGenerating] = useState(false);

  const hasTables = tables && tables.length > 0;

  const handleGenerate = async () => {
    if (!prototypeName.trim()) {
      Toast.warning("Please enter a prototype name");
      return;
    }

    if (!hasTables) {
      Toast.warning("No tables found in the diagram");
      return;
    }

    setIsGenerating(true);
    startGeneration();

    try {
      const result = await generatePrototype({
        prototypeName: prototypeName.trim(),
        tables: tables,
        onProgress: (progress, message) => {
          updateProgress(progress, message);
        },
      });

      completeGeneration();
      
      downloadPrototype(result.blob, result.filename);
      
      Toast.success(`Prototype "${prototypeName}" generated successfully! Downloading...`);
      
      setTimeout(() => {
        reset();
        onClose?.();
      }, 2000);
    } catch (error) {
      console.error("Error generating prototype:", error);
      failGeneration(error.message);
      Toast.error("Failed to generate prototype: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const columns = [
    {
      title: "Table Name",
      dataIndex: "name",
      key: "name",
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Fields",
      dataIndex: "fields",
      key: "fields",
      render: (fields) => (
        <Tag color="blue">{(fields || []).length} fields</Tag>
      ),
    },
    {
      title: "Primary Key",
      dataIndex: "fields",
      key: "pk",
      render: (fields) => {
        const pkField = (fields || []).find((f) => f.primary);
        return pkField ? (
          <Tag color="green">{pkField.name}</Tag>
        ) : (
          <Tag color="orange">No PK</Tag>
        );
      },
    },
  ];

  return (
    <div className="prototype-modal">
      {!isGenerating ? (
        <>
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">
              Prototype Name <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Enter prototype name"
              value={prototypeName}
              onChange={(value) => setPrototypeName(value)}
              showClear
              disabled={isGenerating}
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be used as the folder name for your prototype.
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">
              Tables to Generate ({tables.length})
            </label>
            {hasTables ? (
              <Table
                columns={columns}
                dataSource={tables.map((t) => ({ ...t, key: t.id }))}
                pagination={false}
                size="small"
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <i className="fa-solid fa-table text-3xl mb-2 opacity-50" />
                <p>No tables found. Please add tables to your diagram first.</p>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <i className="fa-solid fa-circle-info text-blue-500 mt-1 mr-3" />
              <div>
                <p className="text-sm font-semibold text-blue-800">What will be generated?</p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li>• A ZIP file containing a folder for each table</li>
                  <li>• Each folder contains: HTML, Python (Flask API), and JSON files</li>
                  <li>• Double-click the HTML file to use the CRUD interface</li>
                  <li>• Run the Python file to start the API server</li>
                  <li>• Data is persisted in the JSON file</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <Button
              theme="light"
              onClick={() => onClose?.()}
            >
              取消
            </Button>
            <Button
              type="primary"
              onClick={handleGenerate}
              disabled={!hasTables}
              icon={<i className="fa-solid fa-rocket" />}
            >
              生成原型
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <Spin size="large" />
          <p className="mt-4 text-lg font-medium">{prototypeStatus.message || "Generating prototype..."}</p>
          <p className="text-sm text-gray-500 mt-2">
            Progress: {prototypeStatus.progress}%
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${prototypeStatus.progress}%` }}
            />
          </div>
          <button
            className="mt-4 text-sm text-blue-600 hover:text-blue-800"
            onClick={() => {
              minimize();
              onClose?.();
            }}
          >
            <i className="fa-solid fa-minus mr-1" />
            Minimize to corner
          </button>
        </div>
      )}
    </div>
  );
}
