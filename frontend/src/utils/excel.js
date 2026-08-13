import { readSheet } from 'read-excel-file/browser';
import writeExcelFile from 'write-excel-file/browser';

export const downloadRowsAsExcel = async (rows, sheetName, fileName) => {
  const normalizedRows = rows.map((row) => row.map((value) => {
    if (value === null || value === undefined) return null;
    if (['string', 'number', 'boolean'].includes(typeof value) || value instanceof Date) return value;
    return String(value);
  }));

  await writeExcelFile(normalizedRows, { sheet: sheetName.slice(0, 31) }).toFile(fileName);
};

export const downloadJsonTemplate = async (records, columns, sheetName, fileName) => {
  const rows = [columns, ...records.map((record) => columns.map((column) => record[column] ?? ''))];
  await downloadRowsAsExcel(rows, sheetName, fileName);
};

export const readFirstWorksheet = async (input) => {
  const rows = await readSheet(input);
  const headers = (rows[0] || []).map((value) => String(value ?? '').trim());

  return rows.slice(1).map((row) => {
    const record = {};
    headers.forEach((header, index) => {
      if (header) record[header] = row[index] ?? '';
    });
    return record;
  }).filter((record) => Object.values(record).some((value) => String(value).trim() !== ''));
};
