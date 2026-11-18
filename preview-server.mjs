import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 8765);
const model = process.env.QULIFE_AI_MODEL || 'gpt-5-mini';
const limits = new Map();
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.ico':'image/x-icon','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8'};
const systemPrompt = 'أنت Qulife AI، مساعد عربي ودود وعملي. أجب بلغة المستخدم، واستخدم العربية بوضوح عندما يكتب بالعربية. قدّم إجابات مفيدة ومباشرة، واسأل للتوضيح عند الحاجة. لا تدّعِ أنك نفذت إجراءات في العالم الحقيقي، ولا تخترع معلومات غير مؤكدة. حافظ على سياق المحادثة.';

function json(res, status, body) {
  const text = JSON.stringify(body);
  res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Content-Length':Buffer.byteLength(text),'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  res.end(text);
}
async function readJson(req, maxBytes=48*1024) {
  const parts=[]; let size=0;
  for await (const chunk of req) { size+=chunk.length; if(size>maxBytes) throw new Error('BODY_TOO_LARGE'); parts.push(chunk); }
  try { return JSON.parse(Buffer.concat(parts).toString('utf8')); } catch { throw new Error('INVALID_JSON'); }
}
function allowRequest(ip) {
  const now=Date.now(); const prev=limits.get(ip);
  if(!prev||now-prev.start>60_000){limits.set(ip,{start:now,count:1});return true;}
  if(prev.count>=20)return false; prev.count+=1; return true;
}
function normalizeMessages(value) {
  if(!Array.isArray(value)||value.length<1||value.length>24) return null;
  const messages=[]; let total=0;
  for(const item of value){
    if(!item||!['user','assistant'].includes(item.role)||typeof item.content!=='string') return null;
    const content=item.content.trim(); total+=content.length;
    if(!content||content.length>6000||total>18000) return null;
    messages.push({role:item.role,content});
  }
  if(messages[messages.length-1].role!=='user') return null;
  return messages;
}
async function chat(req,res){
  const ip=(req.socket.remoteAddress||'unknown').replace(/^::ffff:/,'');
  if(!allowRequest(ip)) return json(res,429,{ok:false,error:'طلبات كثيرة خلال وقت قصير. انتظر قليلًا ثم حاول مجددًا.'});
  const key=process.env.OPENAI_API_KEY;
  const base=(process.env.OPENAI_API_BASE||'https://api.openai.com/v1').replace(/\/+$/,'');
  if(!key) return json(res,503,{ok:false,error:'خدمة الذكاء الاصطناعي غير مهيأة على الخادم.'});
  let body;
  try { body=await readJson(req); } catch(error) { return json(res,error.message==='BODY_TOO_LARGE'?413:400,{ok:false,error:error.message==='BODY_TOO_LARGE'?'الطلب أكبر من المسموح.':'بيانات الطلب غير صالحة.'}); }
  const messages=normalizeMessages(body.messages);
  if(!messages) return json(res,400,{ok:false,error:'الرسائل غير صالحة أو طويلة.'});
  try {
    const upstream=await fetch(base+'/chat/completions',{
      method:'POST',headers:{'Authorization':'Bearer '+key,'Content-Type':'application/json'},
      body:JSON.stringify({model,messages:[{role:'system',content:systemPrompt},...messages],reasoning_effort:'low',max_completion_tokens:1600}),
      signal:AbortSignal.timeout(60_000)
    });
    const result=await upstream.json().catch(()=>({}));
    if(!upstream.ok){console.error('AI provider returned HTTP',upstream.status);return json(res,502,{ok:false,error:'تعذّر على المساعد إنشاء رد الآن. حاول مرة أخرى.'});}
    const message=result?.choices?.[0]?.message;
    const reply=typeof message?.content==='string'?message.content:Array.isArray(message?.content)?message.content.filter(part=>part.type==='text').map(part=>part.text).join(''):'';
    if(!reply.trim()) return json(res,502,{ok:false,error:'وصل رد فارغ من المساعد. أعد المحاولة.'});
    return json(res,200,{ok:true,reply:reply.trim()});
  } catch(error) {
    console.error('AI request failed:',error?.name||'Error');
    return json(res,502,{ok:false,error:'تعذّر الاتصال بالمساعد. تحقق من الاتصال ثم أعد المحاولة.'});
  }
}

const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`);
  if(req.method==='POST'&&url.pathname==='/api/ai/chat') return chat(req,res);
  if(req.method==='GET'&&url.pathname==='/api/health') return json(res,200,{ok:true,service:'qulife-preview',aiConfigured:Boolean(process.env.OPENAI_API_KEY),model});
  if(req.method!=='GET'&&req.method!=='HEAD') return json(res,405,{ok:false,error:'Method not allowed'});
  try {
    let pathname=decodeURIComponent(url.pathname);
    if(pathname==='/') pathname='/Layouts/Pages/Index.html';
    if(pathname.split('/').some(part=>part==='..'||part.startsWith('.'))) return json(res,403,{ok:false,error:'Forbidden'});
    const file=path.resolve(root,'.'+pathname);
    if(file!==root&&!file.startsWith(root+path.sep)) return json(res,403,{ok:false,error:'Forbidden'});
    const info=await stat(file);
    if(!info.isFile()) return json(res,404,{ok:false,error:'Not found'});
    const data=await readFile(file);
    res.writeHead(200,{'Content-Type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','Content-Length':data.length,'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Cache-Control':/\.(html|js|css|mjs)$/.test(file)?'no-cache':'public, max-age=3600'});
    if(req.method==='HEAD') return res.end();
    res.end(data);
  } catch { return json(res,404,{ok:false,error:'Not found'}); }
});
server.listen(port,'0.0.0.0',()=>console.log(`Qulife preview on 0.0.0.0:${port}; AI model ${model}; key configured: ${Boolean(process.env.OPENAI_API_KEY)}`));
