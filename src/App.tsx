import { useEffect, useState } from "react";
import { Github } from "lucide-react";
import { seo } from "./shared/i18n/seo";
import { siteCopy } from "./shared/i18n/site";
import { useI18N } from "./shared/i18n/i18n";
import { useAppearance } from "./shared/appearance";
import { Footer } from "./components/Footer";
import { HowItWorks } from "./components/HowItWorks";
import { Home } from "./components/Home";
import { BrandLogo } from "./components/Brand";
import { needsComputer } from "./components/MobileStart";

const repo = "https://github.com/enigm-llc/enigm-scan";

// Every page has its own URL, so the back button and the logo behave as
// expected. English paths are canonical.
type Route = "home" | "how" | "download";
const PATHS: Record<Route, string> = {
  home: "/",
  how: "/how-it-works",
  download: "/download",
};
function routeOf(path: string): Route {
  let end = path.length;
  while (end > 0 && path[end - 1] === "/") end--;
  const clean = path.slice(0, end) || "/";
  if (/\/(como-funciona|how-it-works)$/.test(clean)) return "how";
  return clean === PATHS.download ? "download" : "home";
}

/**
 * The website: what Enigm Scan is, how it works and where to download it.
 * The scan itself happens in the desktop app (see DesktopApp).
 */
export default function App() {
  const { language, setLanguage, t } = useI18N();
  // The site is designed dark first; light stays one tap away.
  const [appearance, setAppearance] = useAppearance("dark");
  const mobile = needsComputer();
  const [route, setRoute] = useState<Route>(() => routeOf(location.pathname));
  const navigate = (next: Route) => {
    if (location.pathname !== PATHS[next])
      history.pushState(null, "", PATHS[next]);
    setRoute(next);
    window.scrollTo(0, 0);
  };
  useEffect(() => {
    if (/\/como-funciona\/?$/.test(location.pathname))
      history.replaceState(null, "", PATHS.how + location.search);
    const sync = () => setRoute(routeOf(location.pathname));
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
    const [page, description] = seo[language][route];
    const title = page + " - Enigm Scan";
    document.title = title;
    const set = (selector: string, attribute: string, value: string) =>
      document.querySelector(selector)?.setAttribute(attribute, value);
    for (const selector of [
      'meta[name="description"]',
      'meta[property="og:description"]',
      'meta[name="twitter:description"]',
    ])
      set(selector, "content", description);
    for (const selector of [
      'meta[property="og:title"]',
      'meta[name="twitter:title"]',
    ])
      set(selector, "content", title);
    const url = "https://scan.enigm.io" + PATHS[route];
    set('link[rel="canonical"]', "href", url);
    set('meta[property="og:url"]', "content", url);
    set(
      'meta[property="og:locale"]',
      "content",
      {
        es: "es_ES",
        en: "en_US",
        fr: "fr_FR",
        de: "de_DE",
        it: "it_IT",
        pt: "pt_PT",
      }[language],
    );
  }, [language, route]);
  // The tab icon sits on the browser's own bar, which follows the computer's
  // theme, not the page's: follow the system so the symbol is always visible.
  useEffect(() => {
    if (typeof matchMedia !== "function") return;
    const query = matchMedia("(prefers-color-scheme: dark)");
    const sync = () =>
      document
        .querySelector('link[rel="alternate icon"]')
        ?.setAttribute(
          "href",
          query.matches ? "/brand/favicon-dark.png" : "/brand/favicon.png",
        );
    sync();
    query.addEventListener?.("change", sync);
    return () => query.removeEventListener?.("change", sync);
  }, []);
  const how = route === "how";
  return (
    <>
      <header className="scan-header">
        <a
          className="brand"
          href="/"
          onClick={(event) => {
            event.preventDefault();
            navigate("home");
          }}
          aria-label="Enigm Scan"
        >
          <BrandLogo />
        </a>
        <nav aria-label={t.docs}>
          {!mobile && (
            <a
              className="nav-link how-nav"
              href={PATHS.how}
              onClick={(event) => {
                event.preventDefault();
                navigate("how");
              }}
              aria-current={how ? "page" : undefined}
            >
              {siteCopy[language].help}
            </a>
          )}
          <a className="nav-link" href="https://docs.enigm.io">
            {t.docs}
          </a>
          <a className="icon-link" href={repo} aria-label="GitHub">
            <Github size={19} />
          </a>
        </nav>
      </header>
      <main className="scan-main">
        {how ? (
          <HowItWorks
            language={language}
            mobile={mobile}
            onClose={() => navigate("home")}
          />
        ) : (
          <Home
            t={t}
            language={language}
            mobile={mobile}
            onHow={() => navigate("how")}
            started={route === "download"}
            onStart={() => navigate("download")}
          />
        )}
      </main>
      <Footer
        t={t}
        language={language}
        setLanguage={setLanguage}
        appearance={appearance}
        setAppearance={setAppearance}
      />
    </>
  );
}
