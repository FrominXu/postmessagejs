interface ServerObject {
  server: Window;
  origin: string;
}
interface IframeServerObject extends ServerObject {
  frame: HTMLIFrameElement
}
declare namespace utils {
  function resolveOrigin(url: string): string;
  function getIframeServer (iframeRoot: HTMLElement, url: string, name: string, styleList?: string[]):IframeServerObject;
  function getOpenedServer (url: string): ServerObject;
}
interface Options {
  timeout?: number;
  eventFilter?: (e: any) => boolean;
  onDestroy?: (info: any) => void;
}
interface ServerOptions extends Options {
  serverInfo?: any;
}
interface ClientOptions extends Options {
  clientInfo?: any;
}
type PostMessagePayload = any;
type PostMessageResponse = any;
type PostMessageListener = (method: string, payload: PostMessagePayload, response: (response: PostMessageResponse)=> void) => void;
interface ConnectCallback {
  postMessage: (method: string, payload: PostMessagePayload) => Promise<PostMessageResponse>;
  listenMessage: (listener: PostMessageListener) => void;
  destroy: () => void;
}
export function callServer(serverObject: ServerObject, options: ClientOptions): Promise<ConnectCallback>;
export function startListening(options: ServerOptions): Promise<ConnectCallback>;
