import express from 'express';
import {createClient} from '@supabase/supabase-js';
import {measure, parseCsv} from './signal';
import {explain} from './claude';

export const ecgRouter = express.Router();
const attempts = new Map<string, {count:number; until:number}>();
ecgRouter.get('/config', (_req,res) => res.json({enabled:process.env['ECG_ENABLED'] === 'true'}));
ecgRouter.use((req,res,next) => {
  res.setHeader('Cache-Control','no-store');
  if (process.env['ECG_ENABLED'] !== 'true') { res.status(404).json({error:'EKG moduli o‘chirilgan.'}); return; }
  next();
});
ecgRouter.use(async (req,res,next) => {
  try {
    const url=process.env['SUPABASE_URL'], key=process.env['SUPABASE_ANON_KEY'];
    if (!url || !key) {res.status(503).json({error:'Server Supabase konfiguratsiyasi yetishmaydi.'});return;}
    const token=req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    if (!token) {res.status(401).json({error:'Tizimga kiring.'});return;}
    const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:`Bearer ${token}`}}});
    const {data,error}=await client.auth.getUser(token);
    if (error || !data.user) {res.status(401).json({error:'Sessiya yaroqsiz.'});return;}
    res.locals['userId']=data.user.id;
    res.locals['client']=client;
    next();
  } catch {res.status(503).json({error:'Autentifikatsiya xizmati mavjud emas.'});}
});
ecgRouter.use(express.json({limit:'4mb'}));
ecgRouter.get('/studies', async (_req,res) => {
  const {data,error}=await res.locals['client'].from('ecg_studies').select('id,created_at,acquired_at,status,result,interpretation').eq('user_id',res.locals['userId']).order('created_at',{ascending:false}).limit(50);
  if(error) {res.status(503).json({error:'EKG tarixini olish imkonsiz. Migratsiyani tekshiring.'});return;}
  res.json(data);
});
ecgRouter.get('/studies/:id', async (req,res) => {
  if(!/^[0-9a-f-]{36}$/i.test(String(req.params['id']))) {res.status(400).json({error:'ID noto‘g‘ri.'});return;}
  const {data,error}=await res.locals['client'].from('ecg_studies').select('*').eq('id',req.params['id']).eq('user_id',res.locals['userId']).maybeSingle();
  if(error || !data) {res.status(404).json({error:'EKG topilmadi.'});return;}
  res.json(data);
});
ecgRouter.post('/studies', async (req,res) => {
  const userId=res.locals['userId'] as string;
  const now=Date.now();
  for(const [id,entry] of attempts) if(entry.until < now) attempts.delete(id);
  const entry=attempts.get(userId) ?? {count:0,until:now+3600000};
  if(entry.count >= 10) {res.status(429).json({error:'Soatlik limitga yetdingiz.'});return;}
  entry.count++; attempts.set(userId,entry);
  const body=req.body;
  if(!body || typeof body.csv !== 'string' || body.unit !== 'mV' || body.consent !== true) {res.status(400).json({error:'CSV, mV birligi va rozilik kerak.'});return;}
  let signal, result;
  try {signal=parseCsv(body.csv,body.samplingRate);result=measure(signal);} catch(e) {res.status(400).json({error:e instanceof Error?e.message:'CSV noto‘g‘ri.'});return;}
  const serviceKey=process.env['SUPABASE_SERVICE_ROLE_KEY'];
  if(!serviceKey) {res.status(503).json({error:'Server saqlash konfiguratsiyasi yetishmaydi.'});return;}
  const admin=createClient(process.env['SUPABASE_URL']!,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:allowed,error:quotaError}=await admin.rpc('ecg_take_quota',{subject:userId});
  if(quotaError || allowed!==true) {res.status(quotaError?503:429).json({error:'Server saqlash limiti yoki konfiguratsiyasi so‘rovni rad etdi.'});return;}
  const {data,error}=await admin.from('ecg_studies').insert({user_id:userId,signal,result}).select('id,created_at,status,result').single();
  if(error) {res.status(503).json({error:'EKG saqlanmadi. Migratsiyani tekshiring.'});return;}
  res.status(201).json(data);
});
ecgRouter.post('/studies/:id/interpret', async (req,res) => {
 if(req.body?.consent !== true) {res.status(400).json({error:'AI provayderiga uzatish uchun rozilik kerak.'});return;}
 const key=process.env['SUPABASE_SERVICE_ROLE_KEY'];
 if(!key || !process.env['ANTHROPIC_API_KEY'] || !process.env['ANTHROPIC_MODEL']) {res.status(503).json({error:'Claude server konfiguratsiyasi yetishmaydi.'});return;}
 const {data:study,error}=await res.locals['client'].from('ecg_studies').select('id,result,interpretation').eq('id',req.params['id']).eq('user_id',res.locals['userId']).maybeSingle();
 if(error || !study) {res.status(404).json({error:'EKG topilmadi.'});return;}
 if(study.interpretation) {res.json(study.interpretation);return;}
 const admin=createClient(process.env['SUPABASE_URL']!,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:claimed,error:claimError}=await admin.from('ecg_studies').update({model_id:'pending'}).eq('id',study.id).eq('user_id',res.locals['userId']).is('model_id',null).select('id').maybeSingle();
 if(claimError || !claimed) {res.status(409).json({error:'Bu EKG uchun Claude so‘rovi avval yuborilgan. Takroriy xarajat cheklangan.'});return;}
 try {
  const output=await explain({limitations:study.result.limitations});
  const {error:saveError}=await admin.from('ecg_studies').update({interpretation:output.interpretation,model_id:output.model}).eq('id',study.id).eq('user_id',res.locals['userId']);
  if(saveError)throw new Error('AI izohini saqlab bo‘lmadi.');
  res.json(output.interpretation);
 } catch {res.status(502).json({error:'Claude izohi olinmadi. O‘lchovlar saqlangan. Takroriy avtomatik so‘rov yuborilmaydi.'});}
});
ecgRouter.use((err:unknown,_req:express.Request,res:express.Response,_next:express.NextFunction) => {
  void _next;
  const status=typeof err==='object' && err && 'status' in err && err.status===413 ? 413 : 400;
  res.status(status).json({error:status===413?'Fayl hajmi limitdan oshdi.':'So‘rovni qayta ishlash imkonsiz.'});
});
