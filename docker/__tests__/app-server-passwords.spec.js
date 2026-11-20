/**
 * Environment-only credentials of app-server.js, in configurations that differ from
 * the main suite (which runs with a sign-in password, an editor password and an HA
 * connection):
 * - sign-in password only: everyone who signs in may edit
 * - HA connection: from HA_URL / HA_ACCESS_TOKEN only, never from or into the file
 * - session lifetime and persistence
 * - startup validation: required variables, and credentials left in the file
 */

import { describe, it, expect, afterEach, vi } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import request from "supertest";

const dirs = [];
const ENV_KEYS = [
  "EDITOR_PASSWORD",
  "VIEWER_PASSWORD",
  "HA_URL",
  "HA_ACCESS_TOKEN",
  "SESSION_DAYS",
];
const HA_ENV = {
  HA_URL: "https://ha.env.example:8123",
  HA_ACCESS_TOKEN: "env-token-value",
};

// The server loads the developer's real .env via dotenv, which never overrides a
// variable that is already defined: define all of them (empty) so tests stay hermetic.
function setEnv(env) {
  for (const key of ENV_KEYS) process.env[key] = "";
  Object.assign(process.env, env);
}

// Simulates a restart of the server against the same data directory.
async function restartServer(env = {}) {
  process.env.DATA_DIR = dirs[dirs.length - 1];
  setEnv({ ...HA_ENV, ...env });
  vi.resetModules();
  return (await import("../app-server.js")).default;
}

const cookieOf = (response) => response.headers["set-cookie"][0];
const tokenOf = (response) =>
  /ha_dashboard_session=([^;]+)/.exec(cookieOf(response))[1];

/**
 * @param app      the "app" section of the config file
 * @param env      environment variables (HA_URL / HA_ACCESS_TOKEN are filled in
 *                 unless overridden)
 * @param extra    additional top-level keys in the config file (e.g. a leftover haConfig)
 */
async function startServer(app = {}, env = {}, extra = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ha-dashboard-pw-"));
  dirs.push(dir);
  fs.writeFileSync(
    path.join(dir, "dashboard-config.json"),
    JSON.stringify({
      app,
      views: [{ name: "overview", label: "Overview", entities: [] }],
      ...extra,
    }),
  );
  process.env.DATA_DIR = dir;
  setEnv({ ...HA_ENV, ...env });
  vi.resetModules();
  return (await import("../app-server.js")).default;
}

const login = (app, password) =>
  request(app).post("/api/session/login").send({ password });
const storedFile = () =>
  fs.readFileSync(
    path.join(dirs[dirs.length - 1], "dashboard-config.json"),
    "utf-8",
  );

afterEach(() => {
  delete process.env.DATA_DIR;
  for (const key of ENV_KEYS) delete process.env[key];
  vi.restoreAllMocks();
  while (dirs.length) fs.rmSync(dirs.pop(), { recursive: true, force: true });
});

describe("sign-in password only (no editor password)", () => {
  const env = { VIEWER_PASSWORD: "login-password-1" };

  it("signs in with edit rights because nothing separate protects editing", async () => {
    const app = await startServer({}, env);

    const response = await login(app, "login-password-1");
    expect(response.status).toBe(200);
    expect(response.body.role).toBe("editor");

    const save = await request(app)
      .post("/api/config")
      .set("Cookie", response.headers["set-cookie"])
      .send({ views: [{ name: "a", label: "A", entities: [] }] });
    expect(save.status).toBe(200);
  });

  it("still rejects a wrong password", async () => {
    const app = await startServer({}, env);
    expect((await login(app, "nope")).status).toBe(401);
  });
});

describe("both passwords configured", () => {
  it("makes the sign-in password read-only and the editor password edit", async () => {
    const app = await startServer(
      {},
      {
        VIEWER_PASSWORD: "login-password-1",
        EDITOR_PASSWORD: "editor-password-1",
      },
    );
    const viewer = await login(app, "login-password-1");
    const editor = await login(app, "editor-password-1");

    expect(viewer.body.role).toBe("viewer");
    expect(editor.body.role).toBe("editor");
  });
});

describe("Home Assistant connection (environment only)", () => {
  const env = { VIEWER_PASSWORD: "login-password-1" };
  const signIn = async (app) =>
    (await login(app, "login-password-1")).headers["set-cookie"];

  it("serves the environment values to signed-in users", async () => {
    const app = await startServer({}, env);
    const cookie = await signIn(app);

    const response = await request(app)
      .get("/api/config")
      .set("Cookie", cookie);

    expect(response.body.data.haConfig).toEqual({
      haUrl: "https://ha.env.example:8123",
      accessToken: "env-token-value",
    });
  });

  it("ignores a haConfig and passwords left in the config file", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const app = await startServer(
      { password: "file-editor-pw", viewerPassword: "file-viewer-pw" },
      env,
      {
        haConfig: { haUrl: "https://file.example", accessToken: "file-token" },
      },
    );
    const cookie = await signIn(app);

    const response = await request(app)
      .get("/api/config")
      .set("Cookie", cookie);
    const body = JSON.stringify(response.body);

    expect(response.body.data.haConfig.accessToken).toBe("env-token-value");
    for (const leftover of ["file-token", "file.example", "file-editor-pw"]) {
      expect(body).not.toContain(leftover);
    }
    // The file's passwords are not accepted either.
    expect((await login(app, "file-viewer-pw")).status).toBe(401);
    expect((await login(app, "file-editor-pw")).status).toBe(401);
  });

  it("warns at startup about credentials left in the file, without printing them", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await startServer({ password: "file-editor-pw" }, env, {
      haConfig: { haUrl: "https://file.example", accessToken: "file-token" },
    });

    const message = warn.mock.calls.map((call) => call.join(" ")).join("\n");
    expect(message).toContain("app.password");
    expect(message).toContain("haConfig");
    expect(message).not.toContain("file-editor-pw");
    expect(message).not.toContain("file-token");
  });

  it("never writes credentials into the config file when saving", async () => {
    const app = await startServer({}, env);
    const cookie = await signIn(app);

    const save = await request(app)
      .post("/api/config")
      .set("Cookie", cookie)
      .send({
        haConfig: {
          haUrl: "https://client.example",
          accessToken: "from-client",
        },
        views: [{ name: "a", label: "A", entities: [] }],
      });
    expect(save.status).toBe(200);

    const stored = storedFile();
    for (const secret of ["from-client", "client.example", "env-token-value"]) {
      expect(stored).not.toContain(secret);
    }
    const after = await request(app).get("/api/config").set("Cookie", cookie);
    expect(after.body.data.haConfig.accessToken).toBe("env-token-value");
  });

  it("removes leftovers from the file on the next save", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const app = await startServer({ password: "file-editor-pw" }, env, {
      haConfig: { haUrl: "https://file.example", accessToken: "file-token" },
    });
    const cookie = await signIn(app);
    const current = (
      await request(app).get("/api/config").set("Cookie", cookie)
    ).body.data;

    await request(app).post("/api/config").set("Cookie", cookie).send(current);

    const stored = storedFile();
    expect(stored).not.toContain("file-editor-pw");
    expect(stored).not.toContain("file-token");
  });

  it("does not bring credentials back when restoring an old backup", async () => {
    const app = await startServer({}, env);
    const cookie = await signIn(app);
    fs.writeFileSync(
      path.join(
        dirs[dirs.length - 1],
        "backups",
        "dashboard-config.json.backup.5.json",
      ),
      JSON.stringify({
        app: { password: "old-password" },
        haConfig: { haUrl: "https://old.example", accessToken: "old-token" },
        views: [{ name: "old", label: "Old", entities: [] }],
      }),
    );

    const restore = await request(app)
      .post("/api/config/restore")
      .set("Cookie", cookie)
      .send({ sequence: 5 });

    expect(restore.status).toBe(200);
    const stored = storedFile();
    for (const secret of ["old-token", "old.example", "old-password"]) {
      expect(stored).not.toContain(secret);
    }
    expect(JSON.parse(stored).views[0].name).toBe("old");
  });

  it("is required unless the dashboard runs in local-data mode", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`exit:${code}`);
    });

    await expect(
      startServer({}, { ...env, HA_URL: "", HA_ACCESS_TOKEN: "" }),
    ).rejects.toThrow("exit:1");
    await expect(
      startServer({}, { ...env, HA_ACCESS_TOKEN: "" }),
    ).rejects.toThrow("exit:1");

    // Local-data mode never talks to Home Assistant.
    const app = await startServer(
      { localMode: true },
      { ...env, HA_URL: "", HA_ACCESS_TOKEN: "" },
    );
    const cookie = await signIn(app);
    const response = await request(app)
      .get("/api/config")
      .set("Cookie", cookie);
    expect(response.status).toBe(200);
    expect(response.body.data.haConfig).toBeUndefined();
  });

  it("must be an http(s) URL", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`exit:${code}`);
    });

    for (const bad of ["ha.local:8123", "ftp://ha.local", "not a url"]) {
      await expect(startServer({}, { ...env, HA_URL: bad })).rejects.toThrow(
        "exit:1",
      );
    }
  });
});

describe("session lifetime (SESSION_DAYS)", () => {
  const base = { VIEWER_PASSWORD: "login-password-1" };
  const maxAge = async (env) => {
    const app = await startServer({}, { ...base, ...env });
    const response = await login(app, "login-password-1");
    return Number(/Max-Age=(\d+)/.exec(cookieOf(response))[1]);
  };
  const DAY = 24 * 60 * 60;

  it("defaults to 30 days", async () => {
    expect(await maxAge({})).toBe(30 * DAY);
  });

  it("can be set in days", async () => {
    expect(await maxAge({ SESSION_DAYS: "7" })).toBe(7 * DAY);
  });

  it("falls back to 30 days for an invalid value and warns", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await maxAge({ SESSION_DAYS: "abc" })).toBe(30 * DAY);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("Ignoring invalid SESSION_DAYS"),
    );
  });

  it("is capped at 365 days", async () => {
    expect(await maxAge({ SESSION_DAYS: "1000" })).toBe(365 * DAY);
  });
});

describe("sessions across restarts", () => {
  const env = { VIEWER_PASSWORD: "login-password-1" };
  const sessionsFile = () => path.join(dirs[dirs.length - 1], "sessions.json");
  const getConfig = (app, cookie) =>
    request(app).get("/api/config").set("Cookie", cookie);

  it("stay signed in after the server restarts", async () => {
    const app = await startServer({}, env);
    const cookie = cookieOf(await login(app, "login-password-1"));

    const restarted = await restartServer(env);

    expect((await getConfig(restarted, cookie)).status).toBe(200);
  });

  it("never store the session id itself, only its hash", async () => {
    const app = await startServer({}, env);
    const response = await login(app, "login-password-1");

    const stored = fs.readFileSync(sessionsFile(), "utf-8");
    expect(stored).not.toContain(tokenOf(response));
    expect(Object.keys(JSON.parse(stored))).toHaveLength(1);
    expect((fs.statSync(sessionsFile()).mode & 0o777).toString(8)).toBe("600");
  });

  it("are signed out when a password is changed", async () => {
    const app = await startServer({}, env);
    const cookie = cookieOf(await login(app, "login-password-1"));

    const restarted = await restartServer({
      VIEWER_PASSWORD: "changed-pass-2",
    });

    expect((await getConfig(restarted, cookie)).status).toBe(401);
  });

  it("are gone after logging out", async () => {
    const app = await startServer({}, env);
    const cookie = cookieOf(await login(app, "login-password-1"));
    await request(app).post("/api/session/logout").set("Cookie", cookie);

    const restarted = await restartServer(env);

    expect((await getConfig(restarted, cookie)).status).toBe(401);
  });

  it("are not restored once they have expired", async () => {
    const app = await startServer({}, env);
    const cookie = cookieOf(await login(app, "login-password-1"));
    const stored = JSON.parse(fs.readFileSync(sessionsFile(), "utf-8"));
    for (const session of Object.values(stored))
      session.expiresAt = Date.now() - 1;
    fs.writeFileSync(sessionsFile(), JSON.stringify(stored));

    const restarted = await restartServer(env);

    expect((await getConfig(restarted, cookie)).status).toBe(401);
  });

  it("start fresh when the sessions file is corrupt", async () => {
    const app = await startServer({}, env);
    const cookie = cookieOf(await login(app, "login-password-1"));
    fs.writeFileSync(sessionsFile(), "{not json");

    const restarted = await restartServer(env);

    expect((await getConfig(restarted, cookie)).status).toBe(401);
    expect((await login(restarted, "login-password-1")).status).toBe(200);
  });
});

describe("startup validation", () => {
  const exitOnStart = async (app, env = {}) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`exit:${code}`);
    });
    await expect(startServer(app, env)).rejects.toThrow("exit:1");
  };

  it.each(["production", "development", "test"])(
    "refuses to start without a sign-in password (NODE_ENV=%s)",
    async (nodeEnv) => {
      const original = process.env.NODE_ENV;
      process.env.NODE_ENV = nodeEnv;
      try {
        // An editor password alone is not enough: sign-in is required.
        await exitOnStart({}, { EDITOR_PASSWORD: "editor-password-1" });
        await exitOnStart({});
      } finally {
        process.env.NODE_ENV = original;
      }
    },
  );

  it("does not accept sign-in passwords from the config file", async () => {
    await exitOnStart({
      viewerPassword: "file-viewer-pw",
      password: "file-editor-pw",
    });
  });

  it("refuses identical sign-in and editor passwords", async () => {
    await exitOnStart(
      {},
      {
        VIEWER_PASSWORD: "same-password-1",
        EDITOR_PASSWORD: "same-password-1",
      },
    );
  });
});
