import { afterEach, describe, expect, it, vi } from "vitest";

import { cloudinaryUrl, IMAGE_PRESETS, publicIdFromUrl, transformUrl } from "@/lib/cloudinary";
import {
  createUploadSignature,
  environmentFolder,
  isAuthenticUpload,
  signParams,
  uploadFolder,
} from "@/lib/cloudinary-server";

const config = { cloudName: "demo", apiKey: "123", apiSecret: "abcd" };

afterEach(() => vi.unstubAllEnvs());

describe("signParams", () => {
  it("coincide con el ejemplo de la documentación de Cloudinary", () => {
    expect(
      signParams(
        {
          eager: "w_400,h_300,c_pad|w_260,h_200,c_crop",
          public_id: "sample_image",
          timestamp: 1315060510,
        },
        "abcd",
      ),
    ).toBe("bfd09f95f331f558cbd1320e67aa8d488770583e");
  });

  it("ordena los parámetros e ignora los vacíos", () => {
    expect(signParams({ b: "2", a: "1", c: "" }, "s")).toBe(signParams({ a: "1", b: "2" }, "s"));
  });
});

describe("createUploadSignature", () => {
  it("firma carpeta, formatos, timestamp y transformación", () => {
    const signature = createUploadSignature(
      config,
      "catalogo-espejos/dev/marca",
      1_700_000_000_000,
    );
    expect(signature.uploadUrl).toBe("https://api.cloudinary.com/v1_1/demo/image/upload");
    expect(signature.params.timestamp).toBe("1700000000");
    const { signature: sig, ...signed } = signature.params;
    expect(sig).toBe(signParams(signed, "abcd"));
    expect(JSON.stringify(signature)).not.toContain("abcd");
  });
});

describe("isAuthenticUpload", () => {
  it("acepta la firma de Cloudinary y rechaza una falsa", () => {
    const upload = { public_id: "catalogo-espejos/dev/productos/p1/luna", version: 1712345678 };
    const signature = signParams(upload, "abcd");
    expect(isAuthenticUpload(config, { ...upload, signature })).toBe(true);
    expect(isAuthenticUpload(config, { ...upload, signature: "0".repeat(40) })).toBe(false);
    expect(isAuthenticUpload(config, { ...upload, signature: "corta" })).toBe(false);
  });
});

describe("carpetas por entorno", () => {
  it("separa dev, preview y prod", () => {
    vi.stubEnv("VERCEL_ENV", "");
    expect(environmentFolder()).toBe("dev");
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(environmentFolder()).toBe("preview");
    vi.stubEnv("VERCEL_ENV", "production");
    expect(uploadFolder({ kind: "product", productId: "p1" })).toBe(
      "catalogo-espejos/prod/productos/p1",
    );
    expect(uploadFolder({ kind: "logo" })).toBe("catalogo-espejos/prod/marca");
  });
});

describe("URLs", () => {
  it("arma URLs con presets", () => {
    expect(
      cloudinaryUrl("a/b/luna", { ...IMAGE_PRESETS.card, width: 400, cloudName: "demo" }),
    ).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_fill,g_auto,ar_4:5,w_400/a/b/luna",
    );
    expect(cloudinaryUrl("luna", { width: 1600, cloudName: "demo" })).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_1600/luna",
    );
  });

  it("transforma y lee URLs guardadas", () => {
    const url =
      "https://res.cloudinary.com/demo/image/upload/v1712345678/catalogo-espejos/dev/marca/logo.png";
    expect(transformUrl(url, "w_200")).toBe(
      "https://res.cloudinary.com/demo/image/upload/w_200/v1712345678/catalogo-espejos/dev/marca/logo.png",
    );
    expect(publicIdFromUrl(url)).toBe("catalogo-espejos/dev/marca/logo");
    expect(transformUrl("https://otro.com/x.png", "w_200")).toBe("https://otro.com/x.png");
    expect(publicIdFromUrl("https://otro.com/x.png")).toBeNull();
  });
});
