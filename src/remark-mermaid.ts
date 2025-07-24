import { createHTMLWindow } from "svgdom";
import mermaid, { type MermaidConfig } from "mermaid";
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import { type BlockContent, type Code, type Parent } from "mdast";
import { type ElementContent } from "hast";
import { type Plugin } from "unified";
import { visitParents } from "unist-util-visit-parents";
import { type VFile } from "vfile";
import { fromHtmlIsomorphic } from "hast-util-from-html-isomorphic";

const _window = new JSDOM("").window;
const DOMPurify = createDOMPurify(_window);
Object.assign(createDOMPurify, DOMPurify);

const svgWindow = createHTMLWindow();
(globalThis as any).window = svgWindow;
globalThis.document = window.document;
globalThis["Element"] = window["Element"];

export interface RemarkMermaidOptions
  extends MermaidConfig,
    Omit<MermaidConfig, "startOnLoad" | "securityLevel"> {
  /**
   * Create a fallback node if processing of a mermaid diagram fails.
   *
   * @param node
   *   The mdast `code` node that couldn't be rendered.
   * @param error
   *   The error message that was thrown.
   * @param file
   *   The file on which the error occurred.
   * @returns
   *   A fallback node to render instead of the invalid diagram. If nothing is returned, the code
   *   block is removed
   */
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  errorFallback?: (
    node: Code,
    error: string,
    file: VFile,
  ) => BlockContent | undefined | void;
}

type RenderResult = {
  svg?: string;
  reason?: string;
};

const render = async (
  options: RemarkMermaidOptions,
  chart: string,
): Promise<RenderResult> => {
  try {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      htmlLabels: false,
      flowchart: {
        htmlLabels: false,
      },
      ...options,
    });
    return {
      svg: (await mermaid.render("mermaid", chart)).svg,
    };
  } catch (error) {
    return {
      reason: String(error),
    };
  }
};

const remarkMermaid: Plugin<[RemarkMermaidOptions?]> = (options) => {
  return (ast, file) => {
    const instances: Array<{ parent: Parent; node: Code }> = [];

    visitParents(
      ast,
      { type: "code", lang: "mermaid" },
      (node: Code, ancestors) => {
        instances.push({
          parent: ancestors[ancestors.length - 1] as any,
          node,
        });
      },
    );

    if (instances.length === 0) {
      return;
    }

    const promises = instances.map(async ({ parent, node }) => {
      const chart = node.value;
      return { parent, node, result: await render(options || {}, chart) };
    });

    return Promise.all(promises).then((results) => {
      for (const { parent, node, result } of results) {
        const nodeIndex = parent.children.indexOf(node);

        if (result.svg) {
          parent.children[nodeIndex] = {
            type: "paragraph",
            children: [{ type: "html", value: result.svg }],
            data: {
              hChildren: fromHtmlIsomorphic(result.svg, { fragment: true })
                .children as ElementContent[],
            },
          };
        } else if (options?.errorFallback !== undefined) {
          const fallback = options.errorFallback(
            node,
            result.reason || "",
            file,
          );
          if (fallback) {
            parent.children[nodeIndex] = fallback;
          } else {
            parent.children.splice(nodeIndex, 1); // Remove the node if no fallback is provided
          }
        } else {
          const message = file.message(result.reason || "", {
            ruleId: "remark-mermaid",
            source: "remark-mermaid",
            ancestors: [parent, node],
          });
          message.fatal = true;
          message.url = "https://github.com/sebastianingino/remark-mermaid";
          throw message;
        }
      }
    });
  };
};

export default remarkMermaid;
