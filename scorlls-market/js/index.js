loadData(function(){
	init()
	loadTask();
});
var startCounter=0;
function init(){
	$("#list").html("");
	$("#latest").html("");
	contractInscription.methods.recordCounter().call({from:account},function(error,counter){
		startCounter=counter;
		console.log(counter)
		itemRecord(counter,counter);
	})
}

function itemRecord(arr,index){
	if(index<=0){
		return;
	}
	getItem(index,function(div){
		$("#latest").append(div);
		index--;
		itemRecord(arr,index);
	})
}
function loadTask(){
	contractInscription.methods.recordCounter().call({from:account},function(error,counter){
		//console.log("counter",counter)
		if(counter>startCounter){
			loadMore(counter,function(){
				setTimeout(function(){
					loadTask()
				},1000)
			});
		}else{
			setTimeout(function(){
				loadTask()
			},1000)
		}
	})
}
function loadMore(nowCounter,endCall){
	if(startCounter>=nowCounter){
		startCounter=nowCounter;
		endCall()
	}else{
		startCounter++;
		getItem(startCounter,function(div){
			$("#latest").prepend(div);
			loadMore(nowCounter,endCall);
		})
	}
}
function getItem(index,callback){
	contractInscription.methods.records((index)).call({from:account},function(error,result){
		//console.log(result)
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
}