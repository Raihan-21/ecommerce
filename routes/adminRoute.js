const AdminBro = require('admin-bro')
const AdminBroExpress = require('@admin-bro/express')
const AdminBroMongoose = require('@admin-bro/mongoose')
const mongoose = require('mongoose')

AdminBro.registerAdapter(AdminBroMongoose)
const adminBro = new AdminBro({
  databases: [mongoose],
  rootPath: '/admin',
})
const ADMIN = {
  email: "test@gmail.com",
  password: "innorainecake"
}
const adminRouter = AdminBroExpress.buildAuthenticatedRouter(adminBro, {
  cookieName: process.env.ADMIN_COOKIE_NAME || 'admin-bro',
  cookiePassword: process.env.ADMIN_COOKIE_PASS || 'superlong-password-for-admin',
  authenticate: async (email, password) => {
    if(email == ADMIN.email && password == ADMIN.password){
      return ADMIN;
    }
    else{
      return null;
    }
  }
})
module.exports = adminRouter