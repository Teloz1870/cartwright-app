import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * APP-DOCS-BACKUP-SYNC: the backup page follows the engine's runbook.
 *
 * Engine #659 (BACKUP-CRON-500, merged as 3993bf5e, shipped in v0.63.0) gives the
 * nightly database backup its own Blob token. resolveBackupBlobToken tries
 * BACKUP_BLOB_READ_WRITE_TOKEN, then BLOB_READ_WRITE_TOKEN
 * (lib/backup/storage.ts:23-24, :61-69). The upload is `access: "private"`
 * with that token passed explicitly (lib/backup/dump.ts:104-110). With neither,
 * /api/cron/backup answers 503 before it dumps anything
 * (app/api/cron/backup/route.ts:65-78), and every outcome is one
 * `[cron/backup]` log line (:36-40). The steps (a private store created in an
 * unlinked directory, an EU region, a Production-only token, `--rw-token` to
 * fetch) are docs/backup-restore.md. This site's page was last synced at engine
 * v0.21.0 and said the cron needs BLOB_READ_WRITE_TOKEN.
 *
 * The first rule walks every surface. A line that names the backup job or its
 * CLI together with the media token must name the backup token as well, or say
 * which release it describes. The changelog is history.
 */
const ROOT = join(__dirname, '..');
const DIRS = ['app', 'components', 'content', 'lib'];
const SKIP_DIRS = new Set(['node_modules', '.next', '.source', 'changelog']);
const FILE = /\.(?:ts|tsx|md|mdx)$/;

function surfaces(): string[] {
  const found: string[] = [];
  const walk = (rel: string) => {
    for (const entry of readdirSync(join(ROOT, rel), { withFileTypes: true })) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const child = `${rel}/${entry.name}`;
      if (entry.isDirectory()) walk(child);
      else if (FILE.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) found.push(child);
    }
  };
  for (const dir of DIRS) walk(dir);
  return found;
}

const PAGE = 'content/docs/deployment/backup-restore.mdx';
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');
const BACKUP_JOB = /cron\/backup|backup-turso\.ts/;
const MEDIA_TOKEN = /(?<!BACKUP_)BLOB_READ_WRITE_TOKEN/;

describe('the backup page says what the engine backs up with', () => {
  const files = surfaces();
  const page = read(PAGE);
  const lineWith = (needle: string) => page.split('\n').find((l) => l.includes(needle)) ?? '';

  it('walks the docs, including the backup page', () => {
    expect(files).toContain(PAGE);
    expect(files.some((f) => f.startsWith('app/changelog/'))).toBe(false);
  });

  it('never names the backup job with the media token alone', () => {
    const backupLines = files.flatMap((rel) =>
      read(rel)
        .split('\n')
        .map((line, i) => ({ rel, i, line }))
        .filter(({ line }) => BACKUP_JOB.test(line)),
    );
    expect(backupLines.some(({ line }) => line.includes('BACKUP_BLOB_READ_WRITE_TOKEN'))).toBe(true);
    const offenders = backupLines
      .filter(({ line }) => MEDIA_TOKEN.test(line) && !/BACKUP_BLOB_READ_WRITE_TOKEN|v0\.62\.0/.test(line))
      .map(({ rel, i, line }) => `${rel}:${i + 1}: ${line.trim().slice(0, 100)}`);
    expect(offenders).toEqual([]);
  });

  it('gives the nightly job its own token, and the media token only as the private-store fallback', () => {
    expect(lineWith('`/api/cron/backup` runs daily')).toMatch(
      /It needs `CRON_SECRET`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` and \*\*`BACKUP_BLOB_READ_WRITE_TOKEN`\*\* on the Vercel project\./,
    );
    const priv = lineWith('**The backup store must be private.**');
    expect(priv).toMatch(/If the shop's only store is private, there is nothing to do: backups fall back to `BLOB_READ_WRITE_TOKEN`\./);
    expect(priv).toMatch(/If its media store is public, or it has no store at all, give backups a private store of their own\./);
    expect(page).toContain('BACKUP_BLOB_READ_WRITE_TOKEN="…" … npx tsx scripts/backup-turso.ts --write --upload');
  });

  it('creates the store private, unconnected and in a region chosen up front', () => {
    expect(page).toMatch(/Set that store up \*\*without connecting it to the project\*\*\./);
    expect(page).toContain('env -u VERCEL_ORG_ID -u VERCEL_PROJECT_ID -u NOW_ORG_ID -u NOW_PROJECT_ID');
    expect(page).toContain('vercel blob create-store <project>-backups --access private --region <region> --scope <team>');
    const region = lineWith('**Create the store**');
    expect(region).toMatch(/Without `--region` the store is created in `iad1` \(Washington, D\.C\.\)/);
    expect(region).toMatch(/pass an EU region: `fra1` \(Frankfurt\), `arn1` \(Stockholm\), `cdg1` \(Paris\) or `dub1` \(Dublin\)/);
    expect(page).toContain(`'.stores[] | select(.id == $id) | .projects == []'`);
  });

  it('adds the token in Production only and never under the default BLOB names', () => {
    expect(page).toContain('printf %s "$TOKEN" | vercel env add BACKUP_BLOB_READ_WRITE_TOKEN production --sensitive');
    expect(lineWith('**Fallback: connect the store under a prefix.**')).toMatch(/untick \*\*Preview\*\* and leave Development off, so only Production is ticked/);
    expect(page).toMatch(/\*\*Never connect the backup store under the default `BLOB` names\.\*\*/);
  });

  it('fetches a backup with the backup store\'s token, passed as --rw-token', () => {
    expect(page).toContain('vercel blob list --prefix backups/backup-<yyyy>-<mm> --limit 1000 --rw-token "$TOKEN"');
    expect(page).toContain('vercel blob get backups/backup-<ts>.json --access private --rw-token "$TOKEN" --output backups/backup-<ts>.json');
    expect(page).toMatch(/Both stop without a token, because an empty `--rw-token` would fall back to the media store's credentials\./);
  });

  it('says what the job answers and logs without a token, and what v0.62.0 does instead', () => {
    expect(page).toMatch(/With neither variable set, the job answers `503` with `"error":"backup storage not configured"` and `"missing":"BACKUP_BLOB_READ_WRITE_TOKEN"`, before it reads the database, and takes no backup/);
    for (const outcome of ['ok', 'not_configured', 'failed']) {
      expect(page).toContain(`\`"outcome":"${outcome}"\``);
    }
    expect(page).toMatch(/## Restore[\s\S]*### Fetch a nightly backup/);
    expect(page).toMatch(/### On v0\.62\.0\n\nThe job and `--upload` read `BLOB_READ_WRITE_TOKEN` only/);
  });

  it('keeps every shell block on the page free of comments, as the runbook does', () => {
    const blocks = [...page.matchAll(/```bash\n([\s\S]*?)```/g)].map((m) => m[1]);
    expect(blocks.length).toBeGreaterThan(5);
    const comments = blocks.flatMap((b) => b.split('\n').filter((l) => /(^|\s)#/.test(l)));
    expect(comments).toEqual([]);
  });
});
