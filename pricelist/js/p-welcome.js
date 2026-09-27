import{ce,svgI,ICON}from'./p-core.js';
import{modalShell}from'./p-modals.js';
import{FlashSale}from'./p-flashsale.js';
var loyalty=null,terms=null,netflix=null,pricelistHandler=null;
export function setPricelistHandler(fn){pricelistHandler=fn}
export function showWelcome(){
FlashSale.stop();
var container=document.getElementById('app');
if(!container)return;
renderWelcomeView(container);
}
function renderWelcomeView(container){
while(container.firstChild)container.removeChild(container.firstChild);
var welcome=ce('div','welcome fade-in-down');
var title=ce('h1','welcome-title');
title.appendChild(ce('span',null,'❤︎ '));
title.appendChild(ce('span',null,'Ciccu'));
var skySpan=ce('span',null,'Store');skySpan.style.color='var(--blue-400)';
title.appendChild(skySpan);
title.appendChild(ce('span',null,' ❤︎'));
welcome.appendChild(title);
welcome.appendChild(ce('p','welcome-tagline','☁️ Your 100% Trusted Seller ☁️'));
var card=ce('div','welcome-card');
card.appendChild(ce('h2',null,'❀ Premium Apps Pricelist ❀'));
card.appendChild(ce('p',null,'𓏭 🌷⭐️ 𝗪𝗼𝗿𝗸𝗶𝗲 land . . . 🪽 ♡ !? open 🥣 ⌘⁺ ⌒ ♡ ぬいぐるみ . . あまぬい 👑 . ⊹ 𓏭♡  🧁 ? あまい 🎀🍀  ふわあま  ♡ !? softie doll 🐰🍭 𓂃  𖠗'));
var actions=ce('div','welcome-actions');
var loyaltyBtn=ce('button','btn btn-pink');loyaltyBtn.setAttribute('type','button');
loyaltyBtn.appendChild(ce('span',null,'🎁 Loyalty Card'));
loyaltyBtn.addEventListener('click',openLoyaltyModal);
actions.appendChild(loyaltyBtn);
var termsBtn=ce('button','btn btn-white');termsBtn.setAttribute('type','button');
termsBtn.appendChild(ce('span',null,'📜 T&C'));
termsBtn.addEventListener('click',openTermsModal);
actions.appendChild(termsBtn);
card.appendChild(actions);
welcome.appendChild(card);
var pricelistBtn=ce('button','btn btn-primary');pricelistBtn.setAttribute('type','button');
pricelistBtn.style.padding='.875rem 1.75rem';
pricelistBtn.style.fontSize='.875rem';
pricelistBtn.style.borderRadius='9999px';
pricelistBtn.style.boxShadow='var(--sh-lg)';
pricelistBtn.appendChild(svgI(ICON.bag,'1.125rem','1.125rem'));
pricelistBtn.appendChild(ce('span',null,'Lihat Pricelist'));
pricelistBtn.appendChild(svgI(ICON.right,'.9375rem','.9375rem'));
pricelistBtn.addEventListener('click',function(){if(pricelistHandler)pricelistHandler()});
welcome.appendChild(pricelistBtn);
container.appendChild(welcome);
}
function ensureLoyalty(){
if(loyalty)return loyalty;
loyalty=modalShell({title:'🎀 Ciccu Loyalty Card',titleClass:'font-logo',bodyStyle:{maxHeight:'70vh'}});
var imgWrap=ce('div','img-modal');
var img=ce('img');img.setAttribute('src','https://raw.githubusercontent.com/ciccu-id/ciccu/main/lcard.png');img.setAttribute('alt','Loyalty Card');
imgWrap.appendChild(img);
loyalty.body.appendChild(imgWrap);
return loyalty;
}
export function openLoyaltyModal(){ensureLoyalty().open()}
function ensureTerms(){
if(terms)return terms;
terms=modalShell({title:'📜 Terms & Conditions',titleClass:'font-logo',bodyStyle:{maxHeight:'60vh'}});
var sections=[
{title:'🌸 Ketentuan Pembelian',text:'Dengan melakukan pembelian, pembeli dianggap telah memahami, dan menyetujui seluruh ketentuan yang berlaku di Ciccu Store.'},
{title:'🔒 Garansi',text:'Setiap produk memiliki ketentuan garansi yang berbeda sesuai detail produk masing-masing. Karena layanan yang dijual bersifat non-resmi, kelancaran akun tidak dijamin 100%. Estimasi penanganan maksimal 3x24 jam.'},
{title:'♻️ Replace',text:'Apabila terjadi kendala pada akun, penanganan akan dilakukan terlebih dahulu oleh seller yang selanjutnya akan diberikan replacement account jika komplain murni kendala akun.'},
{title:'💸 Refund',text:'Refund hanya diberikan apabila seller tidak dapat memenuhi pesanan setelah masa garansi atau pengecekan selesai.'}
];
sections.forEach(function(s){
var div=ce('div');div.style.marginBottom='.875rem';
var h4=ce('h4',null,s.title);h4.style.fontWeight='700';h4.style.color='var(--choco-500)';h4.style.fontSize='.8125rem';h4.style.marginBottom='.3rem';
div.appendChild(h4);
var p=ce('p',null,s.text);p.style.fontSize='.6875rem';p.style.color='var(--choco-400)';p.style.fontWeight='500';p.style.lineHeight='1.6';p.style.paddingLeft='1rem';p.style.textAlign='justify';
div.appendChild(p);
terms.body.appendChild(div);
});
var netflixBtn=ce('button','btn btn-white');netflixBtn.setAttribute('type','button');
netflixBtn.style.width='100%';netflixBtn.style.marginTop='.4rem';
netflixBtn.appendChild(svgI(ICON.info,'.875rem','.875rem'));
netflixBtn.appendChild(ce('span',null,'Info Tambahan Netflix'));
netflixBtn.addEventListener('click',function(){terms.close();setTimeout(openInfoNetflixModal,350)});
terms.body.appendChild(netflixBtn);
return terms;
}
export function openTermsModal(){ensureTerms().open()}
function ensureNetflix(){
if(netflix)return netflix;
netflix=modalShell({title:'ℹ️ Info Netflix',titleClass:'font-logo',bodyStyle:{maxHeight:'70vh'}});
var imgWrap=ce('div','img-modal');
var img=ce('img');img.setAttribute('src','https://raw.githubusercontent.com/ciccu-id/ciccu/main/snet.jpg');img.setAttribute('alt','Info Netflix');
imgWrap.appendChild(img);
netflix.body.appendChild(imgWrap);
return netflix;
}
export function openInfoNetflixModal(){ensureNetflix().open()}
