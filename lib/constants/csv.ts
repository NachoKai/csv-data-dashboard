import type { Dataset } from "@/lib/types/csv";

/** Default name for unnamed datasets */
export const DEFAULT_DATASET_NAME = "Untitled CSV";

/** Sentinel value used to indicate a tab is being renamed inline */
export const EDITING_SENTINEL = "__editing__";

/** Empty dataset with no rows or columns */
export const EMPTY_DATASET: Dataset = {
  rows: [],
  metadata: { columns: [], dateColumn: null, numericColumns: [] },
};

/** Sample CSV content for the "Try a sample" button */
export const SAMPLE_CSV = `Month,Revenue,Orders,Conversion Rate
Jan 2024,12400,186,3.8
Feb 2024,13800,204,4.1
Mar 2024,15200,229,4.6
Apr 2024,14900,218,4.3
May 2024,17600,267,5.2
Jun 2024,19300,291,5.6
Jul 2024,22100,328,6.1
Aug 2024,24800,374,6.8
Sep 2024,23600,352,6.4
Oct 2024,27900,419,7.2
Nov 2024,31200,468,7.9
Dec 2024,35600,534,8.6}`;
