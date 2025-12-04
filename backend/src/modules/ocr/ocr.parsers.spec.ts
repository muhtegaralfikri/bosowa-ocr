import {
  extractLetterNumber,
  extractTanggal,
  extractPerihal,
  extractNominalList,
  extractNamaPengirim,
} from './ocr.parsers';

describe('OCR Parsers', () => {
  describe('extractLetterNumber', () => {
    it('should extract letter number with multiple segments', () => {
      const text = 'No: 725/SO/BBS-MKS/KIL2025';
      const result = extractLetterNumber(text);
      expect(result.letterNumber).toBe('725/SO/BBS-MKS/KIL2025');
    });

    it('should filter out month names like Macember/2025 from primary selection', () => {
      const text = `Date of Departure Macember/2025
No: 725/SO/BBS-MKS/KIL2025`;
      const result = extractLetterNumber(text);
      expect(result.letterNumber).toBe('725/SO/BBS-MKS/KIL2025');
      expect(result.letterNumber).not.toBe('Macember/2025');
    });

    it('should handle invoice numbers', () => {
      const text = 'Nomor Invoice: INV-2024/00123';
      const result = extractLetterNumber(text);
      expect(result.candidates.length).toBeGreaterThan(0);
    });

    it('should return null if no letter number found', () => {
      const text = 'This is just regular text without any number';
      const result = extractLetterNumber(text);
      expect(result.letterNumber).toBeNull();
    });

    it('should prioritize multi-segment numbers', () => {
      const text = `No: AB-123
No: 001/SKT/XII/2024`;
      const result = extractLetterNumber(text);
      expect(result.letterNumber).toBe('001/SKT/XII/2024');
    });
  });

  describe('extractTanggal', () => {
    it('should extract date in DD MMMM YYYY format (English)', () => {
      const text = 'Makassar, 02 December 2025';
      const result = extractTanggal(text);
      expect(result).toBe('2025-12-02');
    });

    it('should extract date in DD MMMM YYYY format (Indonesian)', () => {
      const text = 'Jakarta, 15 Desember 2024';
      const result = extractTanggal(text);
      expect(result).toBe('2024-12-15');
    });

    it('should extract date in DD-MM-YYYY format', () => {
      const text = 'Tanggal: 25-12-2024';
      const result = extractTanggal(text);
      expect(result).toBe('2024-12-25');
    });

    it('should extract date in DD/MM/YYYY format', () => {
      const text = 'Date: 31/01/2025';
      const result = extractTanggal(text);
      expect(result).toBe('2025-01-31');
    });

    it('should return null if no date found', () => {
      const text = 'No date here';
      const result = extractTanggal(text);
      expect(result).toBeNull();
    });
  });

  describe('extractPerihal', () => {
    it('should extract perihal from labeled line', () => {
      const text = 'Perihal: Penawaran Harga Barang';
      const result = extractPerihal(text);
      expect(result).toBe('Penawaran Harga Barang');
    });

    it('should extract subject from English label', () => {
      const text = 'Subject: Request for Quotation';
      const result = extractPerihal(text);
      expect(result).toBe('Request for Quotation');
    });

    it('should detect document type when no perihal label', () => {
      const text = `PT ABC COMPANY
DISBURSEMENT ACCOUNT
Date: 01/01/2025`;
      const result = extractPerihal(text);
      expect(result).toBe('DISBURSEMENT ACCOUNT');
    });

    it('should detect INVOICE as document type', () => {
      const text = `PT XYZ
INVOICE
No: 001`;
      const result = extractPerihal(text);
      expect(result).toBe('INVOICE');
    });

    it('should return null if no perihal found', () => {
      const text = 'Just some random text';
      const result = extractPerihal(text);
      expect(result).toBeNull();
    });
  });

  describe('extractNominalList', () => {
    it('should extract nominal with Rp prefix', () => {
      const text = 'Total: Rp 1.500.000,00';
      const result = extractNominalList(text);
      expect(result.nominalList).toContain(1500000);
    });

    it('should extract nominal without Rp prefix at end of line', () => {
      const text = 'Harbour Dues 132.120,00';
      const result = extractNominalList(text);
      expect(result.nominalList).toContain(132120);
    });

    it('should calculate total nominal correctly', () => {
      const text = `Item 1 100.000,00
Item 2 200.000,00
Item 3 300.000,00`;
      const result = extractNominalList(text);
      expect(result.totalNominal).toBe(600000);
    });

    it('should handle decimal values', () => {
      const text = 'VAT 2.051.485,92';
      const result = extractNominalList(text);
      expect(result.nominalList).toContain(2051485.92);
    });

    it('should filter out small numbers (< 1000)', () => {
      const text = 'Quantity: 50 | Price: 100.000,00';
      const result = extractNominalList(text);
      expect(result.nominalList).not.toContain(50);
      expect(result.nominalList).toContain(100000);
    });
  });

  describe('extractNamaPengirim', () => {
    it('should extract company name with PT prefix', () => {
      const text = `PT BOSOWA BANDAR AGENSI
CABANG MAKASSAR
Jl. Contoh No. 123`;
      const result = extractNamaPengirim(text);
      expect(result.namaPengirim).toContain('PT BOSOWA');
      expect(result.confidence).toBe('high');
      expect(result.source).toBe('header');
    });

    it('should extract company name with CV prefix', () => {
      const text = `CV MAJU JAYA
Supplier Alat Tulis`;
      const result = extractNamaPengirim(text);
      expect(result.namaPengirim).toContain('CV MAJU JAYA');
    });

    it('should clean up special characters', () => {
      const text = `BOSOWA" PT BOSOWA BANDAR AGENSI
Homepage www.test.com`;
      const result = extractNamaPengirim(text);
      expect(result.namaPengirim).not.toContain('"');
    });

    it('should extract from signature if no header found', () => {
      const text = `Dear Sir,
Blah blah content here with many lines
More content lines without company names
Even more lines
Hormat kami,
PT COMPANY NAME
Director`;
      const result = extractNamaPengirim(text);
      expect(result.namaPengirim).toContain('PT COMPANY');
    });

    it('should exclude address lines', () => {
      const text = `Jl. Sudirman No. 123
PT ABC COMPANY`;
      const result = extractNamaPengirim(text);
      expect(result.namaPengirim).not.toContain('Jl.');
    });
  });
});
