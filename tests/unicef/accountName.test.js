import { describe, expect, it } from "vitest";
import { accountName } from "@/lib/unicef/accountName";

describe("accountName", () => {
  it("splits the Code4Community display name", () => {
    expect(accountName({ email: "s@lcps.org" }, { displayName: "Shail Patel" })).toEqual({
      displayName: "Shail Patel",
      firstName: "Shail",
      lastName: "Patel",
    });
  });

  it("ignores an email-only fallback", () => {
    expect(accountName({ email: "s@lcps.org", displayName: "" }, { email: "s@lcps.org" })).toEqual({
      displayName: "",
      firstName: "",
      lastName: "",
    });
  });
});
