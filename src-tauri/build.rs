fn main() {
    // The date of the commit being built, shown as the release date in the
    // About window. Empty when the source is not a git checkout.
    let date = std::process::Command::new("git")
        .args(["log", "-1", "--format=%cs"])
        .output()
        .ok()
        .filter(|out| out.status.success())
        .and_then(|out| String::from_utf8(out.stdout).ok())
        .map(|date| date.trim().to_string())
        .filter(|date| date.len() == 10)
        .unwrap_or_default();
    println!("cargo:rustc-env=ENIGM_RELEASE_DATE={date}");
    println!("cargo:rerun-if-changed=../.git/HEAD");
    tauri_build::build()
}
