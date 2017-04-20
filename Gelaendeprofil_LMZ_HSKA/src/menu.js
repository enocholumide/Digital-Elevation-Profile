$(document).ready(function(){

  $(".baseLayers").addClass("hide_layers");

  $(".sidebar_menu").addClass("hide_menu");
  $(".toggle_menu").addClass("opacity_one");

  

  $(".fa-chevron-circle-left").click(function(){
    $(".sidebar_menu").addClass("hide_menu");
    $(".toggle_menu").addClass("opacity_one");
  });
  
  $(".toggle_menu").click(function(){
    $(".sidebar_menu").removeClass("hide_menu");
    $(".toggle_menu").removeClass("opacity_one");
  });
  
  /** //time out and delays not working as expected, 
  function showMenuBarOnHover() { 
    $(".toggle_menu").hover(function(){
      $(".sidebar_menu").removeClass("hide_menu");
      $(".toggle_menu").removeClass("opacity_one");
    });
  }
  // use setTimeout() to execute
  setTimeout(showMenuBarOnHover, 50) 
  */
  	
      
	  $(".layersToggle").click(function(){
	    $(".baseLayers").removeClass("hide_layers");
      $(".baseLayers").addClass("hide_layers");
	    $(".layersToggle").removeClass("show_layers");
	  });

    $(".layersToggle").hover(function(){
	    $(".baseLayers").removeClass("hide_layers");
	    $(".layersToggle").removeClass("show_layers");
	  });

  $(".baseLayers").mouseleave(function(){
	    $(".baseLayers").addClass("hide_layers");
	  });

});