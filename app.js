const express = require("express");
const http = require("http");
const Socket = require("websocket").server;
require("dotenv").config();

//1. Create an Express application
const app = express();

//2. Create an HTTP server with the Express app
const server = http.createServer(app);

//3. Set up the WebSocket server [no need if this app run without any extranal server]
const websocket = new Socket({
  httpServer: server,
});

app.use(express.static("public"));

app.set("view engine", "ejs");

// main server part
app.get("/", (req, res) => {
  res.render("index");
});
app.get("/sender", (req, res) => {
  res.render("sender");
});
app.get("/recevier", (req, res) => {
  res.render("recevier");
});

let users = [];
let userMatch = true;

websocket.on("request", (req) => {
  // accept the websocket connection
  const connection = req.accept();
  // console.log(connection);

  connection.on("message", (message) => {
    // Get send user: data in data variable
    const data = JSON.parse(message.utf8Data);

    //  call findUser funtion to know user already excites or not
    const user = findUser(data.username);

    switch (data.type) {
      case "store_user":
        if (user != null) {
          return;
        }

        const newUser = {
          conn: connection,
          username: data.username,
        };
        users.push(newUser);

        break;
      case "store_offer":
        if (user == null) return;

        user.offer = data.offer;
        break;

      case "store_candidate":
        if (user == null) {
          sendData(
            {
              type: "notMatch",
              //   offer: user.offer,
              message: "Inactive caller ID",
            },
            connection
          );
          return;
        }

        if (user.candidates == null) user.candidates = [];
        user.candidates.push(data.candidate);
        break;

      case "send_answer":
        if (user == null) {
        }
        sendData(
          {
            type: "answer",
            answer: data.answer,
          },
          user.conn
        );
        break;
      case "send_candidate":
        if (user == null) {
          return;
        }

        sendData(
          {
            type: "candidate",
            candidate: data.candidate,
          },
          user.conn
        );
        break;
      case "join_call":
        if (user == null) {
          sendData(
            {
              type: "error",
              //   offer: user.offer,
              message: "Inactive caller ID",
            },
            connection
          );

          return;
        }
        sendData(
          {
            type: "offer",
            offer: user.offer,
          },
          connection
        );
        user.candidates.forEach((candidate) => {
          sendData(
            {
              type: "candidate",
              candidate: candidate,
            },
            connection
          );
        });
        break;
    }
  });

  connection.on("close", (reason, description) => {
    users.forEach((user) => {
      if (user.conn == connection) {
        users.splice(users.indexOf(user), 1);
        return;
      }
    });
  });
});

function sendData(data, conn) {
  conn.send(JSON.stringify(data));
}

// Check username already excits or not
function findUser(username) {
  for (let i = 0; i < users.length; i++) {
    if (users[i].username == username) return users[i];
  }
}

//4. Start the HTTP server
server.listen(process.env.PORT || 4000, () => {
  console.log(`Server listening on port ${process.env.PORT}`);
});
