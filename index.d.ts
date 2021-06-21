/**
 * window as server to be connected.
 */
interface ServerObject {
  /**
   * the server may be a frame.contentWindow、a new opened window、window.parent or window.opener
   */
  server: Window;
  origin: string;
}
interface IframeServerObject extends ServerObject {
  frame: HTMLIFrameElement
}
declare namespace utils {
  function resolveOrigin(url: string): string;
  function getIframeServer(iframeRoot: HTMLElement, url: string, name: string, styleList?: string[]): IframeServerObject;
  function getOpenedServer(url: string): ServerObject;
}
interface Options {
  /**
   * timeout is set for client to connect with server, or for client and server's response of postMessage.then.
   */
  timeout?: number;
  /**
   * eventFilter is filter for post messages event.
   */
  eventFilter?: (e: any) => boolean;
  /**
   * called when connection destroyed.
   */
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
/**
 * postMessage listener. method can be any customize event name.
 */
type PostMessageListener = (method: string, payload: PostMessagePayload, response: (response: PostMessageResponse) => void) => void;
interface ConnectCallback {
  /**
   * post a message with a named event and payload data.
   */
  postMessage: (method: string, payload: PostMessagePayload) => Promise<PostMessageResponse>;
  listenMessage: (listener: PostMessageListener) => void;
  /**
   * to destroy the connection
   */
  destroy: () => void;
}
/**
 * client use `callServer` to connect with server unless timeout. You can use the same `serverObject` to create more client-caller if necessary. (the server may be a frame.contentWindow、a new opened window、window.parent or window.opener)
 * @param serverObject 
 * @param options 
 */
export function callServer(serverObject: ServerObject, options: ClientOptions): Promise<ConnectCallback>;
/**
 * server use `startListening` to start a server listening, each server listening can only connect with one client. You can start more than one listening if necessary.
 */
export function startListening(options: ServerOptions): Promise<ConnectCallback>;
