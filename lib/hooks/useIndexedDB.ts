"use client";

import { get, set } from "idb-keyval";
import type { WorkspaceDataset } from "@/lib/types/csv";
import { datasetFromLegacy } from "@/lib/utils/csv";

const KEY = "csvWorkspace:v2";
const LEGACY_KEY = "csvDataset";

export function useIndexedDB() {
  async function load(): Promise<WorkspaceDataset[]> {
    try {
      const saved = await get<unknown>(KEY);
      if (saved) return datasetFromLegacy(saved);
      const legacy = await get<unknown>(LEGACY_KEY);
      if (legacy) return datasetFromLegacy(legacy);
      const browserLegacy =
        typeof window !== "undefined"
          ? JSON.parse(localStorage.getItem(LEGACY_KEY) || "null")
          : null;
      return datasetFromLegacy(browserLegacy);
    } catch {
      try {
        return datasetFromLegacy(
          JSON.parse(
            localStorage.getItem(KEY) || localStorage.getItem(LEGACY_KEY) || "null",
          ),
        );
      } catch {
        return datasetFromLegacy(null);
      }
    }
  }
  async function save(value: WorkspaceDataset[]) {
    try {
      await set(KEY, value);
    } catch {
      localStorage.setItem(KEY, JSON.stringify(value));
    }
  }
  return { load, save };
}
