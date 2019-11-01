import React, { Component } from "react";
import openSocket from "socket.io-client";

import VideoContainer from "./Video.js";
import ChatContainer from "./Chat.js";

import "./App.css";

const socket = openSocket("http://localhost:8000");

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            users: [],
            userIndex: 0,
        };

        socket.on("userUpdated", data => this.updateUser(data.userId, data.user));
        socket.on("userDisconnected", userId => this.removeUser(userId));
    }

    updateUser(userId, user) {
        const users = this.state.users.slice();
        const userIndex = users.findIndex(user => user.id === userId);
        if (userIndex > -1) {
            users[userIndex] = user;
            this.setState({ users });
        } else {
            users.push(user);
            this.setState({ users });
        }

        this.updateUserIndex();
    }

    removeUser(userId) {
        const users = this.state.users.slice();
        const userIndex = users.findIndex(user => user.id === userId);

        if (userIndex > -1) {
            users.splice(userIndex, 1);
        }

        this.setState({ users });
        this.updateUserIndex();
    }

    updateUserIndex() {
        this.setState({ userIndex: this.state.users.findIndex(user => user.id === socket.id) });
    }

    render() {
        const user = this.state.users[this.state.userIndex] || {};
        return (
            <div className="App">
                {/* <VideoContainer socket={socket} user={user} /> */}
                <ChatContainer socket={socket} users={this.state.users} userIndex={this.state.userIndex} />
            </div>
        );
    }
}

export default App;
