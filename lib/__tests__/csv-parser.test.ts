import { describe, it, expect } from "vitest";
import { parseCsv } from "@/lib/hooks/useCsvParser";
import { SAMPLE_CSV } from "@/lib/constants/csv";

describe("parseCsv", () => {
  it("parses a simple CSV string", () => {
    const csv = "Name,Age\nAlice,30\nBob,25";
    const result = parseCsv(csv);
    expect(result.rows).toHaveLength(2);
    expect(result.metadata.columns).toEqual(["Name", "Age"]);
    expect(result.metadata.numericColumns).toEqual(["Age"]);
  });

  it("detects the date column", () => {
    const csv = "Month,Revenue\nJan,100\nFeb,200";
    const result = parseCsv(csv);
    expect(result.metadata.dateColumn).toBe("Month");
  });

  it("trims whitespace from values", () => {
    const csv = "Name,Score\n  Alice  ,  95  ";
    const result = parseCsv(csv);
    expect(result.rows[0].Name).toBe("Alice");
    expect(result.rows[0].Score).toBe("95");
  });

  it("skips empty lines", () => {
    const csv = "A,B\n1,2\n\n3,4\n";
    const result = parseCsv(csv);
    expect(result.rows).toHaveLength(2);
  });

  it("throws on empty input", () => {
    expect(() => parseCsv("")).toThrow("Paste or upload a CSV file first.");
  });

  it("throws on whitespace-only input", () => {
    expect(() => parseCsv("   \n  ")).toThrow(
      "Paste or upload a CSV file first.",
    );
  });

  it("throws on header-only CSV (no data rows)", () => {
    expect(() => parseCsv("A,B,C")).toThrow();
  });

  it("parses the SAMPLE_CSV constant correctly", () => {
    const result = parseCsv(SAMPLE_CSV);
    expect(result.rows.length).toBe(12);
    expect(result.metadata.columns).toContain("Month");
    expect(result.metadata.columns).toContain("Revenue");
    expect(result.metadata.numericColumns).toContain("Revenue");
    expect(result.metadata.numericColumns).toContain("Orders");
    expect(result.metadata.dateColumn).toBe("Month");
  });

  it("parses CSV with decimal numeric values", () => {
    const csv = "Item,Rate\nA,3.8\nB,4.1";
    const result = parseCsv(csv);
    expect(result.metadata.numericColumns).toEqual(["Rate"]);
  });

  it("handles CSV with trailing newline", () => {
    const csv = "X,Y\n1,2\n";
    const result = parseCsv(csv);
    expect(result.rows).toHaveLength(1);
  });

  it("filters out fully-empty rows", () => {
    const csv = "A,B\n1,2\n,\n3,4";
    const result = parseCsv(csv);
    expect(result.rows).toHaveLength(2);
  });
});
