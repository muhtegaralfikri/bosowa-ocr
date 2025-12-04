const phonePattern = /(?:\+62|0)8\d{7,}/;

export const extractLetterNumber = (text: string) => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const disallowed = [/telp/i, /hp/i, /phone/i];
  const keywordPattern = /(invoice\s*no|nomor|no\.?)/i;
  const candidatePattern = /[A-Z0-9]{2,}[/-][A-Z0-9/.-]+/i;

  const candidates = lines
    .filter((line) => keywordPattern.test(line))
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
    /\b\d{1,2}[/-]\d{1,2}[/-]\d{4}\b/,
    /\b\d{1,2}\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+\d{4}\b/i,
    /\b\w+,\s*\d{1,2}\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+\d{4}\b/i,
  ];

  for (const pattern of datePatterns) {
    const match = normalized.match(pattern);
    if (match) {
      return match[0].trim();
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
