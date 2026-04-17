import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
      Toast.warning(t("prototype_enter_name"));
      return;
    }

    if (!hasTables) {
      Toast.warning(t("prototype_no_tables"));
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
      
      Toast.success(t("prototype_generated_success", { name: prototypeName }));
      
      setTimeout(() => {
        reset();
        onClose?.();
      }, 2000);
    } catch (error) {
      console.error("Error generating prototype:", error);
      failGeneration(error.message);
      Toast.error(t("prototype_generate_failed") + ": " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const columns = [
    {
      title: t("prototype_table_name"),
      dataIndex: "name",
      key: "name",
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: t("prototype_fields"),
      dataIndex: "fields",
      key: "fields",
      render: (fields) => (
        <Tag color="blue">
          {t("prototype_fields_count", { count: (fields || []).length })}
        </Tag>
      ),
    },
    {
      title: t("prototype_primary_key"),
      dataIndex: "fields",
      key: "pk",
      render: (fields) => {
        const pkField = (fields || []).find((f) => f.primary);
        return pkField ? (
          <Tag color="green">{pkField.name}</Tag>
        ) : (
          <Tag color="orange">{t("prototype_no_pk")}</Tag>
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
              {t("prototype_name_label")} <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder={t("prototype_name_placeholder")}
              value={prototypeName}
              onChange={(value) => setPrototypeName(value)}
              showClear
              disabled={isGenerating}
            />
            <p className="text-xs text-gray-500 mt-1">
              {t("prototype_name_hint")}
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">
              {t("prototype_tables_label", { count: tables.length })}
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
                <p>{t("prototype_no_tables_hint")}</p>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <i className="fa-solid fa-circle-info text-blue-500 mt-1 mr-3" />
              <div>
                <p className="text-sm font-semibold text-blue-800">
                  {t("prototype_what_generated")}
                </p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li>• {t("prototype_gen_item1")}</li>
                  <li>• {t("prototype_gen_item2")}</li>
                  <li>• {t("prototype_gen_item3")}</li>
                  <li>• {t("prototype_gen_item4")}</li>
                  <li>• {t("prototype_gen_item5")}</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-3">
            <div className="flex items-start">
              <i className="fa-solid fa-triangle-exclamation text-yellow-500 mt-1 mr-3" />
              <div>
                <p className="text-sm text-yellow-800">
                  {t("prototype_download_note")}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <Button
              theme="light"
              onClick={() => onClose?.()}
            >
              {t("cancel")}
            </Button>
            <Button
              type="primary"
              onClick={handleGenerate}
              disabled={!hasTables}
              icon={<i className="fa-solid fa-rocket" />}
            >
              {t("prototype_generate")}
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <Spin size="large" />
          <p className="mt-4 text-lg font-medium">
            {prototypeStatus.message || t("prototype_generating")}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {t("prototype_progress")}: {prototypeStatus.progress}%
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
            {t("prototype_minimize")}
          </button>
        </div>
      )}
    </div>
  );
}
