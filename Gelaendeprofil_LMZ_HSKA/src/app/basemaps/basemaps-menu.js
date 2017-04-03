$(document).ready(function(){
  $(".fixed-size-square").click(function(){
    $(".icons").addClass("hide_icons");
    $(".fixed-size-square").addClass("opacity_one_icons");
  });

  $(".fixed-size-square").click(function(){
    $(".icons").removeClass("hide_icons");
    $(".fixed-size-square").removeClass("opacity_one_icons");
  });
});


