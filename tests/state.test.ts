import { describe, expect, it } from "vitest";
import {
  deleteQuoteState,
  getQuoteState,
  saveQuoteState,
} from "../src/state.js";

describe("quote state store", () => {
  it("round-trips a saved state by note ID", () => {
    saveQuoteState("n1", { generatorId: "generator1", targetId: "target1" });
    expect(getQuoteState("n1")?.generatorId).toBe("generator1");
  });

  it("returns undefined for a note that was never saved", () => {
    expect(getQuoteState("never-saved")).toBeUndefined();
  });

  it("forgets a state once deleted", () => {
    saveQuoteState("n2", { generatorId: "generator1", targetId: "target1" });
    deleteQuoteState("n2");
    expect(getQuoteState("n2")).toBeUndefined();
  });
});
