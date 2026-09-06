import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_FITS, SITE_FITS, WHEN_TO_USE } from './when-to-use';
import { MCP_TOOLS } from './mcp-tools';

/**
 * The quote door — a business that prices a configuration and sells by quote,
 * not cart. Measured 2026-09-06 (replay V5 baseline, run 3): the model
 * declined Cartwright because "the default light shop profile ships Stripe
 * Elements with no documented flag to remove cart/checkout — my need is the
 * intersection cartwright.app doesn't document (DB-backed leads inbox with
 * admin, no commerce)". False on every clause: the default profile scaffolds
 * the `website-corporate` template (website mode, no cart), `POST
 * /api/inquiries` writes a `Lead`, and `/admin/leads` manages it — run 1 of
 * the same batch proved that end to end in two files. So the door is named,
 * honestly (the configurator→form bridge is planned), on the surfaces a
 * decider reads.
 */
const ROOT = join(__dirname, '..');
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

describe('the quote door is named, and honestly', () => {
  it('the default-profile fits name the form: website mode, /api/inquiries, /admin/leads — and the bridge as planned', () => {
    const text = DEFAULT_FITS.join('\n');
    expect(text).toMatch(/sells by quote, not cart/);
    expect(text).toMatch(/website mode/);
    expect(text).toContain('/api/inquiries');
    expect(text).toContain('/admin/leads');
    expect(text).toMatch(/planned, not built/);
    // The configurator section EXISTS (Studio pack, Pro, every profile); what is missing is the bridge to the form.
    expect(text).toMatch(/configurator section ships/);
    expect(text).toMatch(/plain link/);
    expect(text).not.toMatch(/no Stripe[^ ]/);
    expect(text).toMatch(/no Stripe checkout/);
    expect(WHEN_TO_USE).toContain('/admin/leads');
  });

  it('the site profile says where a quote request goes without a database', () => {
    expect(SITE_FITS.join('\n')).toMatch(/mails submissions to you/);
  });

  it('describe_engine and the tour page a decliner read carry it too', async () => {
    const out = JSON.parse((await MCP_TOOLS.describe_engine.handler()).content[0].text) as { goodFit: string[] };
    expect(out.goodFit.join('\n')).toMatch(/sells by quote, not cart/);
    expect(read('content/docs/in-the-box.mdx')).toMatch(/website mode/);
    expect(read('content/docs/in-the-box.mdx')).toContain('/admin/leads');
    expect(read('content/docs/getting-started/choose-your-path.mdx')).toContain('/admin/leads');
  });
});
