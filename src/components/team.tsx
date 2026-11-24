import Image from "next/image";
import Link from "next/link";
import { Check, Code2, Layers, Mail } from "lucide-react";

type Person = {
  name: string;
  role: string;
  photo: string;
  photoAlt: string;
  note: string;
  tags: string[];
  links: Array<[string, string]>;
};

const people: Person[] = [
  {
    name: "Mharryjs",
    role: "Owner · full-stack web developer",
    photo: "/images/mharryjs.png",
    photoAlt: "Mharryjs, owner of SwiftSite",
    note: "Wrote the whole build: HTML, CSS, JavaScript and TypeScript, the Next.js app, the PostgreSQL database, the tool engine and the AI connection. Everything that is not the design brief came from him.",
    tags: ["Front end", "Back end", "Database", "AI chat", "Login & dashboard", "Image & video tools"],
    links: [
      ["Email", "mailto:swiftsite@gmail.com"],
      ["Instagram", "https://www.instagram.com/swif.site/"],
      ["LinkedIn", "https://www.linkedin.com/in/m-harry-js-98076442a"],
      ["GitHub", "https://github.com/Mharryjs"],
    ],
  },
  {
    name: "Hiba Kashif",
    role: "Structure & design · full-stack developer",
    photo: "/images/hiba-avatar.jpg",
    photoAlt: "Hiba Kashif, structure and design at SwiftSite",
    note: "Owned the structure and the design: how every page is laid out, the page order, spacing, the green glass look, the wording people read, and the testing before every release.",
    tags: ["Site structure", "Page layouts", "Visual design", "Look & feel"],
    links: [
      ["Email", "mailto:swiftsite@gmail.com"],
      ["Instagram", "https://www.instagram.com/swif.site/"],
      ["LinkedIn", "https://www.linkedin.com/in/hiba-kashif-70b66b288?utm_source=share_via&utm_content=profile&utm_medium=member_android"],
    ],
  },
];

const split = [
  {
    name: "Hiba Kashif",
    role: "Structure & designing",
    icon: Layers,
    items: [
      "Page structure and section order",
      "Layout, spacing and the green glass look",
      "Mobile and tablet behaviour",
      "Team section copy and microcopy",
      "Testing every release before it shipped",
    ],
  },
  {
    name: "Mharryjs",
    role: "All of the code",
    icon: Code2,
    items: [
      "HTML, CSS, JavaScript and TypeScript",
      "Next.js app, routes and server actions",
      "PostgreSQL schema with Drizzle ORM",
      "Tool engine, calculator parser and APIs",
      "AI provider connection and the studio",
    ],
  },
];

const releases = [
  ["Now", "Code that matches the prompt", "Ask for a simple page or a 3D glass one and the studio writes exactly that, ready to download."],
  ["1.5", "Prompt library", "Reusable prompts with variables, six working modes and exportable history."],
  ["1.2", "Tools that hold up", "Twelve server tools, a hand-written calculator parser and a searchable sidebar."],
  ["1.0", "First quiet launch", "No accounts, no tracking scripts, one anonymous workspace per browser."],
];

export function TeamSection() {
  return (
    <section className="mx-auto max-w-6xl scroll-mt-24 px-4 py-6 sm:px-6" id="studio">
      <div className="glass rounded-[2rem] p-6 sm:p-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="text-sm font-bold tracking-wide text-leaf-700 uppercase">The people</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-leaf-950 sm:text-3xl">
              Two people, one careful product
            </h2>
            <p className="mt-3 leading-relaxed text-leaf-950/70">
              SwiftSite is not a template with a logo on top. Hiba Kashif designed the structure; Mharryjs wrote
              every line of code. Both of them use it daily.
            </p>
          </div>
          <p className="hand-note">structure by Hiba · code by Mharryjs</p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {people.map((person) => (
            <article className="person-card" key={person.name}>
              <div className="flex items-center gap-4">
                <Image
                  src={person.photo}
                  alt={person.photoAlt}
                  width={96}
                  height={96}
                  className="h-[4.5rem] w-[4.5rem] shrink-0 rounded-full border-[3px] border-white/90 object-cover shadow-[0_10px_28px_-10px_rgba(40,100,30,0.6)] ring-2 ring-amber-400/70"
                />
                <div>
                  <h3 className="text-xl font-extrabold tracking-tight text-leaf-950">{person.name}</h3>
                  <p className="text-[0.78rem] font-semibold text-leaf-700">{person.role}</p>
                </div>
              </div>
              <p className="mt-3 text-[0.92rem] leading-relaxed text-leaf-950/70">{person.note}</p>
              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                {person.tags.map((tag) => (
                  <span className="tag" key={tag}>{tag}</span>
                ))}
              </div>
              <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold">
                {person.links.map(([label, href]) => (
                  <a className="text-leaf-800 underline underline-offset-2" href={href} key={label} target="_blank" rel="noreferrer">{label}</a>
                ))}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-extrabold tracking-tight text-leaf-950 sm:text-xl">Who built what</h3>
          <p className="mt-1 text-[0.85rem] text-leaf-950/65">
            A clear split, so nobody has to guess which part came from whom.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {split.map((group) => (
              <div className="split-card" key={group.name}>
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-leaf-100 text-leaf-700"><group.icon size={17} /></span>
                  <div>
                    <p className="text-sm font-bold text-leaf-950">{group.name}</p>
                    <p className="text-[0.7rem] font-semibold text-leaf-700">{group.role}</p>
                  </div>
                </div>
                <ul className="mt-3 space-y-1.5">
                  {group.items.map((item) => (
                    <li className="flex items-start gap-2 text-[0.82rem] leading-relaxed text-leaf-950/75" key={item}>
                      <Check size={14} className="mt-1 shrink-0 text-leaf-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-2 rounded-2xl bg-leaf-100/70 p-4 sm:grid-cols-2">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-wide text-leaf-800">Email — both of us</p>
            <a className="inline-flex items-center gap-1.5 text-sm font-semibold text-leaf-950 underline underline-offset-2 break-all" href="mailto:swiftsite@gmail.com">
              <Mail size={13} /> swiftsite@gmail.com
            </a>
          </div>
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-wide text-leaf-800">Instagram</p>
            <a className="text-sm font-semibold text-leaf-950 underline underline-offset-2" href="https://www.instagram.com/swif.site/" target="_blank" rel="noreferrer">@swif.site</a>
            <span className="mx-2 text-leaf-700">·</span>
            <a className="text-sm font-semibold text-leaf-950 underline underline-offset-2" href="https://www.linkedin.com/in/m-harry-js-98076442a" target="_blank" rel="noreferrer">LinkedIn</a>
            <span className="mx-2 text-leaf-700">·</span>
            <a className="text-sm font-semibold text-leaf-950 underline underline-offset-2" href="https://github.com/Mharryjs" target="_blank" rel="noreferrer">GitHub</a>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ["Assistant modes", "6"],
            ["Built-in tools", "12"],
            ["API endpoints", "6"],
            ["Tracking scripts", "0"],
            ["Accounts needed", "None"],
            ["Type coverage", "100% TS"],
          ].map(([term, value]) => (
            <div className="rounded-2xl bg-white/55 p-4" key={term}>
              <dt className="text-[0.7rem] font-semibold text-leaf-950/60">{term}</dt>
              <dd className="mt-1 text-lg font-extrabold text-leaf-950">{value}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-5 text-sm leading-relaxed text-leaf-950/60">
          SwiftSite 1.6 shipped in October 2026. Every feature on this page is working today — read the{" "}
          <Link className="font-semibold text-leaf-700 underline underline-offset-2" href="/docs">documentation</Link>{" "}
          for the API, or open the <Link className="font-semibold text-leaf-700 underline underline-offset-2" href="/chat">assistant</Link>{" "}
          and ask it something real.
        </p>
      </div>
    </section>
  );
}

export function BuildLog() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6" aria-labelledby="buildlog-heading">
      <div className="glass grid gap-8 rounded-[2rem] p-6 sm:p-9 lg:grid-cols-[0.9fr_1.3fr]">
        <div>
          <p className="text-sm font-bold tracking-wide text-leaf-700 uppercase">Build log</p>
          <h2 id="buildlog-heading" className="mt-2 text-2xl font-extrabold tracking-tight text-leaf-950 sm:text-3xl">
            Small releases, written down
          </h2>
          <p className="mt-3 leading-relaxed text-leaf-950/70">
            No launch theatre. Just the things that changed, kept where we can read them again.
          </p>
          <p className="hand-note mt-5">still adding to this list…</p>
        </div>
        <ol className="space-y-3">
          {releases.map(([version, title, text]) => (
            <li className="flex gap-4 rounded-2xl bg-white/45 p-4" key={version}>
              <span className="log-version">{version}</span>
              <div>
                <p className="text-sm font-bold text-leaf-950">{title}</p>
                <p className="mt-0.5 text-[0.82rem] leading-relaxed text-leaf-950/65">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
