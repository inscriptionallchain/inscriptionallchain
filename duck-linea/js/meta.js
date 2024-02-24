loadData(function(){
	init()
});
function init(){
	var queryString = window.location.search;
	var metaId = getParameterByName('metaId', queryString);
	console.log("metaId",metaId);
	getItem(metaId,function(div){
		$("#list2").html(`<tr>
			<th>Event</th>
			<th>From</th>
			<th>To</th>
			<th>Time</th>
		  </tr>`);
		loadTransfers()
	})
}
var name="";
var tokenId;
function getItem(index,callback){
	contractInscription.methods.records((index)).call({from:account},function(error,result){
		contractProxy.methods.recordString(index).call({from:account},function(error,input){
			//console.log(result)
			var rate=Math.round(result.progress/result.supply*100 * 1000 ) / 1000
			var time=formatDate(parseInt(result.time)*1000);
			var owner=result.owner.slice(0,6)+"..."+result.owner.slice(36);
			var jsonObject = JSON.parse(input);
			var formattedJson = JSON.stringify(jsonObject, null, 2);
			$("#pre").html(formattedJson)
			$("#num").html(result.num)
			$("#owner").html(owner)
			$("#owner2").attr("data-clipboard-text",result.owner)
			$("#time").html(time)
			contractInscription.methods.inscriptionIndex(result.tick).call({from:account},function(error,result2){
				contractInscription.methods.inscriptions(result2).call({from:account},function(error,result3){
					tokenId=result3.num;
					//console.log(result3)
					var creator=result3.owner.slice(0,6)+"..."+result3.owner.slice(36);
					$("#creator").html(creator)
					$("#creator2").attr("data-clipboard-text",result3.owner)
					name=result3.name;
					$("#name").html(name);
					$("#code").html("#"+result3.num);
					var formattedNumber = parseInt(result3.supply).toLocaleString('en-US', { useGrouping: true });
					$("#supply").html(formattedNumber);
					var formattedNumber2 = parseInt(result3.holders).toLocaleString('en-US', { useGrouping: true });
					$("#holders").html(formattedNumber2);
					$("#tokenCreator").html(creator)
					$("#tokenCreator2").attr("data-clipboard-text",result3.owner)
					callback()
				});
			})
		})
	})
}

function loadTransfers(){
	contractInscription.methods.inscriptionRecordsCount(tokenId).call({from:account},function(error,counter){
		transferItem(counter,counter-1);
	})
}

function transferItem(arr,index){
	if(index<0){
		registerCopy();
		return;
	}
	contractInscription.methods.inscriptions(index).call({from:account},function(error,result){
		getTransferItem(index,function(div){
			$("#list2").append(div);
			index--;
			transferItem(arr,index);
		})
	})
}

function getTransferItem(index,callback){
	console.log(tokenId)
	contractInscription.methods.inscriptionRecords(tokenId,index).call({from:account},function(error,ar){
		//console.log(ar)
		contractInscription.methods.records(ar).call({from:account},function(error,result){
			//console.log(result)
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
			var div=`<tr>
				<td>`+method+`</td>
				<td><a href="javascript:void(0)">`+from+`</a></td>
				<td><a href="javascript:void(0)">`+to+`</a></td>
				<td>
				  `+time+`
				</td>
			  </tr>`;
			callback(div);
		})
	})
}
