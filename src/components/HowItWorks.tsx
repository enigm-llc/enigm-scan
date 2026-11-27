import React, { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Cable,
  Check,
  Code,
  Cpu,
  Download,
  FileBadge,
  FileCheck2,
  Globe,
  ImageOff,
  Laptop,
  MessageSquare,
  Network,
  UserX,
  Usb,
  FileClock,
} from "lucide-react";
import { DeviceIcon } from "./Brand";
import { Disclosure } from "./Disclosure";
import { MobileStart } from "./MobileStart";
import { howCopy } from "../shared/i18n/how";
import { faq } from "../shared/i18n/faq";
import { siteCopy } from "../shared/i18n/site";
import { productCopy } from "../shared/i18n/product";
import { dictionaries, type Language } from "../shared/i18n/i18n";

/**
 * Spyware families with the most signed indicators in the bundled rule set
 * (counted from bundle-v2.json, version 2026112601). Update with the rules.
 * "Stalkerware" groups the 174 commercial monitoring apps tracked by Echap.
 */
const FAMILIES: Array<[string, number]> = [
  ["Stalkerware", 5436],
  ["Pegasus", 1566],
  ["Predator", 583],
  ["Donot Team", 257],
  ["Coruna", 215],
  ["Wintego Helios", 174],
];
const TOTAL = 11669;
const STEP_ICONS = [Download, Usb, FileCheck2];
const CHECK_ICONS = [MessageSquare, Globe, Cpu, FileBadge, Network, FileClock];
const PRIVACY_ICONS = [Laptop, UserX, ImageOff, Code];

/** Counts up to a real number once it scrolls into view. */
function Counter({
  to,
  language,
}: Readonly<{ to: number; language: Language }>) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  useEffect(() => {
    const element = ref.current;
    const reduce =
      typeof matchMedia === "function" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!element || reduce || typeof IntersectionObserver !== "function") {
      setValue(to);
      return;
    }
    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / 1400);
          setValue(Math.round(to * (1 - Math.pow(1 - t, 3))));
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [to]);
  return (
    <span ref={ref} className="counter">
      {value.toLocaleString(language)}
    </span>
  );
}

/** A schematic, easy-to-read page that explains the whole product. */
export function HowItWorks({
  language,
  mobile = false,
  onClose,
}: Readonly<{
  language: Language;
  mobile?: boolean;
  onClose: () => void;
}>) {
  const h = howCopy[language];
  const c = siteCopy[language];
  const p = productCopy[language];
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    window.scrollTo(0, 0);
    heading.current?.focus();
  }, []);
  const start = (
    <button className="landing-go" onClick={onClose}>
      {c.start}
      <span aria-hidden="true">
        <ArrowRight size={20} />
      </span>
    </button>
  );
  return (
    <article className="how-page" aria-labelledby="how-title">
      <header className="how-hero">
        <h1 id="how-title" ref={heading} tabIndex={-1}>
          {h.heroTitle} <span>{h.heroSub}</span>
        </h1>
        {!mobile && <div className="how-hero-action">{start}</div>}
      </header>

      <section className="how-band alt" aria-labelledby="how-steps">
        <h2 id="how-steps">{h.title}</h2>
        <ol className="how-flow">
          {h.steps.map(([title, text], i) => {
            const Icon = STEP_ICONS[i];
            return (
              <li key={title}>
                <span className="flow-icon" aria-hidden="true">
                  <Icon size={22} strokeWidth={1.6} />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="how-band" aria-labelledby="how-families">
        <h2 id="how-families">{h.familiesTitle}</h2>
        <p className="how-lede">{h.familiesSub}</p>
        <div className="how-total">
          <Counter to={TOTAL} language={language} />
          <span>{h.indicatorsWord}</span>
        </div>
        <ul className="how-counters">
          {FAMILIES.map(([name, count]) => (
            <li key={name}>
              <Counter to={count} language={language} />
              <b>{name}</b>
            </li>
          ))}
        </ul>
      </section>

      <div className="how-rest">
        <section className="how-band how-split" aria-labelledby="how-check">
          <h2 id="how-check">{h.checkTitle}</h2>
          <ul className="how-tiles">
            {h.checks.map((item, i) => {
              const Icon = CHECK_ICONS[i] ?? Check;
              return (
                <li key={item}>
                  <Icon size={20} strokeWidth={1.6} aria-hidden="true" />
                  <span>{item}</span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="how-band how-split" aria-labelledby="how-privacy">
          <h2 id="how-privacy">{h.privacyTitle}</h2>
          <ul className="how-tiles two">
            {h.privacyCards.map(([title, text], i) => {
              const Icon = PRIVACY_ICONS[i] ?? Check;
              return (
                <li key={title}>
                  <Icon size={20} strokeWidth={1.6} aria-hidden="true" />
                  <span>
                    <b>{title}.</b> {text}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="how-band how-split" aria-labelledby="how-compat">
          <h2 id="how-compat">{h.compatTitle}</h2>
          <div className="how-compat2">
            <div className="compat-phones">
              <div className="compat-logos" aria-hidden="true">
                <span>
                  <DeviceIcon device="ios" size={56} />
                  <b>iPhone</b>
                </span>
                <span>
                  <DeviceIcon device="android" size={64} />
                  <b>Android</b>
                </span>
              </div>
              <p>{h.compat[1]}</p>
            </div>
            <div className="compat-side">
              <div className="compat-computer">
                <span className="compat-mini" aria-hidden="true">
                  <DeviceIcon device="ios" size={18} />
                  <DeviceIcon device="windows" size={18} />
                  <DeviceIcon device="linux" size={18} />
                </span>
                <b>{h.compatHeads[0]}</b>
                <p>{h.compat[0]}</p>
              </div>
              <div className="compat-computer">
                <span className="compat-mini" aria-hidden="true">
                  <Cable size={18} strokeWidth={1.6} />
                </span>
                <b>{h.compatHeads[2]}</b>
                <p>{h.compat[2]}</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="how-band how-faq-section" aria-labelledby="how-faq">
        <h2 id="how-faq">{h.faqTitle}</h2>
        <p className="how-lede">{h.faqSub}</p>
        <div className="how-faq">
          {faq[language].map(([question, answer, link]) => (
            <Disclosure key={question} summary={question}>
              <p>{answer}</p>
              {link && (
                <p className="faq-link">
                  <a
                    href="https://enigm.io"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link}
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </a>
                </p>
              )}
            </Disclosure>
          ))}
        </div>
      </section>

      <section className="how-final" aria-labelledby="how-final">
        {mobile ? (
          <>
            <h2 id="how-final">
              {p.mobileFinalTitle} <span>{p.mobileFinalSub}</span>
            </h2>
            <MobileStart
              t={dictionaries[language]}
              language={language}
              compact
            />
          </>
        ) : (
          <>
            <h2 id="how-final">
              {h.finalTitle} <span>{h.finalSub}</span>
            </h2>
            {start}
          </>
        )}
      </section>
    </article>
  );
}
