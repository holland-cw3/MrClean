// POST https://push.groupme.com/faye

const { response } = require("express");

// BODY: [
//   {
//     "channel":"/meta/handshake",
//     "version":"1.0",
//     "supportedConnectionTypes":["long-polling"],
//     "id":"1"
//   }
// ]

// RESPONSE
/* [
    {
        "id": "1",
        "channel": "/meta/handshake",
        "successful": true,
        "version": "1.0",
        "supportedConnectionTypes": [
            "long-polling",
            "cross-origin-long-polling",
            "callback-polling",
            "websocket",
            "eventsource",
            "in-process"
        ],
        "clientId": "1gr5oy17s7xrc09bvege09jq3we089s7xy1",
        "advice": {
            "reconnect": "retry",
            "interval": 0,
            "timeout": 600000
        }
    }
]




POST https://push.groupme.com/faye

BODY: [
  {
    "channel":"/meta/subscribe",
    "clientId":"1gr5oy17s7xrc09bvege09jq3we089s7xy1",
    "subscription":"/user/<userid>",
    "id":"2",
    "ext":
      {
        "access_token":"QEed7Pim0DMpy5G7Bj5UWkYtsKCw2nGVRiLgZht3",
        "timestamp":1322556419
      }
  }
]

RESPONSE
[
    {
        "id": "2",
        "clientId": "1gr5oy17s7xrc09bvege09jq3we089s7xy1",
        "channel": "/meta/subscribe",
        "successful": true,
        "subscription": "/user/49076132"
    }
]

*/

// GROUP ID FOR CLUB 2024 - 2025: 101188221
// GROUP ID FOR CLUB 2025 - 2026: 108665912

// [
//   {
//     "channel":"/meta/subscribe",
//     "clientId":"1gr5oy17s7xrc09bvege09jq3we089s7xy1",
//     "subscription":"/group/101188221",
//     "id":"2",
//     "ext":
//       {
//         "access_token":"QEed7Pim0DMpy5G7Bj5UWkYtsKCw2nGVRiLgZht3",
//         "timestamp":1322556419
//       }
//   }
// ]

// [
//     {
//         "id": "2",
//         "clientId": "1gr5oy17s7xrc09bvege09jq3we089s7xy1",
//         "channel": "/meta/subscribe",
//         "successful": true,
//         "subscription": "/group/101188221"
//     }
// ]

// import express from "express";
// import bodyParser from "body-parser";

// const app = express().use(bodyParser.json());

// app.listen(80, () => console.log("webhook is listening"));

// url = "https://push.groupme.com/faye";

// app.post("/", (req, res) => {

//   console.log("webhook event received!", req.query, req.body);
//   res.status(200).send("EVENT_RECEIVED");
//   if (
//     req.body.aspect_type === "create" &&
//     req.body.object_type === "activity"
//   ) {
//     console.log("New activity!");
//   }
// });

let clientId = null;
let messageId = 1;

async function get_client() {
  const response = await fetch("https://push.groupme.com/faye", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      {
        channel: "/meta/handshake",
        version: "1.0",
        supportedConnectionTypes: ["long-polling"],
        id: "1",
      },
    ]),
  });

  const data = await response.json();
  return data[0].clientId;
}

async function subscribe(clientId) {
  const response = await fetch("https://push.groupme.com/faye", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      {
        channel: "/meta/subscribe",
        clientId: clientId,
        subscription: "/groups/101188221",
        id: messageId.toString(),
        ext: {
          access_token: "QEed7Pim0DMpy5G7Bj5UWkYtsKCw2nGVRiLgZht3",
          timestamp: Math.floor(Date.now() / 1000),
        },
      },
    ]),
  });

  return "Subscribed";
}

async function poll() {
  if (!clientId) {
    clientId = await get_client();
    const res = await subscribe(clientId);
    console.log(res);
  }

  fetch("https://push.groupme.com/faye", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      {
        channel: "/meta/connect",
        clientId: clientId,
        connectionType: "long-polling",
        id: messageId.toString(),
      },
    ]),
  })
    .then((response) => {
      messageId++;

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((result) => {
      for (let item of result) {
        data = item.data;

        if (data && "subject" in data) {
          if (item.data.type === "line.create") {
            console.log(item);
            const message = item.data.subject.text;

            console.log(message);

            const id = item.data.subject.user_id;
            const TOKEN = "QEed7Pim0DMpy5G7Bj5UWkYtsKCw2nGVRiLgZht3";

            if (message === "sorry ben") {
              fetch(
                `https://api.groupme.com/v3/groups/108780339/members/1092690659/remove?token=${TOKEN}`,
                {
                  method: "POST",
                }
              )
                .then((res) => res.json())
                .then((data) => {
                  console.log("Response:", data);
                })
                .catch((err) => {
                  console.error("Error:", err);
                });
            }
          }
        }
      }
    })
    .catch((error) => {
      clientId = null;
      messageId = 1;
      console.error("Error:", error);
    })
    .finally(() => {
      setTimeout(poll, 5000);
    });
}

poll();
