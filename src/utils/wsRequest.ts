import { Connection } from "home-assistant-js-websocket";
import { TIMEOUT_WEBSOCKET } from "@/utils/constants";
import { createLogger } from "@/utils/logger";

const logger = createLogger("wsRequest");

export async function sendWsMessage(
  connection: Connection | null,
  message: Record<string, unknown>,
  timeoutMs: number = TIMEOUT_WEBSOCKET,
): Promise<any> {
  if (!connection) {
    throw new Error("No WebSocket connection available");
  }

  try {
    const p: Promise<any> = (connection as any).sendMessagePromise(message);
    const result = await Promise.race([
      p,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("WebSocket request timed out")),
          timeoutMs,
        ),
      ),
    ]);
    return result;
  } catch (err) {
    logger.error("sendWsMessage error:", err);
    throw err;
  }
}

/**
 * Normalizes Home Assistant WebSocket responses to consistently return an array of data.
 * Handles cases where results are wrapped in a 'result' key, or mapped by entity ID.
 * @param result - The raw WebSocket response.
 * @returns An array containing the relevant data points.
 */
export function unwrapWsResult(result: any): any {
  if (Array.isArray(result)) return result;

  if (result && typeof result === "object") {
    // Check if result has a 'result' key (standard HA response format)
    if (result.result !== undefined) {
      if (Array.isArray(result.result)) return result.result;
      if (result.result && typeof result.result === "object") {
        const resultKeys = Object.keys(result.result);
        if (
          resultKeys.length > 0 &&
          Array.isArray(result.result[resultKeys[0]])
        ) {
          // It's a map of entity_id -> points
          return Object.values(result.result);
        }
        // It's just the object inside result
        return result.result;
      }
      return result.result;
    }

    // Check if the object itself is the map (e.g., { "entity_id": [points] })
    const keys = Object.keys(result);
    // Exclude HA control keys if they exist at this level
    const dataKeys = keys.filter(
      (k) => k !== "id" && k !== "type" && k !== "success" && k !== "result",
    );
    if (dataKeys.length > 0 && Array.isArray(result[dataKeys[0]])) {
      return Object.values(result).filter((v) => Array.isArray(v));
    }
  }
  return result;
}
