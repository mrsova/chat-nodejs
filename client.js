var socket = io();

function in_array(what, where) {
    for (var i = 0; i < where.length; i++)
        if (what == where[i].id)
            return true;
    return false;
}

new Vue({
    el: '#app',
    data: {
        connectedUsers: [],
        messages: [],
        message: {
            'type': '',
            'action': '',
            'user': '',
            'text': '',
            'timestamp': '',
            'reg': false
        },
        room:'',
        areTyping: []
    },
    created: function () {
        //if server emits user joined, update connectedUsers array
        socket.on('user joined', function (socketId) {
            //get connected user first
            axios.get('/onlineusers')
                .then(function (response) {
                    console.log(response);
                    for (key in response.data) {
                        this.room = key;
                        for (var k in response.data[key].sockets) {
                            if (!in_array(k, this.connectedUsers)) {
                                this.connectedUsers.push({id: k, name: response.data[key].sockets[k]});
                            }
                        }
                    }
                    for (key in this.connectedUsers) {
                        if (this.connectedUsers[key].id == socketId) {
                            var infoMsg = {
                                "type": "info",
                                "msg": "Пользователь " + this.connectedUsers[key].name + " Присоединился"
                            }
                            this.messages.push(infoMsg);
                        }
                    }
                }.bind(this));
        }.bind(this));

        //if caht.message update messages array
        socket.on('chat.message', function (message) {
            this.messages.push(message);
        }.bind(this));

        //server emit user typing
        socket.on('user typing', function (username) {
            this.areTyping.push(username);
        }.bind(this));

        //server emits stoped typing
        socket.on('stopped typing', function (username) {
            var index = this.areTyping.indexOf(username);
            if (index >= 0) {
                this.areTyping.splice(index, 1);
            }
        }.bind(this));


        //if server broadcast 'user left' remuve leaving users connected users
        socket.on('user left', function (socketId) {
            for (key in this.connectedUsers) {
                if (this.connectedUsers[key].id == socketId) {
                    var infoMsg = {
                        "type": "info",
                        "msg": "Пользователь " + this.connectedUsers[key].name + " покинул чат"

                    }
                    this.messages.push(infoMsg);
                    this.connectedUsers.splice(key, 1);
                }
            }

        }.bind(this));

        //document.getElementById('panB').scrollTop = 10000000000000; offsetHeight
    },
    methods: {
        send: function () {
            for (key in this.connectedUsers) {
                if (this.connectedUsers[key].id == socket.id) {
                    this.message.user = this.connectedUsers[key].name;
                }
            }
            this.message.type = "chat";
            lt = new Date();
            Hour = lt.getHours();
            Minutes = lt.getMinutes();
            this.message.timestamp = Hour + ':' + Minutes;
            socket.emit('chat.message', {message: this.message, room:this.room});
            this.message.type = '';
            this.message.user = '';
            this.message.text = '';
            this.message.timastamp = '';
            setTimeout(() => {
                document.getElementById('panB').scrollTop =  100000000000000;
            },10)

            /*$("#messages").bind('DOMSubtreeModified', function () { // отслеживаем изменение содержимого блока
                document.getElementById('panB').scrollTop = 10000000000000000000000000;
            });
            $("#messages").on('DOMSubtreeModified', () => {
                document.getElementById('panB').scrollTop = 10000000000000000000000000;
            }, false);*/
        },
        sendReg: function (res) {
            this.message.reg = true;
            socket.emit('add nameuser', {name: res.srcElement.elements.username.value, id: socket.id});
        },
        userIsTyping: function (username) {
            if (this.areTyping.indexOf(username) >= 0) {
                $('.pencil').animate({left: '-10px'}, 1000);
                $('.pencil').animate({left: '0px'}, 1000);
                return true;
            }
            return false;
        },
        usersAreTyping: function () {
            if (this.areTyping.indexOf(socket.id) <= -1) {
                this.areTyping.push(socket.id);
                socket.emit('user typing', {id:socket.id, room:this.room});
            }
        },
        stoppedTyping: function (keycode) {
            if (keycode == '13' || (keycode == '8' && this.message.text == '')) {
                var index = this.areTyping.indexOf(socket.id);
                if (index >= 0) {
                    this.areTyping.splice(index, 1);
                    socket.emit('stopped typing', {id:socket.id,room:this.room});
                }
            }
        },
        smile: function (event) {
            var val = $("#outMes").val();
            this.message.text = val + ' ' + event.srcElement.outerHTML + ' ';
        }

    }
});
