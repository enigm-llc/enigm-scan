import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import DesktopApp from "./desktop/DesktopApp";
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
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>{isDesktop() ? <DesktopApp /> : <App />}</React.StrictMode>,
);
