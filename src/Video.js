import React, { Component } from "react";
import YouTube from "react-youtube";

import "./Video.css";

class VideoContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            videos: [],
        };

        props.socket.on("videoAdded", video => this.addVideo(video));
        props.socket.on("videoNotAdded", err => this.showError(err));
        props.socket.on("videoRemoved", video => this.removeVideo(video));
        props.socket.on("leaderEnded", _ => this.cueNextVideo());
    }

    addVideo(video) {
        const videos = this.state.videos;
        videos.push(video);
        this.setState({videos});
    }

    showError(err){
        console.error(err);
    }

    removeVideo(video) {
        console.log(video);
    }

    cueNextVideo() {
        const videos = this.state.videos;
        videos.splice(0, 1);
        this.setState({videos});
    }

    render() {
        return (
            <div className="video-container">
                <ul>
                    <li>Username - {this.props.user.name}</li>
                    <li>Leader - {`${this.props.user.leader}`}</li>
                </ul>
                <VideoPlayer 
                    leader={this.props.user.leader} socket={this.props.socket}
                    videoId={this.state.videos.length ? this.state.videos[0].id : ""} 
                />
                <Playlist leader={this.props.user.leader} videos={this.state.videos} removeVideo={this.removeVideo} />
                <VideoInput showError={this.showError} socket={this.props.socket} />
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

    onPlayerStateChange(e) {
        switch(e.data) {
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
                autoplay: 1,
            }
        };

        return <YouTube
            id="video-player"
            videoId={this.props.videoId}
            opts={opts}
            className={this.props.leader ? "" : "no-controls"}
            onStateChange={e => this.onPlayerStateChange(e)}
            onReady={e => this.onPlayerReady(e)}
            onPlay={e => this.onVideoPlay(e)}
            onPause={e => this.onVideoPause(e)}
        />;
    }
}

class Playlist extends Component {
    renderVideo(video, i) {
        return <PlaylistItem key={i} video={video} removeVideo={this.props.removeVideo} />;
    }

    render() {
        const videos = this.props.videos.map((video, i) => this.renderVideo(video, i));
        return <ul className="playlist">
            {videos}
        </ul>;
    }
}

class PlaylistItem extends Component {
    render() {
        return <li>{this.props.video.title} <button onClick={e => this.props.removeVideo(this.props.video.id)}>x</button></li>;
    }
}

class VideoInput extends Component {
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

    addVideo(e) {
        if (e.which === 13) {
            try {
                new URL(this.state.inputValue);
                this.props.socket.emit("videoAdded", this.state.inputValue);
            } catch (err) {
                this.props.showError("Invalid URL");
            } finally {
                this.setState({
                    inputValue: ""
                });
            }
        }
    }

    render() {
        return (
            <input
                type="text"
                value={this.state.inputValue}
                id="chat-input"
                onChange={e => this.onInputChange(e)}
                onKeyPress={e => this.addVideo(e)}
            ></input>
        );
    }
}

export default VideoContainer;