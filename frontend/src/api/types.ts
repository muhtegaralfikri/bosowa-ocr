export interface OcrPreviewResponse {
  letterNumber: string | null;
  candidates: string[];
  tanggalSurat: string | null;
  namaPengirim: string | null;
  perihal: string | null;
  nominalList: number[];
  totalNominal: number;
  ocrRawText: string;
}

export interface Letter {
  id: string;
  letterNumber: string;
  jenisSurat: 'MASUK' | 'KELUAR';
  jenisDokumen: 'SURAT' | 'INVOICE';
  tanggalSurat: string;
  namaPengirim?: string | null;
  alamatPengirim?: string | null;
  teleponPengirim?: string | null;
  perihal?: string | null;
  totalNominal: number;
  fileUrl?: string | null;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pageCount: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
