//_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/
//_/_/_/_/_/_/_/_/拡張開始_/_/_/_/_/_/_/_/_/_/_/_/　
//_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/
function startExtention(){
	//画像読み込みのエラー回避
	$(".leaflet-control-layers-toggle").css("background-image");

	//GoogleMap追加
	addGoogleLayers();
	
	//GoogleApi利用開始
	prepareGoogleMapApi();
	
	//アニメーション利用開始
	prepareBounceMarker();
	
	//プロット時間短縮
	setInterval(hoge, 8000);

//	//地図ジャンプを非表示
//	$("#button_customcontrol_area").remove();
	
	//地図ジャンプを小さく
	$("#button_customcontrol_area").css({"height":"32px","width":"32px","background-image":"url(https://img-pmap.aquapal-cdn.net/img/icon_area.png)", "background-size":"cover"});;
	$("#button_customcontrol_area").find("img").remove();
	
	//出現記録ボタンを小さく
	$("#button_customcontrol_history").css({"height":"32px","width":"32px","background-image":"url(https://img-pmap.aquapal-cdn.net/img/icon_history.png)", "background-size":"cover"});
	$("#button_customcontrol_history").find("img").remove();

	//設定ボタンを小さく
	$("#button_customcontrol_config").css({"height":"32px","width":"32px","background-image":"url(https://img-pmap.aquapal-cdn.net/img/icon_config.png)", "background-size":"cover"});
	$("#button_customcontrol_config").find("img").remove();

	//プッシュ通知ボタンを小さく
	$("#button_customcontrol_push").css({"height":"32px","width":"32px","background-image":"url(https://img-pmap.aquapal-cdn.net/img/icon_push.png)", "background-size":"cover"});
	$("#button_customcontrol_push").find("img").remove();

	//マップレイヤ小さく
//	$(".leaflet-control-layers").css({"width":"32px", "height":"32px"});
	$(".leaflet-control-layers-toggle").css({"width":"32px", "height":"32px", "background-image":"url(https://img-pmap.aquapal-cdn.net/img/icon_area.png)", "background-size":"cover"});

	//フッタ非表示
	hideFooter();
	
	//拡張ヘルプを表示
	$("#area_footer td").append($("<a href='https://github.com/shaland/PgoExtentions' target='_blank'>拡張説明</a>"));

	//ボタンサーチを非表示
	$("#area_buttonsearch").hide();
	
	//カスタムコントロール追加
	addCustomControlShowNearPokemon();
	addCustomControlStreetView()
	addCustomControlSearchPokeSource();

	addCustomControlShowFullScreen();
	addCustomControlShowPokemonWithoutWimp();
	addCustomControlShowPushOnly();
	addCustomControlShowPokemonDictionary();
	
	//アイコンマップ追加時
	map.on('layeradd', function(layer, layername){
		var ent = pokemon_list[layer.layer._locid];
		if(ent && ent.action == "found"){
			layer.layer.on('contextmenu',onRightClickMarkerMap);
		}
	});
	//初回のみすでに表示済みなので呼び出して実行
	setEvent();
	
	//右クリック無効化
	map.on('contextmenu',function(){});
	
	//マップデフォルト設定
	var layerControlElement = document.getElementsByClassName('leaflet-control-layers')[0]; //マップ切り替えのレイヤを取得
	layerControlElement.getElementsByTagName('input')[2].click();	//マップレイヤのチェックボックスの2つ目を選択
	
	//近くのポケモンクリック(いきなりすぎると表示まで時間かかるのでディレイ)
	setTimeout(function(){$("#button_customcontrol_ShowNearPokemon").click();},3000)
}

//_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/
//_/_/_/_/_/_/_/_/汎用関数_/_/_/_/_/_/_/_/_/_/_/_/
//_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/
//全てのポケモンの表示、非表示を変更
function changeAllPokemon(isShow){
	//スタイル未定義エラー回避のため、一度も処理されていない場合はスタイルをダミーで作成
	if($.trim($("#area_customcontrol_config_data_list").html()) == ""){
		var viewhtml = "";
		for (var i=1; i<=151; i++) {
			viewhtml += "<div id='area_configwindow_list_"+i+"' style='width:260px;' ></div>";
		}
		$("#area_customcontrol_config_data_list").html(viewhtml);
	};
	
	//すべてを変更
	allChangeConfigView(isShow?0:1); //allChangeConfigViewは、表示が0、非表示が1
};

//指定キーのポケモンまでのルートを表示
var _rootLine;
function drawRoute(key){
	console.log("★drawRoute1:"+key);
	if(!pokemon_list[key]) return;
	console.log("★★drawRoute2:"+key);

	var ent;
	var lat;
	var lng;

	ent = pokemon_list[key];

	if(gpslog_loc){
		//GPSがONの時はGPS値を利用
		lat = gpslog_loc.latitude;
		lng = gpslog_loc.longitude;
	} else {
		//GPSがOFFの時は画面中央を利用
		var center = getCenterMap();
		lat = center[0];
		lng = center[1];
	};

	var loc = key.split(",");
		
	var points =[];
	var origin = new google.maps.LatLng(lat,lng);	//出発点
	var destination = new google.maps.LatLng(loc[0],loc[1]);						//目的地
	var mode = google.maps.TravelMode.DRIVING;					//交通手段 driving/walking/bicycling

	var directionsService = new google.maps.DirectionsService;
	directionsService.route({
	    	origin: origin,
	    	destination: destination,
    		travelMode: mode,
			drivingOptions: {
				departureTime: new Date(),
				trafficModel: google.maps.TrafficModel.BEST_GUESS
			},
		}, function(response, status) {
		if (status == google.maps.DirectionsStatus.OK) {
			viewServerError(false);
			//ポイントを検索
			for(var i=0; i< response.routes[0].overview_path.length; i++){
				var path = response.routes[0].overview_path[i];
				if(i==0){
					//開始点を追加
					points.push([path.lat(),path.lng()]);
				}
				//終点を追加
				points.push([path.lat(),path.lng()]);
			}
			
			var color;
			var message;
			
			if((new Date()).getTime()/1000 + response.routes[0].legs[0].duration.value <= pokemon_list[key]["tol"]/1000){
				//間に合う
				color = "green";
				message = "◎間に合う！";
			} else {
				//間に合わない
				color = "red";
				message = "×間に合わない";
			}
			
			//道順を描画
			if(_rootLine) _rootLine.remove();
			_rootLine = L.polyline(points, {color: color}).addTo(map);

			if(pokemon_list[key]){
				var ent = pokemon_list[key];
				if(ent.overlay){
					//距離と到着時間を表示
	  				ent.overlay.bindPopup("<div style='font-size:12px;font-weight:bold;'>" + getPokemonLocal(pokemon_list[key].id) + "" +
	  										"<br />消滅時刻：" + viewToL(pokemon_list[key].tol) +
	  										"<br />距離　　：" + response.routes[0].legs[0].distance.text +
	  										"<br />車で　　：" + response.routes[0].legs[0].duration.text +
	  										"<br /><font color='" + color + "'>" + message + "</font> </div>")
	  				   .openPopup();
				}
			}
			
		} else {
			viewServerError("ルートステータスエラー");
			console.log("★★ステータス値異常" + status);
		};
	});
}

//_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/
//_/_/_/_/_/_/_/_/GoogleMap追加_/_/_/_/_/_/_/_/_/_/_/_/
//_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/
function addGoogleLayers(){
	var attr = '&copy;Google、ZENRIN <a href="https://www.google.com/intl/ja_jp/help/terms_maps.html" target="_blank">利用規約</a>';
	var gmap_hyb = new  L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {maxZoom: 21,minZoom: 6,reuseTiles: true,subdomains:['mt0','mt1','mt2','mt3'],attribution:attr})
	var gmap_str = new  L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {maxZoom: 21,minZoom: 6,reuseTiles: true,subdomains:['mt0','mt1','mt2','mt3'],attribution:attr})
	var gmap_sat = new  L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {maxZoom: 21,minZoom: 6,reuseTiles: true,subdomains:['mt0','mt1','mt2','mt3'],attribution:attr})
	var gmap_ter = new  L.tileLayer('https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', {maxZoom: 21,minZoom: 6,reuseTiles: true,subdomains:['mt0','mt1','mt2','mt3'],attribution:attr})

	//ベースレイヤーグループ化
	var baseMaps = {
	    "デフォルト": _tilelayer,
	    "GoogleMap(ハイブリッド)": gmap_hyb,
	    "GoogleMap(ストリート)": gmap_str,
	    "GoogleMap(衛星写真)": gmap_sat,
	    "GoogleMap(地形)": gmap_ter
	};

	L.control.layers(baseMaps).addTo(map);
}
//_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/
//_/_/_/_/_/_/_/_/GoogleMapAPI追加_/_/_/_/_/_/_/_/_/_/_/_/
//_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/
function prepareGoogleMapApi(){
//	$.getScript("https://maps.googleapis.com/maps/api/js");
	$.getScript("https://maps.googleapis.com/maps/api/js?key=AIzaSyD7Tjp5YntHWW7WDsy_JESjGx1fRReIT6o");
}
//_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/
//_/_/_/_/_/_/_/_/バウンズアニメーション用JS追加_/_/_/_/_/_/_/_/_/_/_/_/
//_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/
//https://github.com/hosuaby/Leaflet.SmoothMarkerBouncing
function prepareBounceMarker(){
	$.getScript("https://goo.gl/I5kLRs",
		function(){
			//プラグイン読み込み完了後にアニメーションデフォルト値設定
			L.Marker.setBouncingOptions({
		        bounceHeight : 60,   // height of the bouncing
		        bounceSpeed  : 54   // bouncing speed coefficient
			});

			//既に登録済みのマーカを設定(スクリプトの読み込みがマーカー生成後なので)
			for(var key in map._layers){
				var marker = map._layers[key];
				if(marker._icon){
					marker._bouncingMotion = {
            			isBouncing: false
        			};
        			marker._calculateTimeline()
				}
			}

/*			
			//既に登録済みのマーカを設定(スクリプトの読み込みがマーカー生成後なので)
			for(var key in pokemon_list){
				var ent = pokemon_list[key];
				if(ent && ent["overlay"]){
					ent["overlay"]._bouncingMotion = {
            			isBouncing: false
        			};
        			ent["overlay"]._calculateTimeline()
				}
			}
*/
		}
	);
}

//_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/
//_/_/_/_/_/_/_/_/プロット間隔短縮化_/_/_/_/_/_/_/_/_/_/_/_/
//_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/
//表示間隔短縮化
function hoge(){requestDBServer('viewData');}

//_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/
//_/_/_/_/_/_/_/_/フッタ非表示_/_/_/_/_/_/_/_/_/_/_/_/
//_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/
function hideFooter(){
	//PCの場合はヘッダ部を非表示
	if($("header").get(0).getElementsByTagName("table").length == 6){	
		$("table")[0].hidden=true;
	}
	$("table").css({"height":"24px","font-size":"small"});
	$("#area_topmessage").css({"height":"24px"});	//GPSボタンとか見えなくなるのを防ぐため
	$("#area_map_frame").css({"margin-bottom":"0px","margin-top":"24px"});
	adSetHidden();
	map.invalidateSize(); 
}
function getFooterHeight() {return 24;} //既存メソッドをオーバライド

//_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/
//_/_/_/_/_/_/_/_/近くのポケモン表示_/_/_/_/_/_/_/_/_/_/_/_/
//_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/
//_/_/_/_/_/_/_/_/近くのポケモンボタン_/_/_/_/_/_/_/_/_/_/
function addCustomControlShowNearPokemon(){
	var customControlShowNearPokemon = L.Control.extend({
			options: {
		    	position: 'topleft' 
		  	},

			onAdd: function (map) {
				var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom leaflet-control-command-interior');
					container.id = "button_customcontrol_ShowNearPokemon";
					container.innerHTML = "近くのﾎﾟｹﾓﾝ";
					container.style.backgroundColor = 'white';
					container.style.width = '80px';
					container.style.height = '20px';
					container.style.padding = '5px';
					container.style.fontSize = '50%';
					container.style.textAlign = 'center';
					container.style.fontColor = '#999999';
					container.style.cursor = 'pointer';

					container.onclick = function(){
		      			ShowNearPokemonMain();
		    		}
		    	return container;
		  	},
		});
	map.addControl(new customControlShowNearPokemon());
}

var _shownPokeFlag = false;
var _interval_ShowNearPokemon;
function ShowNearPokemonMain(){
	if(_shownPokeFlag) {
		//停止
		$('#button_customcontrol_ShowNearPokemon').css('backgroundColor', 'white');
        clearInterval(_interval_ShowNearPokemon);
		if($('#area_pokelist').size() != 0 ) $('#area_pokelist').remove();
        _shownPokeFlag = false;
    } else {
    	//開始
		$('#button_customcontrol_ShowNearPokemon').css('backgroundColor', '#FFCC66');
		//一定間隔でポケモンリストを更新
		ShowNearPokemon();
		_interval_ShowNearPokemon = setInterval(ShowNearPokemon, 5000);
        _shownPokeFlag = true;
    }
}

var _shownList = [];
var _currentPokeId = 0;
var _currentIndex = 0;
function ShowNearPokemon(){
	var pokeList = [];
	
	//初期化
	_shownList = [];
	
	//すべてのリストを対象に処理
	for (var i in pokemon_list) {
		if (!pokemon_list[i]) continue;							//リストが未存在ならスキップ
		if (pokemon_list[i]["delete"]) continue;				//リストが削除済みであればスキップ
		if (pokemon_list[i]["action"] != "found") continue;		//ポケモン以外であればスキップ
		if (checkBoundsDiffOver(i)) continue;					//画面外であればスキップ
		
		if(!_shownList[pokemon_list[i].id]){
			//初めての場合、オブジェクトを登録
//			console.log(pokemon_list[i].loc);
			pokeList = new Array();
			pokeList.push(pokemon_list[i]);
			_shownList[pokemon_list[i].id]={"id": pokemon_list[i].id, "count": 1, "pokeList": pokeList};
		} else {
			pokeList = _shownList[pokemon_list[i].id].pokeList;
			pokeList.push(pokemon_list[i]);
			//既に存在している場合は、カウンタをインクリメント
			_shownList[pokemon_list[i].id].count++;
		}
	}

	//発見済みリストをソート
	_shownList.sort(function(a,b){
		if(!a || !b) return 0;

		//１．レア度の降順
		if(rare_table[a.id] != rare_table[b.id]) return rare_table[b.id] - rare_table[a.id];
		
		
		//２．出現数の昇順
		if(a.count != b.count) return a.count - b.count;

		//３．IDの降順
		return b.id - a.id;
	})
	
	//表示エリア描画
	if($('#area_pokelist').size() == 0 ){
		var html = "<div id='area_pokelist' style='display: block; position: fixed; background-color: rgba(200, 200, 255, 0.901961); z-index: 10000; left: 50px; right: 50px; height: 48px; top: 24px; margin: 0 auto;'>"
		html 	+= "	<div style='width:100%;height:100%;overflow-y: hidden;overflow-x: auto;-webkit-overflow-scrolling: touch; white-space:nowrap;'>"
		html 	+= "		<div style='padding:5px;'>"
		html 	+= "			<div id='area_pokelist_data' style='display: table-cell;vertical-align: middle;font-size: 50%;'>"
		html 	+= "			</div>";
		html 	+= "		</div>";
		html 	+= "	</div>";
		html 	+= "</div>";

		$('body').append(html);
	}

	//データ描画
	html = "					<img id='pokemonBall' src='" + getPokemonBallURL() + "' style='width:25px; cursor:pointer;' onclick='onShownPokemonClick(-1);' oncontextmenu='onShownPokemonRightClick(-1); return false;'>";

	for (i=0;i<_shownList.length;i++){
		if(!_shownList[i]) continue;	
		
		html += "				<img src='" + getIconImage(_shownList[i].id) + "' style='width:25px; cursor:pointer;' onclick='onShownPokemonClick(\""+ _shownList[i].id + "\");' oncontextmenu='onShownPokemonRightClick(\""+ _shownList[i].id + "\"); return false;'>" + _shownList[i].count;
	}	
	
	$('#area_pokelist_data').html(html);
}

//近くのポケモンのクリック時
function onShownPokemonClick(id){	
	if(id == -1){
		_currentPokeId = id;
		_currentIndex = 0;
		//スーパーボール時は、すべてのポケモンを表示する
		changeAllPokemon(true);
	} else {
		//クリック対象を探す
		var shownPoke;
		for(var i = 0;i<_shownList.length;i++){
			if(_shownList[i].id == id){
				shownPoke = _shownList[i];
				break;
			}
		}
		
		//見つけられなければ終了
		if(!shownPoke) return;
		
		if(id != _currentPokeId){
			//対象ポケモンが前回と変わっていれば初期化
			_currentPokeId = id;
			_currentIndex = 0;
		}else{
			//変わりない場合は、次の同一ポケモンへ
			_currentPokeId = id;
			_currentIndex++;
			if(shownPoke.pokeList.length <= _currentIndex) _currentIndex=0;
		}
		
		//対象のポケモン情報を取得
		var poke = shownPoke.pokeList[_currentIndex];
	
		//経路を描画
		drawRoute(poke.loc);
		
		//クリックされたポケモンのみ表示する
		changeAllPokemon(false);
		toggleConfigViewList(id);

		//画面中央にポケモンを表示
		var tmp = poke.loc.split(",");
		map.setView([tmp[0],tmp[1]]);

		//ポップアップ位置とGPS位置
		protPolylineFromGPS(tmp[0],tmp[1]);
		
		//ストリートビューモード時は、ビューの位置も移動する
		if(_isStreetViewMode){
			if(pokemon_list[poke.loc]){
				//ストリートビューの位置を変更
				moveToPokemon(pokemon_list[poke.loc]["overlay"]);
			}
		}
	}
}

//_/_/_/_/_/_/_/_/近くのポケモンの右クリック時_/_/_/_/_/_/_/_/_/_/
function onShownPokemonRightClick(id){
	if(id == -1){
		//ポケモンボール時は、ポケモンボール変更
		changePokemonBall();
	} else {
		//まず、すべてのバウンスを停止
		L.Marker.stopAllBouncingMarkers();	
		//クリック対象のポケモンマーカにアニメーションを設定する
		var shownPoke;
		for(var i = 0;i<_shownList.length;i++){
			if(_shownList[i].id == id){
				//全てのポケモンにアニメーションを設定
					for(var key in _shownList[i].pokeList){
						var poke = _shownList[i].pokeList[key];
						if(pokemon_list[poke.loc] && pokemon_list[poke.loc]["overlay"] && pokemon_list[poke.loc]["overlay"]._map){
							//バウンズアニメーションを設定
							pokemon_list[poke.loc]["overlay"].bounce(3);//bounce "n" times
						}
					}					
				break;
			}
		}
	}
}

//_/_/_/_/_/_/_/_/ポケモンボール変更_/_/_/_/_/_/_/_/_/_/
var _currentPokemonBallIndex=0;
function changePokemonBall(){
	_currentPokemonBallIndex++;
	if(_pokemonBallUrlList.length <= _currentPokemonBallIndex) _currentPokemonBallIndex=0;
	
	$("#pokemonBall").attr({'src':getPokemonBallURL()});
}

//_/_/_/_/_/_/_/_/ポケモンボールのURL変更_/_/_/_/_/_/_/_/_/_/
var _pokemonBallUrlList = [];
function getPokemonBallURL(){
	//初回の場合のみURLをセットする
	if(_pokemonBallUrlList.length==0){
		_pokemonBallUrlList =[
			"https://renote.s3.amazonaws.com/uploads/article_image/file/46018/CORKYm-UkAAwgGm.png",
			"https://renote.s3.amazonaws.com/uploads/article_image/file/46028/i320.jpeg",
			"https://d13xjf6056yhmz.cloudfront.net/349639/f02afb3d0344825dd0c0ec0f87300c00_2016-08-18.png/show?1471499558",
			"https://d13xjf6056yhmz.cloudfront.net/417706/5aaf53609dc75162206e17a71599dd8b_2016-09-21.png/show?1474428430",
			"https://cdn.pixabay.com/photo/2016/08/15/00/50/pokeball-1594373_960_720.png",
			"https://renote.s3.amazonaws.com/uploads/article_image/file/46034/1429806633.jpeg"
		];
	}
	
	//カレントのURLを返却する
	return _pokemonBallUrlList[_currentPokemonBallIndex];
}

//_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/
//_/_/_/_/_/_/_/_/ポケモン図鑑表示_/_/_/_/_/_/_/_/_/_/_/_/
//_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/
//_/_/_/_/_/_/_/_/ポケモン図鑑ボタン_/_/_/_/_/_/_/_/_/_/
function addCustomControlShowPokemonDictionary(){
	var customControlShowPokemonDictionary = L.Control.extend({
			options: {
		    	position: 'bottomright' 
		  	},

			onAdd: function (map) {
				var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom leaflet-control-command-interior');
					container.id = "button_customcontrol_ShowPokemonDictionary";
					container.innerHTML = "ﾎﾟｹﾓﾝ図鑑";
					container.style.backgroundColor = 'white';
					container.style.width = '80px';
					container.style.height = '20px';
					container.style.padding = '5px';
					container.style.fontSize = '50%';
					container.style.textAlign = 'center';
					container.style.fontColor = '#999999';
					container.style.cursor = 'pointer';

					container.onclick = function(){
		      			ShowPokemonDictionaryMain();
		    		}
		    	return container;
		  	},
		});
	map.addControl(new customControlShowPokemonDictionary());
}

var _shownPokemonDictionary = false;
function ShowPokemonDictionaryMain(){
	if(_shownPokemonDictionary) {
		//停止
		$('#button_customcontrol_ShowPokemonDictionary').css('backgroundColor', 'white');
		if($('#area_pokemon_dictionary').size() != 0 ) $('#area_pokemon_dictionary').hide();
        _shownPokemonDictionary = false;
    } else {
    	//開始
		$('#button_customcontrol_ShowPokemonDictionary').css('backgroundColor', '#FFCC66');
		ShowPokemonDictionary();
        _shownPokemonDictionary = true;
    }
}

function ShowPokemonDictionary(){
	
	if($('#area_pokemon_dictionary').size() == 0 ){
		//初回表示
		var html = "<div id='area_pokemon_dictionary' style='display: block; position: fixed; background-color: rgba(200, 200, 255, 0.901961); z-index: 10000; left: 50px; right: 50px; height: 48px; bottom: 24px; margin: 0 auto;'>"
		html 	+= "	<div style='width:100%;height:100%;overflow-y: hidden;overflow-x: auto;-webkit-overflow-scrolling: touch; white-space:nowrap;'>"
		html 	+= "		<div style='padding:5px;'>"
		html 	+= "			<div id='area_pokemon_dictionary_data' style='display: table-cell;vertical-align: middle;font-size: 50%;'>"

//		html	+= "				<img id='pokemonBall' src='" + getPokemonBallURL() + "' style='width:25px; cursor:pointer;' onclick='onDictionalyBallClick();' oncontextmenu='return false;'>";

		for (var i=1; i<=251; i++){
			html += "					<img id='pokemon_dictionary_" + i  + "' src='" + getIconImage(i) + "' style='width:25px; cursor:pointer;' onclick='onPokemonDictionaryClick(\""+ i + "\");' oncontextmenu='onPokemonDictionaryRightClick(\""+ i + "\"); return false;'>";
			html += "					<span id='tip_" + i + "' style='width: 500px;'></span>";
		}	

		html 	+= "			</div>";
		html 	+= "		</div>";
		html 	+= "	</div>";
		html 	+= "</div>";
		$('body').append(html);
	} else {
		//二回目以降表示
		$('#area_pokemon_dictionary').show();
	}
}

//_/_/_/_/_/_/_/_/ポケモン辞書のクリック時_/_/_/_/_/_/_/_/_/_/
function onPokemonDictionaryClick(id){
	jumpSearchMobList(id);
}

//_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/
//_/_/_/_/_/_/_/_/ポッポコラッタ以外表示_/_/_/_/_/_/_/_/_/_/_/_/
//_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/
function addCustomControlShowPokemonWithoutWimp(){
	var customControlShowPokemonWithoutWimp = L.Control.extend({
			options: {
		    	position: 'bottomright' 
		  	},

			onAdd: function (map) {
				var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom leaflet-control-command-interior');
					container.id = "button_customcontrol_showPokemonWithoutWimp";
					container.innerHTML = "ﾎﾟｯﾎﾟｺﾗｯﾀ以外";
					container.style.backgroundColor = 'white';
					container.style.width = '80px';
					container.style.height = '20px';
					container.style.padding = '5px';
					container.style.fontSize = '50%';
					container.style.textAlign = 'center';
					container.style.fontColor = '#999999';
					container.style.cursor = 'pointer';

					container.onclick = function(){
						console.log('buttonClicked');
		      			showPokemonWithoutWimp();
		    		}
		    	return container;
		  	},
		});
	map.addControl(new customControlShowPokemonWithoutWimp());
}

//雑魚（ポッポ、コラッタ）以外を表示
function showPokemonWithoutWimp(){
prepareRecord();
/*
	//すべてを表示する
	changeAllPokemon(true);
	
	//ポッポ、コラッタを非表示
	toggleConfigViewList(16);//ポッポ
	toggleConfigViewList(19);//コラッタ
*/
}

//_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/
//_/_/_/_/_/_/_/_/通知のみ表示_/_/_/_/_/_/_/_/_/_/_/_/
//_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/
function addCustomControlShowPushOnly(){
	var CustomControlShowPushOnly = L.Control.extend({
			options: {
		    	position: 'bottomright' 
		  	},

			onAdd: function (map) {
				var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom leaflet-control-command-interior');
					container.id = "button_customcontrol_showPushOnly";
					container.innerHTML = "通知のみ表示";
					container.style.backgroundColor = 'white';
					container.style.width = '80px';
					container.style.height = '20px';
					container.style.padding = '5px';
					container.style.fontSize = '50%';
					container.style.textAlign = 'center';
					container.style.fontColor = '#999999';
					container.style.cursor = 'pointer';

					container.onclick = function(){
						console.log('buttonClicked');
		      			showPushOnly();
		    		}
		    	return container;
		  	},
		});
	map.addControl(new CustomControlShowPushOnly());
}

function showPushOnly(){
	//プッシュ通知以外は非表示にする
	for (var i=1; i<=151; i++) {
		if( (config_push[i]=="1" && config_viewlist[i]=="1") || (config_push[i]!="1" && config_viewlist[i]!="1") ){
			toggleConfigViewList(i);
		}
	}	
}

//_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/
//_/_/_/_/_/_/_/_/自動更新_/_/_/_/_/_/_/_/_/_/_/_/
//_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/

//_/_/_/_/_/_/共通_/_/_/_/_/_/_/_/
var _marker_area = [];
var _marker_circle = [];
var _count=0;
var _searchInterval=15000; //検索の間隔

function searchPointByLoc(loc1,loc2){
	var count = _count;
	console.log("★★latlng: "+loc1+","+loc2+":" + count);
		
	research_key = uuid();

	$.ajax({
	    url: "https://sv-webdb1.pmap.kuku.lu/_server.php",
	    type: "GET",
	    data: "&uukey=c2e316f11149c3f8e1ff5da39efe46de&sysversion=1000&action=addServerQueue&run_key="+research_key+"&loc1="+loc1+"&loc2="+loc2,
//	    data: "&action=addServerQueue&run_key="+research_key+"&loc1="+loc1+"&loc2="+loc2,
	    timeout: 6000,
	    cache: false
	}).done(function(data, status, xhr) {
		if (data.indexOf("OK") != 0) {
			console.log("★★メンテナンス中★★");
			_marker_circle[count]=L.circle([loc1,loc2],100,{"fill": true,"fillOpacity": 0.2,"weight": 0,"color": "#ff0000"}).addTo(map);
		} else {
			var _tmp = data.split("OK:");
			var _res = parseValue(_tmp[1]);
			if (_res["server"] == "busy") {
				console.log("★★busy★★");
				_marker_circle[count]=L.circle([loc1,loc2],100,{"fill": true,"fillOpacity": 0.2,"weight": 0,"color": "#ffff00"}).addTo(map);
				research_runserver = _res;
			} else {
				console.log("★★OK★★");
				_marker_circle[count]=L.circle([loc1,loc2],200,{"fill": true,"fillOpacity": 0.2,"weight": 0,"color": "#0000ff"}).addTo(map);	
//				//サークルを徐々に非表示にする
//				var timerID = setInterval(function(){
//					var opacity = _marker_circle[count].options.fillOpacity - 0.03;
//					_marker_circle[count].setStyle({"fillOpacity": opacity});
//					if(opacity <= 0){
//						clearInterval(timerID);
//					}
//				},100);
				
				research_runserver = _res;
				//ポケソースモードの場合、無駄処理を抑えるため、今回チェックしたﾎﾟｲﾝﾄから、半径200m以内のポケソースはスキップ対象にする
				if(_pokesource_list){
					var i;
					for(i=0;i<_pokesource_list.length;i++){
						var ent = _pokesource_list[i];
						var latlng = ent.loc.split(",");
						if(getDistance(parseFloat(loc1), parseFloat(loc2), parseFloat(latlng[0]), parseFloat(latlng[1]))<=200){
							//サーチをスキップ対象に
							ent.skipSearch = true;
						}
					}
				}
			}
		}
	}).fail(function(xhr, status, error) {
			console.log("★★ERROR★★");
			_marker_circle[count]=L.circle([loc1,loc2],100,{"fill": true,"opacity": 0.8,"weight": 2,"color": "#ff0000"}).addTo(map);
	});
}

//ポケソースの時間チェック
function checkPokeSourceNow(ent) {
	var losttimes = ent.losttime.split(",");
	for (var x in losttimes) {
		var losttime = parseInt(losttimes[x]);
		if (checkPokeSourcePoptimeSingle(losttime, ent.longtime)) {
			return true;
		}
	}
	return false;
}

//_/_/_/_/_/_/_/_/ポケソース更新_/_/_/_/_/_/_/_/_/_/
function addCustomControlSearchPokeSource(){
	var customControlSearchPokeSource = L.Control.extend({
			options: {
		    	position: 'topleft' 
		  	},

			onAdd: function (map) {
				var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom leaflet-control-command-interior');
					container.id = "button_customcontrol_SearchPokeSource";
					container.innerHTML = "ﾎﾟｹｿｰｽ更新";
					container.style.backgroundColor = 'white';
					container.style.width = '80px';
					container.style.height = '20px';
					container.style.padding = '5px';
					container.style.fontSize = '50%';
					container.style.textAlign = 'center';
					container.style.fontColor = '#999999';
					container.style.cursor = 'pointer';

					container.onclick = function(){
		      			searchPokesourceMain();
		    		}
		    	return container;
		  	},
		});
	map.addControl(new customControlSearchPokeSource());
}

var _targetList=[];//検索対象
var _isShowPokesourceMode = false;
var _isJitakuMode;
var _priorityPoint = [];
var _priorityRectangles = [];
var _timerIdSearchPokesource;
var _timerIdCheckPokeFound;
var _timerIdResetCounter;
//_/_/_/_/_/_/_/_/ポケソースサーチ実行_/_/_/_/_/_/_/_/_/_/
function searchPokesourceMain(){
	if(_isShowPokesourceMode) {
		//停止
        _isShowPokesourceMode = false;
		$('#button_customcontrol_SearchPokeSource').css('backgroundColor', 'white');
		
		clearInterval(_timerIdSearchPokesource);
		clearInterval(_timerIdCheckPokeFound);
		clearInterval(_timerIdResetCounter);

		//マーカーをクリア
		var i;
		for(i=0;i<_marker_circle.length;i++){
			if(_marker_circle[i]) {
			 	_marker_circle[i].remove();
			 	_marker_circle[i] = null;
			}
		}
		_marker_circle=[];
		
		//優先エリアをクリア
		for(i=0;i<_priorityRectangles.length;i++){
			if(_priorityRectangles[i]) {
			 	_priorityRectangles[i].remove();
			 	_priorityRectangles[i] = null;
			}
		}
		_priorityRectangles=[];
		
		//画面メッセージ
		viewTopMessage("ポケソース更新終了","");	
    } else {
    	//開始
        _isShowPokesourceMode = true;
		$('#button_customcontrol_SearchPokeSource').css('backgroundColor', '#FFCC66');

		//初期化
		_targetList=[];
		_isJitakuMode=false;
		_priorityPoint=[];		
		_priorityRectangles=[];

		_pokesource_list=[];
		_center=[];
		_prepareCount = 0;
		_prepareOK = false;

		_marker_area = [];
		_marker_circle=[];
		_count = 0;

		var radius=0.0005;

		//画面中央を基点
		_center = getCenterMap();
		
			//通常モード
			_isJitakuMode = false;
			_targetList[0] = _center;
			
		//処理対象の分だけループ
		for(i=0;i<_targetList.length;i++){
			var target = _targetList[i];

			console.log("★★処理対象"+target[0]+","+target[1]);
			
			//準備処理
			prepareSearchPokesource(target[0],target[1]); 
		}
    }
}

var _pokesource_list=[];
var _center=[];
var _prepareCount = 0;
var _prepareOK = false;
//_/_/_/_/_/_/_/_/ポケソース更新の準備処理_/_/_/_/_/_/_/_/_/_/
function prepareSearchPokesource(lat,lng) {
	var mode = 'viewData'
	if (research_runserver["dbserver"]) {
		using_dbserver = research_runserver["dbserver"];
	}	
		
	var pokesource = ""+lat+","+lng;
	
	$.ajax({
	   	url: "https://"+using_dbserver+"/_dbserver.php?uukey=c2e316f11149c3f8e1ff5da39efe46de&sysversion=1000&action="+encodeURIComponent(mode)+"&fort=&pokesource_loc="+encodeURIComponent(pokesource)+"&history_pokemonid=&sv="+encodeURIComponent(research_runserver["server"])+"&research_key="+encodeURIComponent(research_key)+"&loc1="+encodeURIComponent(lat)+"&loc2="+encodeURIComponent(lng),
//	   	url: "https://"+using_dbserver+"/_dbserver.php?action="+encodeURIComponent(mode)+"&fort=&pokesource_loc="+encodeURIComponent(pokesource)+"&history_pokemonid=&sv="+encodeURIComponent(research_runserver["server"])+"&research_key="+encodeURIComponent(research_key)+"&loc1="+encodeURIComponent(lat)+"&loc2="+encodeURIComponent(lng),
	    type: "GET",
	    data: "",
	    timeout: 8000,
	    cache: false
	}).done(function(data, status, xhr) {		
//		console.log(data);
		
		viewServerError(false);
		
		addPokeSourceList(data);
		
		_prepareCount++;
		
		if(_prepareCount==_targetList.length){
			//全部揃ったところで初期化
			for(i=0;i<_pokesource_list.length;i++){
				_pokesource_list[i].skipSearch=false;
				_marker_circle[i] = null;
			}
			_prepareOK=true;
			//画面メッセージ
			var modeName = _isJitakuMode ? "【自宅モード】" : "【通常モード】";
			viewTopMessage("自動更新-"+_pokesource_list.length,"");	
			//初回実行
			searchPokesource();
			
			//一定間隔でポケソースを対象にポケモンを検索
			_timerIdSearchPokesource = setInterval(searchPokesource, _searchInterval);

			//一定間隔でポケモンの状態をチェック
			_timerIdCheckPokeFound = setInterval(checkPokeFound, _searchInterval);

			//一定間隔で最初の地点から検索
			_timerIdResetCounter = setInterval(resetCounter, 10*60*1000);
		}
	}).fail(function(xhr, status, error) {
		//console.log("DBServer: error: "+error);
	    //alert("操作に失敗しました。インターネット接続が安定している場所で再度お試しください。");
	    viewServerError("接続エラー");
	});
}

function addPokeSourceList(data){
	var dataList = data.split("\n");
	for (var i=0; i<dataList.length; i++) {
		var ent = parseValue(dataList[i]);
		
		//揺らぎを防ぐ(?)ため場所を短くする
		if(ent.loc){
			var tmp = ent.loc.split(",");
			ent.loc = ""+mRound(tmp[0],9)+","+mRound(tmp[1],9);
		}
		
		//ポケソース情報を格納
		if (ent.action == "found_ps") {
			if(!GetPokeSourceByLoc(ent.loc)){
				//同一キーがなければ追加
				_pokesource_list.push(ent);
			}
		}

		//ポケモン出現済みかを確認
		if (ent.action == "found") {
			var ent2 = GetPokeSourceByLoc(ent.loc);
			if (ent2) {
				//ポケソース出現の場合は出現済みに更新
//					console.log("★★found: "+ent.loc + ";" + ent.id);
				ent2.found = true;
				//発見したポケIDをポケソースに登録
				ent2.id = ent.id;
			}
		}
	}
	
	//対象範囲を描画
//	drawArea(dataList);
	
	//中心から近い順にソート
	_pokesource_list.sort(function(a,b){
		var radius=0.0005;
		var latlng_a;
		var latlng_b;
		var point_a;
		var point_b;
		var priority_a = 0;
		var priority_b = 0;
		
		latlng_a = a.loc.split(",");
		latlng_b = b.loc.split(",");

		//優先ポイントのエリアに入っているかチェック
		for(i=0;i<_priorityPoint.length;i++){
			if(    ((_priorityPoint[i][0]-radius) <= latlng_a[0]) && (latlng_a[0] <= (_priorityPoint[i][0]+radius))
			    && ((_priorityPoint[i][1]-radius) <= latlng_a[1]) && (latlng_a[1] <= (_priorityPoint[i][1]+radius)) ){
			    priority_a=1;
			    break;
			}
		}
		for(i=0;i<_priorityPoint.length;i++){
			if(    ((_priorityPoint[i][0]-radius) <= latlng_b[0]) && (latlng_b[0] <= (_priorityPoint[i][0]+radius))
			    && ((_priorityPoint[i][1]-radius) <= latlng_b[1]) && (latlng_b[1] <= (_priorityPoint[i][1]+radius)) ){
			    priority_b=1;
			    break;
			}
		}
		
		//優先ポイントの場合は、優先ポイントの有無で比較
		if(priority_a != 0 || priority_b !=0){
			return priority_b - priority_a;
		} 
		
		//中心点からのﾎﾟｲﾝﾄを求める
		point_a = getDistance(parseFloat(_center[0]), parseFloat(_center[1]), parseFloat(latlng_a[0]), parseFloat(latlng_a[1]));
		point_b = getDistance(parseFloat(_center[0]), parseFloat(_center[1]), parseFloat(latlng_b[0]), parseFloat(latlng_b[1]));
		
		//中心点からのポイントで比較
		return point_a - point_b;
	});
}

//対象エリアを描画
function drawArea(dataList){
	//エリアを描画
	var min_lat=0;
	var min_lng=0;
	var max_lat=0;
	var max_lng=0;
	for(i=0;i<dataList.length;i++){
		var ent = parseValue(dataList[i]);
	
		if (ent.action != "found_ps") continue;

		var latlng=ent.loc.split(",");
		
		//初期値セット
		if(i==0){
			min_lat=latlng[0];
			min_lng=latlng[1];
		}
		
		if(latlng[0]<min_lat) min_lat=latlng[0];
		if(max_lat<latlng[0]) max_lat=latlng[0];
		if(latlng[1]<min_lng) min_lng=latlng[1];
		if(max_lng<latlng[1]) max_lng=latlng[1];
	}
	
	//処理範囲を描画
	console.log("★★" + min_lat + ":" + min_lng + ":" + max_lat + ":" + max_lng);
	var bounds = [[min_lat,min_lng],[max_lat,max_lng]];
	_marker_area.push(L.rectangle(bounds,{"fill": true,"opacity": 0.2,"weight": 1,"color": "#ff3333"}).addTo(map));
}

//ポケソースリストからゲット
function GetPokeSourceByLoc(loc){
	for(i=0;i<_pokesource_list.length;i++){
		if(_pokesource_list[i].loc == loc) return _pokesource_list[i];
	}
	return false;
}

//ポケモンが発見済みかをチェック
var _counter_checkPokeFound=0;
function checkPokeFound(){
	var mode = 'viewData'
	var target=[];
	var lat;
	var lng;
	var counter;
	
	//初期化前の場合は処理終了
	if(!_prepareOK) return;
	
	//カウンタ越えの場合は初期化
	if(_targetList.length<=_counter_checkPokeFound){
		for (i=0;i<_targetList.length;i++){
			_targetList[i].found = false;
		}
		_counter_checkPokeFound=0;
	}

	//ローカル変数に格納してカウンタインクリメント
	counter=_counter_checkPokeFound;
	_counter_checkPokeFound++;

//	console.log("★★ポケモン発見済みチェック:" + counter);

	if (research_runserver["dbserver"]) {
		using_dbserver = research_runserver["dbserver"];
	}
	
	//処理対象を決定
	target = _targetList[counter];

//	console.log("★★チェックターゲット:" + target);
	
	//未定義なら処理終了
	if(!target) return;

	lat = target[0];
	lng = target[1];
	var pokesource = ""+lat+","+lng;
	
	$.ajax({
	   	url: "https://"+using_dbserver+"/_dbserver.php?uukey=c2e316f11149c3f8e1ff5da39efe46de&sysversion=1000&action="+encodeURIComponent(mode)+"&fort=&pokesource_loc="+encodeURIComponent(pokesource)+"&history_pokemonid=&sv="+encodeURIComponent(research_runserver["server"])+"&research_key="+encodeURIComponent(research_key)+"&loc1="+encodeURIComponent(lat)+"&loc2="+encodeURIComponent(lng),
//	   	url: "https://"+using_dbserver+"/_dbserver.php?action="+encodeURIComponent(mode)+"&fort=&pokesource_loc=&history_pokemonid=&sv="+encodeURIComponent(research_runserver["server"])+"&research_key="+encodeURIComponent(research_key)+"&loc1="+encodeURIComponent(lat)+"&loc2="+encodeURIComponent(lng),
	    type: "GET",
	    data: "",
	    timeout: 8000,
	    cache: false
	}).done(function(data, status, xhr) {		
		viewServerError(false);
		
		var dataList = data.split("\n");
		for (var i=0; i<dataList.length; i++) {
			var ent = parseValue(dataList[i]);
			
			//揺らぎを防ぐ(?)ため場所を短くする
			if(ent.loc){
				var tmp = ent.loc.split(",");
				ent.loc = ""+mRound(tmp[0],9)+","+mRound(tmp[1],9);
			}
			
			//取得したデータが、ポケソースの場合
			if (ent.action == "found") {
				//ポケソースの情報を取得
				var ent2 = GetPokeSourceByLoc(ent.loc);
				if (ent2) {
					//ポケソース出現の場合は出現済みに更新
//					console.log("★★found: "+ent.loc + ";" + ent.id);
					ent2.found = true;
					//発見したポケIDをポケソースに登録
					ent2.id = ent.id;
				}
			}
		}
		
	}).fail(function(xhr, status, error) {
		console.log("★★DBServer: error: "+error);
	    //alert("操作に失敗しました。インターネット接続が安定している場所で再度お試しください。");
	    viewServerError("接続エラー");
	});
}

//ポケソースで検索
function searchPokesource(){
	var ent;
	var target;
	
	//初期化前の場合は処理終了
	if(!_prepareOK) return;

	if(!_pokesource_list) return;
	if(_pokesource_list.length==0) return;
	
	//処理対象を調べる
	for(i=_count;i<=_pokesource_list.length;i++){
		//最後まで確認すればカウントを初期化
		if(_pokesource_list.length <= i) i=0;
		
		//無限ループ嫌なので無理やり処理終わらせる
		if(i==_count-1){
			_count++;
			return;
		}
		
		//前回マーカがあれば削除
		if(_marker_circle[i]) {
		 	_marker_circle[i].remove();
		 	_marker_circle[i] = null;
		}
		
		//処理対象をセット
		ent=_pokesource_list[i];
	 	target = ent.loc.split(",");
				
		if(!checkPokeSourceNow(ent)){
			//表示対象時間じゃない場合は、処理しない
//			console.log("★★表示時間外なのでスキップ: "+i);
			ent.found=false;
			continue;
		}else if(ent.found) {
			//既にポケモン表示済みなら処理しない
//			console.log("★★既に表示済みなのでスキップ: "+i+":"+ent.id);
/*
			_marker_circle[i]=L.circle([target[0],target[1]],25,{"fill": true,"opacity": 0.8,"weight": 1,"color": "#999999"}).addTo(map)
				.bindPopup(i + ":" + "<img src='" + getIconImage(ent.id) + "' width='30'>" + getPokemonLocal(ent.id))
				.on('mouseover', function (e) {this.openPopup();})
        		.on('mouseout', function (e) {this.closePopup();});
*/
			continue;
		}else if(ent.skipSearch) {
			//スキップサーチのポケソースなら処理しない
//			console.log("★★スキップ対象: "+i+":"+ent.id);
			continue;
		} else {
			//まだポケモンが未表示であれば、処理対象に決定
			console.log("★★処理対象: "+i);
			break;
		}
	}
	
	_count=i;
		
	//検索処理実行
	searchPointByLoc(target[0],target[1]);
	
	//カウンタをインクリメント
	_count++;
	if(_pokesource_list.length<=_count){_count=0};	
}

//カウンタリセット
function resetCounter(){
	//初期化前の場合は処理終了
	if(!_prepareOK) return;

	console.log("★★リセット"+_count);
	//全マークを初期化
	for(i=0;i<_pokesource_list.length;i++){
		var ent = _pokesource_list[i];
		var target = ent.loc.split(",");

		//前回マーカがあれば削除
		if(_marker_circle[i]) {
		 	_marker_circle[i].remove();
		 	_marker_circle[i] = null;
		}
		
		//サーチスキップは初期化
		_pokesource_list[i].skipSearch=false;

		
		if(!checkPokeSourceNow(ent)){
			//表示対象時間じゃない場合は、非表示扱い
			ent.found=false;
		} else if(ent.found){
//			//既にポケモンが表示されている場合はマークを表示
//			_marker_circle[i]=L.circle([target[0],target[1]],25,{"fill": true,"opacity": 0.8,"weight": 1,"color": "#999999"}).addTo(map)
//				.bindPopup(i + ":" + "<img src='" + getIconImage(ent.id)+"' width='30'>" + getPokemonLocal(ent.id))
//				.on('mouseover', function (e) {this.openPopup();})
//        		.on('mouseout', function (e) {this.closePopup();});
		} else {
			//表示対象だけど まだ未表示の場合は、特に処理しない
			ent.found = false;
		}
	}
	_count=0;
}

//_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/
//_/_/_/_/_/_/_/_/ポケモンまでの道順表示_/_/_/_/_/_/_/_/_/_/_/_/
//_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/
//ポケアイコン右クリック時
function onRightClickMarkerMap(e){
	drawRoute(this._locid);

	//ポップアップ位置とGPS位置
	var tmp = this._locid.split(",");
	protPolylineFromGPS(tmp[0],tmp[1]);
			
	//ストリートビューモード時は、ビューの位置も移動する
	if(_isStreetViewMode){
		moveToPokemon(this);
	}
}

//_/_/_/_/_/_/_/_/ポケモンへ移動_/_/_/_/_/_/_/_/_/_/
function moveToPokemon(marker){
	if(!marker._locid) return;
	var loc = marker._locid.split(",");		
	var latlng = new google.maps.LatLng(loc[0],loc[1]);						//目的地

	//半径50mにストリートビューがあるかチェック
	var sv = new google.maps.StreetViewService();
	sv.getPanoramaByLocation(latlng, 200, function(data, status) {
        if (status == google.maps.StreetViewStatus.OK) {
            //ストリートビュー対応エリアの場合

			//キャラ移動
			_myChar.setLatLng(marker.getLatLng());
            	            
            //マーカーの場所へワープ
			_panorama.setPosition(data.location.latLng);

			//向きを変更(なるべく移動中に向きを変えるため、ディレイ)
            var headingValue = google.maps.geometry.spherical.computeHeading(data.location.latLng,latlng);
            setTimeout(function(){_panorama.setPov(({heading: headingValue, pitch: -10}));},500);			
        }else{
        }
	});
}

//全てのポケモンにイベントを関連付け
function setEvent(){
	//全てのポケモンを処理
	for (var key in pokemon_list) {
		if(!pokemon_list[key]) continue;
		var ent = pokemon_list[key];
		if(ent.action == "found" && ent.overlay){
//			console.log("★" + ent.loc);
			ent.overlay.on('contextmenu',onRightClickMarkerMap);
		}
	}
}

//_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/
//_/_/_/_/_/_/_/_/GoogleStreet対応_/_/_/_/_/_/_/_/_/_/_/_/
//_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/
//_/_/_/_/_/_/_/_/ストリートビュー表示ボタンの追加_/_/_/_/_/_/_/_/_/_/
function addCustomControlStreetView(){
	var customControlShowStreetView = L.Control.extend({
			options: {
		    	position: 'topleft' 
		  	},

			onAdd: function (map) {
				var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom leaflet-control-command-interior');
					container.id = "button_customcontrol_ShowStreetView";
					container.innerHTML = "StreetView";
					container.style.backgroundColor = 'white';
					container.style.width = '80px';
					container.style.height = '20px';
					container.style.padding = '5px';
					container.style.fontSize = '50%';
					container.style.textAlign = 'center';
					container.style.fontColor = '#999999';
					container.style.cursor = 'pointer';

					container.onclick = function(){
		      			showStreetView();
		    		}
		    	return container;
		  	},
		});
	map.addControl(new customControlShowStreetView());
}

var _isStreetViewMode = false;
//_/_/_/_/_/_/_/_/ストリートビュー表示切替_/_/_/_/_/_/_/_/_/_/
function showStreetView(){
	if(_isStreetViewMode) {
		//停止
		$('#button_customcontrol_ShowStreetView').css('backgroundColor', 'white');
		cleanupStreetView();
        _isStreetViewMode = false;
    } else {
    	//開始
		$('#button_customcontrol_ShowStreetView').css('backgroundColor', '#FFCC66');
		prepareStreetView();
        _isStreetViewMode = true;
    }
}

var _panorama;
var _myChar;
var _clickedMarker;
var _lastViewLatLng;
//_/_/_/_/_/_/_/_/ストリートビュー利用前の準備_/_/_/_/_/_/_/_/_/_/
function prepareStreetView(){
	
	//キャンバス作成
	$("#map-canvas").css("height","50%");
	$("#area_map_frame").append("<div id='streetView' style='width: 100%; height: 50%;'></div>");
	map.invalidateSize(); 

	//初期位置は画面中央
	var defPos = map.getCenter();

	//ストリートビュー初期化
	var panoramaOptions = {
		panControl: true,
		addressControl: false,
		linksControl: false,
		zoomControlOptions: true,		
		position: defPos,
		pov: {
			heading: 0,
			pitch: -10
			}
	};      
    _panorama = new google.maps.StreetViewPanorama($("#streetView").get(0),panoramaOptions);

	//マイキャラ設定
	var _icon = L.icon({
		//トレーナー
	    iconUrl: 'https://cdn-ak.f.st-hatena.com/images/fotolife/s/salawab/20161119/20161119122203.png',
	    iconRetinaUrl: 'https://cdn-ak.f.st-hatena.com/images/fotolife/s/salawab/20161119/20161119122203.png',
	    iconSize: [30, 75],
	    iconAnchor: [10, 50]
	});
	_myChar = L.marker(defPos, {icon: _icon,draggable: true});
	_myChar.addTo(map)
		.on('dragend', function(e) {
			map.panTo(e.target.getLatLng());
			_panorama.setPosition(e.target.getLatLng());
		});
	
	//最終位置を初期化
	_lastViewLatLng=[0,0];
	
	//ストリートビューのイベントと関連付け
	_panorama.addListener('position_changed', function() {
		var latlng = _panorama.getPosition();
		var lat = latlng.lat();
		var lng = latlng.lng();
		
		//上画面
		_myChar.setLatLng([lat,lng]);
		map.panTo([lat,lng]);

		//最後に全処理した位置から200m以上移動した場合は、全表示する
		if(200 <= getDistance(parseFloat(_lastViewLatLng[0]),parseFloat(_lastViewLatLng[1]),parseFloat(lat),parseFloat(lng))){
			//既に表示済みの全てのマーカーを対象に処理
			for (var key in pokemon_list) {
				if(!pokemon_list[key]) continue;
				var ent = pokemon_list[key];
				if(ent.action == "found" && ent.overlay){
					addMarkerToStreetView(ent.loc);
				}
			}
			//最後の現在地を更新
			_lastViewLatLng = [lat,lng];
		}
	});
	
	//マップのイベントと関連付け
	map.on('layeradd', markerAddEventHandler);				//マーカ追加時
	map.on('layerremove', markerRemoveEventHandler);		//マーカ削除時
	map.on('contextmenu', mapRightClickEventHandler);		//地図右クリック時
}

//_/_/_/_/_/_/_/_/マーカ追加時のイベントハンドラ_/_/_/_/_/_/_/_/_/_/
function markerAddEventHandler(layer, layername){
	var ent = pokemon_list[layer.layer._locid];
	if(ent && ent.action == "found"){
		addMarkerToStreetView(ent.loc);
	}
}

//_/_/_/_/_/_/_/_/マーカ削除時のイベントハンドラ_/_/_/_/_/_/_/_/_/_/
function markerRemoveEventHandler(layer, layername){
	var ent = pokemon_list[layer.layer._locid];
	if(ent && ent.action == "found"){
		removeMarkerFromStreetView(ent.loc);
	}
}

//_/_/_/_/_/_/_/_/マーカ右クリック時のイベントハンドラ_/_/_/_/_/_/_/_/_/_/
function mapRightClickEventHandler(layer, layername){
	_myChar.setLatLng(layer.latlng);
	_panorama.setPosition(layer.latlng);
}

//_/_/_/_/_/_/_/_/ストリートビューモードの終了_/_/_/_/_/_/_/_/_/_/
function cleanupStreetView(){
	//マーカの削除
    _streetViewMarkers.forEach(function(marker, idx) {
      marker.setMap(null);
    });
    _streetViewMarkers = [];
    
    //マップに関連付けていたイベントを削除
	map.off('layeradd', markerAddEventHandler);
	map.off('layerremove', markerRemoveEventHandler);
	map.off('contextmenu', mapRightClickEventHandler);

	//マイキャラ削除
	_myChar.remove();
	_myChar = null;
	
	//ストリートビュー削除
	_panorama = null;
	
	//キャンバス削除
	$("#streetView").remove();
	$("#map-canvas").css("height","100%");
	map.invalidateSize(); 
}

_streetViewMarkers=[];
//_/_/_/_/_/_/_/_/ストリートビューへ、指定のマーカ追加_/_/_/_/_/_/_/_/_/_/
function addMarkerToStreetView(key) {
	var ent = pokemon_list[key];
	var latlng = ent.loc.split(",");
	
	var myCharLatLng = _myChar.getLatLng();

	//ストリートビューへの追加前チェック
	var i;
	for(i=0; i<_streetViewMarkers.length;i++){
		var marker = _streetViewMarkers[i]
		
		//既に追加済みであれば追加しない
		if(marker.loc == key) return;	//既に追加済み
	}

	//半径200m以上であれば追加しない
	if(200<=getDistance(parseFloat(myCharLatLng.lat), parseFloat(myCharLatLng.lng), parseFloat(latlng[0]), parseFloat(latlng[1]))) return; //半径200ｍ以上

	//マーカの追加
	var marker = new google.maps.Marker({
		position: {"lat":parseFloat(latlng[0]),"lng":parseFloat(latlng[1])},
		map: _panorama,
		icon: getIconImage(ent.id),
		title: getPokemonLocal(ent.id)
	});
	marker.loc=ent.loc;
	_streetViewMarkers.push(marker);
	
	//マーカのクリックイベント作成(マーカの位置へワープ)
	marker.addListener('click', function() {
		var sv = new google.maps.StreetViewService();
		
		//指定場所付近にストリートビューがあるかチェック
    	sv.getPanoramaByLocation(marker.getPosition(), 200, function(data, status) {
	        if (status == google.maps.StreetViewStatus.OK) {
	            //ストリートビュー対応エリアの場合
	            
	            if(_panorama.getPosition().toString() == data.location.latLng.toString()){
	            	var message;
	            	//位置が変わらない場合は、これ以上近づけないのでメッセージを表示
			        if($("#view_message_area").size() == 0){
				        message = document.createElement('div');
				        message.id = "view_message_area"
				        message.style.backgroundColor = "rgba(200, 200, 255, 0.901961)"
				        message.style.height = "24px";
				        message.style.width = "50%";
				        message.style.fontFamily = "Meiryo";
				        message.style.fontSize = "medium";
				        message.style.textAlign = "center";
				        message.style.display = "none"
						message.innerHTML = "これ以上近づけません（＞＿＜）";
					} else {
						//なんか再描画で位置がずれるので、再格納する
						message = _panorama.controls[google.maps.ControlPosition.TOP_CENTER].pop();
					}
					_panorama.controls[google.maps.ControlPosition.TOP_CENTER].push(message);
					$("#view_message_area").fadeIn("fast");
					setTimeout(function(){$("#view_message_area").fadeOut("slow");},1000);	            	
	            }else{
		            //マーカーの場所へワープ
					_panorama.setPosition(data.location.latLng);

					//向きを変更(なるべく移動中に向きを変えるため、ディレイ)
		            var headingValue = google.maps.geometry.spherical.computeHeading(data.location.latLng,marker.getPosition());
		            setTimeout(function(){_panorama.setPov(({heading: headingValue, pitch: -10}));},500);
	            }				
	        }else{
	        	//ストリートビュー非対応の場合
	        	console.log("■■ストリートビュー非対応or不明なエラー")
			}
		});
	});

	console.log("★★追加:"+key);
}

//_/_/_/_/_/_/_/_/ストリートビューから、指定のマーカ削除_/_/_/_/_/_/_/_/_/_/
function removeMarkerFromStreetView(key){
	var i;
	for(i=0; i<_streetViewMarkers.length;i++){
		var marker = _streetViewMarkers[i]
		if(marker.loc == key){
			marker.setMap(null);
			_streetViewMarkers.splice(i,1);
			console.log("★★削除:"+key);
			return;
		}
	}
}
//_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/
//_/_/_/_/_/_/_/_/フルスクリーン対応_/_/_/_/_/_/_/_/_/_/_/_/
//_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/
//_/_/_/_/_/_/_/_/フルスクリーンボタンの追加_/_/_/_/_/_/_/_/_/_/
function addCustomControlShowFullScreen(){
	//ブラウザ未対応なら追加しない
	if(!canFullScreen()) return;
	
	var customControl = L.Control.extend({
			options: {
		    	position: 'bottomright' 
		  	},

			onAdd: function (map) {
				var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom leaflet-control-command-interior');
					container.id = "button_customcontrol_ShowFullScreen";
					container.innerHTML = "FullScreen";
					container.style.backgroundColor = 'white';
					container.style.width = '80px';
					container.style.height = '20px';
					container.style.padding = '5px';
					container.style.fontSize = '50%';
					container.style.textAlign = 'center';
					container.style.fontColor = '#999999';
					container.style.cursor = 'pointer';

					container.onclick = function(){
		      			showFullScreen();
		    		}
		    	return container;
		  	},
		});
	map.addControl(new customControl());
}

//_/_/_/_/_/_/_/_/フルスクリーン可否確認_/_/_/_/_/_/_/_/_/_/
function canFullScreen(){
	return (
		document.fullscreenEnabled ||
		document.webkitFullscreenEnabled ||
		document.mozFullScreenEnabled ||
		document.msFullscreenEnabled ||
		false
	);
}
var _isFullScreenMode = false;
//_/_/_/_/_/_/_/_/フルスクリーン表示切替_/_/_/_/_/_/_/_/_/_/
function showFullScreen(){
	if(_isFullScreenMode) {
		//停止
		$('#button_customcontrol_ShowFullScreen').css('backgroundColor', 'white');
        toggleFullScreen(false);
        _isFullScreenMode = false;
    } else {
    	//開始
		$('#button_customcontrol_ShowFullScreen').css('backgroundColor', '#FFCC66');
        toggleFullScreen(true);
        _isFullScreenMode = true;
    }
}

//_/_/_/_/_/_/_/_/フルスクリーン切り替え_/_/_/_/_/_/_/_/_/_/
function toggleFullScreen(full){
	if(full){
		var elem = $("body").get(0);
		if (elem.requestFullscreen) {
		  elem.requestFullscreen();
		} else if (elem.msRequestFullscreen) {
		  elem.msRequestFullscreen();
		} else if (elem.mozRequestFullScreen) {
		  elem.mozRequestFullScreen();
		} else if (elem.webkitRequestFullscreen) {
		  elem.webkitRequestFullscreen();
		}
	} else {
		if (document.exitFullscreen) {
		  document.exitFullscreen();
		} else if (document.msExitFullscreen) {
		  document.msExitFullscreen();
		} else if (document.mozCancelFullScreen) {
		  document.mozCancelFullScreen();
		} else if (document.webkitExitFullscreen) {
		  document.webkitExitFullscreen();
		}
	}
}

//_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/
//_/_/_/_/_/_/_/_/音声認識_/_/_/_/_/_/_/_/_/_/_/_/
//_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/
var _isSpeakMode = false;	//音声認識モードかどうか
//_/_/_/_/_/_/_/_/音声認識事前準備_/_/_/_/_/_/_/_/_/_/
function prepareRecord(){
	//メッセージエリア作成
	if($('#area_window_recordinfo').size() == 0 ){
		var html = '<div id="area_window_recordinfo" style="position:fixed;background-color:rgba(255,202,202,1);padding:0px;z-index:1000200;bottom:0px;left:0px;right:0px;height:25px;display:block;">'
		html += '<TABLE border="0" width="100%" height="24" cellpadding="0" cellspacing="0">'
		html += '	<TR>'
		html += '	<TD align="center" valign="middle">'
		html += '		<span id="area_window_recordinfo_message" style="font-weight:bold;color:red;font-size:70%;">何か喋ってください「近くの○○を表示」「○○だけを表示」など</span>'
		html += '	</TD>'
		html += '	</TR>'
		html += '</TABLE>'
    	html += '</div>'

		$('body').append(html);
	} else {
		$('#area_window_recordinfo').css({"display": "block"});
	}
	
	//音声認識モードON
	_isSpeakMode = true;
	
	//リッスン開始
	startRecord();
}

//_/_/_/_/_/_/_/_/音声認識開始/_/_/_/_/_/_/_/_/_/
function startRecord(){
    //音声認識モードがOFFなら処理しない
    if(!_isSpeakMode) return;
     
    window.SpeechRecognition = window.SpeechRecognition || webkitSpeechRecognition;

	//未対応時
	if(!window.SpeechRecognition) {
    	$("#area_window_recordinfo_message").text("音声認識未対応");
		return;
	}
	
    var recognition = new window.SpeechRecognition();

    recognition.lang = 'ja';
    recognition.interimResults = true; //順次録音

    //録音状況に応じての対応
    recognition.onsoundstart = function(){
        console.log("認識開始");
    };
    recognition.onnomatch = function(){
        console.log("認識不明");
        startRecord();           
    };
    recognition.onerror= function(){
        console.log("認識エラー:");
        if(event.error == "no-speech") {
	        //無言エラーの時は再度リッスン
            startRecord();
        } else if(event.error == "not-allowed") {
	        //未許可の場合
        	$("#area_window_recordinfo_message").text("音声認識エラー:マイクの使用を許可してください");
        	_isSpeakMode=false;
		} else {
        	//想定外エラーの時は、エラーメッセージを表示し、停止
        	$("#area_window_recordinfo_message").text("音声認識エラー:" + event.error);
        	_isSpeakMode=false;
        }
    };
    recognition.onsoundend = function(){
        console.log("認識終了");
        //終了時は、引き続き次のリッスン
        startRecord();
    };
    
    //認識結果
    recognition.onresult = function(event){
        var results = event.results;
        var message = results[0][0].transcript;

        if(results[0].isFinal){
            $("#area_window_recordinfo_message").text(message);
            doActionByMessage(message);
        } else {
	        $("#area_window_recordinfo_message").text("(解析中)" +message);
        }
    };
    recognition.start();
}

//_/_/_/_/_/_/_/_/音声認識終了_/_/_/_/_/_/_/_/_/_/
function stopRecord(){
	//メッセージエリア非表示
	if($('#area_window_recordinfo').size() != 0 ){
		$('#area_window_recordinfo').css({"display": "hidden"});
	}
	
	//リッスン終了
	_isSpeakMode = false;
}

//_/_/_/_/_/_/_/_/メッセージをもとにアクション実行/_/_/_/_/_/_/_/_/_/
function doActionByMessage(message){
    var result = false;

    //^:先頭マッチ　$：末尾マッチ
    var actionList = {
        "showNearPokemon":["^近くの.*"],
        "showAllPokemon":["全部表示して.*","全部表示する$","全部出して.*","全部出す$","全表示して.*","全表示$"],
        "hideAllPokemon":["全部非表示にして.*","全部非表示にする$","全部消して.*","全部消す$","全部隠して.*","全部隠す$","全非表示にして.*","全非表示$"],
        "showOnlyOnePokemon":["だけを?表示して.*","だけを?表示する$","だけ表示$","だけ出して.*","だけ出す$"],
        "showPokemon":["表示して.*","表示する$","表示$","出して.*","出す$"],
        "hidePokemon":["非表示にして.*","非表示にする$","消して.*","消す$","隠して.*","隠す$"]
    };
    
    //アクションを検索
    var action = "Unknown";
    L: for(var key in actionList) {
        var actions = actionList[key];
        for(var i=0;i<=actions.length-1;i++){
            if(message.match(actions[i])){
                action = key;
                break L;
            }
        }
    }
    
    console.log("Action：" + action);
    
    //アクションにより処理を分ける
    switch(action){
        case "showNearPokemon":
        	result = showNearPokemonByMessage(message);
            break;
        case "showAllPokemon":
        	result = showAllPokemonByMessage(message);
            break;
        case "hideAllPokemon":
        	resutl = hideAllPokemonByMessage(message);
            break;
        case "showOnlyOnePokemon":
            result = showOnlyOnePokemonByMessage(message);
            break;
        case "showPokemon":
        	result = showPokemonByMessage(message);
            break;
        case "hidePokemon":
        	result = hidePokemonByMessage(message);
            break;
    }
}

//_/_/_/_/_/_/_/_/メッセージをもとに近くのポケモンを表示/_/_/_/_/_/_/_/_/_/
function showNearPokemonByMessage(message){
    //「の」の後、「を」の前がポケモン名
    var pokeName = message.split("の")[1];
    if(!pokeName) return false;

	pokeName = pokeName.split("を")[0];
    
    //ポケモンIDを名前より取得
    var pokemonId = getPokemonIdByName(pokeName);

    console.log("Pokemon：" + pokeName + "(" + pokemonId + ")");

    //ポケモンIDが取得できなければ終了
    if(pokemonId == -1) return false;

	for (i=0;i<_shownList.length;i++){
		if(!_shownList[i]) continue;
		
		if(pokemonId == _shownList[i].id){
			onShownPokemonClick(pokemonId);
		}
	}
		
	return true;
}

//_/_/_/_/_/_/_/_/メッセージをもとに全てのポケモンを表示/_/_/_/_/_/_/_/_/_/
function showAllPokemonByMessage(message){
    //対象のポケモンのみ表示する
	changeAllPokemon(true);
	
	return true;
}

//_/_/_/_/_/_/_/_/メッセージをもとに全てのポケモンを非表示/_/_/_/_/_/_/_/_/_/
function hideAllPokemonByMessage(message){
    //対象のポケモンのみ表示する
	changeAllPokemon(false);

	return true;
}

//_/_/_/_/_/_/_/_/メッセージをもとに一匹のポケモンだけ表示/_/_/_/_/_/_/_/_/_/
function showOnlyOnePokemonByMessage(message){
    //「だけ」の前がポケモン名
    var pokeName = message.split("だけ")[0];
    
    //ポケモンIDを名前より取得
    var pokemonId = getPokemonIdByName(pokeName);

    console.log("Pokemon：" + pokeName + "(" + pokemonId + ")");

    
    //ポケモンIDが取得できなければ終了
    if(pokemonId == -1) return false;

    //対象のポケモンのみ表示する
	changeAllPokemon(false);
	toggleConfigViewList(pokemonId);
    
    return true;
}

//_/_/_/_/_/_/_/_/メッセージをもとにポケモンを表示/_/_/_/_/_/_/_/_/_/
function showPokemonByMessage(message){
	//「を」の前がポケモン名
    var pokeName = message.split("を")[0];

    //ポケモンIDを名前より取得
    var pokemonId = getPokemonIdByName(pokeName);

    console.log("Pokemon：" + pokeName + "(" + pokemonId + ")");

    //ポケモンIDが取得できなければ終了
    if(pokemonId == -1) return false;

	//未定義なら、表示扱いとする
	if(!config_viewlist[pokemonId]) {
		config_viewlist[pokemonId] = "0";
	}
	
	//非表示なら表示に切り替え
	if(config_viewlist[pokemonId] == "1"){
		toggleConfigViewList(pokemonId);
	}

	return true;
}

//_/_/_/_/_/_/_/_/メッセージをもとにポケモンを非表示/_/_/_/_/_/_/_/_/_/
function hidePokemonByMessage(message){
	//「を」の前がポケモン名
    var pokeName = message.split("を")[0];

    //ポケモンIDを名前より取得
    var pokemonId = getPokemonIdByName(pokeName);

    console.log("Pokemon：" + pokeName + "(" + pokemonId + ")");

    //ポケモンIDが取得できなければ終了
    if(pokemonId == -1) return false;

	//未定義なら、表示扱いとする
	if(!config_viewlist[pokemonId]) {
		config_viewlist[pokemonId] = "0";
	}
	
	//表示なら非表示に切り替え
	if (config_viewlist[pokemonId] == "0"){
		toggleConfigViewList(pokemonId);
	}

	return true;
}

//_/_/_/_/_/_/_/_/ポケモン名からポケモン正式名称を取得/_/_/_/_/_/_/_/_/_/
function getPokemonIdByName(pokeName){
    console.log("getPokemonIdByName:" + pokeName);

    //ポケモン名の揺らぎを修正
    pokeName = convertPokemonName(pokeName);
    
    //ポケモンリストから一致するIDを検索して返す
	for(var i=1; i<=151; i++) {
        if(pokemon_table_ja[i].match(pokeName + " *([\\(\\<].*|$)")) return i;
    }
    
    //見つからなければ-1を返す
    return -1;
}

//_/_/_/_/_/_/_/_/ポケモン名変換/_/_/_/_/_/_/_/_/_/
function convertPokemonName(pokeName){
    var convertList = {
        "ヒトカゲ":["人影"],
        "カメール":["亀戸"],
        "カメックス":["カメ エクス"],
        "ピジョット":["リゾット"],
        "コラッタ":["もらった"],
        "ラッタ":["あった","だった","バッタ","待った"],
        "ニドラン♀":["ニドランメス","ニドラン 女"],
        "ニドラン♂":["ニドランオス","ニドラン 男"],
        "ニドリーノ":["緑の","みどりいぬ"],
        "キュウコン":["球根"],
        "プクリン":["ぽこりん","北鈴"],
        "クサイハナ":["臭い花"],
        "コンパン":["アンパン","根本"],
        "ニャース":["ニュース","ピアス","宮津"],
        "マンキー":["ファンキー","満期"],
        "ガーディ":["ガーディー"],
        "ウィンディ":["ウィンディー","windy"],
        "ケーシィ":["kc"],
        "フーディン":["風鈴"],
        "ゴーリキー":["剛力"],
        "カイリキー":["怪力"],
        "コイル":["ホイール"],
        "ジュゴン":["ズボン"],
        "ゲンガー":["電話"],
        "タマタマ":["たまたま"],
        "ナッシー":["なっしー","なすしお"],
        "サワムラー":["沢村"],
        "エビワラー":["海老原"],
        "サイドン":["sidem"],
        "タッツー":["たっつ"],
        "アズマオウ":["東"],
        "スターミー":["スター ミー"],
        "エレブー":["セレブ"],
        "ブーバー":["ウーバー","ブラ"],
        "イーブイ":["av","ev"],
        "オムスター":["ハムスター","モンスター"],
        "カブト":["兜"],
        "プテラ":["ホテル"],
        "フリーザー":["フリーザ"],
        "ハウクリュー":["白竜"],
        "カイリュー":["海流"]
    };
    
    //空白除去
    pokeName = pokeName.trim();
    
    //ポケモン名称変換
    for(var key in convertList){
        var convertNames = convertList[key];
        for(var i=0;i<=convertNames.length-1;i++){
            if(pokeName == convertNames[i]) return key; //置き換えがあった場合は置き換え
        }
    }
    
    //元の名称を返却
    return pokeName;
}
