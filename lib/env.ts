export function readEnv(upperName: string) {
  return process.env[upperName] ?? process.env[upperName.toLowerCase()];
}
