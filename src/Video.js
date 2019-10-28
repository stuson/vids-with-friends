import React, { Component } from "react";
import YouTube from "react-youtube";

import "./Video.css";

class VideoContainer extends Component {
    render() {
        return (
            <div className="video-container">
                <ul>
                    <li>Username - {this.props.user.name}</li>
                    <li>Leader - {`${this.props.user.leader}`}</li>
                </ul>
                <VideoPlayer leader={this.props.user.leader} socket={this.props.socket} />
                <Playlist />
            </div>
        );
    }
}

class VideoPlayer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            player: null,
            status: -1,
            time: 0,
        };

        props.socket.on("leaderPaused", time => this.onLeaderPause(time));
        props.socket.on("leaderPlayed", time => this.onLeaderPlay(time));
        props.socket.on("videoInfo", video => this.updateVideoInfo(video));
    }

    sendVideoInfo() {
        if (this.props.leader) {
            const video = {
                status: this.state.player.getPlayerState(),
                time: this.state.player.getCurrentTime(),
            };

            this.setState(video);
            this.props.socket.emit("videoInfo", video);
        }
    }

    updateVideoInfo(video) {
        if (!this.state.player) {
            return 0;
        }

        if (!this.props.leader) {
            console.log(this.state.player.getCurrentTime(), video.time);
            
            if (Math.abs(this.state.player.getCurrentTime() - video.time) > 2) {
                this.state.player.seekTo(video.time);
            }
            
            if (this.state.player.getPlayerState() !== video.status) {
                switch(video.status) {
                    case 1:
                        this.state.player.playVideo();
                        break;
                    case 2:
                        this.state.player.pauseVideo();
                        break;
                    default:
                        break;
                }
            }
            this.setState(video);
        }
    }

    onPlayerReady(e) {
        this.setState({player: e.target});
        setInterval(() => this.sendVideoInfo(), 5000);
    }

    onPlayerStateChange(e, status) {
        switch(status) {
            case 0:
                this.onVideoEnd(e);
                break;
            case 1:
                this.onVideoPlay(e);
                break;
            case 2:
                this.onVideoPause(e);
                break;
            case 3:
                this.onVideoBuffer(e);
                break;
            default:
                break;
        }
    }

    onVideoEnd(e) {
        if (this.props.leader) {
            this.props.socket.emit("leaderEnded", e.target.getCurrentTime());
        }
    }

    onVideoPlay(e) {
        if (this.props.leader) {
            this.props.socket.emit("leaderPlayed", e.target.getCurrentTime());
        }
    }

    onVideoPause(e) {
        if (this.props.leader) {
            this.props.socket.emit("leaderPaused", e.target.getCurrentTime());
        }
    }

    onVideoBuffer(e) {
        if (this.props.leader) {
            this.props.socket.emit("leaderBuffered", e.target.getCurrentTime());
        }
    }

    onLeaderPause(time) {
        this.state.player.seekTo(time);
        this.state.player.pauseVideo();
    }
    
    onLeaderPlay(time) {
        this.state.player.seekTo(time);
        this.state.player.playVideo();
    }

    render() {
        const opts = {
            playerVars: {
                controls: this.props.leader * 1,
                modestbranding: 1,
                rel: 0,
                showinfo: 0,
            }
        };

        return <YouTube
            id="video-player"
            videoId="CBTmawSkibc"
            opts={opts}
            className={this.props.leader ? "" : "no-controls"}
            onStateChange={(e, state) => this.onPlayerStateChange(e, state)}
            onReady={e => this.onPlayerReady(e)}
            onPlay={e => this.onVideoPlay(e)}
            onPause={e => this.onVideoPause(e)}
        />;
    }
}

class Playlist extends Component {
    render() {
        return <div className="playlist"></div>;
    }
}

export default VideoContainer;