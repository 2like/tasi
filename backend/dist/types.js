"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRequestSchema = void 0;
const zod_1 = require("zod");
exports.ChatRequestSchema = zod_1.z.object({
    message: zod_1.z.string().min(1),
    sessionId: zod_1.z.string().uuid().optional(),
});
//# sourceMappingURL=types.js.map