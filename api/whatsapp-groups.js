import { createClient } from '@supabase/supabase-js';
const validGroup=id=>typeof id==='string'&&/^[\d-]+@g\.us$/.test(id);
async function fonnte(path,token){
 const action=path==='fetch-group'?'sinkronisasi grup':'pemuatan daftar grup';
 let response;
 try{response=await fetch('https://api.fonnte.com/'+path,{method:'POST',headers:{Authorization:token},signal:AbortSignal.timeout(15000)})}
 catch(error){throw Error(error.name==='TimeoutError'?'Fonnte belum menyelesaikan '+action+'. Tunggu sebentar lalu Muat ulang daftar.':'Koneksi ke Fonnte gagal saat '+action+'. Coba lagi sebentar.');}
 let payload;try{payload=await response.json()}catch{throw Error('Fonnte mengembalikan respons tidak valid saat '+action+' (HTTP '+response.status+').')}
 const detail=[payload.detail,payload.reason,payload.message].filter(v=>typeof v==='string'&&v.trim()).join(' · ').split(token).join('[token disembunyikan]').slice(0,350);
 if(path==='get-whatsapp-group'&&response.ok&&detail.toLowerCase().includes('you have no whatsapp group yet'))return {data:[],status:true};
 if(!response.ok||payload.status!==true){
 if(detail.toLowerCase().includes('token invalid'))throw Error('Token Fonnte tidak valid. Periksa ENV FONNTE_TOKEN di Vercel.');
 throw Error('Fonnte menolak '+action+(detail?': '+detail:'. Tidak ada alasan rinci dari Fonnte.')+(response.ok?'':' (HTTP '+response.status+')')+(path==='get-whatsapp-group'?' Coba Sinkronkan grup terlebih dahulu.':''));
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
 let knownSettings=null,authorized=false;
 try{
 const {data:{user},error:authError}=await db.auth.getUser(jwt);
 if(authError||!user)return res.status(401).json({error:'Sesi berakhir. Login ulang.'});
 const {data:me,error:memberError}=await db.from('kontenflow_members').select('role').eq('email',user.email.toLowerCase()).single();
 if(memberError||me?.role!=='admin')return res.status(403).json({error:'Khusus admin'});
 authorized=true;
 const body=req.method==='POST'?(typeof req.body==='string'?JSON.parse(req.body):req.body)||{}:{};
 if(req.method==='POST'&&!['sync','save'].includes(body.action))return res.status(400).json({error:'Aksi tidak valid'});
 const {data:settings,error:settingsError}=await db.from('kontenflow_wa_settings').select('*').eq('id',true).maybeSingle();
 knownSettings=settings;
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
 }catch(error){return res.status(502).json({... (authorized?{selected:knownSettings?{id:knownSettings.group_id,name:knownSettings.group_name}:null,envTarget:process.env.FONNTE_TARGET||null}:{}),error:error.name==='TimeoutError'?'Sinkronisasi Fonnte belum selesai. Tunggu sebentar, lalu klik Muat ulang daftar.':error.message||'Belum bisa memuat grup Fonnte.'})}
}
