import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/id';
import 'dayjs/locale/en';

dayjs.extend(customParseFormat);

const phonePattern = /(?:\+62|0)8\d{7,}/;
const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

const MONTH_NAMES = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
  'januari',
  'februari',
  'maret',
  'april',
  'mei',
  'juni',
  'juli',
  'agustus',
  'september',
  'oktober',
  'november',
  'desember',
  'jan',
  'feb',
  'mar',
  'apr',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
];
const SUPPORTED_DATE_FORMATS = [
  'DD-MM-YYYY',
  'D-M-YYYY',
  'DD/MM/YYYY',
  'D/M/YYYY',
  'YYYY-MM-DD',
  'DD MMM YYYY',
  'D MMM YYYY',
  'DD MMMM YYYY',
  'D MMMM YYYY',
  'DD-MMM-YYYY',
  'DD-MMM-YY',
  'D-MMM-YY',
  'DD MMM YY',
  'D MMM YY',
  'dddd, D MMMM YYYY',
];
const FUZZY_KEYWORDS = ['nomor', 'no', 'invoice', 'invoice no', 'no surat'];

const ENTITY_PREFIXES = [
  'PT',
  'PT.',
  'CV',
  'CV.',
  'UD',
  'UD.',
  'PD',
  'PD.',
  'YAYASAN',
  'KOPERASI',
  'PERUM',
  'PERSERO',
  'DINAS',
  'BADAN',
  'KANTOR',
  'KEMENTERIAN',
  'PEMERINTAH',
  'UNIVERSITAS',
  'INSTITUT',
  'POLITEKNIK',
  'SEKOLAH',
  'RS',
  'RSU',
  'RSUD',
  'RUMAH SAKIT',
  'BANK',
  'BPR',
  'BRI',
  'BNI',
  'BTN',
  'MANDIRI',
];

const EXCLUDED_SENDER_PATTERNS = [
  /^jl\.|^jln\.|^jalan/i,
  /^alamat/i,
  /^telp|^telepon|^phone|^hp\s*:/i,
  /^fax|^faximile/i,
  /^email|^e-mail/i,
  /^website|^www\./i,
  /^npwp/i,
  /^nomor|^no\s*:/i,
  /^perihal|^hal\s*:/i,
  /^kepada/i,
  /^tanggal/i,
  /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/,
];

const levenshtein = (a: string, b: string) => {
  const matrix = Array.from({ length: a.length + 1 }, () =>
    Array.from({ length: b.length + 1 }, () => 0),
  );

  for (let i = 0; i <= a.length; i++) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[a.length][b.length];
};

const normalizeKeywordContext = (text: string) =>
  text
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/[^\w\s/.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const hasFuzzyKeyword = (line: string) => {
  const tokens = normalizeKeywordContext(line).split(' ');

  return FUZZY_KEYWORDS.some((keyword) => {
    const keywordTokens = keyword.split(' ');
    return keywordTokens.every((kwToken) =>
      tokens.some(
        (token) => token.includes(kwToken) || levenshtein(token, kwToken) <= 2,
      ),
    );
  });
};

const parseDateCandidate = (candidate: string) => {
  const cleaned = candidate.replace(/[,]/g, ' ').replace(/\s+/g, ' ').trim();

  for (const locale of ['id', 'en']) {
    for (const format of SUPPORTED_DATE_FORMATS) {
      const parsed = dayjs(cleaned, format, locale, true);
      if (parsed.isValid()) {
        return parsed.format('YYYY-MM-DD');
      }
    }
  }

  return null;
};

export const extractLetterNumber = (text: string) => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const disallowed = [/telp/i, /hp/i, /phone/i, /fax/i];

  const candidatePatterns = [
    /[A-Z]{1,5}[-/][A-Z0-9]{1,10}[-/][A-Z0-9/-]+/gi,
    /[A-Z0-9]{2,}[/-][A-Z0-9/.-]+/gi,
    /\b\d{3,}[/-][A-Z]{1,5}[/-][IVXLCDM]+[/-]\d{2,4}\b/gi,
    /\bINV[-/]?\d{4}[-/]?\d{3,}/gi,
    /\bB[-/]\d+[-/][A-Z]+[-/]\d{4}/gi,
    /\b[A-Z]{2,4}\d{2,}[/-]\d{2,4}\b/gi,
  ];

  const candidates: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = lines[i + 1] || '';

    if (hasFuzzyKeyword(line) && !disallowed.some((rule) => rule.test(line))) {
      for (const pattern of candidatePatterns) {
        pattern.lastIndex = 0;
        let match = pattern.exec(line);
        while (match) {
          if (!phonePattern.test(match[0])) {
            candidates.push(match[0]);
          }
          match = pattern.exec(line);
        }
      }

      if (candidates.length === 0 && nextLine) {
        for (const pattern of candidatePatterns) {
          pattern.lastIndex = 0;
          let match = pattern.exec(nextLine);
          while (match) {
            if (!phonePattern.test(match[0])) {
              candidates.push(match[0]);
            }
            match = pattern.exec(nextLine);
          }
        }
      }
    }
  }

  if (candidates.length === 0) {
    for (const line of lines) {
      if (disallowed.some((rule) => rule.test(line))) continue;

      for (const pattern of candidatePatterns) {
        pattern.lastIndex = 0;
        let match = pattern.exec(line);
        while (match) {
          if (!phonePattern.test(match[0]) && match[0].length >= 5) {
            candidates.push(match[0]);
          }
          match = pattern.exec(line);
        }
      }
      if (candidates.length > 0) break;
    }
  }

  const containsMonthName = (str: string): boolean => {
    const lower = str.toLowerCase();
    return MONTH_NAMES.some(
      (month) =>
        lower.includes(month) ||
        levenshtein(lower.split(/[/-]/)[0], month) <= 2,
    );
  };

  const scored = candidates
    .filter((c) => !containsMonthName(c))
    .map((c) => {
      let score = 0;
      const segments = c.split(/[/-]/).filter(Boolean);
      if (segments.length >= 3) score += 5;
      else if (segments.length >= 2) score += 2;
      if (/\d{3,}/.test(c)) score += 2;
      if (/\d{4}/.test(c)) score += 1;
      if (/[IVXLCDM]{1,4}/.test(c)) score += 1;
      if (c.length >= 10) score += 2;
      else if (c.length >= 8) score += 1;
      if (/^[A-Z]/.test(c) && /\d/.test(c)) score += 1;
      return { value: c, score };
    });

  scored.sort((a, b) => b.score - a.score);

  const unique = Array.from(new Set(scored.map((s) => s.value)));

  const allCandidatesWithMonth = candidates.filter((c) => containsMonthName(c));
  const finalCandidates = [...unique, ...allCandidatesWithMonth].slice(0, 5);

  return {
    letterNumber: unique[0] ?? null,
    candidates: finalCandidates,
  };
};

export const extractTanggal = (text: string) => {
  const normalized = text.replace(/\r/g, '');

  const datePatterns = [
    /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g,
    /\b\d{4}[/-]\d{1,2}[/-]\d{1,2}\b/g,
    /\b\d{1,2}\s+[A-Za-z.]{3,9}\s+\d{2,4}\b/gi,
    /\b\w+,\s*\d{1,2}\s+[A-Za-z.]{3,9}\s+\d{2,4}\b/gi,
    /\b\d{1,2}[/-][A-Za-z.]{3,9}[/-]\d{2,4}\b/gi,
  ];

  for (const pattern of datePatterns) {
    const matches = normalized.match(pattern);
    if (matches) {
      for (const raw of matches) {
        const parsed = parseDateCandidate(raw);
        if (parsed) {
          return parsed;
        }
      }
    }
  }

  return null;
};

export const extractPerihal = (text: string) => {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const perihalPattern = /^(perihal|subject|re|hal)\s*:?\s*(.*)$/i;

  for (const raw of lines) {
    const match = raw.match(perihalPattern);
    if (match && match[2]?.trim()) {
      return match[2].trim();
    }
  }

  const documentTypes = [
    'DISBURSEMENT ACCOUNT',
    'PROFORMA DISBURSEMENT',
    'INVOICE',
    'SURAT PENAWARAN',
    'SURAT PEMBERITAHUAN',
    'SURAT KETERANGAN',
    'SURAT TUGAS',
    'SURAT PERINTAH',
    'BERITA ACARA',
    'LAPORAN',
    'QUOTATION',
    'PURCHASE ORDER',
    'DELIVERY ORDER',
    'BILLING STATEMENT',
  ];

  for (const line of lines.slice(0, 15)) {
    const upperLine = line.toUpperCase();
    for (const docType of documentTypes) {
      if (upperLine.includes(docType)) {
        return docType;
      }
    }
  }

  return null;
};

export const extractNominalList = (text: string) => {
  const nominalList: number[] = [];
  const seen = new Set<number>();

  const bankAccountPatterns = [
    /rekening|account|a\/c|no\.?\s*rek|bank/i,
    /swift|iban|bic/i,
    /in\s*favour/i,
  ];

  const isBankAccountLine = (line: string): boolean => {
    return bankAccountPatterns.some((pattern) => pattern.test(line));
  };

  const addNominal = (value: number) => {
    if (!Number.isNaN(value) && value >= 1000 && !seen.has(value)) {
      seen.add(value);
      nominalList.push(value);
    }
  };

  const parseIndonesianNumber = (raw: string): number => {
    let normalized = raw.trim();
    if (/^\d{1,3}(\.\d{3})+(,\d{2})?$/.test(normalized)) {
      normalized = normalized.replace(/\./g, '').replace(',', '.');
    } else if (/^\d{1,3}(\.\d{3})+(\.\d{2})?$/.test(normalized)) {
      const parts = normalized.split('.');
      if (parts.length > 1 && parts[parts.length - 1].length === 2) {
        const decimal = parts.pop();
        normalized = parts.join('') + '.' + decimal;
      } else {
        normalized = normalized.replace(/\./g, '');
      }
    } else {
      normalized = normalized.replace(/\./g, '').replace(',', '.');
    }
    return parseFloat(normalized);
  };

  const rpRegex = /Rp\.?\s*([\d.,]+)/gi;
  let match = rpRegex.exec(text);
  while (match) {
    addNominal(parseIndonesianNumber(match[1]));
    match = rpRegex.exec(text);
  }

  const lines = text.split(/\r?\n/);
  const lineEndNumberRegex = /(\d{1,3}(?:\.\d{3})+(?:[.,]\d{2})?)\s*$/;

  for (const line of lines) {
    if (isBankAccountLine(line)) continue;

    const lineMatch = line.match(lineEndNumberRegex);
    if (lineMatch) {
      addNominal(parseIndonesianNumber(lineMatch[1]));
    }
  }

  const totalNominal = nominalList.reduce((acc, val) => acc + val, 0);
  return { nominalList, totalNominal };
};

const isExcludedSenderLine = (line: string): boolean => {
  const trimmed = line.trim();
  if (trimmed.length < 3) return true;
  if (phonePattern.test(trimmed)) return true;
  if (emailPattern.test(trimmed)) return true;
  return EXCLUDED_SENDER_PATTERNS.some((pattern) => pattern.test(trimmed));
};

const hasEntityPrefix = (line: string): boolean => {
  const upper = line.toUpperCase().trim();
  return ENTITY_PREFIXES.some(
    (prefix) =>
      upper.startsWith(prefix + ' ') ||
      upper.startsWith(prefix) ||
      upper === prefix,
  );
};

const isLikelyCompanyName = (line: string): boolean => {
  const trimmed = line.trim();
  if (trimmed.length < 5 || trimmed.length > 100) return false;

  const upperRatio =
    (trimmed.match(/[A-Z]/g)?.length || 0) / trimmed.replace(/\s/g, '').length;
  if (upperRatio > 0.6) return true;

  if (hasEntityPrefix(trimmed)) return true;

  if (/^[A-Z][a-z]+(\s+[A-Z][a-z]+)+$/.test(trimmed)) return true;

  return false;
};

const extractFromSignature = (text: string): string | null => {
  const lines = text.split(/\r?\n/).map((l) => l.trim());

  const signatureKeywords = [
    /^hormat\s*(kami|saya)/i,
    /^salam\s*(hormat|hangat)/i,
    /^tertanda/i,
    /^ttd\.?$/i,
    /^atas\s*nama/i,
    /^a\.?n\.?\s/i,
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (signatureKeywords.some((kw) => kw.test(line))) {
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const candidate = lines[j];
        if (
          candidate &&
          candidate.length >= 3 &&
          !isExcludedSenderLine(candidate) &&
          (hasEntityPrefix(candidate) || isLikelyCompanyName(candidate))
        ) {
          return candidate;
        }
      }
    }
  }

  return null;
};

export const extractNamaPengirim = (
  text: string,
): {
  namaPengirim: string | null;
  confidence: 'high' | 'medium' | 'low';
  source: 'header' | 'signature' | null;
} => {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const headerLines = lines.slice(0, 8);
  const headerCandidates: { line: string; score: number }[] = [];

  for (let i = 0; i < headerLines.length; i++) {
    const line = headerLines[i];

    if (isExcludedSenderLine(line)) continue;

    let score = 0;

    if (hasEntityPrefix(line)) {
      score += 10;
    }

    if (isLikelyCompanyName(line)) {
      score += 5;
    }

    if (i < 3) {
      score += 3 - i;
    }

    if (line.length >= 10 && line.length <= 60) {
      score += 2;
    }

    if (score > 0) {
      headerCandidates.push({ line, score });
    }
  }

  headerCandidates.sort((a, b) => b.score - a.score);

  const cleanSenderName = (name: string): string => {
    return name
      .replace(/^["'`]+|["'`]+$/g, '')
      .replace(/["'`\\]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  if (headerCandidates.length > 0 && headerCandidates[0].score >= 8) {
    return {
      namaPengirim: cleanSenderName(headerCandidates[0].line),
      confidence: 'high',
      source: 'header',
    };
  }

  const signatureName = extractFromSignature(text);
  if (signatureName) {
    return {
      namaPengirim: cleanSenderName(signatureName),
      confidence: 'medium',
      source: 'signature',
    };
  }

  if (headerCandidates.length > 0) {
    return {
      namaPengirim: cleanSenderName(headerCandidates[0].line),
      confidence: headerCandidates[0].score >= 5 ? 'medium' : 'low',
      source: 'header',
    };
  }

  return {
    namaPengirim: null,
    confidence: 'low',
    source: null,
  };
};

export const calculateOcrConfidence = (params: {
  letterNumber: string | null;
  tanggalSurat: string | null;
  namaPengirim: string | null;
  senderConfidence: 'high' | 'medium' | 'low';
  perihal: string | null;
  totalNominal: number;
  ocrRawText: string;
}): {
  overallScore: number;
  overallConfidence: 'high' | 'medium' | 'low';
  details: {
    letterNumber: number;
    tanggalSurat: number;
    namaPengirim: number;
    perihal: number;
    textQuality: number;
  };
} => {
  const scores = {
    letterNumber: params.letterNumber ? 25 : 0,
    tanggalSurat: params.tanggalSurat ? 20 : 0,
    namaPengirim:
      params.senderConfidence === 'high'
        ? 25
        : params.senderConfidence === 'medium'
          ? 15
          : params.namaPengirim
            ? 5
            : 0,
    perihal: params.perihal ? 15 : 0,
    textQuality: 0,
  };

  const text = params.ocrRawText;
  const totalChars = text.length;
  const alphanumericChars = (text.match(/[a-zA-Z0-9]/g) || []).length;
  const ratio = totalChars > 0 ? alphanumericChars / totalChars : 0;

  if (ratio > 0.5) scores.textQuality = 15;
  else if (ratio > 0.3) scores.textQuality = 10;
  else if (ratio > 0.1) scores.textQuality = 5;

  const overallScore =
    scores.letterNumber +
    scores.tanggalSurat +
    scores.namaPengirim +
    scores.perihal +
    scores.textQuality;

  const overallConfidence: 'high' | 'medium' | 'low' =
    overallScore >= 70 ? 'high' : overallScore >= 40 ? 'medium' : 'low';

  return {
    overallScore,
    overallConfidence,
    details: scores,
  };
};
