loadData(function(){
	init()
});

function init(){
	$("#keywords").val(account)
	$("#search").click()
	$("#latest").html("");
	$("#latest2").html("");
	contractInscription.methods.ownerActivityCount(account).call({from:account},function(error,counter){
		blockRecord(counter,counter);
	})
}

function blockRecord(arr,index){
	if(index<=0){
		return;
	}
	getBlock(index,function(div){
		$("#latest2").append(div);
		index--;
		blockRecord(arr,index);
	})
}
function getBlock(index,callback){
	contractInscription.methods.ownerActivity(account,index).call({from:account},function(error,current){
		contractInscription.methods.records(current).call({from:account},function(error,result){
			contractProxy.methods.recordString(result.num).call({from:account},function(error,input){
				contractInscription.methods.exchargeRecord(result.num).call({from:account},function(error,isRecharge){
					console.log("result.num",result.num)
					console.log("isRecharge",isRecharge)
					var rate=Math.round(result.progress/result.supply*100 * 1000 ) / 1000
					var time=formatDate(parseInt(result.time)*1000);
					var owner=result.owner.slice(0,6)+"..."+result.owner.slice(36);
					var jsonObject = JSON.parse(input);
					var formattedJson = JSON.stringify(jsonObject, null, 2);
					var releaseItem="";
					if(jsonObject.op=="mint"&&isRecharge==false){
						releaseItem=`<div class="infor" style="margin-top:5px; justify-content: center">
						  <button onclick="release('`+result.num+`')" class='release'>Release</button>
						</div>`;
					}
					var div=`<div class="item">
						<a href="meta.html?metaId=`+index+`">
						  <div class="text">
							<div class="scroll">
							  <pre>`+formattedJson+`</pre>
							</div>
						  </div>
						</a>
					  <div class="content">
						<div class="infor">
						  <p>#`+result.num+`</p>
						  <p>`+owner+`</p>
						</div>
						<div class="time">`+time+`</div>
					  </div>
					  </div>
					</div>`;
					callback(div);
				})
			})
		})
	})
}
function release(mId){
	console.log("mId",mId)
	contractInscription.methods.records(mId).call({from:account},function(error,result){
		contractInscription.methods.lockTime().call({from:account},function(error,timeInterval){
			console.log("result",result);
			var lastTime=result.time;
			var targetDate = (parseInt(lastTime)+parseInt(timeInterval))*1000;
			var currentDate = new Date().getTime();
			if(targetDate>currentDate){
				showAlert(2,"please wait for "+getCountdown(targetDate-currentDate))
			}else{
				call(contractInscription.methods.excharge(mId),contracts.inscription.address,function(){
					$("#alertmodel2").fadeOut(100)
					showAlert(1,"Success")
					init();
				});
			}
		});
	});
}
function getCountdown(distance) {
	// 计算倒计时的天、小时、分钟和秒
	const days = Math.floor(distance / (1000 * 60 * 60 * 24));
	const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
	const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
	const seconds = Math.floor((distance % (1000 * 60)) / 1000);
	var res=`${days}days ${hours}hours ${minutes}minutes ${seconds}seconds`;
	return res;
}
$("#search").click(function(){
	var addr=$("#keywords").val();
	if(addr.length!=42){
		return;
	}
	searchResult(addr);
})
function searchResult(addr){
	contractInscription.methods.typeCount(addr).call({from:account},function(error,counter){
		$("#latest").html("");
		console.log(counter)
		itemRecord(addr,counter);
	})
}

function itemRecord(addr,index){
	if(index<=0){
		return;
	}
	contractInscription.methods.indexName(addr,index).call({from:account},function(error,nameIndex){
		contractInscription.methods.inscriptions(nameIndex).call({from:account},function(error,meta){
			contractInscription.methods.balanceOf(addr,nameIndex).call({from:account},function(error,result){
				var formattedNumber = parseInt(result).toLocaleString('en-US', { useGrouping: true });
				var transfer='';
				var excharge='';
				if(nameIndex==1){
					//excharge=`<span class="evbtn" onclick="excharge('`+nameIndex+`',`+result+`)">Excharge</span>`;
				}
				if(addr==account){
					transfer=`<div href="javascript:;" class="bg2" style="color:#fff;cursor: pointer;">
						<span class="evbtn" onclick="send('`+meta.name+`',`+result+`)">Send</span>
						`+excharge+`
					</div>`
				}
				var div=`<div class="item">
					<div class="bg1">
					  <div class="title">`+meta.name+`</div>
					  <div class="val">`+formattedNumber+`</div>
					</div>
				   `+transfer+`
				  </div>`;
				$("#latest").append(div);
				index--;
				itemRecord(addr,index);
			})
		})
	})
}

function send(str,balance){
	tick=str;
	max=balance;
	$("#tick").html(str);
	$("#alertmodel2").fadeIn(200);
}
function excharge(num,balance){
	exchargeNum=num;
	max=balance;
	$("#balance").html(max)
	$("#alertmodel3").fadeIn(200);
}
var tick;
var max=0;
var exchargeNum=0;

$("#transfer").click(function(){
	var val=$("#value").val();
	var to=$("#toAddr").val();
	if(!val){
		showAlert(2,"Please enter amount")
		return;
	}
	if(!to||to.length!=42){
		showAlert(2,"The recipient's address is incorrect")
		return;
	}
	if(parseInt(val)>max){
		showAlert(2,"Insufficient Balance")
		return
	}
	var str=`{"p":"lrc-20","op":"transfer","tick":"`+tick+`","amt":"`+val+`"}`;
	console.log(str)
	call(contractInscription.methods.transfer(str,to),contracts.inscription.address,function(){
		$("#alertmodel2").fadeOut(100)
		showAlert(1,"Success")
		init();
	});
})

$("#excharge").click(function(){
	var val=$("#value2").val();
	if(!val){
		showAlert(2,"Please enter amount")
		return;
	}
	if(parseInt(val)>max){
		showAlert(2,"Insufficient Balance")
		return
	}
	call(contractInscription.methods.exchargeBalance(exchargeNum,val),contracts.inscription.address,function(){
		$("#alertmodel3").fadeOut(100)
		showAlert(1,"Success")
		init();
	});
})
$("#cancel").click(function(){
	$("#alertmodel2").fadeOut(200);
})
$("#cance2").click(function(){
	$("#alertmodel3").fadeOut(200);
})