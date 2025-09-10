export function extractIdentifierFromText(text: string): string | undefined {
  const match = text.match(/\+?\d{8,15}/);
  return match ? match[0] : undefined;
}

export function extractPrefixFromText(text: string): string | undefined {
  const match = text.match(/\+?\d{3,7}/);
  return match ? match[0] : undefined;
}

