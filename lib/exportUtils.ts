import Papa from "papaparse";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function exportToCSV(filename: string, data: any[]) {
    if (!data || data.length === 0) {
        alert("Tidak ada data untuk diekspor.");
        return;
    }
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `${filename}.csv`);
}

export function exportToExcel(filename: string, data: any[]) {
    if (!data || data.length === 0) {
        alert("Tidak ada data untuk diekspor.");
        return;
    }
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `${filename}.xlsx`);
}
