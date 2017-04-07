$(document).ready(function(){
  $(".fa-chevron-circle-right").click(function(){
    $(".icons_menu").addClass("hide_icons");
    $(".icons_toggle").addClass("display_icons");
  });

  $(".icons_toggle").click(function(){
    $(".icons_menu").removeClass("hide_icons");
    $(".icons_toggle").removeClass("display_icons");
  });

});


