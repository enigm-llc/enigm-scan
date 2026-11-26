# Enigm compatibility backport

Base: published `glib` 0.18.5 crate, SHA-256 `233daaf6e83ae6a12a52055f568f9d7cf4671dabb78ff9560ab6da230ce00ee5`.

License and copyright are preserved in LICENSE and COPYRIGHT. Original Cargo.toml.orig is retained. The package version adds `+enigm.1` metadata; no GTK API upgrade is attempted.

The only runtime change is the two-line upstream correction to `VariantStrIter::impl_get`: declare the output pointer mutable and pass `&mut p` to the variadic GLib call. This backports [gtk-rs-core PR 1343](https://github.com/gtk-rs/gtk-rs-core/pull/1343), addressing [RUSTSEC-2024-0429](https://rustsec.org/advisories/RUSTSEC-2024-0429.html). A release-mode regression test exercises both iterator directions in `src-tauri/tests/glib_regression.rs`.

This path patch is temporary while the Linux GTK3 dependency chain requires glib 0.18. Remove it only when an upstream-compatible version includes the correction and the regression still passes. Version-only advisory scanners may continue to flag the 0.18 API line; preserve this source-level provenance rather than silently ignoring advisories. The backport does not claim to remediate unrelated GTK3 maintenance risks.

Cargo.toml also allows two upstream style lints (`mismatched_lifetime_syntaxes`, `unused_parens`) that newer compilers report in the unchanged 0.18.5 source. Cargo caps lints for registry crates in the same way; it does not for a path copy.
