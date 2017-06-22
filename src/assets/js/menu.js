$(document).ready(function(){

  //----------------INITIALIZE---------------------

  $(".baseLayers").addClass("hide_layers"); // remove base layers
  $(".dropdown-menu").show();     
  $(".informationBlock").hide();
  
  //----------------oooooooooo---------------------



  //----------------SIDE BAR DIVS TOGGLE---------------------

  $(".sidebartoggle").click(function(){
    var x = document.getElementById('dropdown-menu');
    var a = document.getElementById('informationBlock');
    var b = document.getElementById('geological');
    var c = document.getElementById('moreInfo');
    var d = document.getElementById('legend');
    var e = document.getElementById('impressum');
    if (x.style.display === 'none') {
        x.style.display = 'block';
    } else {
        x.style.display = 'none';
        a.style.display = 'none';
        b.style.display = 'none';
        c.style.display = 'none';
        d.style.display = 'none';
        e.style.display = 'none';          
    }
  });

  $("#item01").click(function(){
    $(".informationBlock").hide();
    var x = document.getElementById('informationBlock');
    if (x.style.display === 'none') {
        x.style.display = 'block';
    } else {
        x.style.display = 'none';
    }
  });

  $("#item02").click(function(){
    $(".informationBlock").hide();
    var x = document.getElementById('geological');
    if (x.style.display === 'none') {
        x.style.display = 'block';
    } else {
        x.style.display = 'none';
    }
  });

  $("#item03").click(function(){
    $(".informationBlock").hide();
    var x = document.getElementById('moreInfo');
    if (x.style.display === 'none') {
        x.style.display = 'block';
    } else {
        x.style.display = 'none';
    }
  });

  $("#item04").click(function(){
    $(".informationBlock").hide();
    var x = document.getElementById('legend');
    if (x.style.display === 'none') {
        x.style.display = 'block';
    } else {
        x.style.display = 'none';
    }
  });

  $("#item05").click(function(){
    $(".informationBlock").hide();
    var x = document.getElementById('impressum');
    if (x.style.display === 'none') {
        x.style.display = 'block';
    } else {
        x.style.display = 'none';
    }
  });

  // Changes color on active element
  $('.dropdown-menu').on('click','li', function(){
   $(this).addClass('active').siblings().removeClass('active');
  });

//-------------ooooooooooooooooooooooo----------------

//---------------BASE MAPS SELECTORS------------------
  	   
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

//-------------ooooooooooooooooooooooo----------------

});