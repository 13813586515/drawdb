import { createContext, useState } from "react";
import { PROTOTYPE_STATUS } from "../data/constants";

export const PrototypeContext = createContext(null);

export default function PrototypeContextProvider({ children }) {
  const [prototypeStatus, setPrototypeStatus] = useState({
    status: PROTOTYPE_STATUS.IDLE,
    progress: 0,
    message: "",
    isMinimized: false,
    error: null,
  });

  const startGeneration = () => {
    setPrototypeStatus({
      status: PROTOTYPE_STATUS.GENERATING,
      progress: 0,
      message: "Starting prototype generation...",
      isMinimized: false,
      error: null,
    });
  };

  const updateProgress = (progress, message) => {
    setPrototypeStatus((prev) => ({
      ...prev,
      progress: Math.min(100, Math.max(0, progress)),
      message: message || prev.message,
    }));
  };

  const completeGeneration = () => {
    setPrototypeStatus((prev) => ({
      ...prev,
      status: PROTOTYPE_STATUS.COMPLETED,
      progress: 100,
      message: "Prototype generation completed!",
    }));
  };

  const failGeneration = (error) => {
    setPrototypeStatus({
      status: PROTOTYPE_STATUS.ERROR,
      progress: 0,
      message: "Prototype generation failed",
      isMinimized: false,
      error: error,
    });
  };

  const minimize = () => {
    setPrototypeStatus((prev) => ({
      ...prev,
      isMinimized: true,
    }));
  };

  const maximize = () => {
    setPrototypeStatus((prev) => ({
      ...prev,
      isMinimized: false,
    }));
  };

  const reset = () => {
    setPrototypeStatus({
      status: PROTOTYPE_STATUS.IDLE,
      progress: 0,
      message: "",
      isMinimized: false,
      error: null,
    });
  };

  return (
    <PrototypeContext.Provider
      value={{
        prototypeStatus,
        startGeneration,
        updateProgress,
        completeGeneration,
        failGeneration,
        minimize,
        maximize,
        reset,
      }}
    >
      {children}
    </PrototypeContext.Provider>
  );
}
