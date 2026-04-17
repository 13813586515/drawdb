import { createContext, useState, useContext, useCallback, useEffect } from "react";
import { useDiagram, useSelect } from "../hooks";
import { ObjectType, MODAL } from "../data/constants";

const CodeGeneratorContext = createContext(null);

export function CodeGeneratorContextProvider({ children }) {
  const { tables } = useDiagram();
  const { selectedElement, bulkSelectedElements, setBulkSelectedElements } = useSelect();
  const [isOpen, setIsOpen] = useState(false);
  const [triggerTable, setTriggerTable] = useState(null);

  const getSelectedTables = useCallback(() => {
    let selected = [];

    if (bulkSelectedElements.length > 0) {
      selected = bulkSelectedElements
        .filter((el) => el.type === ObjectType.TABLE)
        .map((el) => tables.find((t) => t.id === el.id))
        .filter(Boolean);
    }

    if (selected.length === 0 && triggerTable) {
      selected = [triggerTable];
    }

    if (selected.length === 0 && selectedElement.element === ObjectType.TABLE) {
      const table = tables.find((t) => t.id === selectedElement.id);
      if (table) {
        selected = [table];
      }
    }

    return selected;
  }, [bulkSelectedElements, tables, triggerTable, selectedElement]);

  const getAllTables = useCallback(() => {
    return tables;
  }, [tables]);

  const openCodeGenerator = useCallback((table = null) => {
    if (table) {
      setTriggerTable(table);
      const elementInBulk = {
        id: table.id,
        type: ObjectType.TABLE,
        currentCoords: { x: table.x, y: table.y },
        initialCoords: { x: table.x, y: table.y },
      };
      setBulkSelectedElements([elementInBulk]);
    } else {
      setTriggerTable(null);
    }
    setIsOpen(true);
  }, [setBulkSelectedElements]);

  const closeCodeGenerator = useCallback(() => {
    setIsOpen(false);
    setTriggerTable(null);
  }, []);

  return (
    <CodeGeneratorContext.Provider
      value={{
        isOpen,
        triggerTable,
        getSelectedTables,
        getAllTables,
        openCodeGenerator,
        closeCodeGenerator,
      }}
    >
      {children}
    </CodeGeneratorContext.Provider>
  );
}

export function useCodeGenerator() {
  const context = useContext(CodeGeneratorContext);
  if (!context) {
    throw new Error(
      "useCodeGenerator must be used within a CodeGeneratorContextProvider",
    );
  }
  return context;
}

export default CodeGeneratorContext;
