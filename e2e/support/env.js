import { existsSync, readFileSync } from 'node:fs';

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};

  return Object.fromEntries(
    readFileSync(filePath, 'utf8')
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const separator = line.indexOf('=');
        return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
      }),
  );
}

export function loadE2EEnvironment(rootDir) {
  const fileValues = parseEnvFile(`${rootDir}\\.env.e2e.local`);
  return {
    email: process.env.E2E_EMAIL || fileValues.E2E_EMAIL || '',
    password: process.env.E2E_PASSWORD || fileValues.E2E_PASSWORD || '',
    displayName: process.env.E2E_DISPLAY_NAME || fileValues.E2E_DISPLAY_NAME || 'Phera QA',
    partnerOne: process.env.E2E_PARTNER_ONE || fileValues.E2E_PARTNER_ONE || 'Priya QA',
    partnerTwo: process.env.E2E_PARTNER_TWO || fileValues.E2E_PARTNER_TWO || 'Arjun QA',
  };
}
