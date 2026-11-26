//! The macOS menu bar, in the system's own bar at the top of the screen: the
//! app menu (About, Hide, Quit), Edit, Window and Help, in the system language.
//! Windows and Linux draw a menu bar inside the window, so the app sets none
//! there: the window holds only the app.
#![cfg_attr(not(target_os = "macos"), allow(dead_code))]
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem, Submenu};
use tauri::{AppHandle, Wry};

/// The menu item that opens the app's About window.
pub const ABOUT: &str = "about";
/// The menu item that opens the "How it works" page in the browser.
pub const HELP: &str = "help";
pub const HELP_URL: &str = "https://scan.enigm.io/how-it-works";

struct Labels {
    about: &'static str,
    edit: &'static str,
    window: &'static str,
    help: &'static str,
    how: &'static str,
    hide: &'static str,
    hide_others: &'static str,
    show_all: &'static str,
    quit: &'static str,
    undo: &'static str,
    redo: &'static str,
    cut: &'static str,
    copy: &'static str,
    paste: &'static str,
    select_all: &'static str,
    minimize: &'static str,
    close: &'static str,
}

fn labels(language: &str) -> Labels {
    match language {
        "es" => Labels {
            about: "Acerca de Enigm Scan",
            edit: "Edición",
            window: "Ventana",
            help: "Ayuda",
            how: "Cómo funciona Enigm Scan",
            hide: "Ocultar Enigm Scan",
            hide_others: "Ocultar otros",
            show_all: "Mostrar todo",
            quit: "Salir de Enigm Scan",
            undo: "Deshacer",
            redo: "Rehacer",
            cut: "Cortar",
            copy: "Copiar",
            paste: "Pegar",
            select_all: "Seleccionar todo",
            minimize: "Minimizar",
            close: "Cerrar ventana",
        },
        "fr" => Labels {
            about: "À propos d’Enigm Scan",
            edit: "Édition",
            window: "Fenêtre",
            help: "Aide",
            how: "Fonctionnement d’Enigm Scan",
            hide: "Masquer Enigm Scan",
            hide_others: "Masquer les autres",
            show_all: "Tout afficher",
            quit: "Quitter Enigm Scan",
            undo: "Annuler",
            redo: "Rétablir",
            cut: "Couper",
            copy: "Copier",
            paste: "Coller",
            select_all: "Tout sélectionner",
            minimize: "Réduire",
            close: "Fermer la fenêtre",
        },
        "de" => Labels {
            about: "Über Enigm Scan",
            edit: "Bearbeiten",
            window: "Fenster",
            help: "Hilfe",
            how: "So funktioniert Enigm Scan",
            hide: "Enigm Scan ausblenden",
            hide_others: "Andere ausblenden",
            show_all: "Alle einblenden",
            quit: "Enigm Scan beenden",
            undo: "Widerrufen",
            redo: "Wiederholen",
            cut: "Ausschneiden",
            copy: "Kopieren",
            paste: "Einsetzen",
            select_all: "Alles auswählen",
            minimize: "Im Dock ablegen",
            close: "Fenster schließen",
        },
        "it" => Labels {
            about: "Informazioni su Enigm Scan",
            edit: "Modifica",
            window: "Finestra",
            help: "Aiuto",
            how: "Come funziona Enigm Scan",
            hide: "Nascondi Enigm Scan",
            hide_others: "Nascondi altre",
            show_all: "Mostra tutte",
            quit: "Esci da Enigm Scan",
            undo: "Annulla",
            redo: "Ripeti",
            cut: "Taglia",
            copy: "Copia",
            paste: "Incolla",
            select_all: "Seleziona tutto",
            minimize: "Contrai",
            close: "Chiudi finestra",
        },
        "pt" => Labels {
            about: "Acerca do Enigm Scan",
            edit: "Edição",
            window: "Janela",
            help: "Ajuda",
            how: "Como funciona o Enigm Scan",
            hide: "Ocultar Enigm Scan",
            hide_others: "Ocultar outros",
            show_all: "Mostrar tudo",
            quit: "Sair do Enigm Scan",
            undo: "Desfazer",
            redo: "Refazer",
            cut: "Cortar",
            copy: "Copiar",
            paste: "Colar",
            select_all: "Selecionar tudo",
            minimize: "Minimizar",
            close: "Fechar janela",
        },
        _ => Labels {
            about: "About Enigm Scan",
            edit: "Edit",
            window: "Window",
            help: "Help",
            how: "How Enigm Scan works",
            hide: "Hide Enigm Scan",
            hide_others: "Hide Others",
            show_all: "Show All",
            quit: "Quit Enigm Scan",
            undo: "Undo",
            redo: "Redo",
            cut: "Cut",
            copy: "Copy",
            paste: "Paste",
            select_all: "Select All",
            minimize: "Minimize",
            close: "Close Window",
        },
    }
}

/// "About Enigm Scan" in the given language, also the About window's title.
pub fn about_title(language: &str) -> &'static str {
    labels(language).about
}

pub fn build(app: &AppHandle, language: &str) -> tauri::Result<Menu<Wry>> {
    let l = labels(language);
    // The system About panel shows only a small icon and one line; the app
    // opens its own window instead (see `open_about` in main.rs).
    let about = MenuItem::with_id(app, ABOUT, l.about, true, None::<&str>)?;
    let how = MenuItem::with_id(app, HELP, l.how, true, None::<&str>)?;
    let separator = || PredefinedMenuItem::separator(app);
    let cut = PredefinedMenuItem::cut(app, Some(l.cut))?;
    let copy = PredefinedMenuItem::copy(app, Some(l.copy))?;
    let paste = PredefinedMenuItem::paste(app, Some(l.paste))?;
    let select_all = PredefinedMenuItem::select_all(app, Some(l.select_all))?;
    let quit = PredefinedMenuItem::quit(app, Some(l.quit))?;
    let edit = Submenu::with_items(
        app,
        l.edit,
        true,
        &[
            &PredefinedMenuItem::undo(app, Some(l.undo))?,
            &PredefinedMenuItem::redo(app, Some(l.redo))?,
            &separator()?,
            &cut,
            &copy,
            &paste,
            &select_all,
        ],
    )?;
    let app_menu = Submenu::with_items(
        app,
        "Enigm Scan",
        true,
        &[
            &about,
            &separator()?,
            &PredefinedMenuItem::services(app, None)?,
            &separator()?,
            &PredefinedMenuItem::hide(app, Some(l.hide))?,
            &PredefinedMenuItem::hide_others(app, Some(l.hide_others))?,
            &PredefinedMenuItem::show_all(app, Some(l.show_all))?,
            &separator()?,
            &quit,
        ],
    )?;
    let window = Submenu::with_items(
        app,
        l.window,
        true,
        &[
            &PredefinedMenuItem::minimize(app, Some(l.minimize))?,
            &PredefinedMenuItem::close_window(app, Some(l.close))?,
        ],
    )?;
    let help = Submenu::with_items(app, l.help, true, &[&how])?;
    Menu::with_items(app, &[&app_menu, &edit, &window, &help])
}

#[cfg(test)]
mod tests {
    use super::labels;
    #[test]
    fn every_language_names_the_menus() {
        for language in ["en", "es", "fr", "de", "it", "pt", "zz"] {
            let l = labels(language);
            for label in [l.about, l.quit, l.how, l.edit, l.help] {
                assert!(!label.is_empty(), "{language}");
            }
        }
        assert_eq!(labels("es").quit, "Salir de Enigm Scan");
        assert_eq!(labels("zz").quit, "Quit Enigm Scan");
    }
}
