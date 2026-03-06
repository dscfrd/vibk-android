import React, { forwardRef, useImperativeHandle, useRef, useCallback } from 'react'
import { StyleSheet } from 'react-native'
import { WebView } from 'react-native-webview'

const XTERM_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.css"/>
  <script src="https://cdn.jsdelivr.net/npm/xterm@5.3.0/lib/xterm.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/xterm-addon-fit@0.8.0/lib/xterm-addon-fit.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #terminal { width: 100%; height: 100%; overflow: hidden; background: #1a1b26; }
    .xterm { padding: 4px; }
    .xterm-viewport { overflow-y: auto !important; }
  </style>
</head>
<body>
  <div id="terminal"></div>
  <script>
    const term = new Terminal({
      theme: {
        background: '#1a1b26',
        foreground: '#c0caf5',
        cursor: '#c0caf5',
        cursorAccent: '#1a1b26',
        selectionBackground: '#3b4261',
        black: '#15161e',
        red: '#f7768e',
        green: '#9ece6a',
        yellow: '#e0af68',
        blue: '#7aa2f7',
        magenta: '#bb9af7',
        cyan: '#7dcfff',
        white: '#a9b1d6',
        brightBlack: '#414868',
        brightRed: '#f7768e',
        brightGreen: '#9ece6a',
        brightYellow: '#e0af68',
        brightBlue: '#7aa2f7',
        brightMagenta: '#bb9af7',
        brightCyan: '#7dcfff',
        brightWhite: '#c0caf5'
      },
      fontFamily: 'monospace',
      fontSize: 13,
      cursorBlink: true,
      scrollback: 10000,
      allowProposedApi: true
    });

    const fitAddon = new FitAddon.FitAddon();
    term.loadAddon(fitAddon);
    term.open(document.getElementById('terminal'));
    fitAddon.fit();

    term.onData(data => {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'data', data }));
    });

    term.onResize(({ cols, rows }) => {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'resize', cols, rows }));
    });

    window.terminalWrite = function(data) { term.write(data); };
    window.terminalClear = function() { term.clear(); };
    window.terminalFit = function() {
      fitAddon.fit();
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
    };

    setTimeout(() => {
      fitAddon.fit();
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
    }, 100);

    window.addEventListener('resize', () => fitAddon.fit());
  </script>
</body>
</html>
`

interface TerminalWebViewProps {
  onData?: (data: string) => void
  onResize?: (cols: number, rows: number) => void
}

export interface TerminalWebViewRef {
  writeData: (data: string) => void
  clear: () => void
  fit: () => void
}

export const TerminalWebView = forwardRef<TerminalWebViewRef, TerminalWebViewProps>(
  ({ onData, onResize }, ref) => {
    const webViewRef = useRef<WebView>(null)

    const writeData = useCallback((data: string) => {
      // Batch writes for performance — encode as base64 to avoid escaping issues
      const b64 = btoa(unescape(encodeURIComponent(data)))
      webViewRef.current?.injectJavaScript(`terminalWrite(decodeURIComponent(escape(atob('${b64}')))); true;`)
    }, [])

    const clear = useCallback(() => {
      webViewRef.current?.injectJavaScript('terminalClear(); true;')
    }, [])

    const fit = useCallback(() => {
      webViewRef.current?.injectJavaScript('terminalFit(); true;')
    }, [])

    useImperativeHandle(ref, () => ({ writeData, clear, fit }), [writeData, clear, fit])

    const handleMessage = useCallback((event: { nativeEvent: { data: string } }) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data)
        if (msg.type === 'data') onData?.(msg.data)
        else if (msg.type === 'resize') onResize?.(msg.cols, msg.rows)
      } catch { /* ignore */ }
    }, [onData, onResize])

    return (
      <WebView
        ref={webViewRef}
        source={{ html: XTERM_HTML }}
        onMessage={handleMessage}
        style={styles.webView}
        scrollEnabled={false}
        javaScriptEnabled
        originWhitelist={['*']}
      />
    )
  }
)

const styles = StyleSheet.create({
  webView: { flex: 1, backgroundColor: '#1a1b26' }
})
