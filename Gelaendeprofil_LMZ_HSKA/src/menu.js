$(document).ready(function(){

  $(".fa-chevron-circle-left").click(function(){
    $(".sidebar_menu").addClass("hide_menu");
    $(".toggle_menu").addClass("opacity_one");
  });

  $(".toggle_menu").click(function(){
    $(".sidebar_menu").removeClass("hide_menu");
    $(".toggle_menu").removeClass("opacity_one");
  });
  
  $(".baseLayers").addClass("hide_layers");
  $(".layersClose").click(function(){
	    $(".baseLayers").addClass("hide_layers");
	    $(".layersToggle").addClass("show_layers");
	  });
  		
	  $(".layersToggle").hover(function(){
	    $(".baseLayers").removeClass("hide_layers");
	    $(".layersToggle").removeClass("show_layers");
	  });
  
});


