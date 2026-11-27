// The commit a git checkout is at, read from its .git directory so the
// converters do not need to run git.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export function gitHead(checkout) {
  const git = join(checkout, ".git");
  const head = readFileSync(join(git, "HEAD"), "utf8").trim();
  const ref = head.startsWith("ref: ") ? head.slice(5) : null;
  if (!ref) return head;
  if (existsSync(join(git, ref)))
    return readFileSync(join(git, ref), "utf8").trim();
  const packed = existsSync(join(git, "packed-refs"))
    ? readFileSync(join(git, "packed-refs"), "utf8")
    : "";
  for (const line of packed.split("\n")) {
    const [commit, name] = line.split(" ");
    if (name === ref) return commit;
  }
  throw new Error(`Cannot resolve ${ref} in ${checkout}`);
}
