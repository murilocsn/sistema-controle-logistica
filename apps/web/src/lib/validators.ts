export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function normalizePlate(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export function isValidPlate(value: string) {
  return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(normalizePlate(value));
}

export function isValidCpf(value: string) {
  return onlyDigits(value).length === 11;
}

export function isValidCnpj(value: string) {
  return onlyDigits(value).length === 14;
}

export function isValidEmail(value: string) {
  if (!value.trim()) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function normalizeState(value: string) {
  return value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 2);
}

export function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseOptionalNumber(value: string, fieldLabel: string) {
  const normalized = value.trim().replace(",", ".");

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${fieldLabel} deve ser um numero positivo.`);
  }

  return parsed;
}

export function parseOptionalInteger(value: string, fieldLabel: string) {
  const parsed = parseOptionalNumber(value, fieldLabel);

  if (parsed === null) {
    return null;
  }

  if (!Number.isInteger(parsed)) {
    throw new Error(`${fieldLabel} deve ser um numero inteiro.`);
  }

  return parsed;
}
