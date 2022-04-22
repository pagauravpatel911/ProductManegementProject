const productModel = require("../model/productModel");
const validator = require("../validator/validator")
const aws = require("./aws")
const moment = require("moment")

const createProduct = async function (req, res) {
    try {
        const products = req.body
       // products.availableSizes = JSON.parse(products.availableSizes)
        // return res.send(products)
        if (!validator.isValidObject(products)) {
            return res.status(400).send({status: false, message: "Plaese Provide all required field" })
        }
        //DE STRUCTURING
        const { title, description,style, price, currencyId, currencyFormat } = products
        let availableSizes = products.availableSizes
        if (!validator.isValid(title)) {
            return res.status(400).send({ status: false, message: "Please Provide Title" })
        }
        if (!validator.isValidString(title)) {
            return res.status(400).send({ status: false, message: "Please Provide valid Title, do not enter numbers" })
        }
        const titleInUse = await productModel.findOne({title: title})
        if(titleInUse){
            return res.status(400).send({status: false, message: "enter different Title" })
        }
        if (!validator.isValid(description)) {
            return res.status(400).send({ status: false, message: "Please Provide Description" })
        }
       
        if (!validator.isValid(style)) {
            return res.status(400).send({ status: false, message: "Please Provide style" })
        }
        if (!validator.isValidString(style)){
            return res.status(400).send({ status: false, message: "Please Provide a valid style" })
        }
        if (!validator.isValid(price)) {
            return res.status(400).send({ status: false, message: "Please Provide Price" })
        }
        if(!/^[0-9.]*$/.test(price)){
            return res.status(400).send({ status: false, message: "Please Provide Valid Price" })
            
        }
        products.price = Math.round(price)
        if(!/^[0-9]*$/.test(products.installments)){
            return res.status(400).send({ status: false, message: "Please Provide Valid Installments" })

        }
        if (!validator.isValid(availableSizes)) {
            return res.status(400).send({ status: false, message: "Please Provide Available Sizes" })
        }
    
        availableSizes = JSON.parse(availableSizes)
        // return res.send({data: availablSizes})
        for (let i of availableSizes){
            // console.log(i)
            if(!validator.isValidSize(i)){
                return res.status(400).send({ status: false, message: 'Please Provide Available Sizes from S,XS,M,X,L,XXL,XL' })
            }
        }
        products.availableSizes = availableSizes
        let files = req.files
        if (files && files.length > 0) {
            let uploadedFileURL = await aws.uploadFile(files[0])
            products.productImage = uploadedFileURL
        }else{
           return res.status(400).send({ status: false, message: "plz enter a product Img" })
        }
        
        // return res.send({data: products})
        const product = await productModel.create(products)
        return res.status(201).send({ status: true, message: 'Success', data: product })
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


const getSpecificProduct = async function (req, res) {
    try{
        let data = {
            isDeleted: false
        }
        let queryDataSize = req.query.size;
        if (queryDataSize) {
            if (!(validator.isValid(queryDataSize)) && (validator.isValidSize(queryDataSize))) {
                return res.status(400).send({status: false, message:"plz Enter a valid Size"})
            }
            if(!(validator.isValidSize(queryDataSize))) {
                return res.status(400).send({status:false, message:"Please Provide Available Sizes from S,XS,M,X,L,XXL,XL"})
            }
            data["availableSizes"] = queryDataSize.trim();
        }
        let name = req.query.name;
        if (name) {
            if (!validator.isValid(name)) {
                return res.status(400).send({status: false, message:"plz enter a valid name"})
            }
            data["title"] = {$regex: name.trim()}
        }
        let priceGreaterThan = req.query.priceGreaterThan;
        if (priceGreaterThan) {
            if (!validator.isValid(priceGreaterThan)) {
                return res.status(400).send({status: false, message:"plz enter a valid name"})
            }
            data["price"] = {
                $gte: priceGreaterThan
            }
        }
        let priceLessThan = req.query.priceLessThan;
        if (priceLessThan) {
            if (!validator.isValid(priceLessThan)) {
                return res.status(400).send({status: false, message:"plz enter a valid name"})
            }
            data["price"] = {
                $lte: priceLessThan
            }
        }
        if( priceLessThan && priceGreaterThan){
            if(!validator.isValid(priceLessThan)){
                return res.status(400).send({status: false, message:"plz enter a valid price"})
            }
            if(!validator.isValid(priceGreaterThan)){
                return res.status(400).send({status: false, message:"plz enter a valid price"})
            }
            data["price"] = {$lte:priceLessThan,$gte:priceGreaterThan}
    
        }
        let filerProduct = await productModel.find(data).sort({price: req.query.priceSort})//.skip(8)//.limit(1)//.count();
        // let filerProduct = await productModel.find({title: {$regex: name}});
        if (filerProduct.length === 0) {
            return res.status(400).send({
                status: true,
                message: "No product found"
            })
        }
        return res.status(200).send({
            statu: true,
            message: "products you want",
            data: filerProduct
        })
    }catch(error){
        return res.status(500).send ({status:false, message: error.message})
    }
}

const getProductByProductId = async (req,res) => {

    try{
            const productId = req.params.productId

        if(!validator.isValidObjectId(productId))
        {return res.status(400).send({status:true, message:"Invalid productId"})}

        const getDataByProductId = await productModel.findById({_id:productId})

        if(!getDataByProductId){
            return res.status(404).send({status:true, message:`This ${productId} productId not exist `})
        }
        if(getDataByProductId.isDeleted === true){
            return res.status(404).send({status:true, message:"product is already deleted"})
        }
        return res.status(200).send({status:true, message:getDataByProductId})


    } catch (err){
       return res.status(500).send({status: false, error:err.message})
    }
}

const updatedProduct = async function (req, res) {
    try {
        const { productId } = req.params
        //check id correct or
        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: " NO such Product id are avilable "})
        }
        const product = await productModel.findById(productId);
        //RETURN error is no product found releated to this id
        if (!product) {
            return res.status(404).send({ status: false, message: "Product not found" })
        }
        if (product.isDeleted == "true") {
            return res.status(404).send({ status: false, message: "product is already deleted" })
        }
        const newProduct = req.body
        const files = req.files
        const data = {}
        // if (!validator.isValidObject(newProduct)){
        //     return res.status(400).send({status: false, message: "please enter data for updation"})
        // }
        
        const { title, description, style, price, currencyId, currencyFormat, installments } = newProduct
        let  availableSizes = newProduct.availableSizes
        // console.log(title || title.trim().length != 0)
        if (title){
            const titleInUse = await productModel.findOne({title: title})
            if (titleInUse){
                return res.status(400).send({status: false, message: "title is used, enter different title"})
            }
            if(!validator.isValid(title)){
                return res.status(400).send({status: false, message: "please enter valid title !!"})
            }
            if(!validator.isValidString(title)){
                return res.status(400).send({status: false, message: "please enter valid title"})
            }
            data.title = title
        }
        if (description){
            if(!validator.isValid(description)){
                return res.status(400).send({status: false, message: "please enter proper description"})
            }
            // if(!validator.isValidString(description)){
            //     return res.status(400).send({status: false, message: "please enter valid description"})
            // }
            data.description = description
        }
        if (style){
            if(!validator.isValidString(style)){
                return res.status(400).send({status: false, message: "please enter proper style"})
            }
            data.style = style
        }
        if (price){
            if(!validator.isValid(price)){
                return res.status(400).send({status: false, message: "please enter proper price !!"})
            }
            console.log(price)
            console.log(Number(price))
            if (!/^[0-9.]*$/.test(price)){
                return res.status(400).send({status: false, message: "please enter proper price"})
            }
            data.price = price
        }// for decimal number /^([0-9]+\.?[0-9]*|\.[0-9]+)$/
        if (availableSizes){
            availableSizes = JSON.parse(availableSizes)
            for(let i of availableSizes){
                if(!validator.isValidSize(i)){
                    return res.status(400).send({status: false, message: "please enter proper size"})
                }
            }
            data.availableSizes = availableSizes
        }
        if (installments){
            if (!/^[0-9]*$/.test(installments)){
                return res.status(400).send({status: false, message: "please enter proper installments"})
            }
            data.installments = installments
        }
        //with the help of AWS we upplode the image 
        // return
        if(files && files.length > 0){
            const link = await getNewProductImageLink(req, res)
            data.productImage = link
        }
        if (!validator.isValidObject(data)){
            return res.status(400).send({status: false, message: "please enter data for updation"})
        }
        //Simply UPDATE THE PRODUCT (ALL THING IN PRODUCT ),PRODUCT IMAGE, 
        const updateProduct = await productModel.findOneAndUpdate({ _id: productId, isDeleted: false }, data, { new: true })
        if (!updateProduct) {
            return res.status(200).send({ status: false, message: "product not found Product was all Ready Deleted" })
        }
        //console.log(updateProduct)
        return res.status(200).send({ status: true, message: "updated product", data: updateProduct })
    }catch (error) {
        return res.status(500).send({ status: false, error: error.message })
    }

}

const getNewProductImageLink = async function (req, res) {
    try {
        let files = req.files
        if (files && files.length > 0) {
            let uploadedFileURL = await aws.uploadFile(files[0])

            return uploadedFileURL
        }
        else {
            return res.status(404).send({ status: false, message: "file Not FOUND" })
        }
    }
    catch (err) {
        return res.status(500).send({ status: false, error: err.msg })
    }
}

const deleteProduct = async (req, res) => {
    try {
        const productId = req.params.productId
        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({
                status: true,
                message: "Invalid productId"
            })
        }
        const deletedProductId = await productModel.findById({
            _id: productId
        })
        if (!deletedProductId) {
            return res.status(404).send({
                status: true,
                message: `This ${productId} productId does not exist `
            })
        }
        if (deletedProductId.isDeleted !== false) {
            return res.status(404).send({
                status: true,
                message: `This ${productId} productId is already Deleted `
            })
        }
        await productModel.findByIdAndUpdate({
            _id: productId
        }, {
            $set: {
                isDeleted: true,
                deletedAt: moment().format()
            }
        }, {
            new: true
        })
        return res.status(200).send({
            status: true,
            message: "Deleted Successfully"
        })
    } catch (err) {
        return res.status(500).send({
            status: false,
            Error: err.message
        })
    }
}


module.exports.createProduct = createProduct
module.exports.getSpecificProduct = getSpecificProduct
module.exports.getProductByProductId = getProductByProductId
module.exports.updatedProduct = updatedProduct
module.exports.deleteProduct = deleteProduct

