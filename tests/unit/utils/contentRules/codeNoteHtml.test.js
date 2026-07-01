/**
 * Content Rules: code/mermaid notes must accept HTML-like content
 *
 * Regression test — code notes store content verbatim as plain text, so content
 * that merely "looks like" HTML (JSX, generics, XML, HTML source) must NOT be
 * rejected. Trilium's own UI accepts this content; the MCP server must too.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import { validateContentForNoteType } from '../../../../build/utils/contentRules.js';

describe('Content Rules: code/mermaid notes accept HTML-like content', () => {
  const htmlLikeCodeSamples = [
    ['HTML source', '<div class="card"><h1>Hello</h1></div>'],
    ['JSX', 'const el = <Button onClick={fn}>Go</Button>;'],
    ['C++ generics', 'std::vector<int> v; auto m = std::map<std::string,int>();'],
    ['Java generics', 'List<String> xs = new ArrayList<>();'],
    ['XML', '<config><item id="1"/></config>'],
    ['HTML entity', 'const s = "a &amp; b";'],
  ];

  for (const noteType of ['code', 'mermaid']) {
    for (const [label, content] of htmlLikeCodeSamples) {
      it(`accepts ${label} in a ${noteType} note`, async () => {
        const result = await validateContentForNoteType(content, noteType);
        assert.strictEqual(result.valid, true, result.error);
        // Content must round-trip verbatim (trimmed), never mangled or wrapped.
        assert.strictEqual(result.content, content);
      });
    }
  }

  it('still accepts plain code', async () => {
    const result = await validateContentForNoteType('def fibonacci(n):\n    return n', 'code');
    assert.strictEqual(result.valid, true);
  });
});
