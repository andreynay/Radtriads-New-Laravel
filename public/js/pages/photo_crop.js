$(document).ready(function() {
	
	var pixie = new Pixie({
	    image: photo_url,
	    baseUrl: url + "/photo_editor",
        ui: {
			toolbar: {
            	hideOpenButton: true,
            }
        },
        tools: {
	        zoom: {
		        allowUserZoom: false
	        }
        },
	    onLoad: function() {
	        $(".loading-pixie").remove();
	        
	        $("toolbar-item").first().remove();
	    },
	    onSave: function(data, name) {

			bootbox.confirm({
			    message: "This will erase your original photo. Would you like to continue?",
			    buttons: {
			        confirm: {
			            label: 'Yes',
			            className: 'btn-primary'
			        },
			        cancel: {
			            label: 'No',
			            className: 'btn-danger'
			        }
			    },
			    callback: function (result) {
			        
			        if(result) {
				        
				        $("body").loading({
	                        message: 'Saving your edited photo...'
	                    });
				        
				        $.ajax({
	                        type:'POST',
	                        url:'ajax/apply_photo_edit.php',
	                        data:{
	                            base_64_img: data,
	                            photo_name: name,
	                            photo_unique_id: photo_unique_id
	                        },
	                        success:function(res) {
		                        
		                        $('body').loading('stop');
		                        
		                        $.toast({
							    heading: 'Success',
								    text:"Your photo has been updated and saved!",
								    showHideTransition: 'slide',
								    icon: 'success',
								    hideAfter: 8000,
								    position: "top-right"
								});
		                        
		                    }
	                    });
				        
				    }
				    
				}
			
			}).find('.modal-content').css({
			    'margin-top': function (){
			        var w = $( window ).height();
			        var b = $(".modal-dialog").height();
			        // should not be (w-h)/2
			        var h = (w-b)/2;
			        return h+"px";
			    }
			});
        
        }
	});
		
	$(".btn-apply-ratio").click(function(e) {
		
		e.preventDefault();
		
		
		var width = parseInt($(".data-width").val());
		var height = parseInt($(".data-height").val());
		
		var data = {
			width: width,
			height: height
		};
		
		cropper.setData(data);
		
	});
	
	$(".btn-resize").click(function(e) {
		
		e.preventDefault();
		
		$("#resize-modal").modal("show");
		
	});
	
	// Handle flip button click
	$(".btn-flip").click(function(e) {
		
		e.preventDefault();
		
		if($("#crop-upload-img").attr("data-scale") == 1) {
			$("#crop-upload-img").attr("data-scale", -1);
			cropper.scaleX("-1");
		} else {
			$("#crop-upload-img").attr("data-scale", 1);
			cropper.scaleX("1");
		}
		
	});
	
	// Handle flip button click
	$(".btn-rotate").click(function(e) {
		
		e.preventDefault();
		
		cropper.rotate("90");
		
	});
	
	// Handle crop button click
	$(".btn-crop").click(function(e) {
	
		e.preventDefault();
		
		var that = $(this);
		var that_content = that.html();
		
		cropper.getCroppedCanvas().toBlob((blob) => {

		    const formData = new FormData();
		
		    // Pass the image file name as the third parameter if necessary.
		    formData.append('cropped_img', blob);
		    formData.append('uploaded_photo_unique_id', photo_unique_id);
		    
		    that.addClass("disabled");
		    that.html('<i class="fas fa-cog fa-spin"></i> Saving...');
		    
		    var save_as_new = 0;
		    
		    if($(".save_as_new").is(":checked")) {
			    save_as_new = 1;
		    }
		    
		    formData.append("save_as_new", save_as_new);
		
		    // Use `jQuery.ajax` method for example
		    $.ajax('ajax/upload_cropped_photo.php', {
		        method: "POST",
		        data: formData,
		        processData: false,
		        contentType: false,
		        success(data) {
			        
			        data = JSON.parse(data);
			        
			        that.removeClass("disabled");
			        that.html(that_content);
			        
			        if(data.status && data.status == 1) {
				        
				        if(save_as_new == 0) {
					        
				        	$.toast({
							    heading: 'Success',
							    text:"Your photo has been updated and saved!",
							    showHideTransition: 'slide',
							    icon: 'success',
							    hideAfter: 8000,
							    position: "top-right"
							});
				        	
				        } else {
					        
					        var photo_unique_id = data.file_id;
					        
					        window.location = "file.php?id=" + photo_unique_id + "&action=cropped&upload=1";
				        }
				        
			        } else {
				        
				        alert("Error while uploading the cropped version!");
				        
			        }
			        
		        },
		        error() {
			        alert("Error while uploading the cropped version!");
		        },
		    });
		}, uploaded_mime_type);
		
		
	});
	
	$(".btn-resize-ok").click(function(e) {
		
		e.preventDefault();
		
		var new_width = $(".data-width").val();
		var new_height = $(".data-height").val();
		
		
		$.ajax('ajax/resize_photo.php', {
	        method: "POST",
	        data: {
		        new_width: new_width,
		        new_height: new_height,
		        photo_short_id: photo_short_id
	        },
	        dataType: "json", 
	        success(data) {
		        		        
		        if(data.error) {
			        $(".alert-copy-files").html(data.error).fadeIn();
		        } else {
			        window.location = "photo-crop.php?id=" + photo_unique_id + "&action=resized";
		        }
		        
		    }
		});
		
	});
	
	$(".keep_ratio").change(function() {
		
		if(this.checked) {
			keep_ratio = true;
			
			//Refresh data.
			getValues();
			getAspectRatio();
			//Formula: "Height = Width / Aspect Ratio".
			newHeight = Math.round(newWidth/aspectRatio);
			//Output:
			$(".data-height").val(newHeight);
			//Formula: "Width = Aspect Ratio * Height".
			newWidth = Math.round(newHeight*aspectRatio);
			//Output:
			$(".data-width").val(newWidth);
		} else {
			keep_ratio = false;
		}

	});
	
	var newWidth, newHeight;
	
	$(".data-width").on("change keyup", function(){
		
		if(keep_ratio) {
			//Refresh data.
			getValues();
			getAspectRatio();
			//Formula: "Height = Width / Aspect Ratio".
			newHeight = Math.round(newWidth/aspectRatio);
			//Output:
			$(".data-height").val(newHeight);
		}
	});
	
	//Get new width:
	$(".data-height").on("change keyup", function(){
		
		if(keep_ratio) {
			//Refresh data.
			getValues();
			getAspectRatio();
			//Formula: "Width = Aspect Ratio * Height".
			newWidth = Math.round(newHeight*aspectRatio);
			//Output:
			$(".data-width").val(newWidth);
		}
	});
	
	function getValues(){
	  newWidth = $(".data-width").val();
	  newHeight = $(".data-height").val();
	};
	
	//Aspect ratio:
	function getAspectRatio(){
		//Formula: "Aspect Ratio = Width / Height".
		return aspectRatio = initialWidth/initialHeight;
	};
	
});
