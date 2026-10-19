import { describe, expect, it } from "vitest";
import { createItem, createSignup, listFoodBanks, listItems, listSignups, setItemQuantity, setSignupStatus } from "@/lib/db";

describe("database", () => {
  it("seeds demo food banks with weekend sessions", () => {
    const banks = listFoodBanks();
    expect(banks.length).toBe(3);
    expect(banks.every((b) => b.isDemo)).toBe(true);
    expect(banks.some((b) => b.sessions.some((s) => s.dayOfWeek === 6))).toBe(true);
  });

  it("stores items and hides ones with no stock left", () => {
    const bank = listFoodBanks()[0];
    const id = createItem({
      foodBankId: bank.id, name: "Rice", category: "Dry goods", barcode: null, quantity: 3, unitWeightG: 1000,
      expiry: "2027-01-01", allergens: [], nutrients: {
        energyKcal: 350, proteinG: 7, fatG: 1, carbsG: 78, sugarsG: 0, fibreG: 1, saltG: 0,
        vitaminAUg: null, vitaminCMg: null, vitaminDUg: null, calciumMg: null, ironMg: null,
      }, nutrientsEstimated: false, source: "manual",
    });
    expect(listItems(bank.id).map((i) => i.id)).toContain(id);
    setItemQuantity(id, 0);
    expect(listItems(bank.id).map((i) => i.id)).not.toContain(id);
  });

  it("records sign-ups as pending until approved", () => {
    const id = createSignup({
      kind: "business", name: "Sam", email: "sam@example.com", phone: null, organisation: "Corner Bakery",
      postcode: null, offer: "Day-old bread", availability: "Fridays", canDeliver: false,
    });
    expect(listSignups().find((s) => s.id === id)?.status).toBe("pending");
    setSignupStatus(id, "approved");
    expect(listSignups().find((s) => s.id === id)?.status).toBe("approved");
  });
});
