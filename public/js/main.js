$(document).ready(function(){
  $("#join_button").click(function(){
    $("#sidebar").css("display","initial");
    $("#sidebar").animate({
      width:"21%"
    },225,function(){
      $("#sidebar").animate({
        width:"20%"
      },200)
    });
  })
  $("#close").click(function(){

    $("#sidebar").animate({
      width:"0%"
    },250,function(){
      $("#sidebar").css("display","none");  
    });
  })
});