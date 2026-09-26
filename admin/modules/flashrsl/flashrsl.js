(function(M){
function init(host){
return FlashShared.mount(host,FlashShared.cfgReseller());
}
function destroy(){
FlashShared.destroy();
}
M.init=init;
M.destroy=destroy;
})(AdminModules.flashrsl=AdminModules.flashrsl||{});
