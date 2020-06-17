//用于判断当前网站协议头
(function()
{
var bp = document.createElement('script');
var curProtocol = window.location.protocol.split(':')[0];
if (curProtocol === 'https'){
 bp.src = './js/push1';
}
else{
bp.src = './js/push2';
}
var s = document.getElementsByTagName("script")[0];
s.parentNode.insertBefore(bp, s);
})();

//根据表单更改iframe的src属性
function SetSrc() 
{ 
    document.getElementById("mobile").src = document.getElementById("txtSRC").value;
    document.getElementById("tablet").src = document.getElementById("txtSRC").value;
    document.getElementById("laptop").src = document.getElementById("txtSRC").value;
    document.getElementById("desktop").src = document.getElementById("txtSRC").value; 
} 