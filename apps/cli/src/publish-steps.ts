import pc from "picocolors";

/**
 * The success banner's two claims about GitHub — does the CI workflow run, and
 * is the code already there — and the command that makes them true.
 *
 * A workflow file only runs once GitHub has the commit that holds it, and
 * "on every push" before that LOOKS like coverage, so nobody goes looking for
 * a green mark that has never existed. Since `create-cartwright .` accepts a
 * fresh clone, a remote no longer proves the code was pushed: in a clone the
 * remote was there before the scaffold, and the scaffold commit (or, with
 * --no-git, the scaffold itself) exists only on this machine.
 */
export interface PublishState {
  slug: string;
  ciWritten: boolean;
  gitInitialized: boolean;
  /** The folder's remote before anything was written (prepareScaffoldTarget). */
  remoteBefore: string | undefined;
  /** A remote exists now — after this run's optional `gh repo create --push`. */
  remoteNow: boolean;
}

const CI_FILE = ".github/workflows/ci.yml";

export function publishSteps(s: PublishState): { ci: string; step1: string } {
  const ciClause = s.ciWritten ? " — this also turns on the CI above" : "";
  const inactive = (until: string) =>
    s.ciWritten ? `${pc.yellow("!")} CI workflow written (${CI_FILE}) — ${pc.bold("inactive")} ${until}` : "";

  if (s.remoteBefore !== undefined) {
    const remote = s.remoteBefore;
    const push = `git push -u ${remote} HEAD`;
    return s.gitInitialized
      ? {
          ci: inactive(`until you push the scaffold commit to ${remote}`),
          step1: pc.dim(
            `  1. Push the scaffold commit to ${remote}, the remote this folder already has${ciClause}:\n     ${push}`,
          ),
        }
      : {
          ci: inactive(`until you commit it and push to ${remote}`),
          step1: pc.dim(
            `  1. Commit the scaffold and push it to ${remote}, the remote this folder already has${ciClause}:\n` +
              `     git add -A && git commit -m "feat: initial commit from create-cartwright" && ${push}`,
          ),
        };
  }
  if (s.remoteNow) {
    return {
      ci: s.ciWritten ? `${pc.green("✓")} CI workflow written (${CI_FILE}) — runs on every push` : "",
      step1: pc.dim("  1. Your code is already on GitHub ✓"),
    };
  }
  return {
    ci: inactive("until this project has a remote"),
    step1: pc.dim(
      `  1. Push this folder to a private GitHub repo${ciClause}:\n     gh repo create ${s.slug} --private --source=. --remote=origin --push`,
    ),
  };
}
