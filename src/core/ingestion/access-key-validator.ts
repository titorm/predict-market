export function extractAccessKey(input: string): string | null {
  const cleaned = input.replace(/\s+/g, '');
  if (/^[0-9]{44}$/.test(cleaned)) return cleaned;

  const match = cleaned.match(/(?:chNFe=|p=|chave=)([0-9]{44})/i) ?? cleaned.match(/([0-9]{44})/);
  return match ? match[1] : null;
}

export function isValidAccessKey(input: string): boolean {
  return extractAccessKey(input) !== null;
}
