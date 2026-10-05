import { describe, expect, it } from "vitest";

import { canonicalHostRedirects, normalizeHost } from "./canonical-host";

describe("normalizeHost", () => {
  it("deja solo el host en minúsculas", () => {
    expect(normalizeHost(" https://Espejos.co/ ")).toBe("espejos.co");
    expect(normalizeHost("espejos.co/espejos")).toBe("espejos.co");
    expect(normalizeHost(undefined)).toBe("");
  });
});

describe("canonicalHostRedirects", () => {
  it("no redirige sin dominio propio", () => {
    expect(canonicalHostRedirects({})).toEqual([]);
    expect(canonicalHostRedirects({ CANONICAL_HOST: " ", VERCEL_ENV: "production" })).toEqual([]);
  });

  it("nunca redirige los previews", () => {
    expect(canonicalHostRedirects({ CANONICAL_HOST: "espejos.co", VERCEL_ENV: "preview" })).toEqual(
      [],
    );
  });

  it("manda cualquier otro host al dominio con 308, conservando la ruta", () => {
    const [redirect] = canonicalHostRedirects({
      CANONICAL_HOST: "https://www.espejos.co/",
      VERCEL_ENV: "production",
    });
    expect(redirect).toEqual({
      source: "/:path*",
      missing: [{ type: "host", value: "www\\.espejos\\.co" }],
      destination: "https://www.espejos.co/:path*",
      permanent: true,
    });
    // El valor se evalúa como expresión regular completa: el punto no puede valer cualquier letra.
    const pattern = new RegExp(`^${redirect.missing?.[0].value}$`);
    expect(pattern.test("www.espejos.co")).toBe(true);
    expect(pattern.test("wwwxespejos.co")).toBe(false);
    expect(pattern.test("espejos.vercel.app")).toBe(false);
  });
});
