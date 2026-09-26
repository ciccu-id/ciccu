(function(M){
function init(host){
return FlashShared.mount(host,FlashShared.cfgPublic());
}
function destroy(){
FlashShared.destroy();
}
M.init=init;
M.destroy=destroy;
})(AdminModules.flashpub=AdminModules.flashpub||{});
