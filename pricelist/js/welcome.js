var loyaltyModalEl=null,termsModalEl=null,netflixModalEl=null;
function renderWelcomeView(container){
while(container.firstChild)container.removeChild(container.firstChild);
var welcome=ce('div','welcome fade-in-down');
var title=ce('h1','welcome-title');
title.appendChild(ce('span',null,'❤︎ '));
title.appendChild(ce('span',null,'Ciccu'));
var skySpan=ce('span',null,'Store');
skySpan.style.color='var(--blue-400)';
title.appendChild(skySpan);
title.appendChild(ce('span',null,' ❤︎'));
welcome.appendChild(title);
welcome.appendChild(ce('p','welcome-tagline','☁️ Your 100% Trusted Seller ☁️'));
var card=ce('div','welcome-card');
card.appendChild(ce('h2',null,'❀ Premium Apps Pricelist ❀'));
card.appendChild(ce('p',null,'𓏭 🌷⭐️ 𝗪𝗼𝗿𝗸𝗶𝗲 land . . . 🪽 ♡ !? open 🥣🌱 ⌘⁺◦ ⌒ 𓈒♡ ぬいぐるみ . . あまぬい 👑 . ⊹ 𓏭♡ ⌗ 🧁 ? あまい 🎀🍀 ⊹ ふわあま 🥛 ♡ !? softie doll 🐰🍭 𓂃  𖠗'));
var actions=ce('div','welcome-actions');
var loyaltyBtn=ce('button','btn btn-pink');
loyaltyBtn.setAttribute('type','button');
loyaltyBtn.appendChild(ce('span',null,'🎁 Loyalty Card'));
loyaltyBtn.addEventListener('click',openLoyaltyModal);
actions.appendChild(loyaltyBtn);
var termsBtn=ce('button','btn btn-white');
termsBtn.setAttribute('type','button');
termsBtn.appendChild(ce('span',null,'📜 T&C'));
termsBtn.addEventListener('click',openTermsModal);
actions.appendChild(termsBtn);
card.appendChild(actions);
welcome.appendChild(card);
var pricelistBtn=ce('button','btn btn-primary');
pricelistBtn.setAttribute('type','button');
pricelistBtn.style.padding='.875rem 1.75rem';
pricelistBtn.style.fontSize='.875rem';
pricelistBtn.style.borderRadius='9999px';
pricelistBtn.style.boxShadow='var(--sh-lg)';
pricelistBtn.appendChild(svgI('M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z','1.125rem','1.125rem'));
pricelistBtn.appendChild(ce('span',null,'Lihat Pricelist'));
pricelistBtn.appendChild(svgI('M14 5l7 7m0 0l-7 7m7-7H3','.9375rem','.9375rem'));
pricelistBtn.addEventListener('click',function(){if(typeof showPricelist==='function')showPricelist()});
welcome.appendChild(pricelistBtn);
container.appendChild(welcome);
}
function showWelcome(){
var container=document.getElementById('app');
if(!container)return;
renderWelcomeView(container);
}
function createLoyaltyModal(){
loyaltyModalEl=ce('div','modal-overlay');
loyaltyModalEl.classList.add('hidden');
var backdrop=ce('div','modal-backdrop');
backdrop.addEventListener('click',closeLoyaltyModal);
loyaltyModalEl.appendChild(backdrop);
var box=ce('div','modal-box');
var head=ce('div','modal-head');
head.appendChild(ce('h3','font-logo','🎀 Ciccu Loyalty Card'));
var closeBtn=ce('button','modal-close');
closeBtn.setAttribute('type','button');
closeBtn.appendChild(svgI('M6 18L18 6M6 6l12 12','1rem','1rem'));
closeBtn.addEventListener('click',closeLoyaltyModal);
head.appendChild(closeBtn);
box.appendChild(head);
var body=ce('div','modal-body');
body.style.maxHeight='70vh';
var imgWrap=ce('div','img-modal');
var img=ce('img');
img.setAttribute('src','https://raw.githubusercontent.com/ciccu-id/ciccu/main/lcard.png');
img.setAttribute('alt','Loyalty Card');
imgWrap.appendChild(img);
body.appendChild(imgWrap);
box.appendChild(body);
loyaltyModalEl.appendChild(box);
document.body.appendChild(loyaltyModalEl);
}
function openLoyaltyModal(){
if(!loyaltyModalEl)createLoyaltyModal();
loyaltyModalEl.classList.remove('hidden');
var bd=loyaltyModalEl.querySelector('.modal-backdrop');
var bx=loyaltyModalEl.querySelector('.modal-box');
setTimeout(function(){if(bd)bd.classList.add('show');if(bx)bx.classList.add('show')},10);
}
function closeLoyaltyModal(){
if(!loyaltyModalEl)return;
var bd=loyaltyModalEl.querySelector('.modal-backdrop');
var bx=loyaltyModalEl.querySelector('.modal-box');
if(bd)bd.classList.remove('show');if(bx)bx.classList.remove('show');
setTimeout(function(){loyaltyModalEl.classList.add('hidden')},300);
}
function createTermsModal(){
termsModalEl=ce('div','modal-overlay');
termsModalEl.classList.add('hidden');
var backdrop=ce('div','modal-backdrop');
backdrop.addEventListener('click',closeTermsModal);
termsModalEl.appendChild(backdrop);
var box=ce('div','modal-box');
var head=ce('div','modal-head');
head.appendChild(ce('h3','font-logo','📜 Terms & Conditions'));
var closeBtn=ce('button','modal-close');
closeBtn.setAttribute('type','button');
closeBtn.appendChild(svgI('M6 18L18 6M6 6l12 12','1rem','1rem'));
closeBtn.addEventListener('click',closeTermsModal);
head.appendChild(closeBtn);
box.appendChild(head);
var body=ce('div','modal-body');
body.style.maxHeight='60vh';
var sections=[
{title:'🌸 Ketentuan Pembelian',text:'Dengan melakukan pembelian, pembeli dianggap telah memahami, dan menyetujui seluruh ketentuan yang berlaku di Ciccu Store.'},
{title:'🔒 Garansi',text:'Setiap produk memiliki ketentuan garansi yang berbeda sesuai detail produk masing-masing. Karena layanan yang dijual bersifat non-resmi, kelancaran akun tidak dijamin 100%. Estimasi penanganan maksimal 3x24 jam.'},
{title:'♻️ Replace',text:'Apabila terjadi kendala pada akun, penanganan akan dilakukan terlebih dahulu oleh seller yang selanjutnya akan diberikan replacement account jika komplain murni kendala akun.'},
{title:'💸 Refund',text:'Refund hanya diberikan apabila seller tidak dapat memenuhi pesanan setelah masa garansi atau pengecekan selesai.'}
];
sections.forEach(function(s){
var div=ce('div');
div.style.marginBottom='.875rem';
var h4=ce('h4',null,s.title);
h4.style.fontWeight='700';h4.style.color='var(--choco-500)';h4.style.fontSize='.8125rem';h4.style.marginBottom='.3rem';
div.appendChild(h4);
var p=ce('p',null,s.text);
p.style.fontSize='.6875rem';p.style.color='var(--choco-400)';p.style.fontWeight='500';p.style.lineHeight='1.6';p.style.paddingLeft='1rem';p.style.textAlign='justify';
div.appendChild(p);
body.appendChild(div);
});
var netflixBtn=ce('button','btn btn-white');
netflixBtn.setAttribute('type','button');
netflixBtn.style.width='100%';
netflixBtn.style.marginTop='.4rem';
netflixBtn.appendChild(svgI('M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z','.875rem','.875rem'));
netflixBtn.appendChild(ce('span',null,'Info Tambahan Netflix'));
netflixBtn.addEventListener('click',function(){closeTermsModal();setTimeout(openInfoNetflixModal,350)});
body.appendChild(netflixBtn);
box.appendChild(body);
termsModalEl.appendChild(box);
document.body.appendChild(termsModalEl);
}
function openTermsModal(){
if(!termsModalEl)createTermsModal();
termsModalEl.classList.remove('hidden');
var bd=termsModalEl.querySelector('.modal-backdrop');
var bx=termsModalEl.querySelector('.modal-box');
setTimeout(function(){if(bd)bd.classList.add('show');if(bx)bx.classList.add('show')},10);
}
function closeTermsModal(){
if(!termsModalEl)return;
var bd=termsModalEl.querySelector('.modal-backdrop');
var bx=termsModalEl.querySelector('.modal-box');
if(bd)bd.classList.remove('show');if(bx)bx.classList.remove('show');
setTimeout(function(){termsModalEl.classList.add('hidden')},300);
}
function createNetflixModal(){
netflixModalEl=ce('div','modal-overlay');
netflixModalEl.classList.add('hidden');
var backdrop=ce('div','modal-backdrop');
backdrop.addEventListener('click',closeInfoNetflixModal);
netflixModalEl.appendChild(backdrop);
var box=ce('div','modal-box');
var head=ce('div','modal-head');
head.appendChild(ce('h3','font-logo','ℹ️ Info Netflix'));
var closeBtn=ce('button','modal-close');
closeBtn.setAttribute('type','button');
closeBtn.appendChild(svgI('M6 18L18 6M6 6l12 12','1rem','1rem'));
closeBtn.addEventListener('click',closeInfoNetflixModal);
head.appendChild(closeBtn);
box.appendChild(head);
var body=ce('div','modal-body');
body.style.maxHeight='70vh';
var imgWrap=ce('div','img-modal');
var img=ce('img');
img.setAttribute('src','https://raw.githubusercontent.com/ciccu-id/ciccu/main/snet.jpg');
img.setAttribute('alt','Info Netflix');
imgWrap.appendChild(img);
body.appendChild(imgWrap);
box.appendChild(body);
netflixModalEl.appendChild(box);
document.body.appendChild(netflixModalEl);
}
function openInfoNetflixModal(){
if(!netflixModalEl)createNetflixModal();
netflixModalEl.classList.remove('hidden');
var bd=netflixModalEl.querySelector('.modal-backdrop');
var bx=netflixModalEl.querySelector('.modal-box');
setTimeout(function(){if(bd)bd.classList.add('show');if(bx)bx.classList.add('show')},10);
}
function closeInfoNetflixModal(){
if(!netflixModalEl)return;
var bd=netflixModalEl.querySelector('.modal-backdrop');
var bx=netflixModalEl.querySelector('.modal-box');
if(bd)bd.classList.remove('show');if(bx)bx.classList.remove('show');
setTimeout(function(){netflixModalEl.classList.add('hidden')},300);
}
