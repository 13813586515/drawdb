import { useContext } from "react";
import { PrototypeContext } from "../context/PrototypeContext";

export default function usePrototype() {
  return useContext(PrototypeContext);
}
