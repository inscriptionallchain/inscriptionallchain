loadData(function(){
	var queryString = window.location.search;
	tokenId = getParameterByName('token', queryString);
	console.log("tokenId",tokenId);
	init()
});
var tokenId=0;
var name="";
var fee=0;
var supply=0;
function init(){
	contractInscription.methods.inscriptions(tokenId).call({from:account},function(error,result){
		//console.log(result)
		supply=result.supply;
		var rate=Math.round(result.progress/result.supply*100 * 10000 ) / 10000
		var deployTime=formatDate(parseInt(result.deployTime)*1000)
		fee=Math.round(result.free/10**18* 100000 ) / 100000
		$("#name").html(result.name);
		$("#tick2").html(result.name);
		name=result.name;
		$(".main1 .line .left i").width(rate+"%");
		$("#rate").html(rate+"%");
		$("#supply").html(result.supply);
		$("#progress").html(result.progress);
		$("#limit").html(result.limit);
		$("#limit2").html(result.limit);
		$("#owner").html(result.owner);
		$("#owner2").attr("data-clipboard-text",result.owner);
		$("#deployTime").html(deployTime);
		$("#holders").html(result.holders);
		$("#fee").html(fee+"ETH");
		$("#fee2").html(fee+"ETH");
		$("#transactions").html(result.transtractions);
		if(parseFloat(result.progress)<parseFloat(result.supply)){
			//$("#mint").show();
			//增加倒计时显示
			//1703606700000
			//1703577000000
			targetDate = 1703937600*1000;
			setInterval(updateCountdown, 1000);
		}
		pageIndex=1;
		$("#scroll").html("");
		loadHolders(tokenId);
		loadActivity(name)
	});
}
var pageIndex=1;
var pageSize=10;
var targetDate;
function updateCountdown() {
	// 获取当前日期和时间
	const currentDate = new Date().getTime();
	// 计算距离目标日期的毫秒数
	const distance = targetDate - currentDate;
	// 计算倒计时的天、小时、分钟和秒
	const days = Math.floor(distance / (1000 * 60 * 60 * 24));
	const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
	const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
	const seconds = Math.floor((distance % (1000 * 60)) / 1000);
	$("#startMint").show();
	$("#startMint").html(`${days}days ${hours}hours ${minutes}minutes ${seconds}seconds`);
	// 将倒计时显示在页面上
	if (distance < 0) {
		$("#startMint").hide();
		$("#mint").show();
	}
}
var holders=[]
var counter=0;
function loadHolders(index){
	contractProxy.methods.holders(tokenId).call({from:account},function(error,result){
		//console.log(result);
		holders=result;
		holdersResult();
	})
}
function holdersResult(){
	var sortedData = [...holders].sort((a, b) => b.value - a.value);
	$("#holdersList").html("");
	console.log(sortedData)
	for(var i=0;i<sortedData.length;i++){
		var tr=`<tr>
			<td>`+(i+1)+`</td>
			<td>
			  <a href="javascript:void(0)">`+sortedData[i].holder+`</a>
			  <div class="copy" data-clipboard-text="`+sortedData[i].holder+`"></div>
			</td>
			<td>
			  <div class="val">`+sortedData[i].percentage/100000+`%</div>
			  <div class="lines"><i style="width:`+sortedData[i].percentage/100000+`%;"></i></div>
			</td>
			<td>
			  `+sortedData[i].value+`
			</td>
		  </tr>`;
		$("#holdersList").append(tr);
	}
	registerCopy();
}
function loadActivity(name){
	contractProxy.methods.activity(name,pageIndex,pageSize).call({from:account},function(error,items){
		for(var i=0;i<items.length;i++){
			var result=items[i];
			var time=formatDate(parseInt(result.time)*1000);
			var from=result.owner.slice(0,4)+"..."+result.owner.slice(36);
			var to=result.to.slice(0,4)+"..."+result.owner.slice(36);
			var method="";
			if(result.op=="1"){
				method="deploy"
			}else if(result.op=="2"){
				method="mint"
			}else if(result.op=="3"){
				method="transfer"
			}
			var div=`<div class="item">
				<div class="s1"><div class="waptxt">Number：</div>#`+result.num+`</div>
				<div class="s2"><div class="waptxt">Method：</div>`+method+`</div>
				<div class="s3"><div class="waptxt">Quantity：</div>`+result.count+`</div>
				<div class="s4">
				  <div class="waptxt">From：</div>
				  <a href="#" class="un">`+from+`</a>
				  <div class="copy" data-clipboard-text="`+result.owner+`"></div>
				</div>
				<div class="s5">
				  <div class="waptxt">To：</div>
				  <a href="#" class="un">`+to+`</a>
				  <div class="copy" data-clipboard-text="`+result.to+`"></div>
				</div>
				<div class="s6">
				  <div class="waptxt">Date Time：</div>
				  `+time+`
				</div>
			  </div>`;
			$("#scroll").append(div);
		}
	})
}

$("#scroll").scroll(function() {
	// 当滚动到底部时，执行相关操作
	if ($(this).scrollTop() + $(this).innerHeight()+50 >= $(this)[0].scrollHeight) {
	  pageIndex+=1;
	  loadActivity(name);
	}
});
$("#mint").click(function(){
	$("#alertmodel2").fadeIn(200);
})
$("#mintConfirm").click(function(){
	var c=$("#count").val()
	if(!c){
		showAlert(2,"Please enter count")
		return;
	}
	contractInscription.methods.inscriptions(tokenId).call({from:account},function(error,result){
		var str=`{"p":"src-20","op":"mint","tick":"`+result.name+`","amt":"`+result.limit+`"}`;
		var cost=BigInt(parseInt(result.free)*c/25);
		call(contractInscription.methods.mintBatch(str,c),contracts.inscription.address,function(){
			$("#alertmodel2").fadeOut(100)
			showAlert(1,"Success")
			init();
		});
	});
})
$("#count").on("input", function(e) {
	var inputValue = $(this).val();
	// 使用正则表达式检查是否只包含数字
	var numericInput = inputValue.replace(/[^0-9]/g, '');
	// 更新输入框的值
	$(this).val(numericInput);
});
$(".mint-count").click(function(){
	$(".mint-count").removeClass("active")
	$(this).addClass("active")
	$(this).children("input").attr("checked", "checked");
	var c=$("input[name='count']:checked").val();
	$("#fee2").html(fee*c+"ETH");
})