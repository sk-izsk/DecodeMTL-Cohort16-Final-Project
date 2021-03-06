const express = require("express");
const router = express.Router();
const ObjectId = require("mongodb").ObjectId;

const AUTHENTICATION_ERROR = "Authentification issue. Please log into your account"

/**update the curt item of the current user */
router.put("/updateItem", async (req, res) => {
  let sid = req.cookies.sid;
  let cartItemId = req.body.cartItemId;
  // check if a session exists
  if (sid && res.locals.SESSIONS[sid]) {
    let username = res.locals.SESSIONS[sid];
    //get a userId of the current user
    let cu = await res.locals.USERS.findOne({ username: username });
    let currentUser = cu._id;
    //get a userId of the current Cart item
    let ciu = await res.locals.CART.findOne({ _id: ObjectId(cartItemId) });
    let currentItemUserId = ciu.userId;
    //if that's the same person - update the item
    if (
      currentUser.toString().localeCompare(currentItemUserId.toString()) === 0
    ) {
      let _id = ObjectId(req.body.cartItemId);
      let quantity = req.body.itemQuantity;
      await CART.updateOne(
        { _id: _id },
        { $set: { itemQuantity: quantity } },
        function(err, obj) {
          if (err) throw err;
          console.log(obj.result.n + " cart item updated");
        }
      );
      res.send(JSON.stringify({ successful: true }));
    }
  } else { res.status(500).send(JSON.stringify(AUTHENTICATION_ERROR)); }
});

/**clear the Cart of the current user*/
router.delete("/clear", async (req, res) => {
  let sid = req.cookies.sid;
  //check if the session exists
  if (sid && res.locals.SESSIONS[sid]) {
    let username = res.locals.SESSIONS[sid];
    //get a userId of the current user
    let currentUser = await res.locals.USERS.findOne({ username: username });
    //delete all the elements in the Cart
    await res.locals.CART.deleteMany({ userId: currentUser._id }, function(
      err,
      obj
    ) {
      if (err) throw err;
      console.log("Cart cleared");
      res.send(JSON.stringify({ successful: true }));
    });
  } else { res.status(500).send(JSON.stringify(AUTHENTICATION_ERROR)); }
});

/**delete one Cart Item */
router.delete("/deleteItem", async (req, res) => {
  let sid = req.cookies.sid;
  let cartItemId = req.body.cartItemId;
  //check if a session exists
  if (sid && res.locals.SESSIONS[sid]) {
    let username = res.locals.SESSIONS[sid];
    //get a userId of the current user
    let cu = await res.locals.USERS.findOne({ username: username });
    let currentUser = cu._id;
    //get a userId of the current Cart item
    let ciu = await res.locals.CART.findOne({ _id: ObjectId(cartItemId) });
    let currentItemUserId = ciu.userId;
    //if that's the same person - remove the item
    if (
      currentUser.toString().localeCompare(currentItemUserId.toString()) === 0
    ) {
      let _id = ObjectId(req.body.cartItemId);
      await CART.deleteOne({ _id: _id }, function(err, obj) {
        if (err) throw err;
        console.log(obj.result.n + " cart item deleted");
        res.send(JSON.stringify({ successful: true }));
      });
    }
  } else { res.status(500).send(JSON.stringify(AUTHENTICATION_ERROR)); }
});

/**add a Cart item to mongoDB*/
router.post("/addItem", async (req, res) => {
  let sid = req.cookies.sid;
  //check if a session exists
  if (sid && res.locals.SESSIONS[sid]) {
    let username = res.locals.SESSIONS[sid];
    //get userId of the current user
    let currentUser = await res.locals.USERS.findOne({ username: username });
    let itemId = req.body.itemId;

    //check if the item already exists in the users's Cart

    let isItemExists = await res.locals.CART.findOne({ itemId: itemId, userId: currentUser._id });
    console.log("Is item already in the cart: ", isItemExists);

    if (isItemExists) {
      let _id = ObjectId(isItemExists._id);
      let quantity = isItemExists.itemQuantity + 1;
      await CART.updateOne(
        { _id: _id },
        { $set: { itemQuantity: quantity } },
        function(err, obj) {
          if (err) throw err;
          console.log(obj.result.n + " cart item updated");
        }
      );
      res.send(JSON.stringify({ successful: true }));
    } else {
      //create a new object for the new item
      console.log("ItemId", itemId, "currentUser._id", currentUser._id)
      let newCartItem = {
        itemId: itemId,
        itemQuantity: 1,
        userId: currentUser._id
      };
      //add this object to the "cart" collection
      await res.locals.CART.insertOne(newCartItem, function(err, obj) {
        if (err) throw err;
        console.log(obj.result.n + " cart item added");
        res.send(JSON.stringify({ successful: true }));
      });
    }
  } else { res.status(500).send(JSON.stringify(AUTHENTICATION_ERROR)); }
});

/**return an array of items (each item is an object) in the Cart for current user*/
router.get("/allItems", async (req, res) => {
  let sid = req.cookies.sid;
  //check if there is a session for current user
  if (sid && res.locals.SESSIONS[sid]) {
    let username = res.locals.SESSIONS[sid];
    //request userId from the collection "users"
    let currentUser = await res.locals.USERS.findOne({ username: username });

    let cartItems = await res.locals.CART.aggregate([{
      $match: { userId: ObjectId(currentUser._id)}
    },{ $addFields: { convertedItemId: {$toObjectId: "$itemId"}, convertedCartItemId: {$toString: "$_id"}}
    },{ $lookup: {
          from: "items",
          localField: "convertedItemId",
          foreignField: "_id",
          as: "item"        
    }
    },{
      $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$item", 0 ] }, "$$ROOT" ] } }
    },{
      $project: {cartItemId: "$convertedCartItemId",itemName: "$name",itemImage: "$imgUrl", itemPrice: "$price", itemQuantity:1, itemId: 1 }
    }, {
      $project: {item: 0, _id: 0, sellerId: 0, quantity:0, description:0, isDeleted: 0, isAvailable:0}
    }]).toArray()

   /**
    //request the items in the Cart for user with this userId only
    let cart = await res.locals.CART.find({
      userId: currentUser._id
    }).toArray();
    //request all items from the collection "Items"
    let items = await res.locals.ITEMS.find({}).toArray();
    //for each item in the Cart create an object for frontend
    let cartItems = cart.map(element => {
      let cartItem = {};
      items.forEach(item => {
        if (ObjectId(item._id).toString() === element.itemId) {
          cartItem = {
            cartItemId: ObjectId(element._id).toString(),
            itemId: ObjectId(item._id).toString(),
            itemName: item.name,
            itemImage: item.imgUrl,
            itemPrice: item.price,
            itemQuantity: element.itemQuantity
          };
        }
      });
      console.log("OldResult: ", cartItem)
      return cartItem;
    });
    */
    console.log("Cart items sent");
    process.env.NODE_ENV === "development" &&
      res.send(JSON.stringify({ successful: true, cartItems: cartItems }));
    } else { res.status(500).send(JSON.stringify(AUTHENTICATION_ERROR)); }
});

module.exports = router;
