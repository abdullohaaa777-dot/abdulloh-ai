import {afterEach,describe,it,expect} from 'vitest';
import express from 'express';
import {ecgRouter} from '../../src/server/ecg/router';
import type {Server} from 'node:http';
let server:Server;
const previous=process.env['ECG_ENABLED'];
afterEach(async()=>{if(previous===undefined)delete process.env['ECG_ENABLED'];else process.env['ECG_ENABLED']=previous;if(server)await new Promise<void>((resolve,reject)=>server.close(e=>e?reject(e):resolve()));});
async function start(){const app=express();app.use('/api/ecg',ecgRouter);server=app.listen(0,'127.0.0.1');await new Promise<void>(resolve=>server.once('listening',resolve));const address=server.address();if(!address || typeof address==='string')throw new Error('No address');return `http://127.0.0.1:${address.port}/api/ecg`;}
describe('ECG API safety boundary',()=>{
 it('defaults to disabled and rejects requests',async()=>{process.env['ECG_ENABLED']='false';const base=await start();expect((await fetch(base+'/config').then(r=>r.json())).enabled).toBe(false);expect((await fetch(base+'/studies')).status).toBe(404);});
 it('never accepts unauthenticated uploads',async()=>{process.env['ECG_ENABLED']='true';const base=await start();const response=await fetch(base+'/studies',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({csv:'II\n0'})});expect([401,503]).toContain(response.status);expect(response.headers.get('cache-control')).toBe('no-store');});
});
