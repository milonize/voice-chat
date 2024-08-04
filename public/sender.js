const websocket = new WebSocket("/");

// Handle incoming messages from the WebSocket server
websocket.onmessage = (e) => {
  // Parse and process signaling data

  handleSignalData(JSON.parse(e.data));
};

// Process the signaling data received from the WebSocket
function handleSignalData(data) {
  switch (data.type) {
    case "answer":
      // Set the remote description when receiving an answer
      peerConnection.setRemoteDescription(data.answer);
      break;
    case "candidate":
      // Add ICE candidate to the peer connection
      peerConnection.addIceCandidate(data.candidate);
      break;
    case "notMatch":
      document.getElementById("video-call-div").style.display = "none";

      document.getElementById(
        "message"
      ).innerHTML = `<div class="alert p-2 alert-danger" role="alert">
 ${data.message}
</div>`;
  }
}

let username;

// Send the username to the server and display it in a toast notification
function sendUsername() {
  let toastBody = document.getElementById("toast-body");
  let toastBox = document.getElementById("toastBox");
  // Show the toast box
  toastBox.style.display = "block";
  // Set the toast message to the stored username
  toastBody.innerText = localStorage.getItem("voiceUsername");

  // Get the username from the input field and store it in localStorage
  username = document.getElementById("username-input").value;
  localStorage.setItem("voiceUsername", username);

  // Send the username data to the server
  sendData({
    type: "store_user",
  });
}

// Send data to the WebSocket server
function sendData(data) {
  data.username = username; // Attach the username to the data
  // Send the data as a JSON string through the WebSocket
  websocket.send(JSON.stringify(data));
}

let localVideoStream;
let peerConnection;

// Start a video call by accessing user media and setting up a peer connection
function startCall() {
  // Display the video call container
  document.getElementById("video-call-div").style.display = "inline";
  // Get user media (video and audio) with specified constraints
  navigator.mediaDevices
    .getUserMedia({
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
      // Set the local video stream
      localVideoStream = stream;

      document.getElementById("local-video").srcObject = localVideoStream;

      // Configure ICE servers for the peer connection
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
      // Create a new RTCPeerConnection with the configuration
      peerConnection = new RTCPeerConnection(peerConfigure);
      // Add the local video stream to the peer connection
      peerConnection.addStream(localVideoStream);

      // Handle the event when a remote stream is added
      peerConnection.ontrack = (e) => {
        // Display the remote video stream
        document.getElementById("remote-video").srcObject = e.streams[0];
      };

      // Handle ICE candidate events
      peerConnection.onicecandidate = (e) => {
        // Check if the event contains an ICE candidate
        if (e.candidate) {
          // If an ICE candidate is available, send it to the server
          // The ICE candidate is necessary for establishing a connection between peers
          sendData({
            type: "store_candidate", // Specifies the type of data being sent
            candidate: e.candidate, // The actual ICE candidate object
          });
        }
      };

      // Create and send an offer to the server
      createAndSendOffer();
    })
    .catch((error) => {
      // Log any errors encountered while accessing media devices
      console.error("Error accessing media devices.", error);
    });
}

// Create and send an SDP offer to the server
function createAndSendOffer() {
  // Create an SDP offer for the peer connection
  peerConnection
    .createOffer()
    .then((offer) => {
      // Set the local description with the offer
      return peerConnection.setLocalDescription(offer);
    })
    .then(() => {
      // Send the offer to the server
      sendData({
        type: "store_offer",
        offer: peerConnection.localDescription,
      });
    })
    .catch((error) => {
      // Log any errors encountered while creating the offer
      console.error("Error creating offer.", error);
    });
}

let isAudio = true;

// Toggle audio mute/unmute
function muteAudio() {
  isAudio = !isAudio; // Toggle the audio state
  // Enable or disable the audio track based on the new state
  localVideoStream.getAudioTracks()[0].enabled = isAudio;

  // Update the mute button icon based on the audio state
  const muteButton = document.getElementById("muteAudio");
  muteButton.innerHTML = isAudio
    ? `<img src="./images/mic-fill.svg" alt="Microphone On">`
    : `<img src="./images/mic-mute-fill.svg" alt="Microphone Off">`;
}

let isVideo = true;

// Toggle video mute/unmute
function muteVideo() {
  isVideo = !isVideo; // Toggle the video state
  // Enable or disable the video track based on the new state
  localVideoStream.getVideoTracks()[0].enabled = isVideo;

  // Update the mute button icon based on the video state
  const muteButton = document.getElementById("muteVideo");
  muteButton.innerHTML = isVideo
    ? `<img src="./images/camera-video-fill.svg" alt="Camera On">`
    : `<img src="./images/camera-video-off-fill.svg" alt="Camera Off">`;
}
