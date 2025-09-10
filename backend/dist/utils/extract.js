"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractIdentifierFromText = extractIdentifierFromText;
exports.extractPrefixFromText = extractPrefixFromText;
function extractIdentifierFromText(text) {
    const match = text.match(/\+?\d{8,15}/);
    return match ? match[0] : undefined;
}
function extractPrefixFromText(text) {
    const match = text.match(/\+?\d{3,7}/);
    return match ? match[0] : undefined;
}
//# sourceMappingURL=extract.js.map