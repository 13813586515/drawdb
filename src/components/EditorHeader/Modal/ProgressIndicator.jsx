import { useEffect } from "react";
import { usePrototype } from "../../../hooks";
import { PROTOTYPE_STATUS } from "../../../data/constants";
import { Toast } from "@douyinfe/semi-ui";
import { motion, AnimatePresence } from "framer-motion";

export default function ProgressIndicator() {
  const {
    prototypeStatus,
    maximize,
    reset,
  } = usePrototype();

  const { status, progress, message, isMinimized, error } = prototypeStatus;

  const isActive =
    status === PROTOTYPE_STATUS.GENERATING ||
    status === PROTOTYPE_STATUS.COMPLETED ||
    status === PROTOTYPE_STATUS.ERROR;

  useEffect(() => {
    if (status === PROTOTYPE_STATUS.COMPLETED) {
      const timer = setTimeout(() => {
        reset();
      }, 5000);
      return () => clearTimeout(timer);
    }
    if (status === PROTOTYPE_STATUS.ERROR) {
      Toast.error("Prototype generation failed: " + (error || "Unknown error"));
      const timer = setTimeout(() => {
        reset();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status, error, reset]);

  if (!isActive) {
    return null;
  }

  if (isMinimized) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-4 cursor-pointer hover:shadow-3xl transition-shadow border border-gray-200"
            onClick={maximize}
            title="Click to expand"
          >
            <div className="flex items-center space-x-3">
              {status === PROTOTYPE_STATUS.GENERATING && (
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-4 border-gray-200" />
                  <svg
                    className="absolute top-0 left-0 w-12 h-12 -rotate-90"
                    viewBox="0 0 48 48"
                  >
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      fill="none"
                      stroke="#175e7a"
                      strokeWidth="4"
                      strokeDasharray={`${progress * 1.256} 125.6`}
                      className="transition-all duration-300"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-700">
                      {progress}%
                    </span>
                  </div>
                </div>
              )}
              {status === PROTOTYPE_STATUS.COMPLETED && (
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <i className="fa-solid fa-check text-green-600 text-xl" />
                </div>
              )}
              {status === PROTOTYPE_STATUS.ERROR && (
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <i className="fa-solid fa-exclamation text-red-600 text-xl" />
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {status === PROTOTYPE_STATUS.GENERATING && "Generating..."}
                  {status === PROTOTYPE_STATUS.COMPLETED && "Complete!"}
                  {status === PROTOTYPE_STATUS.ERROR && "Error"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {message || "Click to expand"}
                </p>
              </div>
            </div>
            {status === PROTOTYPE_STATUS.GENERATING && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-teal-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-6 right-6 z-50 w-96"
      >
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-blue-600 to-teal-500 px-4 py-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                {status === PROTOTYPE_STATUS.GENERATING && (
                  <i className="fa-solid fa-gear fa-spin text-white" />
                )}
                {status === PROTOTYPE_STATUS.COMPLETED && (
                  <i className="fa-solid fa-check-circle text-white" />
                )}
                {status === PROTOTYPE_STATUS.ERROR && (
                  <i className="fa-solid fa-exclamation-circle text-white" />
                )}
                <span className="text-white font-semibold">
                  {status === PROTOTYPE_STATUS.GENERATING && "Generating Prototype"}
                  {status === PROTOTYPE_STATUS.COMPLETED && "Prototype Generated"}
                  {status === PROTOTYPE_STATUS.ERROR && "Generation Failed"}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {status === PROTOTYPE_STATUS.GENERATING && (
                  <button
                    className="text-white/80 hover:text-white transition-colors"
                    onClick={() => {}}
                    title="Minimize"
                  >
                    <i className="fa-solid fa-minus" />
                  </button>
                )}
                <button
                  className="text-white/80 hover:text-white transition-colors"
                  onClick={reset}
                  title="Close"
                >
                  <i className="fa-solid fa-times" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="text-sm text-gray-600 mb-3">
              {message || "Processing..."}
            </div>

            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>Progress</span>
                <span className="font-mono">{progress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${
                    status === PROTOTYPE_STATUS.ERROR
                      ? "bg-red-500"
                      : status === PROTOTYPE_STATUS.COMPLETED
                      ? "bg-green-500"
                      : "bg-gradient-to-r from-blue-500 to-teal-500"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-400">
                {status === PROTOTYPE_STATUS.GENERATING && (
                  <span>
                    <i className="fa-solid fa-circle-dot text-blue-500 mr-1 animate-pulse" />
                    Generating files...
                  </span>
                )}
                {status === PROTOTYPE_STATUS.COMPLETED && (
                  <span className="text-green-600">
                    <i className="fa-solid fa-check mr-1" />
                    Download should start automatically
                  </span>
                )}
                {status === PROTOTYPE_STATUS.ERROR && (
                  <span className="text-red-600">
                    <i className="fa-solid fa-exclamation-triangle mr-1" />
                    {error || "Something went wrong"}
                  </span>
                )}
              </div>
              {status === PROTOTYPE_STATUS.GENERATING && (
                <button
                  className="text-xs text-blue-600 hover:text-blue-800"
                  onClick={() => {}}
                >
                  <i className="fa-solid fa-chevron-down mr-1" />
                  Minimize
                </button>
              )}
              {status === PROTOTYPE_STATUS.COMPLETED && (
                <button
                  className="text-xs text-gray-600 hover:text-gray-800"
                  onClick={reset}
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
