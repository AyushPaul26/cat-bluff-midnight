// Browser-only Vite alias: SDK imports the named WebSocket constructor,
// while isomorphic-ws's upstream browser entry exports only a default.
export const WebSocket = globalThis.WebSocket;
export default WebSocket;
