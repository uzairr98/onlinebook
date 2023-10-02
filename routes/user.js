const express = require("express");
const router = express.Router();
const csrf = require("csurf");
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
const Product = require("../models/product");
const Order = require("../models/order");
const Cart = require("../models/cart");
const middleware = require("../middleware");
const multer = require("multer");
const {
  userSignUpValidationRules,
  userSignInValidationRules,
  validateSignup,
  validateSignin,
} = require("../config/validator");
const csrfProtection = csrf();
router.use(csrfProtection);


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/bookuploads"); // Destination folder
  },
  filename: (req, file, cb) => {
    const fileName = Date.now() + "-" + file.originalname;
    cb(null, fileName); // File name in the destination folder
  },
});

const upload = multer({ storage: storage });

// GET: display the signup form with csrf token
router.get("/signup", middleware.isNotLoggedIn, (req, res) => {
  var errorMsg = req.flash("error")[0];
  res.render("user/signup", {
    csrfToken: req.csrfToken(),
    errorMsg,
    pageName: "Sign Up",
  });
});
// POST: handle the signup logic
router.post(
  "/signup",
  [
    middleware.isNotLoggedIn,
    userSignUpValidationRules(),
    validateSignup,
    passport.authenticate("local.signup", {
     
      failureFlash: true,
    }),
  ],
  async (req, res) => {
    try {
    
      //if there is cart session, save it to the user's cart in db
      if (req.session.cart) {
        
        const cart = await new Cart(req.session.cart);
     
        cart.user = req.user._id;
        await cart.save();
      }
      // redirect to the previous URL
      if (req.session.oldUrl) {
        var oldUrl = req.session.oldUrl;
        req.session.oldUrl = null;
        res.redirect(oldUrl);
      } else {
        res.redirect("/user/addproduct");
      }
    } catch (err) {
      console.log(err);
      req.flash("error", err.message);
      return res.redirect("/");
    }
  }
);

// GET: display the signin form with csrf token
router.get("/signin", middleware.isNotLoggedIn, async (req, res) => {
  var errorMsg = req.flash("error")[0];
  res.render("user/signin", {
    csrfToken: req.csrfToken(),
    errorMsg,
    pageName: "Sign In",
  });
});

// POST: handle the signin logic
router.post(
  "/signin",
  [
    middleware.isNotLoggedIn,
    userSignInValidationRules(),
    validateSignin,
    passport.authenticate("local.signin", {
      failureRedirect: "/user/signin",
      failureFlash: true,
    }),
  ],
  async (req, res) => {
    try {
      // cart logic when the user logs in
      let cart = await Cart.findOne({ user: req.user._id });
      // if there is a cart session and user has no cart, save it to the user's cart in db
      if (req.session.cart && !cart) {
        const cart = await new Cart(req.session.cart);
        cart.user = req.user._id;
        await cart.save();
      }
      // if user has a cart in db, load it to session
      if (cart) {
        req.session.cart = cart;
      }
      // redirect to old URL before signing in
      if (req.session.oldUrl) {
        var oldUrl = req.session.oldUrl;
        req.session.oldUrl = null;
        res.redirect(oldUrl);
      } else {
        res.redirect("/user/addproduct");
      }
    } catch (err) {
      console.log(err);
      req.flash("error", err.message);
      return res.redirect("/");
    }
  }
);

// GET: display user's profile
router.get("/profile", middleware.isLoggedIn, async (req, res) => {
  const successMsg = req.flash("success")[0];
  const errorMsg = req.flash("error")[0];
  try {
    // find all orders of this user
    allOrders = await Order.find({ user: req.user });
    res.render("user/profile", {
      orders: allOrders,
      errorMsg,
      successMsg,
      pageName: "User Profile",
    });
  } catch (err) {
    console.log(err);
    return res.redirect("/");
  }
});

// GET: logout
router.get("/logout", middleware.isLoggedIn, (req, res) => {
  req.logout();
  req.session.cart = null;
  res.redirect("/");
});

router.get("/addproduct", middleware.isLoggedIn, (req, res) => {
  const successMsg = req.flash("success")[0];
  const errorMsg = req.flash("error")[0];
  res.render("user/addproduct", {
      csrfToken: req.csrfToken(),
      errorMsg,
      successMsg,
      pageName: "Add an Ad",
  });
});

// POST: handle the addition of a product
router.post("/addproduct", middleware.isLoggedIn,  upload.single("image"), async (req, res) => {

  try {
    // Retrieve the product data from the request body
    const {
      productCode,
      title,
      description,
      price,
      category,
      manufacturer,
    } = req.body;
    const imageFileName = req.file.filename; 
    // Create a new Product document in the database
    const product = new Product({
      productCode,
      title,
      imagePath: "/bookuploads/" + imageFileName,
      description,
      price,
      category,
      manufacturer,
      available: true,
      // Set other fields as needed
    });

    // Save the product to the database
    await product.save();

    // Redirect to a success page or display a success message
    req.flash("success", "Product added successfully!");
    res.redirect("/user/addproduct");
  } catch (err) {
    console.error(err);
    req.flash("error", "Error adding the product.");
    res.redirect("/user/addproduct"); // Redirect back to the add product form
  }
});

module.exports = router;
