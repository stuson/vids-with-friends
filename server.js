const io = require("socket.io")();
const {google} = require("googleapis");

require("dotenv").config();

const youtube = google.youtube({
    version: "v3",
    auth: process.env.YOUTUBE_API_KEY,
});

const port = 8000;

let userNameCounter = 0;

const video = {
    state: -1,
    time: 0,
};

io.on("connection", client => {
    client.user = {
        id: client.id,
        name: getName(),
        leader: false,
    };

    const sockets = io.sockets.connected;
    const currentLeader = Object.values(sockets).find(socket => socket.user.leader);

    if (!currentLeader) {
        client.user.leader = true;
    }

    for (const userId in sockets) {
        io.emit("userUpdated", { userId, user: sockets[userId].user });
    }

    client.on("disconnect", function () {
        io.emit("userDisconnected", client.id);
        if (client.user.leader) {
            replaceLeader(client);
        }
    });

    client.on("leaderPaused", time => {
        video.state = 2;
        video.time = time;
        client.broadcast.emit("leaderPaused", time);
    });

    client.on("leaderPlayed", time => {
        video.state = 1;
        video.time = time;
        client.broadcast.emit("leaderPlayed", time);
    });

    client.on("leaderEnded", time => {
        video.state = 0;
        video.time = time;
        client.emit("leaderEnded", time);
    });

    client.on("leaderBuffering", time => {
        video.state = 3;
        video.time = time;
        client.broadcast.emit("leaderBuffering");
    });

    client.on("videoInfo", data => {
        video.time = data.time;
        io.emit("videoInfo", video);
    });

    client.on("userChatMessage", content => {
        const message = {
            user: client.user,
            timestamp: new Date(),
            content
        };

        io.emit("userChatMessage", message);
    });

    client.on("videoAdded", link => {
        youtube.search.list({
            q: link,
            part: "id,snippet",
            fields: "items(id,snippet(title))",
        }).then(res => {
            const videos = res.data.items;
            if (videos.length) {
                const video = videos[0].snippet;
                video.id = videos[0].id.videoId;

                io.emit("videoAdded", video);
            } else {
                io.emit("videoNotAdded", `No videos found for ${link}`);
            }
        }).catch(err => {
            console.error(err);
            io.emit("videoNotAdded", err);
        });
    });
});

function replaceLeader(client) {
    client.user.leader = false;

    const keys = Object.keys(io.sockets.connected);
    if (keys.length > 0) {
        const newLeader = io.sockets.connected[keys[keys.length * Math.random() >> 0]];
        newLeader.user.leader = true;
        io.emit("userUpdated", { userId: newLeader.id, user: newLeader.user });
    }
}

function getName() {
    return `user-${userNameCounter++}`;
}

io.listen(port);
console.log("listening on port", port);
