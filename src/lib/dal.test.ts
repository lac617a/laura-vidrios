import { beforeEach, describe, expect, it, vi } from "vitest";

// La sesión se simula: getSession devuelve lo que cada test necesite.
const getSession = vi.fn();

vi.mock("@/lib/auth", () => ({ auth: { api: { getSession } } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

const { authorizeAction, requireAdmin } = await import("@/lib/dal");

function sessionFor(role: string) {
  return { user: { id: "u1", name: "Ana", email: "ana@local.test", role } };
}

beforeEach(() => getSession.mockReset());

describe("authorizeAction", () => {
  it("responde 401 sin sesión", async () => {
    getSession.mockResolvedValue(null);
    await expect(authorizeAction()).resolves.toMatchObject({ ok: false, status: 401 });
  });

  it("responde 403 si el rol no está permitido", async () => {
    getSession.mockResolvedValue(sessionFor("EDITOR"));
    await expect(authorizeAction(["OWNER"])).resolves.toMatchObject({ ok: false, status: 403 });
  });

  it("devuelve el usuario si el rol está permitido", async () => {
    getSession.mockResolvedValue(sessionFor("OWNER"));
    await expect(authorizeAction(["OWNER"])).resolves.toMatchObject({
      ok: true,
      user: { id: "u1", role: "OWNER" },
    });
  });

  it("trata un rol desconocido como EDITOR", async () => {
    getSession.mockResolvedValue(sessionFor("ADMIN"));
    await expect(authorizeAction(["OWNER"])).resolves.toMatchObject({ status: 403 });
  });
});

describe("requireAdmin", () => {
  it("redirige al login sin sesión", async () => {
    getSession.mockResolvedValue(null);
    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/admin/login");
  });
});
