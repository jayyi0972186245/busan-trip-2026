const STORAGE_KEY = "busan-trip-2026-v2";
const PUBLIC_STORAGE_KEY = "busan-trip-public-v1";
const PRIVATE_STORAGE_KEY = "busan-trip-private-v1";
const LEGACY_STORAGE_KEY = "busan-trip-2026";
const FONT_KEY = "busan-trip-large-text";
const newId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const clone = value => JSON.parse(JSON.stringify(value));
const days = [
  {id:"day1",short:"第 1 天",date:"10/17（六）",title:"抵達釜山・西面・廣安里"},
  {id:"day2",short:"第 2 天",date:"10/18（日）",title:"海東龍宮寺・海雲台"},
  {id:"day3",short:"第 3 天",date:"10/19（一）",title:"甘川文化村・南浦洞"},
  {id:"day4",short:"第 4 天",date:"10/20（二）",title:"採買・返回台灣"}
];
const defaultTrips = [
  ["day1","13:00","抵達金海國際機場","108 Gonghangjinip-ro, Gangseo-gu, Busan, South Korea","6 人建議搭兩台計程車前往飯店。"],
  ["day1","16:00","西面商圈與田浦咖啡街","Jeonpo Cafe Street, Busan, South Korea","先輕鬆逛街與喝咖啡。"],
  ["day1","19:30","廣安里海水浴場","219 Gwanganhaebyeon-ro, Suyeong-gu, Busan, South Korea","欣賞廣安大橋夜景，海邊風大請帶外套。"],
  ["day2","09:30","海東龍宮寺","86 Yonggung-gil, Gijang-gun, Busan, South Korea","有階梯，慢慢走並預留休息時間。"],
  ["day2","14:30","青沙浦天空膠囊","116 Cheongsapo-ro, Haeundae-gu, Busan, South Korea","6 人需分兩車，請提前預約。"],
  ["day2","17:00","海雲台海水浴場","264 Haeundaehaebyeon-ro, Haeundae-gu, Busan, South Korea","散步後可至 The Bay 101 看夜景。"],
  ["day3","09:30","甘川文化村","203 Gamnae 2-ro, Saha-gu, Busan, South Korea","坡道較多，建議搭計程車到入口。"],
  ["day3","12:30","松島海上纜車","171 Songdohaebyeon-ro, Seo-gu, Busan, South Korea","搭纜車看海，減少步行。"],
  ["day3","16:00","札嘎其市場與 BIFF 廣場","52 Jagalchihaean-ro, Jung-gu, Busan, South Korea","晚餐可吃生魚片，再逛夜市。"],
  ["day4","09:00","西面早餐與最後採買","Seomyeon Station, Busan, South Korea","依回程航班時間彈性調整。"],
  ["day4","12:00","前往金海國際機場","108 Gonghangjinip-ro, Gangseo-gu, Busan, South Korea","國際線建議起飛前 2.5 小時抵達。"]
].map(([day,time,name,address,note])=>({id:newId(),day,time,name,address,note}));
const defaultPrep = [
  {id:newId(),category:"證件",title:"確認護照與入境資料",detail:"護照效期至少 6 個月；護照照片與機票存一份在手機。",image:"",link:"",done:false},
  {id:newId(),category:"交通",title:"安裝 Naver Map 與 Papago",detail:"韓國導航建議使用 Naver Map；Papago 可協助翻譯。",image:"",link:"https://map.naver.com/",done:false},
  {id:newId(),category:"付款",title:"準備現金與信用卡",detail:"市場小店可能只收現金；信用卡記得開啟海外交易。",image:"",link:"",done:false},
  {id:newId(),category:"健康",title:"準備常用藥品",detail:"攜帶個人常用藥、暈車藥、OK 繃與簡單腸胃藥。",image:"",link:"",done:false},
  {id:newId(),category:"行李",title:"攜帶薄外套與好走的鞋",detail:"10 月海邊風較大，甘川文化村與龍宮寺有坡道和階梯。",image:"",link:"",done:false}
];
const defaultInfo = {
  outboundFlight:"", outboundTime:"", returnFlight:"", returnTime:"",
  hotelName:"", hotelAddress:"", hotelPhone:"",
  emergencyName:"", emergencyPhone:"", insurance:""
};
let data = loadData(), activeView="trip", activeDay="day1", prepFilter="全部", editingTrip=null, editingPrep=null;
const $=selector=>document.querySelector(selector);
const esc=(value="")=>String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
function loadData(){
  try {
    const publicData=JSON.parse(localStorage.getItem(PUBLIC_STORAGE_KEY));
    const privateData=JSON.parse(localStorage.getItem(PRIVATE_STORAGE_KEY));
    if(publicData?.trips&&publicData?.prep)return{...publicData,info:{...defaultInfo,...privateData?.info}};
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));
    if(saved?.trips&&saved?.prep)return{...saved,info:{...defaultInfo,...saved.info}};
    const legacy=JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY));
    if(Array.isArray(legacy))return{trips:legacy,prep:clone(defaultPrep),info:clone(defaultInfo)};
  } catch {}
  return{trips:clone(defaultTrips),prep:clone(defaultPrep),info:clone(defaultInfo)}
}
function save(){
  try {
    localStorage.setItem(PUBLIC_STORAGE_KEY,JSON.stringify({trips:data.trips,prep:data.prep}));
    localStorage.setItem(PRIVATE_STORAGE_KEY,JSON.stringify({info:data.info}));
    syncChannel?.postMessage("updated");
    window.dispatchEvent(new CustomEvent("busan-public-data-changed"));
    return true;
  } catch {
    alert("資料容量已滿，請刪除部分照片後再試一次。");
    return false;
  }
}
const syncChannel=typeof BroadcastChannel!=="undefined"?new BroadcastChannel("busan-trip-sync"):null;
if(syncChannel)syncChannel.onmessage=()=>{data=loadData();render();toast("已收到另一個分頁的更新")};
function toast(message){$("#toast").textContent=message;$("#toast").classList.add("show");setTimeout(()=>$("#toast").classList.remove("show"),2100)}
function mapUrl(item){return`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address||item.name)}`}
function safeUrl(url){return /^https?:\/\//i.test(url||"")?url:""}
function empty(message){return`<div class="empty"><strong>${message}</strong>按新增按鈕開始建立。</div>`}
function renderTabs(){
  $("#day-tabs").innerHTML=days.map(d=>`<button class="day-tab ${d.id===activeDay?"active":""}" data-day="${d.id}" type="button"><span>${d.short}</span>${d.date.slice(0,5)}</button>`).join("");
}
function renderTrips(){
  const day=days.find(d=>d.id===activeDay), items=data.trips.filter(i=>i.day===activeDay).sort((a,b)=>a.time.localeCompare(b.time));
  $("#selected-date").textContent=day.date;$("#selected-title").textContent=day.title;$("#trip-count").textContent=`${items.length} 個行程`;
  $("#trip-list").innerHTML=items.length?items.map((i,index)=>`${index&&i.travelMinutes?`<div class="travel-time">從上一站前往約 ${esc(i.travelMinutes)} 分鐘</div>`:""}<article class="card trip-card"><div class="trip-time">${esc(i.time)}</div><div><h3>${esc(i.name)}</h3>${i.address?`<p class="meta"><strong>地址：</strong>${esc(i.address)}</p>`:""}${i.note?`<p class="meta"><strong>提醒：</strong>${esc(i.note)}</p>`:""}<div class="card-actions"><a class="action-button map-button" href="${mapUrl(i)}" target="_blank" rel="noopener">Google 地圖導航</a><button class="action-button edit-button" data-edit-trip="${i.id}" type="button">編輯行程</button></div></div><button class="delete-button" data-delete-trip="${i.id}" type="button" aria-label="刪除">刪</button></article>`).join(""):empty("這天還沒有行程");
}
function renderPrep(){
  const cats=["全部",...new Set(data.prep.map(i=>i.category))];
  $("#prep-filters").innerHTML=cats.map(c=>`<button class="filter-button ${c===prepFilter?"active":""}" data-filter="${esc(c)}" type="button">${esc(c)}</button>`).join("");
  const items=data.prep.filter(i=>prepFilter==="全部"||i.category===prepFilter),done=data.prep.filter(i=>i.done).length;
  $("#prep-count").textContent=`${done}/${data.prep.length} 完成`;
  $("#prep-list").innerHTML=items.length?items.map(i=>`<article class="card prep-card ${i.done?"done":""}"><button class="check-button" data-check-prep="${i.id}" type="button" aria-label="切換完成">${i.done?"✓":""}</button><span class="category">${esc(i.category)}</span><h3>${esc(i.title)}</h3>${i.detail?`<p class="meta">${esc(i.detail)}</p>`:""}${safeUrl(i.image)?`<img class="prep-image" src="${esc(i.image)}" alt="${esc(i.title)}照片" loading="lazy" onerror="this.hidden=true">`:""}<div class="card-actions">${safeUrl(i.link)?`<a class="action-button link-button" href="${esc(i.link)}" target="_blank" rel="noopener">開啟相關連結</a>`:`<button class="action-button link-button" disabled>尚無連結</button>`}<button class="action-button edit-button" data-edit-prep="${i.id}" type="button">編輯事項</button></div><button class="delete-button" data-delete-prep="${i.id}" type="button" aria-label="刪除">刪</button></article>`).join(""):empty("這個分類尚無事項");
}
function infoValue(label,value){return`<div class="info-value"><small>${label}</small><strong>${esc(value||"尚未填寫")}</strong></div>`}
function renderInfo(){
  const i=data.info;
  $("#info-list").innerHTML=`<article class="card"><h3>航班資訊</h3><div class="info-grid">${infoValue("去程航班",i.outboundFlight)}${infoValue("去程時間",i.outboundTime)}${infoValue("回程航班",i.returnFlight)}${infoValue("回程時間",i.returnTime)}</div></article><article class="card"><h3>住宿資訊</h3><div class="info-grid">${infoValue("飯店",i.hotelName)}${infoValue("電話",i.hotelPhone)}${infoValue("地址",i.hotelAddress)}</div><div class="info-actions">${i.hotelAddress?`<a class="action-button map-button" href="${mapUrl({address:i.hotelAddress})}" target="_blank" rel="noopener">飯店導航</a>`:""}${i.hotelPhone?`<a class="action-button edit-button" href="tel:${esc(i.hotelPhone)}">撥打飯店</a>`:""}</div></article><article class="card"><h3>緊急聯絡</h3><div class="info-grid">${infoValue("聯絡人",i.emergencyName)}${infoValue("電話",i.emergencyPhone)}${infoValue("旅遊保險",i.insurance)}${infoValue("韓國緊急電話","警察 112・救護／消防 119")}</div>${i.emergencyPhone?`<a class="action-button map-button full-width" href="tel:${esc(i.emergencyPhone)}">撥打緊急聯絡人</a>`:""}</article>`;
  $("#sync-status").textContent=location.protocol==="file:"?"目前是本機檔案，其他手機無法開啟這個網址。":"目前頁面已有公開網址，可分享給同行者查看。";
}
function render(){renderTabs();renderTrips();renderPrep();renderInfo()}
function switchView(view){activeView=view;document.querySelectorAll(".main-tab").forEach(b=>b.classList.toggle("active",b.dataset.view===view));$("#trip-view").hidden=view!=="trip";$("#prep-view").hidden=view!=="prep";$("#info-view").hidden=view!=="info";$("#floating-add").hidden=view==="info"}
function openTrip(item){editingTrip=item?.id||null;$("#trip-dialog-title").textContent=editingTrip?"編輯行程":"新增行程";$("#trip-day").value=item?.day||activeDay;$("#trip-time").value=item?.time||"09:00";$("#trip-name").value=item?.name||"";$("#trip-address").value=item?.address||"";$("#trip-note").value=item?.note||"";$("#trip-travel-minutes").value=item?.travelMinutes||"";$("#trip-dialog").showModal()}
function openPrep(item){editingPrep=item?.id||null;$("#prep-dialog-title").textContent=editingPrep?"編輯注意事項":"新增注意事項";$("#prep-category").value=item?.category||"其他";$("#prep-title").value=item?.title||"";$("#prep-detail").value=item?.detail||"";$("#prep-image").value=safeUrl(item?.image)?item.image:"";$("#prep-link").value=item?.link||"";$("#prep-photo-preview").src=item?.image||"";$("#prep-photo-preview").hidden=!item?.image;$("#prep-dialog").showModal()}
function openInfo(){Object.entries(data.info).forEach(([key,value])=>{const field=$(`#${key.replace(/[A-Z]/g,m=>"-"+m.toLowerCase())}`);if(field)field.value=value});$("#info-dialog").showModal()}
async function imageToDataUrl(file){
  const image=await createImageBitmap(file),scale=Math.min(1,1000/image.width),canvas=document.createElement("canvas");
  canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);
  canvas.getContext("2d").drawImage(image,0,0,canvas.width,canvas.height);
  return canvas.toDataURL("image/jpeg",.72);
}
days.forEach(d=>$("#trip-day").add(new Option(`${d.short}・${d.date}`,d.id)));
document.addEventListener("click",e=>{
  const target=e.target.closest("button");if(!target)return;
  if(target.dataset.view)switchView(target.dataset.view);
  if(target.dataset.day){activeDay=target.dataset.day;renderTrips();renderTabs()}
  if(target.dataset.filter){prepFilter=target.dataset.filter;renderPrep()}
  if(target.dataset.close)$("#"+target.dataset.close).close();
  if(target.id==="add-trip"||(target.id==="floating-add"&&activeView==="trip"))openTrip();
  if(target.id==="add-prep"||(target.id==="floating-add"&&activeView==="prep"))openPrep();
  if(target.id==="edit-info")openInfo();
  if(target.dataset.editTrip)openTrip(data.trips.find(i=>i.id===target.dataset.editTrip));
  if(target.dataset.editPrep)openPrep(data.prep.find(i=>i.id===target.dataset.editPrep));
  if(target.dataset.checkPrep){const i=data.prep.find(i=>i.id===target.dataset.checkPrep);i.done=!i.done;save();renderPrep();toast(i.done?"已標記完成":"已取消完成")}
  if(target.dataset.deleteTrip){const i=data.trips.find(i=>i.id===target.dataset.deleteTrip);if(confirm(`確定刪除「${i.name}」嗎？`)){data.trips=data.trips.filter(x=>x.id!==i.id);save();renderTrips();toast("行程已刪除")}}
  if(target.dataset.deletePrep){const i=data.prep.find(i=>i.id===target.dataset.deletePrep);if(confirm(`確定刪除「${i.title}」嗎？`)){data.prep=data.prep.filter(x=>x.id!==i.id);save();renderPrep();toast("注意事項已刪除")}}
});
$("#trip-form").addEventListener("submit",e=>{e.preventDefault();const values=Object.fromEntries(new FormData(e.currentTarget));editingTrip?data.trips=data.trips.map(i=>i.id===editingTrip?{...i,...values}:i):data.trips.push({id:newId(),...values});activeDay=values.day;save();$("#trip-dialog").close();render();toast("行程已儲存")});
$("#prep-form").addEventListener("submit",e=>{e.preventDefault();const values=Object.fromEntries(new FormData(e.currentTarget));editingPrep?data.prep=data.prep.map(i=>i.id===editingPrep?{...i,...values}:i):data.prep.push({id:newId(),done:false,...values});save();$("#prep-dialog").close();renderPrep();toast("注意事項已儲存")});
$("#prep-photo-file").addEventListener("change",async e=>{const file=e.target.files[0];if(!file)return;try{const image=await imageToDataUrl(file);$("#prep-image").value=image;$("#prep-photo-preview").src=image;$("#prep-photo-preview").hidden=false;toast("照片已壓縮並加入")}catch{alert("無法讀取這張照片。")}});
$("#info-form").addEventListener("submit",e=>{e.preventDefault();data.info=Object.fromEntries(new FormData(e.currentTarget));save();$("#info-dialog").close();renderInfo();toast("重要資訊已儲存")});
$("#share-button").addEventListener("click",async()=>{if(location.protocol==="file:"){alert("目前是本機檔案，分享後其他手機無法開啟。請先發布成公開網址。");return}const payload={title:"釜山安心遊",url:location.href};try{navigator.share?await navigator.share(payload):await navigator.clipboard.writeText(location.href);toast("分享網址已準備好")}catch{}});
$(".backup-button").addEventListener("click",()=>$("#backup-dialog").showModal());document.querySelectorAll(".backup-button")[1].addEventListener("click",()=>$("#backup-dialog").showModal());
$("#font-toggle").addEventListener("click",()=>{document.body.classList.toggle("large-text");localStorage.setItem(FONT_KEY,document.body.classList.contains("large-text"));toast(document.body.classList.contains("large-text")?"已放大字體":"已恢復標準字體")});
$("#export-button").addEventListener("click",()=>{const publicBackup={trips:data.trips,prep:data.prep.map(item=>({...item,image:safeUrl(item.image)?item.image:""}))};const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(publicBackup,null,2)],{type:"application/json"}));a.download="釜山公開行程備份.json";a.click();URL.revokeObjectURL(a.href);toast("公開行程備份已下載")});
$("#import-input").addEventListener("change",async e=>{try{const value=JSON.parse(await e.target.files[0].text());if(!value.trips||!value.prep)throw Error();data.trips=value.trips;data.prep=value.prep;save();render();$("#backup-dialog").close();toast("公開行程已還原")}catch{alert("無法讀取這個備份檔。")}});
$("#reset-button").addEventListener("click",()=>{if(confirm("確定恢復預設資料嗎？")){data={trips:clone(defaultTrips),prep:clone(defaultPrep),info:clone(defaultInfo)};save();render();$("#backup-dialog").close();toast("已恢復預設資料")}});
if(localStorage.getItem(FONT_KEY)==="true")document.body.classList.add("large-text");render();
if("serviceWorker" in navigator&&location.protocol!=="file:")navigator.serviceWorker.register("./sw.js").catch(()=>{});
window.BusanApp={
  getPublicData:()=>({trips:clone(data.trips),prep:clone(data.prep).map(({image,...item})=>item)}),
  applyPublicData:publicData=>{
    if(!publicData?.trips||!publicData?.prep)return;
    const localImages=new Map(data.prep.map(item=>[item.id,item.image||""]));
    data.trips=publicData.trips;
    data.prep=publicData.prep.map(item=>({...item,image:localImages.get(item.id)||""}));
    try{localStorage.setItem(PUBLIC_STORAGE_KEY,JSON.stringify({trips:data.trips,prep:data.prep}))}catch{}
    render()
  },
  setSyncStatus:message=>{$("#sync-status").textContent=message},
  toast
};
