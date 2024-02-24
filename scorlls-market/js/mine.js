loadData(function(){
	init()
});

function init(){
	$("#keywords").val(account)
	$("#search").click()
	$("#latest").html("");
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
			var rate=Math.round(result.progress/result.supply*100 * 1000 ) / 1000
			var time=formatDate(parseInt(result.time)*1000);
			var owner=result.owner.slice(0,6)+"..."+result.owner.slice(36);
			var jsonObject = JSON.parse(result.input);
			var formattedJson = JSON.stringify(jsonObject, null, 2);
			var div=`<div class="item">
				<a href="meta.html?metaId=`+index+`">
				  <div class="text">
					<div class="scroll">
					  <pre>`+formattedJson+`</pre>
					</div>
				  </div>
				  <div class="content">
					<div class="infor">
					  <p>#`+result.num+`</p>
					  <p>`+owner+`</p>
					</div>
					<div class="time">`+time+`</div>
				  </div>
				</a>
			  </div>
			</div>`;
			callback(div);
		})
	})
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
		var startCounter=counter;
		$("#latest").html("");
		console.log(counter)
		itemRecord(addr,counter,startCounter);
	})
}

function itemRecord(addr,index){
	if(index<=0){
		return;
	}
	contractInscription.methods.indexName(addr,index).call({from:account},function(error,str){
		contractInscription.methods.balanceOf(addr,str).call({from:account},function(error,result){
			var formattedNumber = parseInt(result).toLocaleString('en-US', { useGrouping: true });
			var transfer='';
			if(addr==account){
				transfer=`<div href="javascript:;" class="bg2" onclick="send('`+str+`',`+result+`)" style="color:#fff;cursor: pointer;">Send</div>`
			}
			var div=`<div class="item">
                <div class="bg1">
                  <div class="title">`+str+`</div>
                  <div class="val">`+formattedNumber+`</div>
                </div>
               `+transfer+`
              </div>`;
			$("#latest").append(div);
			index--;
			itemRecord(addr,index);
		})
	})
}

function send(str,balance){
	console.log(str);
	tick=str;
	max=balance;
	$("#tick").html(str);
	$("#alertmodel2").fadeIn(200);
}
var tick;
var max=0;

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
	var str=`{"p":"src-20","op":"transfer","tick":"`+tick+`","amt":"`+val+`"}`;
	console.log(str)
	call(contractInscription.methods.transfer(str,to),contracts.inscription.address,function(){
		$("#alertmodel2").fadeOut(100)
		showAlert(1,"Success")
		init();
	});
})