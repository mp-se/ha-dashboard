import { describe, it, expect, beforeEach } from "vitest";
import {
  encrypt,
  decrypt,
  setSecureItem,
  getSecureItem,
  removeSecureItem,
  isCryptoSupported,
} from "../secureStorage";

describe("secureStorage", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe("isCryptoSupported", () => {
    it("should return true when crypto is available", () => {
      expect(isCryptoSupported()).toBe(true);
    });

    // Note: Cannot test missing crypto in happy-dom as window.crypto is read-only
    // This would be tested in real browsers without Web Crypto API support
  });

  describe("encrypt and decrypt", () => {
    it("should encrypt and decrypt a string", async () => {
      const plaintext = "my-secret-token-12345";
      const encrypted = await encrypt(plaintext);

      expect(encrypted).toBeTruthy();
      expect(encrypted).not.toBe(plaintext);
      expect(typeof encrypted).toBe("string");

      const decrypted = await decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it("should produce different ciphertext for same plaintext (due to random IV)", async () => {
      const plaintext = "test-data";
      const encrypted1 = await encrypt(plaintext);
      const encrypted2 = await encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);

      // But both should decrypt to the same value
      const decrypted1 = await decrypt(encrypted1);
      const decrypted2 = await decrypt(encrypted2);
      expect(decrypted1).toBe(plaintext);
      expect(decrypted2).toBe(plaintext);
    });

    it("should handle empty string", async () => {
      const plaintext = "";
      const encrypted = await encrypt(plaintext);
      const decrypted = await decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("should handle special characters and unicode", async () => {
      const plaintext = "Hello 世界! 🔐 Special chars: <>&\"'";
      const encrypted = await encrypt(plaintext);
      const decrypted = await decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("should handle long strings", async () => {
      const plaintext = "a".repeat(10000);
      const encrypted = await encrypt(plaintext);
      const decrypted = await decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("should throw error when decrypting invalid data", async () => {
      await expect(decrypt("invalid-base64-data")).rejects.toThrow();
    });

    it("should throw error when decrypting corrupted data", async () => {
      const plaintext = "test";
      const encrypted = await encrypt(plaintext);

      // Corrupt the encrypted data
      const corrupted = encrypted.slice(0, -5) + "xxxxx";

      await expect(decrypt(corrupted)).rejects.toThrow();
    });
  });

  describe("setSecureItem and getSecureItem", () => {
    it("should store and retrieve encrypted data", async () => {
      const key = "test_key";
      const value = "secret-value-123";

      await setSecureItem(key, value);

      // Verify it's stored in localStorage
      const stored = localStorage.getItem(key);
      expect(stored).toBeTruthy();
      expect(stored).not.toBe(value); // Should be encrypted

      // Retrieve and decrypt
      const retrieved = await getSecureItem(key);
      expect(retrieved).toBe(value);
    });

    it("should return null for non-existent key", async () => {
      const result = await getSecureItem("non_existent_key");
      expect(result).toBeNull();
    });

    it("should return null and remove corrupted data", async () => {
      const key = "corrupted_key";
      localStorage.setItem(key, "corrupted-data-not-encrypted");

      const result = await getSecureItem(key);
      expect(result).toBeNull();

      // Should have removed the corrupted item
      expect(localStorage.getItem(key)).toBeNull();
    });

    it("should handle multiple keys", async () => {
      await setSecureItem("key1", "value1");
      await setSecureItem("key2", "value2");
      await setSecureItem("key3", "value3");

      expect(await getSecureItem("key1")).toBe("value1");
      expect(await getSecureItem("key2")).toBe("value2");
      expect(await getSecureItem("key3")).toBe("value3");
    });

    it("should overwrite existing key", async () => {
      const key = "overwrite_test";

      await setSecureItem(key, "first-value");
      expect(await getSecureItem(key)).toBe("first-value");

      await setSecureItem(key, "second-value");
      expect(await getSecureItem(key)).toBe("second-value");
    });
  });

  describe("removeSecureItem", () => {
    it("should remove item from localStorage", async () => {
      const key = "remove_test";
      await setSecureItem(key, "value");

      expect(localStorage.getItem(key)).toBeTruthy();

      removeSecureItem(key);

      expect(localStorage.getItem(key)).toBeNull();
      expect(await getSecureItem(key)).toBeNull();
    });

    it("should not throw error when removing non-existent key", () => {
      expect(() => removeSecureItem("non_existent")).not.toThrow();
    });
  });

  describe("key derivation consistency", () => {
    it("should produce consistent encryption/decryption results", async () => {
      const plaintext = "consistency-test";

      // Encrypt and decrypt multiple times
      for (let i = 0; i < 5; i++) {
        const encrypted = await encrypt(plaintext);
        const decrypted = await decrypt(encrypted);
        expect(decrypted).toBe(plaintext);
      }
    });

    it("should maintain data across localStorage operations", async () => {
      await setSecureItem("ha_url", "https://homeassistant.local:8123");
      await setSecureItem("ha_token", "very-long-token-" + "x".repeat(100));

      // Simulate page reload by retrieving again
      const url = await getSecureItem("ha_url");
      const token = await getSecureItem("ha_token");

      expect(url).toBe("https://homeassistant.local:8123");
      expect(token).toBe("very-long-token-" + "x".repeat(100));
    });
  });

  describe("edge cases", () => {
    it("should handle rapid sequential operations", async () => {
      const operations = Array.from({ length: 10 }, (_, i) =>
        setSecureItem(`key${i}`, `value${i}`),
      );

      await Promise.all(operations);

      for (let i = 0; i < 10; i++) {
        expect(await getSecureItem(`key${i}`)).toBe(`value${i}`);
      }
    });

    it("should handle numbers as strings", async () => {
      const key = "number_test";
      const value = "12345.67890";

      await setSecureItem(key, value);
      expect(await getSecureItem(key)).toBe(value);
    });

    it("should handle URL strings", async () => {
      const url =
        "https://homeassistant.local:8123/api/states?param=value&other=test";

      await setSecureItem("url", url);
      expect(await getSecureItem("url")).toBe(url);
    });

    it("should handle JSON strings", async () => {
      const jsonData = JSON.stringify({
        url: "https://test.com",
        token: "abc123",
        nested: { key: "value" },
      });

      await setSecureItem("json", jsonData);
      const retrieved = await getSecureItem("json");
      expect(JSON.parse(retrieved)).toEqual(JSON.parse(jsonData));
    });
  });
});
