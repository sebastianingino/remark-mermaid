# remark-mermaid

A [remark](https://remark.js.org) plugin to render [mermaid](https://mermaid-js.github.io) diagrams. No playwright!

> This plugin is heavily based on the original (now archived) [remark-mermaidjs](https://github.com/remcohaszing/remark-mermaidjs) and is designed to work more easily with the latest versions of mermaid.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API](#api)
  - [`unified().use(remarkMermaid, options?)`](#unifieduseremarkmermaid-options)
- [Related Projects](#related-projects)

## Installation

```sh
npm install remark-mermaid
```

## Usage

This plugin takes all code blocks marked as `mermaid` and renders them as an inline SVG.

```js
import { readFile } from "node:fs/promises";

import { remark } from "remark";
import remarkMermaid from "remark-mermaidjs";

const { value } = await remark()
  .use(remarkMermaid, {
    /* Options */
  })
  .process(await readFile("readme.md"));

console.log(value);
```

## API

This package has a default export `remarkMermaid`.

### `unified().use(remarkMermaid, options?)`

#### `errorFallback`

Create a fallback node if processing of a mermaid diagram fails. If nothing is returned, the code
block is removed. The function receives the following arguments:

- `node`: The mdast `code` node that couldn't be rendered.
- `error`: The error message that was thrown.
- `file`: The file on which the error occurred.

#### `mermaidConfig`

The [mermaid config](https://mermaid.js.org/config/schema-docs/config.html) to use.

#### `prefix`

A custom prefix to use for Mermaid IDs. (`string`, default: `mermaid`)

## Related Projects

- [`mermaid`](https://mermaid.js.org) is the library that's used to render the diagrams.
- [`remark-mermaidjs`](https://github.com/remcohaszing/remark-mermaidjs) is the original plugin that this project is based on.
- [`rehype-mermaid`](https://github.com/remcohaszing/rehype-mermaid) is a more powerful plugin that
  does the same as remark-mermaidjs, but as a [rehype](https://github.com/rehypejs/rehype) plugin. It also uses Playwright to render the diagrams.
