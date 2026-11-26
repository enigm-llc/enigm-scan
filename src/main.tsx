import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { isDesktop } from "./core/agent";
import "@fontsource-variable/roboto/wght.css";
import "./styles.css";
import "./design.css";
import "./console.css";
import { installTouchFeedback } from "./core/touch-feedback";
import { initialLanguage } from "./shared/i18n/i18n";
// Before the first paint: browsers decide whether to offer a translation from
// the document language, and index.html cannot know the visitor's choice.
document.documentElement.lang = initialLanguage();
installTouchFeedback();
// The website and the desktop app share this entry but not their code: each
// loads only its own screens.
const Root = isDesktop()
  ? lazy(() => import("./desktop/DesktopApp"))
  : lazy(() => import("./App"));
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Suspense fallback={null}>
      <Root />
    </Suspense>
  </React.StrictMode>,
);
