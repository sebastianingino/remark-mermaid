import { test, expect } from "bun:test";
import { Glob } from "bun";

import type { RemarkMermaidOptions } from "./remark-mermaid";
import { VFile } from "vfile";
import remarkMermaid from "./remark-mermaid";
import { remark } from "remark";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import path from "node:path";

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

      // console.log(htmlResult.value);
    expect(htmlResult.value.toString().trim()).toBe(expectedHTMLContent.trim());
  });
}

// testFixturesDirectory<RemarkMermaidOptions>({
//   directory: new URL("../fixtures", import.meta.url),
//   prettier: true,
//   tests: {
//     "expected.md"(input, options) {
//       return remark().use(remarkMermaid, options).process(input);
//     },

//     "expected.html"(input, options) {
//       return remark()
//         .use(remarkMermaid, options)
//         .use(remarkRehype)
//         .use(rehypeStringify)
//         .process(input);
//     },
//   },
// });
