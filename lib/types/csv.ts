export type CSVValue = string | number;
export type CSVRow = Record<string, CSVValue>;

export type CSVMetadata = {
  columns: string[];
  dateColumn: string | null;
  numericColumns: string[];
};

export type Dataset = { rows: CSVRow[]; metadata: CSVMetadata };

export type WorkspaceDataset = Dataset & {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
};
