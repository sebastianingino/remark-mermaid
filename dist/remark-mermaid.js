import { createHTMLWindow } from "svgdom";
import mermaid from "mermaid";
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import { visitParents } from "unist-util-visit-parents";
import { fromHtmlIsomorphic } from "hast-util-from-html-isomorphic";
const _window = new JSDOM("").window;
const DOMPurify = createDOMPurify(_window);
Object.assign(createDOMPurify, DOMPurify);
const svgWindow = createHTMLWindow();
globalThis.document = svgWindow.document;
const render = async (options, chart) => {
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
    }
    catch (error) {
        return {
            reason: String(error),
        };
    }
};
const remarkMermaid = (options) => {
    return (ast, file) => {
        const instances = [];
        visitParents(ast, { type: "code", lang: "mermaid" }, (node, ancestors) => {
            instances.push({
                parent: ancestors[ancestors.length - 1],
                node,
            });
        });
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
                                .children,
                        },
                    };
                }
                else if (options?.errorFallback !== undefined) {
                    const fallback = options.errorFallback(node, result.reason || "", file);
                    if (fallback) {
                        parent.children[nodeIndex] = fallback;
                    }
                    else {
                        parent.children.splice(nodeIndex, 1); // Remove the node if no fallback is provided
                    }
                }
                else {
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
