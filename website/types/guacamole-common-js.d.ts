declare module "guacamole-common-js" {
    namespace Guacamole {
        class Client {
            constructor(tunnel: Tunnel);
            connect(data?: string): void;
            disconnect(): void;
            getDisplay(): Display;
            sendKeyEvent(pressed: number, keysym: number): void;
            sendMouseState(mouseState: Mouse.State): void;
            sendSize(width: number, height: number): void;
            onstatechange: ((state: number) => void) | null;
            onerror: ((status: Status) => void) | null;
            onclipboard: ((stream: InputStream, mimetype: string) => void) | null;
        }

        class Display {
            getElement(): HTMLElement;
            getWidth(): number;
            getHeight(): number;
            scale(scale: number): void;
            onresize: ((width: number, height: number) => void) | null;
        }

        class WebSocketTunnel implements Tunnel {
            constructor(tunnelURL: string);
            connect(data?: string): void;
            disconnect(): void;
            sendMessage(...elements: any[]): void;
            state: number;
            onerror: ((status: Status) => void) | null;
            onstatechange: ((state: number) => void) | null;
        }

        interface Tunnel {
            connect(data?: string): void;
            disconnect(): void;
            sendMessage(...elements: any[]): void;
            state: number;
            onerror: ((status: Status) => void) | null;
            onstatechange: ((state: number) => void) | null;
        }

        class Keyboard {
            constructor(element: HTMLElement | Document);
            onkeydown: ((keysym: number) => void) | null;
            onkeyup: ((keysym: number) => void) | null;
        }

        class Mouse {
            constructor(element: HTMLElement);
            onmousedown: ((state: Mouse.State) => void) | null;
            onmouseup: ((state: Mouse.State) => void) | null;
            onmousemove: ((state: Mouse.State) => void) | null;
        }

        namespace Mouse {
            class State {
                x: number;
                y: number;
                left: boolean;
                middle: boolean;
                right: boolean;
                up: boolean;
                down: boolean;
            }

            class Touchscreen {
                constructor(element: HTMLElement);
                onmousedown: ((state: State) => void) | null;
                onmouseup: ((state: State) => void) | null;
                onmousemove: ((state: State) => void) | null;
            }
        }

        class Status {
            code: number;
            message: string;
            constructor(code: number, message?: string);
        }

        class InputStream {
            constructor(client: Client, index: number);
        }
    }

    export = Guacamole;
    export as namespace Guacamole;
}
