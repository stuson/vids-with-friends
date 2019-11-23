import React, { Component } from "react";
import "./Chat.css";

class ChatContainer extends Component {
    render() {
        return (
            <div id="chat-container">
                <div id="chat-body">
                    <ChatBox socket={this.props.socket} />
                    <ChatInput socket={this.props.socket} />
                </div>
                <div id="chat-sidebar">
                    <UserList userNames={this.props.userNames} />
                </div>
            </div>
        );
    }
}

class ChatBox extends Component {
    constructor(props) {
        super(props);

        this.state = {
            userMessages: []
        };

        this.props.socket.on("userChatMessage", message => this.addUserMessage(message));
    }

    addUserMessage(message) {
        const userMessages = this.state.userMessages.slice();
        userMessages.push(message);
        this.setState({ userMessages });
    }

    renderUserMessage(message, key) {
        return (
            <li className="user-message" key={key}>
                <span className="message-sender">{message.user.name}</span>:
                <span className="message-content"> {message.content}</span>
            </li>
        );
    }

    render() {
        const userMessages = this.state.userMessages.map(this.renderUserMessage);
        return (
            <ul id="chat-box">
                {userMessages}
            </ul>
        );
    }
}

class ChatInput extends Component {
    constructor(props) {
        super(props);

        this.state = {
            inputValue: ""
        };
    }

    onInputChange(e) {
        this.setState({
            inputValue: e.target.value
        });
    }

    sendMessage(e) {
        if (e.which === 13) {
            this.props.socket.emit("userChatMessage", this.state.inputValue);
            this.setState({
                inputValue: ""
            });
        }
    }

    render() {
        return (
            <input
                type="text"
                value={this.state.inputValue}
                id="chat-input"
                onChange={e => this.onInputChange(e)}
                onKeyPress={e => this.sendMessage(e)}
            ></input>
        );
    }
}

class UserList extends Component {
    renderUser(userName, i) {
        return <li className="chat-user" key={i}>{userName}</li>;
    }

    render() {
        const userItems = this.props.userNames.map(this.renderUser);
        return (
            <div id="user-list-container">
                <span>{this.props.userNames.length} connected</span>
                <ul id="user-list">
                    {userItems}
                </ul>
            </div>
        );
    }
}

export default ChatContainer;