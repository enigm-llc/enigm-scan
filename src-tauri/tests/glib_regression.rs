#![cfg(target_os = "linux")]
use glib::variant::ToVariant;

#[test]
fn variant_strings_survive_optimized_forward_and_backward_iteration() {
    let variant = vec!["first", "middle", "last"].to_variant();
    let mut iterator = variant.array_iter_str().unwrap();
    assert_eq!(iterator.next(), Some("first"));
    assert_eq!(iterator.next_back(), Some("last"));
    assert_eq!(iterator.next(), Some("middle"));
    assert_eq!(iterator.next(), None);
    assert_eq!(iterator.next_back(), None);
}
