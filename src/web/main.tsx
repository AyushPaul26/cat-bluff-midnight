import { Buffer } from 'buffer';
import { createRoot } from 'react-dom/client';
import './style.css';

// The browser SDK uses Buffer; install the narrow polyfill before loading it.
(globalThis as typeof globalThis & {Buffer:typeof Buffer}).Buffer=Buffer;
const root=createRoot(document.getElementById('root')!);
void import('./App.tsx').then(({default:App})=>root.render(<App/>)).catch(()=>{
  root.render(<main className="wrap"><h1>Cat Bluff couldn’t start</h1><p>Reload this page in a supported browser. Check the setup instructions if the problem continues.</p></main>);
});
