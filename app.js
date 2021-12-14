//jshint esversion:6

const express = require("express")
const bodyParser = require("body-parser")
const date = require(__dirname + "/date.js")
const mongoose = require("mongoose")
const _ = require("lodash")

const app = express()

app.set("view engine", "ejs")

app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static("public"))

mongoose.connect("mongodb://localhost:27017/todolistDB")

const itemsSchema = mongoose.Schema({
     title: String,
})

const Item = mongoose.model("Item", itemsSchema)

const item1 = new Item({
     title: "Welcome to your todolist!",
})

const item2 = new Item({
     title: "Hit the + button to add a new item.",
})

const item3 = new Item({
     title: "<-- Hit this to delete an item.",
})

const defaultItems = [item1, item2, item3]

const listSchema = {
     name: String,
     items: [itemsSchema],
}

const List = mongoose.model("List", listSchema)

app.get("/", function (req, res) {
     Item.find({}, function (err, foundItems) {
          if (foundItems.length === 0) {
               Item.insertMany(defaultItems, (err) => {
                    if (err) {
                         console.log(err)
                    } else {
                         console.log("Successfully added items")
                    }
               })
               res.redirect("/")
          } else {
               res.render("list", {
                    listTitle: "Today",
                    newListItems: foundItems,
               })
          }
     })
})

app.get("/:customListName", function (req, res) {
     const customListName = _.capitalize(req.params.customListName)

     List.findOne({ name: customListName }, function (err, foundList) {
          if (err) {
               console.log(err)
          } else {
               if (!foundList) {
                    const list = new List({
                         name: customListName,
                         items: defaultItems,
                    })

                    list.save()
                    res.redirect("/" + customListName)
               } else {
                    res.render("list", {
                         listTitle: foundList.name,
                         newListItems: foundList.items,
                    })
               }
          }
     })
})

app.post("/", function (req, res) {
     const itemName = req.body.newItem
     const listName = req.body.list

     const item = new Item({
          title: itemName,
     })

     if (listName === "Today") {
          item.save()
          res.redirect("/")
     } else {
          List.findOne({ name: listName }, function (err, foundList) {
               foundList.items.push(item)
               foundList.save()
               res.redirect("/" + listName)
          })
     }
})

app.post("/delete", function (req, res) {
     console.log(req.body)
     const checkedItemId = req.body.checkbox
     const listName = req.body.listName

     if (listName === "Today") {
          Item.findByIdAndRemove(checkedItemId, (err) => {
               if (err) {
                    console.log(err)
               } else {
                    console.log(
                         "Successfully deleted item: " + req.body.checkbox
                    )
               }
               res.redirect("/")
          })
     } else {
          List.findOneAndUpdate(
               { name: listName },
               { $pull: { items: { _id: checkedItemId } } },
               function (err, found) {
                    if (err) {
                         console.log(err)
                    } else {
                         res.redirect("/" + listName)
                    }
               }
          )
     }
})

app.get("/about", function (req, res) {
     res.render("about")
})

app.listen(3000, function () {
     console.log("Server started on port 3000")
})
