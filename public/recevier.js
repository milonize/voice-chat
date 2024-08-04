const websocket = new WebSocket("/");

// Handle remote clinet offer and ice candidate
websocket.onmessage = (e) => {
  console.log(JSON.parse(e.data));

  handleSignalData(JSON.parse(e.data));
};
// function: 4
function handleSignalData(data) {
  switch (data.type) {
    case "offer":
      peerConnection.setRemoteDescription(data.offer);
      createAndSendAnswer();
      break;
    case "candidate":
      peerConnection.addIceCandidate(data.candidate);
      break;
    case "error":
      document.getElementById("video-call-div").style.display = "none";

      document.getElementById(
        "message"
      ).innerHTML = `<div class="alert p-2 alert-danger" role="alert">
 ${data.message}
</div>`;
      break;
  }
}

// let remoteVideoStream;
// let peerConnection;

function createAndSendAnswer() {
  peerConnection.createAnswer(
    (answer) => {
      peerConnection.setLocalDescription(answer);
      sendData({
        type: "send_answer",
        answer: answer,
      });
    },
    (error) => {
      console.log(error);
    }
  );
}

// funtion: 1
function sendData(data) {
  data.username = username;

  websocket.send(JSON.stringify(data));
}

// funtion: 2
let username;
let peerConnection;
let localVideoStream;
function joinCall() {
  username = document.getElementById("username-input").value;

  // display inline to the video div
  document.getElementById("video-call-div").style.display = "inline";

  // getting local user video
  navigator.mediaDevices
    .getUserMedia({
      // video spacifications
      video: {
        frameRate: 24,
        width: {
          min: 480,
          ideal: 720,
          max: 1280,
        },
        aspectRatio: 1.33333,
      },

      audio: true,
    })
    .then((stream) => {
      // set video in local video div
      localVideoStream = stream;
      document.getElementById("local-video").srcObject = localVideoStream;

      //   create peer connnection
      let peerConfigure = {
        iceServers: [
          {
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:stun1.l.google.com:19302",
              "stun:stun2.l.google.com:19302",
            ],
          },
        ],
      };
      peerConnection = new RTCPeerConnection(peerConfigure);
      //  add local video in the peer conntion
      peerConnection.addStream(localVideoStream);

      // when another guy connect to this peer connection
      peerConnection.onaddstream = (e) => {
        // extract the remote stream video
        // remoteVideoStream = e.stream;
        // display the remote video stream
        document.getElementById("remote-video").srcObject = e.stream;
      };
      // When cadidate create peerConnection
      peerConnection.onicecandidate = (e) => {
        if (e.candidate == null) return;
        sendData({
          type: "send_candidate",
          candidate: e.candidate,
        });
      };
      sendData({
        type: "join_call",
      });
    })
    .catch((error) => {
      console.log(error);
    });
}

// controll audio
let isAudio = true;
function muteAudio() {
  isAudio = !isAudio;
  localVideoStream.getAudioTracks()[0].enabled = isAudio;

  if (localVideoStream.getAudioTracks()[0].enabled == false) {
    document.getElementById(
      "muteAudio"
    ).innerHTML = `<img src="./images/mic-mute-fill.svg" alt="">`;
  } else if (localVideoStream.getAudioTracks()[0].enabled == true) {
    document.getElementById(
      "muteAudio"
    ).innerHTML = `<img src="./images/mic-fill.svg" alt="">`;
  }
}

let isVideo = true;
function muteVideo() {
  isVideo = !isVideo;
  localVideoStream.getVideoTracks()[0].enabled = isVideo;

  if (localVideoStream.getVideoTracks()[0].enabled == false) {
    document.getElementById(
      "muteVideo"
    ).innerHTML = `<img src="./images/camera-video-off-fill.svg" alt="">`;
  } else if (localVideoStream.getVideoTracks()[0].enabled == true) {
    document.getElementById(
      "muteVideo"
    ).innerHTML = `<img src="./images/camera-video-fill.svg" alt="">`;
  }
}
