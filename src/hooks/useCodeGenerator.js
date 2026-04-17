import { useContext } from "react";
import CodeGeneratorContext from "../context/CodeGeneratorContext";

export default function useCodeGenerator() {
  return useContext(CodeGeneratorContext);
}
