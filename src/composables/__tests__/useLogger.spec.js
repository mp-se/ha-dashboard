import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useLogger } from "../useLogger";

describe("useLogger", () => {
  let logSpy, warnSpy, errorSpy;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe("return shape", () => {
    it("returns log, warn, and error functions", () => {
      const logger = useLogger();
      expect(typeof logger.log).toBe("function");
      expect(typeof logger.warn).toBe("function");
      expect(typeof logger.error).toBe("function");
    });
  });

  describe("in DEV mode (import.meta.env.DEV = true)", () => {
    beforeEach(() => {
      vi.stubEnv("DEV", true);
    });

    it("log() calls console.log", () => {
      const logger = useLogger();
      logger.log("hello", "world");
      expect(logSpy).toHaveBeenCalledWith("hello", "world");
    });

    it("warn() calls console.warn", () => {
      const logger = useLogger();
      logger.warn("careful");
      expect(warnSpy).toHaveBeenCalledWith("careful");
    });

    it("error() calls console.error", () => {
      const logger = useLogger();
      logger.error("broke");
      expect(errorSpy).toHaveBeenCalledWith("broke");
    });

    it("log() with prefix prepends tag", () => {
      const logger = useLogger("MyStore");
      logger.log("init");
      expect(logSpy).toHaveBeenCalledWith("[MyStore]", "init");
    });

    it("warn() with prefix prepends tag", () => {
      const logger = useLogger("HaSensor");
      logger.warn("entity missing");
      expect(warnSpy).toHaveBeenCalledWith("[HaSensor]", "entity missing");
    });

    it("error() with prefix prepends tag", () => {
      const logger = useLogger("authStore");
      logger.error("connection failed");
      expect(errorSpy).toHaveBeenCalledWith("[authStore]", "connection failed");
    });

    it("log() passes multiple args correctly", () => {
      const logger = useLogger("Test");
      logger.log("a", "b", 42);
      expect(logSpy).toHaveBeenCalledWith("[Test]", "a", "b", 42);
    });
  });

  describe("in production mode (import.meta.env.DEV = false)", () => {
    beforeEach(() => {
      vi.stubEnv("DEV", false);
    });

    it("log() is suppressed", () => {
      const logger = useLogger();
      logger.log("should not appear");
      expect(logSpy).not.toHaveBeenCalled();
    });

    it("warn() is suppressed", () => {
      const logger = useLogger("prod");
      logger.warn("should not appear");
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("error() still fires", () => {
      const logger = useLogger("prod");
      logger.error("real error");
      expect(errorSpy).toHaveBeenCalledWith("[prod]", "real error");
    });

    it("error() without prefix still fires", () => {
      const logger = useLogger();
      logger.error("untagged error");
      expect(errorSpy).toHaveBeenCalledWith("untagged error");
    });
  });

  describe("prefix handling", () => {
    beforeEach(() => {
      vi.stubEnv("DEV", true);
    });

    it("no prefix: log() calls console.log without tag", () => {
      const logger = useLogger();
      logger.log("bare");
      expect(logSpy).toHaveBeenCalledWith("bare");
    });

    it("empty string prefix behaves same as no prefix", () => {
      const logger = useLogger("");
      logger.log("bare");
      expect(logSpy).toHaveBeenCalledWith("bare");
    });
  });
});
