const mongoose = require("mongoose");
mongoose.connect(
  "mongodb+srv://paraskaushik12:vSMrmhNAdP1OIKxH@naveli.qfh4qyi.mongodb.net/naveli?retryWrites=true&w=majority&appName=naveli",
  { useNewUrlParser: true, useUnifiedTopology: true }
);
//mongoose.connect("mongodb://localhost/perfectCollectionDb");
const db = mongoose.connection;
db.on("error", console.error.bind(console, "Error connecting to MongoDB"));
db.once("open", function () {
  console.log("Connected to Database :: MongoDB");
});
module.exports = db;
