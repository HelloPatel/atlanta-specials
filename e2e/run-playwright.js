import { existsSync, readdirSync } from 'node:fs';
import { delimiter, dirname, join } from 'node:path';
import { spawn } from 'node:child_process';
import { createConnection } from 'node:net';

function findPortableJava() {
  const javaRoot = join(process.cwd(), '.playwright', 'java');
  if (!existsSync(javaRoot)) return '';

  const executable = process.platform === 'win32' ? 'java.exe' : 'java';
  const match = readdirSync(javaRoot, { recursive: true })
    .find((entry) => String(entry).endsWith(join('bin', executable)));
  return match ? join(javaRoot, String(match)) : '';
}

function quote(argument) {
  return `"${String(argument).replace(/"/g, '\\"')}"`;
}

const environment = { ...process.env };
const portableJava = findPortableJava();
if (portableJava) {
  environment.JAVA_HOME = dirname(dirname(portableJava));
  environment.PATH = `${dirname(portableJava)}${delimiter}${environment.PATH || ''}`;
}

const firebaseCli = join(
  process.cwd(),
  'node_modules',
  'firebase-tools',
  'lib',
  'bin',
  'firebase.js',
);
const playwrightCli = join(
  process.cwd(),
  'node_modules',
  '@playwright',
  'test',
  'cli.js',
);
const viteCli = join(
  process.cwd(),
  'node_modules',
  'vite',
  'bin',
  'vite.js',
);
const vitePort = Number(environment.E2E_PORT || 5173);
const playwrightArguments = process.argv.slice(2).map(quote).join(' ');
const testCommand = [
  quote(process.execPath),
  quote(playwrightCli),
  'test',
  playwrightArguments,
].filter(Boolean).join(' ');

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = createConnection({ host: '127.0.0.1', port });
    const finish = (open) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(open);
    };

    socket.setTimeout(750);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

function run(command, args, env) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      env,
      stdio: 'inherit',
    });

    child.once('exit', (code) => resolve(code ?? 1));
    child.once('error', () => resolve(1));
  });
}

async function waitForPort(port, timeout = 30_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await isPortOpen(port)) return true;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return false;
}

async function emulatorsAreRunning() {
  const [authReady, firestoreReady] = await Promise.all([
    isPortOpen(9099),
    isPortOpen(8080),
  ]);
  return authReady && firestoreReady;
}

const emulatorEnvironment = {
  ...environment,
  VITE_USE_FIREBASE_EMULATORS: 'true',
  GCLOUD_PROJECT: 'demo-phera',
  FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
  FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
};

async function startManagedVite() {
  if (await isPortOpen(vitePort)) return null;

  const child = spawn(
    process.execPath,
    [viteCli, '--port', String(vitePort), '--strictPort', '--mode', 'e2e'],
    {
      env: emulatorEnvironment,
      stdio: 'inherit',
    },
  );

  if (!await waitForPort(vitePort)) {
    child.kill();
    throw new Error(`Vite did not start on port ${vitePort}.`);
  }

  return child;
}

async function stopManagedVite(child) {
  if (!child || child.exitCode !== null) return;
  child.kill();
  await Promise.race([
    new Promise((resolve) => child.once('exit', resolve)),
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);
}

async function runPlaywrightAgainstExistingEmulators() {
  return run(
    process.execPath,
    [playwrightCli, 'test', ...process.argv.slice(2)],
    emulatorEnvironment,
  );
}

async function main() {
  const managedVite = await startManagedVite();
  try {
    if (await emulatorsAreRunning()) {
      console.log('Reusing Firebase emulators on ports 9099 and 8080.');
      process.exitCode = await runPlaywrightAgainstExistingEmulators();
      return;
    }

    const exitCode = await run(
      process.execPath,
      [
        firebaseCli,
        'emulators:exec',
        '--only',
        'auth,firestore',
        '--project',
        'demo-phera',
        testCommand,
      ],
      environment,
    );

    if (exitCode !== 0 && await emulatorsAreRunning()) {
      console.log('Firebase startup left healthy emulators running; retrying Playwright directly.');
      process.exitCode = await runPlaywrightAgainstExistingEmulators();
      return;
    }

    process.exitCode = exitCode;
  } finally {
    await stopManagedVite(managedVite);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
