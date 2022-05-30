
$(function() {
	// init loading
	$('.loading_box,.loading_mask').show();
	
	$('.float').on('click',function(e){
		// e.stopPropagation();
	});
	
	
	
	
	var selected_blockchain='',query_target_address='',max_block_searched=0,overwrite_mode='';
	var selected_blockchain_explor_url='';
	$('#select_blockchain').change(function(){
		var opt=$('#select_blockchain').find("option:selected");
		$('#target_address').val(opt.data('default_address'));
		selected_blockchain_explor_url=opt.data('explor_url');
	}).change();
	
	$('.config_box input[name="overwrite_mode"]').eq(0).prop('checked', true);
	
	
	
	
	
	
	
    var canvas_w=$('body').width();
    var canvas_h=$('body').height();
	
    var renderer = PIXI.autoDetectRenderer({width:canvas_w,height:canvas_h,backgroundColor:0xFEFEFE});
	
    var canvas=renderer.view;
	
	$(window).resize(function(){
		canvas_w=$('body').width();
		canvas_h=$('body').height();
		$(canvas).attr({width:canvas_w,height:canvas_h});
	});
	
	
    //Append the renderer to the DOM
    $('body').append(canvas);
    //console.log(111,canvas);
	
    var stage = new PIXI.Container();
    //Setup the stage properties
    stage.interactive = true;


	//mainLayer offset 0
    var mainLayer = new PIXI.Container();
    //var mainLayer = new PIXI.DisplayObject();

    var graphicLayer = new PIXI.Container();
	
    var testGraphic = new PIXI.Graphics();

    //Build object styles
	var color=0x000000;
	var pixel_len=10;
    // testGraphic.beginFill(color);
    // testGraphic.drawRect(0, 0, pixel_len, pixel_len);
	
    //Build object hierarchy
    // graphicLayer.addChild(testGraphic);
	// mainLayer.addChild(graphicLayer);
	mainLayer.addChild(testGraphic);
    stage.addChild(mainLayer);

    /**
     * Animates the stage
     */
    function animate() {
        renderer.render(stage);
        // Recursive animation request, disabled for performance.
        // requestAnimationFrame(animate);
    }

    //Animate via WebAPI
    requestAnimationFrame(animate);

    //stage init
    stage.scale.set(1,1);
	stage.position.set(canvas_w/2-10*pixel_len,canvas_h/2-6*pixel_len);	

	
	var final_pixel_graphic = new PIXI.Graphics();
	final_pixel_graphic.position.set(0,0);
	mainLayer.addChild(final_pixel_graphic);
	var final_pixel_data={};
	var draw_final_pixel=function(x,y,color,alpha){
		final_pixel_graphic.beginFill(color,alpha);
		final_pixel_graphic.drawRect(x*pixel_len, y*pixel_len, pixel_len, pixel_len);
		// console.log(1111,'update pixel:',color,final_pixel_graphic.position);
		requestAnimationFrame(animate);
	};
	function calc_hash(data,return_arr){
		var summary_str=data.height+data.sender+query_target_address+data.amount+data.memo;
		
		if(return_arr){
			var hash_result=sha256.array(summary_str);
		}else{
			var hash_result=sha256(summary_str);
		}
		
		return hash_result;
	}
	// handle the data finally saved in localstorage 
	var update_final_pixel=function(overwrite_mode,data){
		// console.log(6666,data);
		var pixel_data=(data.memo || '').split(',');
		var x=pixel_data[0]-0,
			y=pixel_data[1]-0;
		var fr=final_pixel_data[x];
		if(!fr){
			final_pixel_data[x]={};
			fr={};
		}
		fr=fr[y];
		if(!fr){
			final_pixel_data[x][y]={};
			fr={};
		}
		
		function overwrite(){
			// console.log('set final data:',data);
			final_pixel_data[x][y]=data;
			
			// update Graphics
			var color='0x'+pixel_data[2]+pixel_data[3]+pixel_data[4];
			var alpha=pixel_data[5]-0;
			draw_final_pixel(x,y,color,alpha);
		}
		switch(overwrite_mode){
			
			case 'time':{
				var time=fr.time || 0;
				if(data.time>time){
					overwrite();
				}
				
				
				break;
			}
			case 'amount':{
				// console.log('overwrite_mode: amount',x+','+y,fr,data);
				var amount=fr.amount || 0;
				
				if(data.amount>amount){
					overwrite();
				}
				
				break;
			}
			case 'hash':{
				var summary_hash_pre=fr.summary_hash;
				if(!summary_hash_pre){
					overwrite();
					break;
				} 
			
				var current_hash=data.summary_hash;
				// console.log('summary_hash_pre:',summary_hash_pre);
				// console.log('current_hash:',current_hash);
				
				for(var i in summary_hash_pre){
					if(summary_hash_pre[i]==current_hash[i]){
						//
					}else{
						// console.log('compare, pre str:',summary_hash_pre[i],' current str:',current_hash[i]);
						var result=parseInt(current_hash[i],16)<parseInt(summary_hash_pre[i],16);
						// console.log('compare result is:',result);
						if(result){
							overwrite();
						}else{
							
						}
						break;
					}
				}
				
				break;
			}
		}
	};
	
	
	function read_local_storage_pixel_data(x,y){
		
		var fr=(final_pixel_data[x] || {})[y];
			
		if(!fr || !fr.txhash){
			return '';
			$('#current_pixel_info .sender_address_text').text('');
			$('#current_pixel_info .tx_hash_text').text('');
			$('#current_pixel_info .tx_amount_text').text('');
			$('#current_pixel_info .tx_time_text').text('');
			
		}else{
			
			
			$('#current_pixel_info .selected_blockchain_text').text(selected_blockchain);
			
			$('#current_pixel_info .sender_address_text').text(fr.sender);
			
			var tx_detail_url=selected_blockchain_explor_url+fr.txhash;
			$('#current_pixel_info .tx_hash_text').attr('href',tx_detail_url).text(fr.txhash);
			$('#current_pixel_info .tx_amount_text').text(JSON.stringify(fr.amount));
			$('#current_pixel_info .tx_time_text').text(fr.time_str);
			$('#current_pixel_info .tx_info_hash_text').text(fr.summary_hash);
			
			
			
		}
		
		// $('#current_pixel_info .total_amount_text').text('');
		// $('#current_pixel_info .tx_info_hash_text').text('');
		// console.log(111111,fr);
	}
	
	
	/*current mouseover pixel*/
    var mouse_pixel_color=0x000000;
    var mouse_pixel_graphic = new PIXI.Graphics();
	mouse_pixel_graphic.beginFill(mouse_pixel_color);
	mouse_pixel_graphic.drawRect(0, 0, pixel_len, pixel_len);
	mainLayer.addChild(mouse_pixel_graphic);
	
	var mouse_pixel_x=0,mouse_pixel_y=0;
	
	//If it is a negative number , subtracted by 1
	function fix_int(num){
		if(num<0) num-=1;
		return parseInt(num);
	}
	function update_mouse_pixel_pos(e){
		
		var  current_zoom=zoom_range[main_layer_zoom_scale_index];
		
		var ml_pos_x=mainLayer.position.x;///pixel_len;
		var ml_pos_y=mainLayer.position.y;///pixel_len;
		$('.main_layer_offset_text').text(ml_pos_x.toFixed(4)+','+ml_pos_y.toFixed(4));
		
		// console.log(2222,e);
		var mouse_pos_x=(e.offsetX-stage.position.x)/current_zoom-ml_pos_x;
		var mouse_pos_y=(e.offsetY-stage.position.y)/current_zoom-ml_pos_y;
		$('.mouse_position_in_main_layer_text').text((mouse_pos_x).toFixed(4)+','+(mouse_pos_y).toFixed(4));
		
		mouse_pixel_x=fix_int(mouse_pos_x/pixel_len);
		mouse_pixel_y=fix_int(mouse_pos_y/pixel_len);
		
		mouse_pixel_graphic.position.set(mouse_pixel_x*pixel_len, mouse_pixel_y*pixel_len);
		// console.log(555,mouse_pixel_graphic.position);
		
		$('#current_pixel_info .pixel_coordinate_text').text(mouse_pixel_x+','+mouse_pixel_y);
		
		read_local_storage_pixel_data(mouse_pixel_x,mouse_pixel_y);
	}
	function update_mouse_pixel(color,alpha){
		mouse_pixel_graphic.clear();
		mouse_pixel_graphic.beginFill(color,alpha);
		mouse_pixel_graphic.drawRect(0, 0, pixel_len, pixel_len);
		// console.log(1234,color);
		requestAnimationFrame(animate);
	};
	
	var last_place_pixel = new PIXI.Graphics();
	mainLayer.addChild(last_place_pixel);
	function place_pixel(){
		last_place_pixel.clear();
		last_place_pixel.beginFill(mouse_pixel_graphic._fillStyle.color,mouse_pixel_graphic._fillStyle.alpha);
		last_place_pixel.drawRect(0, 0, pixel_len, pixel_len);
		last_place_pixel.position.set(mouse_pixel_graphic.position.x, mouse_pixel_graphic.position.y);
		requestAnimationFrame(animate);
	}
	
	

	
	
	
	
	
	$("#color_input").spectrum({
		flat: true,
		showInput: true,
		// showInitial: true,
		showButtons: true,
		allowEmpty:true,
		showAlpha: true,
		showPalette: true,
		// showPaletteOnly : true , 
		// togglePaletteOnly: true,
		// togglePaletteMoreText: 'more',
		// togglePaletteLessText: 'less',
		
		showSelectionPalette: true, 
		maxSelectionSize: 32	,
		
		clickoutFiresChange : false,
		cancelText:'',
		
		preferredFormat: "hex3",
		palette: [
			["#000","#444","#666","#999","#ccc","#eee","#f3f3f3","#fff"],
			["#f00","#f90","#ff0","#0f0","#0ff","#00f","#90f","#f0f"],
			// ["#f4cccc","#fce5cd","#fff2cc","#d9ead3","#d0e0e3","#cfe2f3","#d9d2e9","#ead1dc"],
			["#ea9999","#f9cb9c","#ffe599","#b6d7a8","#a2c4c9","#9fc5e8","#b4a7d6","#d5a6bd"],
			// ["#e06666","#f6b26b","#ffd966","#93c47d","#76a5af","#6fa8dc","#8e7cc3","#c27ba0"],
			["#c00","#e69138","#f1c232","#6aa84f","#45818e","#3d85c6","#674ea7","#a64d79"],
			// ["#900","#b45f06","#bf9000","#38761d","#134f5c","#0b5394","#351c75","#741b47"],
			["#600","#783f04","#7f6000","#274e13","#0c343d","#073763","#20124d","#4c1130"]
		],
		change:function(color){
			var c_str='000000',alpha=1;
			if(color && color.toHexString){
				c_str=color.toHexString().substring(1);
				alpha=color._a;
			}
			c_str='0x'+c_str;
			// console.log(111111,c_str,color);
			update_mouse_pixel(c_str,alpha);
			
			$("#color_input").spectrum("show");
		}
	});
	
	
    //Used to check if mouse is down
    var mousedown = false;
	var is_click=false;
	//
    var clientX=-1,clientY=-1;
    /**
     *
     *
     *
     *  EVENT LISTENERS
     *
     *
     *
     */
	var input_pixel_data={x:0,y:0,r:0,g:0,b:0,a:0};
	function update_input_memo(){
		input_pixel_data.x=mouse_pixel_x;
		input_pixel_data.y=mouse_pixel_y;
		var color_str=mouse_pixel_graphic._fillStyle.color;
		if(!color_str || color_str=='0'){
			color_str='0x000000';
		}
		// console.log(5555,color_str,mouse_pixel_graphic._fillStyle);
		input_pixel_data.r=color_str.substring(2,4);
		input_pixel_data.g=color_str.substring(4,6);
		input_pixel_data.b=color_str.substring(6,8);
		input_pixel_data.a=mouse_pixel_graphic._fillStyle.alpha;
		// console.log(6666,input_pixel_data);
		$('#input_memo').val(
			input_pixel_data.x+','+
			input_pixel_data.y+','+
			input_pixel_data.r+','+
			input_pixel_data.g+','+
			input_pixel_data.b+','+
			// parseInt(input_pixel_data.r, 16)+','+
			// parseInt(input_pixel_data.g, 16)+','+
			// parseInt(input_pixel_data.b, 16)+','+
			input_pixel_data.a+','
		)
	}
    $(canvas).on('mousedown', function(e){
		e.preventDefault();
		e.stopPropagation();
		
        //Reset clientX and clientY to be used for relative location base panning
        clientX = -1;
        clientY = -1;
        mousedown = true;
		is_click=true;
		// console.log(111111,'mouse down,is_click:',is_click);
    });
	
	$(canvas).on('dblclick', function(e){
		// console.log(22222,'click',mouse_pixel_graphic._fillStyle);
	});


    $(canvas).on('mouseup',function(e){
		e.preventDefault();
		e.stopPropagation();
		
        mousedown = false;
        // console.log(111111,'mouse up,is_click:',is_click);
		if(is_click){
			place_pixel();
			update_input_memo();
		}
    });
	
	 
			
  
	
	
	var  xPos = 0,yPos=0;
    $(canvas).on('mousemove',function(e){
        // Check if the mouse button is down to activate panning
        if(!mousedown){
			
			update_mouse_pixel_pos(e);
			
			// Animate the stage
			requestAnimationFrame(animate);
            return '';
        }
		
		
        
        // If this is the first iteration through then set clientX and clientY to match the inital mouse position
        if(clientX == -1 && clientY == -1) {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        // Run a relative check of the last two mouse positions to detect which direction to pan on x
        if(e.clientX == clientX) {
            xPos = 0;
        }else{
			xPos = (e.clientX < clientX?-1:1) * Math.abs(e.clientX - clientX);
		}

        // Run a relative check of the last two mouse positions to detect which direction to pan on y
        if(e.clientY == clientY) {
            yPos = 0;
        }else{
			yPos = (e.clientY < clientY?-1:1) * Math.abs(e.clientY - clientY);
		}
		if(xPos!=0 && yPos!=0){
			is_click=false;
			// console.log(222,'mousemove, not click');
		}
		
		

        // Set the relative positions for comparison in the next frame
        clientX = e.clientX;
        clientY = e.clientY;

        // Change the main layer zoom offset x and y for use when mouse wheel listeners are fired.
        var main_layer_offset_x = mainLayer.position.x + xPos/zoom_range[main_layer_zoom_scale_index];
        var main_layer_offset_y = mainLayer.position.y + yPos/zoom_range[main_layer_zoom_scale_index];
        // Move the main layer based on above calucalations
        mainLayer.position.set(main_layer_offset_x, main_layer_offset_y);

        // Animate the stage
        requestAnimationFrame(animate);
    });



    //Attach cross browser mouse wheel listeners
	var body=document.body;
    if (body.addEventListener){
        body.addEventListener( 'mousewheel', zoom, false );     // Chrome/Safari/Opera
        body.addEventListener( 'DOMMouseScroll', zoom, false ); // Firefox
    }else if (body.attachEvent){
        body.attachEvent('onmousewheel',zoom);                  // IE
    }

    /**
     *
     *
     *
     *  METHODS
     *
     *
     *
     */


    /**
     * Detect the amount of distance the wheel has traveled and normalize it based on browsers.
     * @param  event
     * @return integer
     */
    function wheelDistance(evt){
        if (!evt) evt = event;
        var w=evt.wheelDelta, d=evt.detail;
        if (d){
            if (w) return w/d/40*d>0?1:-1; // Opera
            else return -d/3;              // Firefox;         TODO: do not /3 for OS X
        } else return w/120;             // IE/Safari/Chrome TODO: /3 for Chrome OS X
    }


    var main_layer_zoom_scale_index = 5;
    var main_layer_zoom_scalemax_index = 11;
    var main_layer_zoom_scalemin_index = 0;
	var zoom_range=[
		0.1,
		0.2,
		0.4,
		0.6,
		0.8,
		1,
		1.5,
		2.25,
		3.375,
		5,
		7.5,
		10
	];
	
    /**
     * Detect the direction that the scroll wheel moved
     * @param event
     * @return integer
     */
    function wheelDirection(evt){
        if (!evt) evt = event;
        return (evt.detail<0) ? 1 : (evt.wheelDelta>0) ? 1 : -1;
    }

    /**
     * Zoom into the DisplayObject that acts as the stage
     * @param event
     */
	
    function zoom(evt){

        // Find the direction that was scrolled
        var direction = wheelDirection(evt);

        // Find the normalized distance
        //var distance = wheelDistance(evt);
        //console.log(5555,distance);
        // Set the old scale to be referenced later
		// var old_scale_index=main_layer_zoom_scale_index;
		var old_scale=zoom_range[main_layer_zoom_scale_index];
        // Manipulate the scale based on direction
        main_layer_zoom_scale_index = main_layer_zoom_scale_index +direction;

        //Check to see that the scale is not outside of the specified bounds
        if (main_layer_zoom_scale_index > main_layer_zoom_scalemax_index) main_layer_zoom_scale_index = main_layer_zoom_scalemax_index;
        else if (main_layer_zoom_scale_index < main_layer_zoom_scalemin_index) main_layer_zoom_scale_index = main_layer_zoom_scalemin_index;

		
		var new_scale=zoom_range[main_layer_zoom_scale_index];
		
	   // Find the position of the clients mouse
        // x = evt.clientX;
        // y = evt.clientY;
		var fix_x=canvas_w*(new_scale-old_scale)/2/new_scale;
		var fix_y=canvas_h*(new_scale-old_scale)/2/new_scale;
        var zoom_offset_x= mainLayer.position.x- - fix_x;
        var zoom_offset_y= mainLayer.position.y - fix_y;
		
		
        // ,canvas_h/2-pixel_len
		
		
		//Set the position and scale of the DisplayObject
        // mainLayer.position.set(zoom_offset_x, zoom_offset_y);
		
		set_scale(new_scale);
		draw_grid(new_scale);
    }

	/*draw grid */
	var show_grid=1;
    var grid_color=0xD0D0D0;
    var gridGraphic = new PIXI.Graphics();
	mainLayer.addChild(gridGraphic);
	function draw_grid(scale_val){
		if(!scale_val){
			scale_val=zoom_range[main_layer_zoom_scale_index];
		}
		gridGraphic.clear();
		if(show_grid && scale_val>=0.5){
			var line_width=1;
			gridGraphic.lineStyle(line_width/scale_val, grid_color,1);
			var grid_max=1000;
			var grid_max_length=grid_max*5;
			for(var i=0;i<grid_max;i++){
				gridGraphic.moveTo((-grid_max_length), (-grid_max_length+i*10));
				gridGraphic.lineTo((grid_max_length), (-grid_max_length+i*10));
				gridGraphic.moveTo((-grid_max_length+i*10),(-grid_max_length));
				gridGraphic.lineTo((-grid_max_length+i*10),(grid_max_length));
			}
		}
	}
	draw_grid();
	
	
	function set_scale(scale_val){
		if(!scale_val){
			scale_val=zoom_range[main_layer_zoom_scale_index];
		}
		
		// mainLayer.scale.set(scale_val,scale_val);
		stage.scale.set(scale_val,scale_val);
		
		//Animate the stage
        requestAnimationFrame(animate);
		
		$('.current_scale_text').text(scale_val);
	}

	

	
	
	function reload_local_storage_data(){
		// console.log(1111,'reload_local_storage_data');
		$('.loading_box,.loading_mask').show();
		
		final_pixel_data={};
		final_pixel_graphic.clear();
		
		selected_blockchain=$('#select_blockchain option:selected').val();
		query_target_address=$('#target_address').val();
		max_block_searched=$('#block_range_input').val();
		overwrite_mode=$('.config_box input[name="overwrite_mode"]:checked').val();
		
		var local_storage_max_height_key=selected_blockchain+'_'+query_target_address+'_max_height';
		var local_storage_max_height=localStorage.getItem(local_storage_max_height_key);
		if(!local_storage_max_height){
			return '';
		}
		
		for(var i=0;i<max_block_searched;i++){
			(function(ii){
				
				var local_storage_data_key=selected_blockchain+'_'+query_target_address+'_'+(local_storage_max_height-ii);
				var local_storage_data=localStorage.getItem(local_storage_data_key);
				if(!local_storage_data){
					
				}else{
					try{
						local_storage_data=JSON.parse(local_storage_data);	
					}catch(e){
						
					}
					// console.log(555,local_storage_data_key,local_storage_data);
					$.each(local_storage_data,function(key,data){
						update_final_pixel(overwrite_mode,data);
						// draw_final_pixel(2,2,'0xff0000',1);
					});
				}
				
				
			})(i-0)
		}
	
		// init finish
		setTimeout(function(){
			$('.loading_box,.loading_mask').hide();
		},100);
	}
	
	
	
	
	var query_start_height=0,query_data_offset=0;
	var is_searching=0,loop_count=0;
	function query_history_start(){
		selected_blockchain=$('#select_blockchain option:selected').val();
		query_target_address=$('#target_address').val();
		max_block_searched=$('#block_range_input').val();
		overwrite_mode=$('.config_box input[name="overwrite_mode"]:checked').val();
		
		$('#query_data_start').val('searching...');
		$('#search_tips').text('');
		$('#query_data_stop').show();
		
		final_pixel_data={};
		final_pixel_graphic.clear();
		
		query_history_loop();
	}
	function query_history_end(msg){
		$('#query_data_start').val('search');
		if(!msg) msg='finished!';
		$('#search_tips').text(msg);
		$('#query_data_stop').hide();
		query_data_offset=0;
		is_searching=0;
		loop_count=0;
	};
	var searched_block=0;
	function handle_transaction_data_terra_classic(res){
		$.each(res.txs,function(k,v){
			// check block height
			var block_height=v.height;
			if(block_height>query_start_height) query_start_height=block_height-0;
			searched_block=query_start_height-block_height;
			// console.log(5555,searched_block);
			if((searched_block)>max_block_searched){
				// search end
				is_searching=0;
				return false;
			}
			
			
			var memo=v.tx.value.memo;
			if(memo.length<5 || memo.indexOf(',')<0){
				return true;
			}
			
			var pixel_data=memo.split(',');
			if(pixel_data.length<5){
				return true;
			}
			
			var msg_type=v.tx.value.msg[0].type;
			if(msg_type!='bank/MsgSend'){
				return true;
			}
			
			
			//
			var tx_id=v.id;
			var from_address=v.tx.value.msg[0].value.from_address;
			var to_address=v.tx.value.msg[0].value.to_address;
			
			var local_storage_data_key=selected_blockchain+'_'+to_address+'_'+block_height;
			var local_storage_data_str=localStorage.getItem(local_storage_data_key);
			var local_storage_data={};
			if(!local_storage_data_str){
			}else{
				
				try{
					local_storage_data=JSON.parse(local_storage_data_str);
				}catch(e){
					console.log(444,'parse local data error:',local_storage_data_key,' org data is:',local_storage_data_str);
				}
				if(typeof(local_storage_data)=='string'){
					local_storage_data={};
				}
				// console.log(555,'parse result:',local_storage_data);
			}
			
			//  
			var new_data={
				height:v.height,
				sender:from_address,
				// token:'uluna',
				amount:0,
				memo:memo,
				time_str:v.timestamp,
				txhash:v.txhash,
			};
			// console.log(6666,key);
			new_data.time=new_data.time_str.split('T').join(' ');
			// console.log(6666,data);
			new_data.time=new Date(new_data.time).getTime();
			
			//current version only supports "uluna"
			$.each(v.tx.value.msg[0].value.amount,function(kk,vv){
				if(vv && vv.denom=='uluna'){
					new_data.amount-=(-vv.amount);
				}
			});
			
			//summary hash 
			new_data.summary_hash=calc_hash(new_data);
				
			local_storage_data[from_address+'_'+tx_id]=new_data;
			
			// console.log(444,'save data:',local_storage_data_key,new_data);
			localStorage.setItem(local_storage_data_key,JSON.stringify(local_storage_data));
			
			update_final_pixel(overwrite_mode,new_data);
		});
		
		query_data_offset=res.next;
	}
	 
	function handle_transaction_data_terra_v2(res){
		$.each(res.tx_responses,function(k,v){
			// console.log(5555,v);
			// check block height
			var block_height=v.height;
			if(block_height>query_start_height) query_start_height=block_height-0;
			searched_block=query_start_height-block_height;
			// console.log(5555,searched_block);
			if((searched_block)>max_block_searched){
				// search end
				is_searching=0;
				return false;
			}
			
			
			var memo=v.tx.body.memo;
			if(memo.length<5 || memo.indexOf(',')<0){
				return true;
			}
			
			var pixel_data=memo.split(',');
			if(pixel_data.length<5){
				return true;
			}
			
			var msg_type=v.tx.body.messages[0]['@type'];
			if(msg_type!='/cosmos.bank.v1beta1.MsgSend'){
				return true;
			}
			
			//
			var tx_id=v.id;
			var from_address=v.tx.body.messages[0].from_address;
			var to_address=v.tx.body.messages[0].to_address;
			
			var local_storage_data_key=selected_blockchain+'_'+to_address+'_'+block_height;
			var local_storage_data_str=localStorage.getItem(local_storage_data_key);
			var local_storage_data={};
			if(!local_storage_data_str){
			}else{
				
				try{
					local_storage_data=JSON.parse(local_storage_data_str);
				}catch(e){
					console.log(444,'parse local data error:',local_storage_data_key,' org data is:',local_storage_data_str);
				}
				if(typeof(local_storage_data)=='string'){
					local_storage_data={};
				}
				// console.log(555,'parse result:',local_storage_data);
			}
			
			//  
			var new_data={
				height:v.height,
				sender:from_address,
				// token:'uluna',
				amount:0,
				memo:memo,
				time_str:v.timestamp,
				txhash:v.txhash,
			};
			// console.log(6666,key);
			new_data.time=new_data.time_str.split('T').join(' ');
			// console.log(6666,data);
			new_data.time=new Date(new_data.time).getTime();
			
			//current version only supports "uluna"
			$.each(v.tx.body.messages[0].amount,function(kk,vv){
				if(vv && vv.denom=='uluna'){
					new_data.amount-=(-vv.amount);
				}
			});
			
			//summary hash 
			new_data.summary_hash=calc_hash(new_data);
				
			local_storage_data[from_address+'_'+tx_id]=new_data;
			
			console.log(444,'save data:',local_storage_data_key,new_data);
			localStorage.setItem(local_storage_data_key,JSON.stringify(local_storage_data));
			
			update_final_pixel(overwrite_mode,new_data);
		});
		
		query_data_offset=res.next;
	}
	
	
	function query_history_loop(msg){
		// console.log(5555,'is_searching:',is_searching);
		if(!is_searching){
			query_history_end(msg);
			return '';
		}
		
		if(loop_count>0 && searched_block==0){
			query_history_end(msg);
			return '';
		}
		
		loop_count++;
		setTimeout(function(){
			
			var query_data_url='';
			var query_param={};
			switch(selected_blockchain){
				case 'terra_classic':{
					query_data_url='https://fcd.terra.dev/v1/txs';
					query_param={
						// chainId:'columbus-5',//columbus-5
						//block:7767213,  // This parameter cannot take effect at the same time as 'account'
						account:query_target_address,//default : 'terra1sk06e3dyexuq4shw77y3dsv480xv42mq73anxu'
						limit:'100',
						offset:query_data_offset
					};
					break;
				}
				case 'terra_2':{
					// query_data_url='https://phoenix-fcd.terra.dev/v1/txs';
					query_data_url='https://phoenix-lcd.terra.dev/cosmos/tx/v1beta1/txs';
					
					query_target_address='terra13s4gwzxv6dycfctvddfuy6r3zm7d6zklynzzj5';// test
					query_param={
						// chainId:'', //
						events:'coin_received.receiver=\''+query_target_address+'\'',//query_target_address',// 
						// "pagination.limit":'100',
						// 'pagination.offset':query_data_offset,
						// 'pagination.count_total':true
						limit:'10',
						// offset:query_data_offset
					};
					break;
				}
				
			}
			$.ajax({
				url:query_data_url,
				data:query_param
			})
			.success(function(res){
				// console.log(555,res);
			
				
				//handle transaction data
				switch(selected_blockchain){
					case 'terra_classic':{
						handle_transaction_data_terra_classic(res);
						break;
					}
					case 'terra_2':{
						handle_transaction_data_terra_v2(res);
						break;
					}
					
				}
				
				
				var local_storage_max_height_key=selected_blockchain+'_'+query_target_address+'_max_height';
				localStorage.setItem(local_storage_max_height_key,query_start_height);
				// console.log(555,local_storage_max_height_key,query_start_height);
				
				$('#search_tips').text('searched block:'+searched_block+' ...');
				query_history_loop();
				
			})
			.error(function(e){
				is_searching=0;
				query_history_loop('search error:'+JSON.stringify(e));
			});
			
			
		},800);
		
	}
	
	$('#query_data_stop').on('click',function(){
		
		query_history_end();
	});
	$('#query_data_start').on('click',function(){
		if(is_searching){
			return '';
		}
		is_searching=1;
		query_history_start();
	});
   
	
    $('#reset_btn').on('click',function(){
		mainLayer.position.set(0,0);
		set_scale(1,1);
		draw_grid(1);
		main_layer_zoom_scale_index=5;
    }).click();
	
	
	
	function save_current_config(){
		var pre_data={
			grid:$('.config_box .grid').is(':checked'),
			overwrite_mode:$('.config_box input[name="overwrite_mode"]:checked').val()
		};
		$('#save_config_cancel').data('pre_data',pre_data);
		return pre_data;
	}
	$('.config_icon_box').on('click',function(e){
		e.stopPropagation();
		$('.config_box,.config_box_mask').show();
		
		save_current_config();
	});
	$('.config_box_mask').on('click',function(){
		$('.config_box,.config_box_mask').hide();
	});

	
    $('#save_config_confirm').on('click',function(){
		var config=save_current_config();
		
		show_grid=config.grid;
		set_scale();
		draw_grid();
		
		$('.config_box,.config_box_mask').hide();
		
		if(overwrite_mode!=config.overwrite_mode){
		
			reload_local_storage_data();
			overwrite_mode=config.overwrite_mode;
		}
		
    });
	$('#save_config_cancel').on('click',function(){
		var pre_data=$('#save_config_cancel').data('pre_data');
		
		$('.config_box .grid').prop("checked", pre_data.grid);
		
		$('.config_box input[name="overwrite_mode"][value="'+pre_data.overwrite_mode+'"]').prop("checked", true);
		
		$('.config_box,.config_box_mask').hide();
    });
	
	 
	
	
	setTimeout(function(){
		reload_local_storage_data();
	},100);
	
});


