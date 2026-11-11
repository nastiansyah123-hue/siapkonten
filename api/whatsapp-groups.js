import { createClient } from '@supabase/supabase-js';
const validGroup=id=>typeof id==='string'&&/^[\d-]+@g\.us$/.test(id);
async function fonnte(path,token){
 const response=await fetch('https://api.fonnte.com/'+path,{method:'POST',headers:{Authorization:token},signal:AbortSignal.timeout(15000)});
 const payload=await response.json();
 if(!response.ok)throw Error('Fonnte belum merespons dengan baik. Coba lagi nanti.');
 if(payload.status!==true){
 if(path==='get-whatsapp-group'&&payload.detail==='you have no whatsapp group yet')return {data:[],status:true};
 if(payload.detail==='token invalid')throw Error('Token Fonnte tidak valid. Periksa ENV FONNTE_TOKEN di Vercel.');
 throw Error('Fonnte belum bisa mengambil grup. Pastikan perangkat terhubung dan nomor WA sudah bergabung ke grup, lalu coba Sinkronkan lagi.');
 }
 return payload;
}
const normalize=payload=>(Array.isArray(payload.data)?payload.data:[]).filter(g=>validGroup(g.id)&&typeof g.name==='string').map(g=>({id:g.id,name:g.name.slice(0,200)}));
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(!['GET','POST'].includes(req.method)){res.setHeader('Allow','GET, POST');return res.status(405).json({error:'Metode tidak didukung'})}
 if(req.headers.origin){try{if(new URL(req.headers.origin).host!==req.headers.host)return res.status(403).json({error:'Origin tidak valid'})}catch{return res.status(403).json({error:'Origin tidak valid'})}}
 const jwt=req.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
 if(!jwt)return res.status(401).json({error:'Silakan login'});
 if(!process.env.VITE_SUPABASE_URL||!process.env.VITE_SUPABASE_PUBLISHABLE_KEY)return res.status(503).json({error:'Konfigurasi Supabase belum lengkap'});
 const db=createClient(process.env.VITE_SUPABASE_URL,process.env.VITE_SUPABASE_PUBLISHABLE_KEY,{global:{headers:{Authorization:'Bearer '+jwt}},auth:{persistSession:false,autoRefreshToken:false}});
 try{
 const {data:{user},error:authError}=await db.auth.getUser(jwt);
 if(authError||!user)return res.status(401).json({error:'Sesi berakhir. Login ulang.'});
 const {data:me,error:memberError}=await db.from('kontenflow_members').select('role').eq('email',user.email.toLowerCase()).single();
 if(memberError||me?.role!=='admin')return res.status(403).json({error:'Khusus admin'});
 const body=req.method==='POST'?(typeof req.body==='string'?JSON.parse(req.body):req.body)||{}:{};
 if(req.method==='POST'&&!['sync','save'].includes(body.action))return res.status(400).json({error:'Aksi tidak valid'});
 const {data:settings,error:settingsError}=await db.from('kontenflow_wa_settings').select('*').eq('id',true).maybeSingle();
 if(settingsError)return res.status(503).json({error:'Pengaturan grup belum tersedia. Pasang SQL 004_whatsapp_groups.sql terlebih dahulu.'});
 if(!process.env.FONNTE_TOKEN)return res.status(503).json({error:'Isi FONNTE_TOKEN di ENV Vercel, lalu redeploy.'});
 let synced=false;
 if(body.action==='sync'){await fonnte('fetch-group',process.env.FONNTE_TOKEN);synced=true;}
 const groups=normalize(await fonnte('get-whatsapp-group',process.env.FONNTE_TOKEN));
 if(body.action==='save'){
 const selected=groups.find(g=>g.id===body.groupId);
 if(!selected)return res.status(400).json({error:'Grup tidak ada pada daftar perangkat Fonnte. Sinkronkan ulang.'});
 const {error}=await db.from('kontenflow_wa_settings').upsert({id:true,group_id:selected.id,group_name:selected.name,updated_at:new Date().toISOString()},{onConflict:'id'});
 if(error)return res.status(500).json({error:'Grup belum berhasil disimpan. Coba lagi.'});
 return res.status(200).json({ok:true,group:selected});
 }
 return res.status(200).json({groups,selected:settings?{id:settings.group_id,name:settings.group_name}:null,envTarget:process.env.FONNTE_TARGET||null,synced});
 }catch(error){return res.status(502).json({error:error.name==='TimeoutError'?'Sinkronisasi Fonnte belum selesai. Tunggu sebentar, lalu klik Muat ulang daftar.':error.message||'Belum bisa memuat grup Fonnte.'})}
}
