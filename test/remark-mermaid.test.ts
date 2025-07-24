import { test, expect } from "bun:test";
import { Glob } from "bun";

import type { RemarkMermaidOptions } from "../dist/remark-mermaid";
import { VFile } from "vfile";
import remarkMermaid from "../dist/remark-mermaid";
import { remark } from "remark";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import path from "node:path";
import { evaluate } from "@mdx-js/mdx";
import { createElement } from "react";
import * as runtime from 'react/jsx-runtime.js'
import { renderToString } from "react-dom/server";

const fixtures = path.resolve(import.meta.dirname, "../fixtures");
const glob = new Glob("*");
for (const dir of glob.scanSync({ cwd: fixtures, onlyFiles: false })) {
  const dirPath = path.join(fixtures, dir);
  const input = Bun.file(dirPath + "/input.md");

  let options: RemarkMermaidOptions = {};
  if (await Bun.file(dirPath + "/options.js").exists()) {
    options = (await import(dirPath + "/options.js")).default;
  }
  const expectedMarkdown = Bun.file(dirPath + "/expected.md");
  const expectedHTML = Bun.file(dirPath + "/expected.html");

  test(`remark-mermaid: ${dir}`, async () => {
    const inputContent = await input.text();

    const expectedMarkdownContent = await expectedMarkdown.text();
    const expectedHTMLContent = await expectedHTML.text();

    const markdownResult = await remark()
      .use(remarkMermaid, options)
      .process(new VFile({ path: "input.md", value: inputContent }));

    expect(markdownResult.value).toBe(expectedMarkdownContent);

    const htmlResult = await remark()
      .use(remarkMermaid, options)
      .use(remarkRehype)
      .use(rehypeStringify)
      .process(new VFile({ path: "input.md", value: inputContent }));

    expect(htmlResult.value.toString().trim()).toBe(expectedHTMLContent.trim());
  });
}

test("remark-mermaid mdx", async () => {
  const input = Bun.file("./test/mdx/input.mdx");
  const inputContent = await input.text();

  const file = (await evaluate(new VFile({ path: "input.mdx", value: inputContent }), {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...runtime as any,
    remarkPlugins: [remarkMermaid],
  })).default;

  const html = renderToString(createElement(file));
  const expectedHTML = await Bun.file("./test/mdx/expected.mdx.html").text();

  expect(html.trim()).toBe(expectedHTML.trim());
});
