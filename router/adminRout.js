const express = require("express")
const multer = require('../config/multer')
const adminController = require('../controllers/adminController')
const productController=require('../controllers/productController')
const categoryController=require('../controllers/categoryController')
const orderController=require('../controllers/orderController')
const auth = require('../middleware/authAdmin')
// const userBlock=require('../middleware/userBlock')

const upload = multer.createMulter()

const admin_rout = express()

admin_rout.set('view engine', 'ejs')
admin_rout.set('views', './views/admin')


admin_rout.get('/', auth.adminLogin, adminController.loginLoad)

admin_rout.post('/',auth.adminLogin,adminController.adminLogin)

admin_rout.get('/home', auth.logOutSession, adminController.loadAdminHome)

admin_rout.get('/logout', auth.logOutSession, adminController.adminLogOut)

admin_rout.get('/userData', auth.logOutSession, adminController.loadUserData)

admin_rout.get('/blockUser',auth.logOutSession,adminController.blockUser)

admin_rout.get('/unblockUser', auth.logOutSession, adminController.unblockUser)



admin_rout.get('/addProduct', auth.logOutSession, productController.newProduct)

admin_rout.post('/addProduct',auth.logOutSession,upload.array('image',4),productController.addProduct)

admin_rout.get('/products',auth.logOutSession,productController.loadProducts)

admin_rout.get('/deleteProduct',auth.logOutSession,productController.deleteProduct)

admin_rout.get('/editProduct',auth.logOutSession,productController.loadEditPage)

admin_rout.post('/editProduct',upload.array('image',4),productController.editProduct)

// admin_rout.get('/deleteImage', auth.logOutSession, productController.deleteImage);

admin_rout.get('/cancelOrder',auth.logOutSession,orderController.cancelOrder)

admin_rout.get('/orderStatus',auth.logOutSession,orderController.orderStatus)

admin_rout.get('/order', auth.logOutSession, orderController.loadOrder)


// admin_rout.get('/admin/home', auth.logOutSession, orderController.loadAdminHome)


admin_rout.get('/category',auth.logOutSession,categoryController.categoryManage)

admin_rout.get('/addCategory',auth.logOutSession,categoryController.loadAddCategory)

admin_rout.post('/addCategory',auth.logOutSession,categoryController.addCategory)

admin_rout.get('/editCategory',auth.logOutSession,categoryController.loadEditCategory)

admin_rout.post('/editCategory',auth.logOutSession,categoryController.editCategory)

admin_rout.get('/deleteCategory',auth.logOutSession,categoryController.categoryDelete)

admin_rout.post('/proImage',auth.logOutSession,productController.singleRemove)

admin_rout.get('/salesReport',auth.logOutSession,adminController.loadSalesPage)





admin_rout.get("*",auth.logOutSession,adminController.loadAdminHome)

module.exports = admin_rout

