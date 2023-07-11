const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();
const PORT = process.env.PORT || 3000;
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected successfully");
  })
  .catch((error) => {
    console.log(error);
  });

const itemschema = new mongoose.Schema({
  name: String,
});

const Item = new mongoose.model("Item", itemschema);

const x = new Item({
  name: "Welcome to your todolist!",
});
const y = new Item({
  name: "Hit the + button to add a new item.",
});
const z = new Item({
  name: "<-- Hit this to delete an item.",
});

const defaultArray = [x, y, z];

const listSchema = {
  name: String,
  arrayM: [itemschema],
};
const List = mongoose.model("List", listSchema);

app.get("/", async (req, res) => {
  try {
    const arr2 = await Item.find({});
    if (arr2.length === 0) {
      await Item.insertMany(defaultArray);
    } else {
      res.render("list", { listTitle: "Today", newListItem: arr2 });
    }
  } catch (error) {
    console.log(error);
  }
});

app.post("/", async (req, res) => {
  try {
    const itemName = req.body.newItem;
    const listName = req.body.list;
    const item = new Item({
      name: itemName,
    });
    if (listName === "Today") {
      await item.save();
      res.redirect("/");
    } else {
      try {
        const list = await List.findOne({ name: listName });
        list.arrayM.push(item);
        list.save();
        res.redirect(`/${listName}`);
      } catch (error) {
        console.log(error);
        res.redirect("/");
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error occurred while adding the item.");
  }
});

app.post("/delete", async (req, res) => {
  try {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    if (listName === "Today") {
      await Item.findByIdAndRemove(checkedItemId);
      res.redirect("/");
    } else {
      await List.findOneAndUpdate(
        { name: listName },
        { $pull: { arrayM: { _id: checkedItemId } } }
      );
      res.redirect(`/${listName}`);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error occurred while deleting the item.");
  }
});


app.get("/:customName", async (req, res) => {
  const customListName = _.capitalize(req.params.customName);
  try {
    const list = await List.findOne({ name: customListName });
    if (!list) {
      const newList = new List({
        name: customListName,
        arrayM: defaultArray,
      });
      await newList.save();
      // Redirect to the custom list page
      res.redirect(`/${customListName}`);
    } else {
      res.render("list", { listTitle: list.name, newListItem: list.arrayM });
    }
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
});

app.listen(PORT, () => {
  console.log("Server at port 3000");
});
