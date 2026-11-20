#!/usr/bin/env node
// Usage: node docker/hash-password.js '<password>'
// Prints a value for app.password in dashboard-config.json (or EDITOR_PASSWORD)
// that stores a scrypt hash instead of the plain-text password.
import { randomBytes, scryptSync } from "crypto";

const password = process.argv[2];
if (!password) {
  console.error("Usage: node docker/hash-password.js '<password>'");
  process.exit(1);
}
const salt = randomBytes(16);
console.log(
  `scrypt$${salt.toString("hex")}$${scryptSync(password, salt, 32).toString("hex")}`,
);
