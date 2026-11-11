import { createClient } from '@supabase/supabase-js';

export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Metode tidak didukung'})}
 if(req.headers.origin){try{if(new URL(req.headers.origin).host!==req.headers.host)return res.status(403).json({error:'Origin tidak valid'})}catch{return res.status(403).json({error:'Origin tidak valid'})}}
 const token=req.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
 if(!token)return res.status(401).json({error:'Silakan login'});
 const url=process.env.VITE_SUPABASE_URL,key=process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return res.status(503).json({error:'Konfigurasi Supabase server belum lengkap'});
 const db=createClient(url,key,{global:{headers:{Authorization:'Bearer '+token}},auth:{persistSession:false,autoRefreshToken:false}});
 let lease,videoId;
 try{
 const {data:{user},error:authError}=await db.auth.getUser(token);
 if(authError||!user)return res.status(401).json({error:'Sesi berakhir. Login ulang.'});
 const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
 videoId=body?.videoId;
 if(typeof videoId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(videoId))return res.status(400).json({error:'ID video tidak valid'});
 const {data:me,error:memberError}=await db.from('kontenflow_members').select('role').eq('email',user.email.toLowerCase()).single();
 if(memberError||!['admin','editor'].includes(me?.role))return res.status(403).json({error:'Tidak memiliki akses'});
 const {data:video,error:videoError}=await db.from('kontenflow_videos').select('*').eq('id',videoId).single();
 if(videoError||!video||(me.role!=='admin'&&video.creator_id!==user.id))return res.status(403).json({error:'Video tidak dapat diakses'});
 if(video.posted)return res.status(409).json({error:'Video sudah diposting'});
 const {data:savedTarget,error:targetError}=await db.rpc('kontenflow_notification_target');
 if(targetError)return res.status(503).json({error:'Pengaturan grup belum tersedia. Minta admin memasang SQL 004.'});
 const fonnteToken=process.env.FONNTE_TOKEN,target=savedTarget||process.env.FONNTE_TARGET;
 if(!fonnteToken||!target)return res.status(503).json({error:'Fonnte belum dikonfigurasi di Vercel'});
 const {data:account,error:accountError}=await db.from('kontenflow_accounts').select('*').eq('id',video.account).single();
 if(accountError||!account)return res.status(403).json({error:'Akun tidak dapat diakses'});
 const {data:product}=await db.from('kontenflow_products').select('name').eq('id',account.product).single();
 const {data:claim,error:claimError}=await db.rpc('kontenflow_claim_notice',{target_video:videoId});
 if(claimError)return res.status(409).json({error:claimError.message});
 lease=claim;
 const message=['*Kontenflow — Video siap posting*','',`Produk: ${product?.name||'-'}`,`Akun TikTok: ${account.name} (${account.handle})`,`Judul: ${video.title}`,`Jenis konten: ${video.content_type||'Belum diatur'}`,`Editor: ${video.creator}`,'',video.url,'','Tim sosmed, silakan posting sesuai akun tujuan. Setelah tayang, klik Sudah Posting di Kontenflow.'].join('\n');
 const response=await fetch('https://api.fonnte.com/send',{method:'POST',headers:{Authorization:fonnteToken},body:new URLSearchParams({target,message,countryCode:'62'}),signal:AbortSignal.timeout(10000)});
 let result;try{result=await response.json()}catch{throw Error('Respons Fonnte tidak valid; cek dashboard Fonnte sebelum mencoba ulang')}
 if(!response.ok||result.status!==true){
 await db.rpc('kontenflow_finish_notice',{target_video:videoId,claim:lease,accepted:false,message_id:null});
 return res.status(502).json({error:'Fonnte belum menerima notifikasi. Periksa koneksi perangkat dan kuota di dashboard Fonnte.'});
 }
 const providerId=Array.isArray(result.id)?result.id.join(','):String(result.id||'');
 const {error:finishError}=await db.rpc('kontenflow_finish_notice',{target_video:videoId,claim:lease,accepted:true,message_id:providerId});
 if(finishError)return res.status(202).json({ok:true,message:'Diterima Fonnte; pencatatan status belum selesai. Cek dashboard Fonnte sebelum mengirim ulang.'});
 return res.status(200).json({ok:true,message:'Notifikasi masuk antrean Fonnte'});
 }catch(error){
 // A timeout may happen after Fonnte accepts the message. Keep the processing
 // lease to avoid an immediate duplicate; user can inspect Fonnte before retry.
 return res.status(502).json({error:'Notifikasi belum dapat dikonfirmasi. Cek dashboard Fonnte sebelum mencoba ulang.'});
 }
}
