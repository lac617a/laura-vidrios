import type { Metadata } from "next";

import { defaultPrivacyPolicy } from "@/lib/privacy-policy";
import { getSettings } from "@/lib/settings";
import { textBlocks } from "@/lib/text";

export const metadata: Metadata = {
  title: "Política de tratamiento de datos",
  description: "Cómo tratamos tus datos personales (Ley 1581 de 2012).",
  alternates: { canonical: "/politica-de-datos" },
};

/** PRD RF-L12: texto editable en la configuración; si está vacío, el texto base. */
export default async function PrivacyPolicyPage() {
  const settings = await getSettings();
  const blocks = textBlocks(settings.privacyPolicy ?? defaultPrivacyPolicy(settings));

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pt-10 pb-20 sm:pt-14">
      <p className="text-sm tracking-[0.25em] text-muted-foreground uppercase">Ley 1581 de 2012</p>
      <h1 className="mt-2 font-heading text-4xl font-semibold text-balance sm:text-5xl">
        Política de tratamiento de datos personales
      </h1>
      <div className="mt-8 space-y-4 leading-relaxed text-pretty text-foreground/85">
        {blocks.map((block, index) =>
          block.type === "heading" ? (
            <h2 key={index} className="pt-4 text-xl font-semibold text-foreground">
              {block.text}
            </h2>
          ) : block.type === "list" ? (
            <ul key={index} className="list-disc space-y-1.5 pl-5 marker:text-muted-foreground">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ul>
          ) : (
            <p key={index}>{block.text}</p>
          ),
        )}
      </div>
    </main>
  );
}
