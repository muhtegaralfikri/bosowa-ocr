import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/id';

dayjs.extend(customParseFormat);
dayjs.locale('id');

const phonePattern = /(?:\+62|0)8\d{7,}/;
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

  for (const format of SUPPORTED_DATE_FORMATS) {
    const parsed = dayjs(cleaned, format, 'id', true);
    if (parsed.isValid()) {
      return parsed.format('YYYY-MM-DD');
    }
  }

  return null;
};

export const extractLetterNumber = (text: string) => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const disallowed = [/telp/i, /hp/i, /phone/i];
  const candidatePattern = /[A-Z0-9]{2,}[/-][A-Z0-9/.-]+/i;

  const candidates = lines
    .filter((line) => hasFuzzyKeyword(line))
    .filter((line) => !disallowed.some((rule) => rule.test(line)))
    .map((line) => line.replace(/[:\s]+/g, ' ').trim())
    .map((line) => {
      const match = line.match(candidatePattern);
      return match ? match[0] : null;
    })
    .filter((line): line is string => !!line)
    .filter((line) => !phonePattern.test(line));

  const unique = Array.from(new Set(candidates));

  return {
    letterNumber: unique[0] ?? null,
    candidates: unique,
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
  const lines = text.split(/\r?\n/);
  const perihalPattern = /^(perihal|subject|re)\s*:?\s*(.*)$/i;

  for (const raw of lines) {
    const match = raw.match(perihalPattern);
    if (match) {
      return match[2]?.trim() || null;
    }
  }

  return null;
};

export const extractNominalList = (text: string) => {
  const regex = /Rp\.?\s*([\d.,]+)/gi;
  const nominalList: number[] = [];

  let match = regex.exec(text);
  while (match) {
    const raw = match[1];
    const normalized = raw.replace(/\./g, '').replace(',', '.');
    const value = parseFloat(normalized);
    if (!Number.isNaN(value)) {
      nominalList.push(value);
    }
    match = regex.exec(text);
  }

  const totalNominal = nominalList.reduce((acc, val) => acc + val, 0);
  return { nominalList, totalNominal };
};
