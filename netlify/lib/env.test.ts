// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { requestSiteUrl } from "./env";

describe("requestSiteUrl", () => {
  afterEach(() => {
    delete process.env.SITE_URL;
    delete process.env.SITE_NAME;
  });

  it("ramène le client sur l'aperçu ou le site d'où il commande, jamais ailleurs", () => {
    process.env.SITE_URL = "https://mlhorion.com";
    process.env.SITE_NAME = "mlhorionsetup";
    const from = (url: string) => requestSiteUrl(new Request(url));
    expect(from("https://mlhorion.com/api/checkout")).toBe("https://mlhorion.com");
    expect(from("https://deploy-preview-2--mlhorionsetup.netlify.app/api/checkout")).toBe("https://deploy-preview-2--mlhorionsetup.netlify.app");
    expect(from("https://pirate.example/api/checkout")).toBe("https://mlhorion.com");
    expect(from("https://x--autre-site.netlify.app/api/checkout")).toBe("https://mlhorion.com");
  });
});
