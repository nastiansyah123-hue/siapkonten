import {createClient} from '@supabase/supabase-js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Metode tidak didukung'})}
 if(req.headers.origin){try{if(new URL(req.headers.origin).host!==req.headers.host)return res.status(403).json({error:'Origin tidak valid'})}catch{return res.status(403).json({error:'Origin tidak valid'})}}
 const jwt=req.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];if(!jwt)return res.status(401).json({error:'Silakan login sebagai admin'});
 if(!process.env.VITE_SUPABASE_URL||!process.env.VITE_SUPABASE_PUBLISHABLE_KEY)return res.status(503).json({error:'ENV Supabase belum lengkap'});
 const db=createClient(process.env.VITE_SUPABASE_URL,process.env.VITE_SUPABASE_PUBLISHABLE_KEY,{global:{headers:{Authorization:'Bearer '+jwt}},auth:{persistSession:false,autoRefreshToken:false}});
 try{
 const {data:{user},error:authError}=await db.auth.getUser(jwt);if(authError||!user)return res.status(401).json({error:'Sesi berakhir. Login ulang.'});
 const {data:member,error:memberError}=await db.from('kontenflow_members').select('role').eq('email',user.email.toLowerCase()).single();if(memberError||member?.role!=='admin')return res.status(403).json({error:'Tes hanya untuk admin'});
 const {data:settings,error:settingsError}=await db.from('kontenflow_wa_settings').select('group_id,group_name').eq('id',true).maybeSingle();
 if(settingsError)return res.status(503).json({error:'Pengaturan grup belum tersedia. Pastikan SQL 004 sudah dipasang.'});
 const target=settings?.group_id||process.env.FONNTE_TARGET;
 if(!target)return res.status(503).json({error:'Belum ada tujuan. Pilih grup lalu Simpan terlebih dahulu.'});
 const token=process.env.FONNTE_TOKEN;if(!token)return res.status(503).json({error:'FONNTE_TOKEN belum tersedia di deployment Vercel ini. Isi lalu redeploy.'});
 const time=new Date().toLocaleString('id-ID',{timeZone:'Asia/Jakarta'});
 const response=await fetch('https://api.fonnte.com/send',{method:'POST',headers:{Authorization:token},body:new URLSearchParams({target,message:'[TEST KONTENFLOW]\nTes koneksi notifikasi grup sosmed.\nWaktu: '+time+' WIB\nIni hanya tes, tidak ada video baru dan tidak perlu diposting.',countryCode:'62'}),signal:AbortSignal.timeout(10000)});
 let payload;try{payload=await response.json()}catch{return res.status(502).json({error:'Respons Fonnte tidak valid (HTTP '+response.status+'). Cek dashboard sebelum tes ulang.'})}
 if(!response.ok||payload.status!==true){const reason=[payload.detail,payload.reason,payload.message].filter(v=>typeof v==='string').join(' · ').split(token).join('[token disembunyikan]').slice(0,350);return res.status(502).json({error:'Tes ditolak Fonnte'+(reason?': '+reason:'. Tidak ada alasan rinci.')+' (HTTP '+response.status+').',target,groupName:settings?.group_name||null})}
 const id=Array.isArray(payload.id)?payload.id.join(', '):typeof payload.id==='string'?payload.id:null;
 return res.status(200).json({ok:true,message:'Pesan TEST diterima Fonnte untuk diproses. Cek pesan di grup atau statusnya di dashboard Fonnte.',target,groupName:settings?.group_name||null,providerId:id});
 }catch(error){return res.status(502).json({error:'Hasil tes belum dapat dikonfirmasi. Cek dashboard Fonnte sebelum mencoba ulang karena pesan mungkin sudah diterima.'})}
}
