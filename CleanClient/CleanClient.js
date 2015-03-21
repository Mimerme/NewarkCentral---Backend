  var REDIRECT_URL = "localhost:5000";
  var URL = "localhost:5000"

  var roomList;
  var room;
  var nick;
  var socketID;

  room = removeQuotes(getUrlParameter('room'));
  nick = removeQuotes(getUrlParameter('nickname'));

  if(room == null){
    room = prompt("Enter the room you wish to join");
    if(room == null){
      alert('Room name cannot be left blank');
    }
  }
  if(nick == null){
    nick = prompt("Enter the nickname you wish to use");
    if(room == null){
      alert('Nickname cannot be left blank');
    }
  }

  var socket = io();

  socket.on('UserConnectionFailed', function(reason){
    console.log(reason);
    if(reason == "roomNonExistant"){
      //If room is nonexistant then retry the connection to another room
      alert("The room you are trying to join does not exist");
      room = null;
      nick = null;
      location.reload();
    }
    else if(reason == "nicknameExists"){
      alert("The nickname you are attemping to connect with is already in use");
      room = null;
      nick = null;
      location.reload();
    }
  });

  socket.on('OnRoomExpire', function(){
    alert('The room you are currently in has reached its expiration, the client will now close');
    window.location.replace(REDIRECT_URL);
  });

  socket.emit('UserConnectionAttempt', room, nick);

  $('form').submit(function(){
    socket.emit('OnChatMessage', room, $('#m').val(), nick);
    $('#m').val('');
    return false;
  });

  socket.on('chatMessage', function(msg, nick, timestamp){
    displayMessage(msg, nick, timestamp);
  });

  //Server messages are a light-grey
  socket.on('serverMessage', function(msg){
    $('#roomMessages').append($('<p>').text(msg).css('color', '#848484'));
  });

  socket.on('init', function(chatLog, connectedUsers, desciption){
    //Loop through chat log messages
    for (var message in chatLog) {
      //chat messages, nicknames, and timestamps are split by commas
      var split = chatLog[message].split(',');
      //re assemblr the message
      displayMessage(split[0], split[1], split[2]);
    }
    //Loop through connected room  users
    for(var user in connectedUsers){
      //TODO : Hacky
        if(connectedUsers[user] == null){
          continue;
        }
        addUser(connectedUsers[user]);
      }

      $("#roomDescription").append($('<p3>').text(desciption));

  });

  socket.on('userJoin', function(nick){
    addUser(nick);
  });

  socket.on('userLeave', function(updatedUserList, nickname){
    //TODO : Fix hacky method of handling user leaves
    //Reset the user list
      $('#roomUsers').empty();
      //Re-add the users
      for(var user in updatedUserList){
        //Ignore all null values
        //TODO : server should handle null values
        if(updatedUserList[user] == null){
          continue;
        }
        addUser(updatedUserList[user]);
      }
      $('#roomMessages').append($('<p>').text(nickname + " has left the room").css('color', '#848484'));
  });

  socket.on('canRenew', function(){
      $('#roomDescription').append('<button id="renew" onclick="renew()">Renew this room for another 24 hours</button>');
  });

  function getUrlParameter(sParam)
  {
      var sPageURL = window.location.search.substring(1);
      var sURLVariables = sPageURL.split('&');
      for (var i = 0; i < sURLVariables.length; i++)
      {
          var sParameterName = sURLVariables[i].split('=');
          if (sParameterName[0] == sParam)
          {
              return sParameterName[1];
          }
      }
  }

  //Only displays chat messages
  function displayMessage(msg, nick, timestamp){
    $('#roomMessages').append($('<p>').text(msg).append($('<div>').css({
      'text-align': 'right',
       'opacity': 0.4
    }).text('Sent by '+ nick  + ' @ ' + timestamp)));
  }

  function addUser(nickname){
    $('#roomUsers').append($('<p>').text(nickname));
  }

  function removeQuotes(string){
    if(string == null)
    return;

    return string.replace(new RegExp('%22', 'g'), '');
  }

  function renew(){
    window.open("http://" + URL + '/chat?renewRoom="' + room + '"');
    $('#renew').remove();
    //window.open("https://google.com");
  }

  function roomURL(){window.prompt("Copy to clipboard: Ctrl+C, Enter", window.location.hostname + '/chat?room="' + room + '"');}
