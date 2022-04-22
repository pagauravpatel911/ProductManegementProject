const cartModel = require("../model/cartModel")
const userModel = require("../model/userModel")
const validator = require("../validator/validator")
const orderModel = require("../model/orderModel")


const postOrder = async (req, res) => {
    try{
        const {userId} = req.params
        if(!validator.isValidObjectId(userId)){
            return res.status(400).send({status: false, message: "not a valid userID"})
        }
        const isUserExist = await userModel.findOne({_id: userId})
      

        if(!isUserExist){
            return res.status(404).send({status: false, message: "user does not exist"})
        }
        const isCartExist = await cartModel.findOne({userId:userId});
        if(!isCartExist){
          return res.status(404).send({status: false, message: "user does not have a cart"})
      }

        const data = req.body
        if (!validator.isValidObject(data)){
            return res.status(404).send({status: false, message: "enter data"})
        }
        const {items, totalPrice, totalItems} = data
        let todtalQuantity = 0
        for(let i = 0; i < items.length; i++){
          todtalQuantity = todtalQuantity + items[i].quantity
        }
        data.totalQuantity = todtalQuantity
        data.userId = userId
        const order = await orderModel.create(data)
        return res.status(201).send({status: true, data: order})
    }catch(error){
        return res.status(500).send({status: false, message: error.message})
    }
}

const upadateOrder = async function (req, res) {
    try{
      let userId = req.params.userId;
      let orderId = req.body.orderId;
    
      if (!(validator.isValid(userId) && validator.isValidObjectId(userId))) {
        return res
          .status(400)
          .send({ status: false, message: "user  Id not valid" });
      }
      if (!(validator.isValid(orderId) && validator.isValidObjectId(orderId))) {
        return res
          .status(400)
          .send({ status: false, message: "user  Id not valid" });
      }
    
      let cartExist = await cartModel.findOne({userId:userId});
      if (!cartExist) {
        return res
          .status(400)
          .send({ status: false, message: "This user have no card till Now" });
      }
      let findOrder = await orderModel.findById(orderId);
      if (!findOrder) {
        return res
          .status(400)
          .send({ status: false, message: "Order in not found with this Id" });
      }
      if (userId != findOrder.userId) {
        return res
          .status(400)
          .send({ status: false, message: "User is not autherized to do changes" });
      }
      if (findOrder.cancellable == true && findOrder.status == "pending" && findOrder.isDeleted == false) {
        const updateOrder = await orderModel.findOneAndUpdate(
          { _id: orderId },
          { $set: { status: "cancled" } },
          { new: true }
        );
        return res
          .status(200)
          .send({
            status: false,
            message: "Succesfully Cancled Order",
            data: updateOrder,
          });
      }
      return res
        .status(400)
        .send({
          status: false,
          message: "order is not canclable or cart is alerady deleted",
      });
    }catch(error){
      return res.status(500).send({status: false, message: error.message})
    }
};


module.exports.postOrder = postOrder
module.exports.upadateOrder = upadateOrder
