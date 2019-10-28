import React, { Component } from "react";

class ChatContainer extends Component {
    render() {
        return (
            <div id="chat-container">
                <div id="chat-body">
                    <ChatBox />
                    <ChatInput />
                </div>
                <div id="chat-sidebar">
                    <UserList users={this.props.users} />
                </div>
            </div>
        );
    }
}

class ChatBox extends Component {
    render() {
        return (
            <ul id="chat-box">

            </ul>
        );
    }
}

class ChatInput extends Component {
    render() {
        return (
            <input type="text" id="chat-input"></input>
        );
    }
}

class UserList extends Component {
    renderUser(user) {
        return <li className="chat-user" key={user.id}>{user.name}</li>;
    }

    render() {
        const userItems = this.props.users.map(user => this.renderUser(user));
        return (
            <div className="user-list-container">
                <span>{this.props.users.length} connected</span>
                <ul>
                    {userItems}
                </ul>
            </div>
        );
    }
}

export default ChatContainer;