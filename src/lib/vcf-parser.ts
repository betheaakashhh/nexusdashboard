// src/lib/vcf-parser.ts

export interface ParsedContact {
  name: string;
  phone: string;
  email?: string;
}

export function parseVCF(content: string): ParsedContact[] {
  const contacts: ParsedContact[] = [];
  const cards = content.split(/BEGIN:VCARD/i).filter(Boolean);

  for (const card of cards) {
    const nameMatch = card.match(/^FN:(.+)$/m);
    const nMatch = card.match(/^N:([^;\n\r]+)/m);
    const telMatches = card.match(/^TEL[^\n]*:(.+)$/gm);
    const emailMatch = card.match(/^EMAIL[^\n]*:(.+)$/m);

    // Prefer FN (formatted name), fallback to N (structured name)
    let name = 'Unknown';
    if (nameMatch) {
      name = nameMatch[1].trim().replace(/\r/g, '');
    } else if (nMatch) {
      const parts = nMatch[1].split(';').filter(Boolean);
      name = parts.reverse().join(' ').trim();
    }

    const email = emailMatch ? emailMatch[1].trim().replace(/\r/g, '') : undefined;

    if (telMatches) {
      for (const telLine of telMatches) {
        const phone = telLine.replace(/^TEL[^:]*:/i, '').trim().replace(/\r/g, '');
        if (phone) {
          contacts.push({ name, phone, email });
          break; // take first number per contact
        }
      }
    }
  }

  return contacts;
}

export function parseContactCSV(content: string): ParsedContact[] {
  const lines = content.split('\n');
  const results: ParsedContact[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle quoted CSV fields
    const parts = line.match(/(".*?"|[^,]+)(?=,|$)/g) || line.split(',');
    const clean = (s: string) => (s || '').trim().replace(/^"|"$/g, '');

    const name = clean(parts[0]);
    const phone = clean(parts[1]);
    const email = clean(parts[2]);

    if (phone) {
      results.push({ name: name || 'Unknown', phone, email: email || undefined });
    }
  }

  return results;
}

export function parseEmailCSV(content: string) {
  const lines = content.split('\n');
  const results: Array<{ name: string; email: string; subject?: string; body?: string }> = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.match(/(".*?"|[^,]+)(?=,|$)/g) || line.split(',');
    const clean = (s: string) => (s || '').trim().replace(/^"|"$/g, '');

    const name = clean(parts[0]);
    const email = clean(parts[1]);
    const subject = clean(parts[2]);
    const body = clean(parts[3]);

    if (email) {
      results.push({ name: name || email, email, subject, body });
    }
  }

  return results;
}
