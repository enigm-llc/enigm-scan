/**
 * Departure-board cascade: when a real phase changes, its name flips in
 * character by character. Spaces stay plain text so the accessible name and
 * text content remain the original string; reduced motion shows it at once.
 */
export function Cascade({ text }: { text: string }) {
  let index = 0;
  return (
    <span className="cascade" key={text}>
      {text.split(/(\s+)/).map((part, p) =>
        /^\s+$/.test(part) ? (
          part
        ) : (
          <span className="cascade-word" key={p}>
            {[...part].map((char, i) => (
              <span
                key={i}
                style={{ animationDelay: `${Math.min(index++, 48) * 16}ms` }}
              >
                {char}
              </span>
            ))}
          </span>
        ),
      )}
    </span>
  );
}
