import*as manual from'./manual.js';
const REGISTRY={manual};
function assertProvider(p){if(!p||typeof p.name!=='string'||typeof p.createPayment!=='function'||typeof p.verifyPayment!=='function')throw new Error('invalid payment provider');return p}
export function getProvider(env){const key=String(env.PAYMENT_PROVIDER||'manual').toLowerCase().trim();const p=REGISTRY[key];if(!p)throw new Error('unsupported payment provider');return assertProvider(p)}
export function listProviders(){return Object.keys(REGISTRY)}
