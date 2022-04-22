const userModel = require("../model/userModel")
const validator = require("../validator/validator")
const aws = require("./aws")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")

const salt = 10

const register = async (req, res) => {
    try{
        const data = req.body
        if (!validator.isValidObject(data)){
            return res.status(400).send({status: false, message: "please fill all required fields"})
        }
        const{fname, lname, email, phone, password} = data
        // let address = data.address
        if(!data.address){
            return res.status(400).send({status: false, message: "please enter your address "})
        }
        data.address = JSON.parse(data.address)
        // return res.send(address)
        const {shipping, billing} = data.address
        if (!validator.isValidObject(shipping)){
            return res.status(400).send({status: false, message: "please fill all required fields in shipping"})
        }
        if (!validator.isValidObject(billing)){
            return res.status(400).send({status: false, message: "please fill all required fields billing"})
        }
        if(!validator.isValid(fname)){
            return res.status(400).send({status: false, message: "please enter your first name"})
        }

        if(!validator.isValidString(fname)){
            return res.status(400).send({status: false, message: "please enter letters only in first name"})
        }
        
        if(!validator.isValid(lname)){
            return res.status(400).send({status: false, message: "please enter your last name"})
        }
        if(!validator.isValidString(lname)){
            return res.status(400).send({status: false, message: "please enter letters only in last name"}) 
        }
        if(!validator.isValid(email)){
            return res.status(400).send({status: false, message: "please enter your email"})
        }
        if(!validator.isValidEmail(email)){
            return res.status(400).send({status: false, message: "please enter valid email"})
        }
        const isEmailInUse = await userModel.findOne({email: email})
        if(isEmailInUse) {
            return res.status(400).send({status:false, message: "email already registered, enter different email"})
        }
        if(!validator.isValid(password)){
            return res.status(400).send({status: false, message: "please enter  password"})
        }
        if(!validator.isValidPW(password)){
            return res.status(400).send({status: false, message: "please enter valid password, between 8 to 15 characters"})
        }
        if (!validator.isValidPhone(phone)){
            return res.status(400).send({status: false, message: "please enter valid phone number"})
        }
        const isPhoneInUse = await userModel.findOne({phone: phone})
        if(isPhoneInUse) {
            return res.status(400).send({status:false, message: "phone number already registered, enter different number"})
        }
        if(!validator.isValid(shipping.street)){
            return res.status(400).send({status: false, message: "please enter street name"})
        }
        if(!validator.isValidString(shipping.street)){
            return res.status(400).send({status: false, message: "please enter valid street name, dont enter number"})
        }
        if(!validator.isValid(shipping.city)){
            return res.status(400).send({status: false, message: "please enter name of city"})
        }
        if(!validator.isValidString(shipping.city)){
            return res.status(400).send({status: false, message: "please enter vaid name of the city, dont enter number"})
        }
      
       
        if(!validator.isValidPincode(shipping.pincode)){
            return res.status(400).send({status: false, message: "please enter valid pincode"})
        }
        if(!validator.isValid(billing.street)){
            return res.status(400).send({status: false, message: "please enter street name"})
        }
        if(!validator.isValidString(billing.street)){
            return res.status(400).send({status: false, message: "please enter street name, dont enter number"})
        }
        if(!validator.isValid(billing.city)){
            return res.status(400).send({status: false, message: "please enter name of the city"})
        }
        if(!validator.isValidString(billing.city)){
            return res.status(400).send({status: false, message: "please enter valid name of the city, dont enter number"})
        }
      
        if(!validator.isValidPincode(billing.pincode)){
            return res.status(400).send({status: false, message: "please enter valid pincode"})
        }
        const hash = await bcrypt.hash(password, salt)
        data.password = hash
        // const link = await getProfileImgLink(req, res)
        // data.profileImage = link
        let files = req.files
        if (files && files.length > 0) {
            let uploadedFileURL = await aws.uploadFile(files[0])
            data.profileImage = uploadedFileURL
        }else{
           return res.status(400).send({ status: false, message: "plz enter a profile Img" })
        }
        // return res.send({data: data})
        const user = await userModel.create(data)
        return res.status(201).send({status: true, message: 'User created successfully', data: user})
    }catch(error){
        return res.status(500).send({status: false, message: error.message})
    }
}


const userlogin = async function (req, res){
    try{      
      const body = req.body;
      //// check body  provied or not
      if(!validator.isValidObject(body)){
          return res.status(400).send ({status: false, message:"Please provide body"})
      }
      const emailId = req.body.email
      const password = req.body.password
      //check user exist or not
      if(!(emailId || password)) {
        return res.status(400).send ({ status: false, message: "email or password is missing"})
      } 
     // check email provied or not
      if(!validator.isValid(emailId)){
            return res.status(400).send ({status: false, message: "plese provide email_Id"})    
      }
      // check by regex
      if(!(validator.isValidEmail(emailId))) {
          return res.status(400).send ({status: false, message: "please provide valid eamil with sign"})
      }
      // check password provied or not
      if(!validator.isValid(password)){
          return res.status(400).send ({status: false, message: "please provide valid password"})
      }
     //check by regex
    //   if(!validator.isValidPW(password)){
    //       return res.status(400).send({status: false, message: "please enter valid password, between 8 to 15 characters"})
    //   }
      const login = await userModel.findOne({ email: emailId})
      if(!login) {
          return res.status(404).send ({ status: false, message: "email is not register"})
      }
      bcrypt.compare(password, login.password, (err, result) => {
          if(result === true){
            let token = jwt.sign(
                {
                    userId: login._id,
                    iat: Math.floor(Date.now() / 1000),
                    exp: Math.floor(Date.now() / 1000) + 2*60*60
               
                }, "projectfivegroup30"
            );
                res.status(200).setHeader ("api-token-key", token)
                return res.status(200).send ({status: true, message: "token created successfully" ,data:{userId: login._id, Token: token}})
            }else{
                return res.status(400).send({status: false, message: "incorrect password"})
            }
        })
      
    } 
      catch (error) {
        return res.status(500).send({status: false, error: error.message })
    }
};


const getUserProfile = async function(req,res){
    try{  
        let userId = req.params.userId;
        // return res.send(req)
        if(!(validator.isValid(userId) && validator.isValidObjectId(userId))) {
          return res.status(400).send({status: false, message: "user  Id not valid"})
      }
      let getUserProfile = await userModel.findById(userId);
      if(!getUserProfile){
          return res.status(404).send({status: false, message:"User Not Found"})
      }
     return res.status(200).send({status:true, message: "User profile details",data:getUserProfile})
  }catch (err) {
    //   console.log("This is the error :", err.message);
      return res.status(500).send({ status: false, error: err.message });
    }
}


  
const getProfileImgLink = async (req, res) => {
    try{
        let files = req.files
        if(files && files.length > 0){
            let uploadedFileURL = await aws.uploadFile(files[0])
            // return res.status(201).send({status: true, message: "file uploaded succesfully", data: uploadedFileURL})
            return uploadedFileURL
        }else{
            return res.status(400).send({status: false, message: "please enter profile pic" })
        }
    }catch(error){
        return res.status(500).send({status: false, message: error.message })
    }
}


const updateUser = async (req, res) => {
    try{
        const {userId} = req.params
        if (!validator.isValidObjectId(userId)){
            return res.status(400).send ({status:false, message :"Please provide valid ID"})
        }
        const data = req.body //JSON.parse(JSON.stringify(req.body)) 
        const files = req.files
        const {password} = data
        const updateUserData = {}
        // if(!validator.isValidObject(data)){
        //     return res.status(400).send ({status:false, message :"Please provide body"})
        // }
        const isUserExist = await userModel.findById(userId)
        if (!isUserExist){
            return res.status(404).send({status: false, message: "user not found"})
        }
        if(data._id){
            return res.status(400).send({status: false, message: "can not update user id"})
        }
        if(data.fname){
            if(!(validator.isValid(data.fname))) {
                return res.status(400).send ({status: false, message: "please provide valid first name"})
            }
            if(!validator.isValidString(data.fname)){
                return res.status(400).send({status: false, message: "please enter letters only in first name"})
            }
            updateUserData.fname = data.fname
        }
        if(data.lname){
            if(!(validator.isValid(data.lname))) {
                return res.status(400).send ({status: false, message: "please provide valid lname name"})
            }
            if(!validator.isValidString(data.lname)){
                return res.status(400).send({status: false, message: "please enter letters only in last name"})
            }
            updateUserData.lname = data.lname
        }
        if(data.email){
            if(!validator.isValidEmail(data.email)) {
                return res.status(400).send({status:false, message: "Please provide valid email Id"})
             
            }
            const isEmailInUse = await userModel.findOne({email: data.email})
            if(isEmailInUse) {
                return res.status(400).send({status:false, message: "email already registered, enter different email"})
            }
            updateUserData.email = data.email
        }
        if(data.phone){
            if(!validator.isValidPhone(data.phone)) {
                return res.status(400).send({status:false, message: "Please provide 10 digit number && number should start with 6,7,8,9"})
             
            }
            const isPhoneInUse = await userModel.findOne({phone: data.phone})
            if(isPhoneInUse) {
                return res.status(400).send({status:false, message: "phone number already registered, enter different number"})
            }
            updateUserData.phone = data.phone

        }
        //it check image avilable or not
        if(files && files.length > 0){
            const link = await getProfileImgLink(req, res)
            updateUserData.profileImage = link
            // console.log(link)
        }
        if (password){
            const hash = await bcrypt.hash(password, salt)
            updateUserData.password = hash
        }
        const add = JSON.parse(JSON.stringify(isUserExist.address))

        // return res.send(add)
        if(data.address){
            data.address = JSON.parse(data.address)
            // return res.send(data)
            if(data.address.shipping){
                if(data.address.shipping.street){
                    if (!validator.isValid(data.address.shipping.street)){
                        return res.status(400).send({status: false, message: "please enter shipping street name"})
                    }
                    add.shipping.street = data.address.shipping.street
                }
                if(data.address.shipping.city){
                    if (!validator.isValid(data.address.shipping.city)){
                        return res.status(400).send({status: false, message: "please enter shipping city name"})
                    }
                    add.shipping.city = data.address.shipping.city
                }
                if(data.address.shipping.pincode){
                    if (!validator.isValid(data.address.shipping.pincode)){
                        return res.status(400).send({status: false, message: "please enter shipping pincode"})
                    }
                if(!validator.isValidPincode(data.address.shipping.pincode)) {
                    return res.status(400).send({status: false, message: "please enter valid shipping pincode only accept 6 didgit number "})
                }   
                    add.shipping.pincode = data.address.shipping.pincode
                }
            }
            if(data.address.billing){
                if(data.address.billing.street){
                    if (!validator.isValid(data.address.billing.street)){
                        return res.status(400).send({status: false, message: "please enter billing street name"})
                    }
                    add.billing.street = data.address.billing.street
                }
                if(data.address.billing.city){
                    if (!validator.isValid(data.address.billing.city)){
                        return res.status(400).send({status: false, message: "please enter billing city name"})
                    }
                    add.billing.city = data.address.billing.city
                }
                if(data.address.billing.pincode){
                    if (!validator.isValid(data.address.billing.pincode)){
                        return res.status(400).send({status: false, message: "please enter billing pincode"})
                    }
                
                if(!validator.isValidPincode(data.address.billing.pincode)) {
                        return res.status(400).send({status: false, message: "please enter valid billing pincode only accept 6 didgit number "})
                    }    
                    add.billing.pincode = data.address.billing.pincode
                }
            }
            updateUserData.address = add// copy from the mongodb and update from the user provide the updated key
        }
        if (!validator.isValidObject(updateUserData)){
            return res.status(400).send({status: false, message: "please enter data for updation"})
        }
        // return res.send(data.address)
        const updateUser = await userModel.findOneAndUpdate({_id: userId}, updateUserData, {new: true})
        return res.status(200).send({status: true, message: "User profile update successfully", data: updateUser})
    }catch(error){
        return res.status(500).send({status: false, message: error.message})
    }
}


module.exports.register = register
module.exports.getUserProfile = getUserProfile;
module.exports.userlogin = userlogin
module.exports.updateUser = updateUser
