const express = require("express")

const userController = require("../controller/userController")
const productController = require("../controller/productController")
const cartController = require("../controller/cartController")
const orderController = require("../controller/orderController")
const mw = require("../middleware/auth")

const router = express.Router()

router.get("/test", (req, res) => {
    let data = req.body
    res.status(200).send({status: true, message: "it's working", data: data})
})
// user
router.post("/register", userController.register)

router.post("/login", userController.userlogin)

router.get("/user/:userId/profile", mw.authentication, userController.getUserProfile)

router.put("/user/:userId/profile", mw.authentication, mw.userAuthorization, userController.updateUser)

//products
router.post("/products", productController.createProduct)

router.get("/products", productController.getSpecificProduct)

router.get("/products/:productId", productController.getProductByProductId)

router.put("/products/:productId", productController.updatedProduct)

router.delete("/products/:productId", productController.deleteProduct)

//Cart
router.post("/users/:userId/cart", mw.authentication, mw.userAuthorization, cartController.createCart)

router.get("/users/:userId/cart", mw.authentication, mw.userAuthorization, cartController.getCartByUserId)

router.delete("/users/:userId/cart", mw.authentication, mw.userAuthorization, cartController.deleteCartItems)

router.put("/users/:userId/cart", mw.authentication, mw.userAuthorization, cartController.updateCart)

// order
router.post("/users/:userId/orders", mw.authentication, mw.userAuthorization, orderController.postOrder)

router.put("/users/:userId/orders", mw.authentication, mw.userAuthorization, orderController.upadateOrder2)

//it check that you provide correct url (like delete , put ) && if you not provide user_Id in params
router.get("*", (req, res) => {
    return res.status(404).send({status: false, message: "page not found"})
})
router.post("*", (req, res) => {
    return res.status(404).send({status: false, message: "page not found"})
})
router.put("*", (req, res) => {
    return res.status(404).send({status: false, message: "page not found"})
})
router.delete("*", (req, res) => {
    return res.status(404).send({status: false, message: "page not found"})
})
module.exports = router