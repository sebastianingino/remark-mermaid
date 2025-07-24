import { type MermaidConfig } from "mermaid";
import { Root, type BlockContent, type Code } from "mdast";
import { type Plugin } from "unified";
import { type VFile } from "vfile";
export interface RemarkMermaidOptions extends MermaidConfig, Omit<MermaidConfig, "startOnLoad" | "securityLevel"> {
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
    errorFallback?: (node: Code, error: string, file: VFile) => BlockContent | undefined | void;
}
declare const remarkMermaid: Plugin<[RemarkMermaidOptions?], Root>;
export default remarkMermaid;
