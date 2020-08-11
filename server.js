const express = require("express");
const app = express();
const protobuf = require("protobufjs");
const fs = require("fs");
const readline = require("readline");
const cors = require("cors");
const { google } = require("googleapis");
var bodyParser = require("body-parser");
const { GoogleSpreadsheet } = require("google-spreadsheet");

app.use(bodyParser.raw({ type: "application/x-protobuf" }));
var doc = new GoogleSpreadsheet(process.env.SHEET_ID);
app.use(cors({origin: "https://languid-fern-bell.glitch.me"})); 

app.post("/add", async (req, res) => {
  protobuf.load("awesome.proto", async function(err, root) {
    if (err) res.send(err);
    let reqSchema = root.lookupType("sub.RequestMessage");
    let resSchema = root.lookupType("sub.ResponseMessage");
    console.log(typeof req.body);
    var reqData = reqSchema.decode(req.body);
    await doc.useServiceAccountAuth({
      client_email: process.env.EMAIL,
      private_key: process.env.KEY.replace(/\\n/g, '\n')
    });
    await doc.loadInfo(); // loads sheets
    const sheet = doc.sheetsByIndex[0]; // the first sheet
    await sheet.addRow({ EMAILS: reqData.email });
    res.setHeader("Content-Type", "application/x-protobuf");
    let payload = { messages: "Added", success: true };
    let errMsg = resSchema.verify(payload);
    if (errMsg) throw Error(errMsg);
    var message = resSchema.create(payload);
    var buffer = resSchema.encode(message).finish();
    res.send(buffer).status(201);
  });
});

app.get("**", (request, response) => {
  response.status(404).send("Page not found");
});

// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
