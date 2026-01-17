import * as XLSX from "xlsx";

export function exportToExcel<T extends Record<string, unknown>>(
    data: T[],
    filename: string,
    sheetName: string = "Sheet1"
): void {
    // Create worksheet from data
    const ws = XLSX.utils.json_to_sheet(data);

    // Auto-size columns
    const colWidths = Object.keys(data[0] || {}).map((key) => ({
        wch: Math.max(
            key.length,
            ...data.map((row) => String(row[key] || "").length)
        ),
    }));
    ws["!cols"] = colWidths;

    // Create workbook and append sheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Write file
    XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function createExcelBuffer<T extends Record<string, unknown>>(
    data: T[],
    sheetName: string = "Sheet1"
): Buffer {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
