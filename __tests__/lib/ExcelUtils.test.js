/**
 * TDD Test Suite: lib/ExcelUtils.js
 * Tests for: saveAsXLSX (web download path)
 */

jest.mock('xlsx', () => ({
  write: jest.fn(() => new ArrayBuffer(8)),
  utils: {
    json_to_sheet: jest.fn(() => ({})),
    book_new: jest.fn(() => ({})),
    book_append_sheet: jest.fn(),
  },
}));

jest.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false },
}));

jest.mock('@capacitor/filesystem', () => ({
  Filesystem: { writeFile: jest.fn() },
  Directory: { Documents: 'DOCUMENTS' },
}));

jest.mock('@capacitor/share', () => ({
  Share: { share: jest.fn() },
}));

import { saveAsXLSX } from '../../lib/ExcelUtils.js';
import * as XLSX from 'xlsx';

describe('ExcelUtils - saveAsXLSX', () => {
  let mockAnchor;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAnchor = { href: '', download: '', click: jest.fn() };
    jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
    jest.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    jest.spyOn(document.body, 'removeChild').mockImplementation(() => {});
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();
    global.Blob = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should call XLSX.write with bookType xlsx and type array', async () => {
    const wb = {};
    await saveAsXLSX(wb, 'test.xlsx');
    expect(XLSX.write).toHaveBeenCalledWith(wb, { bookType: 'xlsx', type: 'array' });
  });

  test('should create blob URL for web download', async () => {
    await saveAsXLSX({}, 'test.xlsx');
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  test('should set correct filename on download anchor', async () => {
    await saveAsXLSX({}, 'quiz_results.xlsx');
    expect(mockAnchor.download).toBe('quiz_results.xlsx');
  });

  test('should trigger anchor click to start download', async () => {
    await saveAsXLSX({}, 'test.xlsx');
    expect(mockAnchor.click).toHaveBeenCalled();
  });

  test('should set href from blob URL', async () => {
    await saveAsXLSX({}, 'test.xlsx');
    expect(mockAnchor.href).toBe('blob:mock-url');
  });
});
