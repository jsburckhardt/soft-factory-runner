#!/usr/bin/env node

export const projectName = "Soft Factory Runner";

export function main(): void {
  process.stdout.write(
    `${projectName} is bootstrapped. Product commands will be delivered through RPIV.\n`,
  );
}

/* istanbul ignore next -- the built executable is covered by the command smoke check */
if (require.main === module) {
  main();
}
