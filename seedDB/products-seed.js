const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const Product = require("../models/product");
const Category = require("../models/category");
const mongoose = require("mongoose");
const faker = require("faker");
const connectDB = require("./../config/db");
connectDB();

async function seedDB() {
  faker.seed(0);

  //----------------------Backpacks
  const fiction_books = [
    "As A Man Thinketh - (PB) Liberty Publication",
  
  ];
  const fiction_books_imgs = [
    "/bookuploads/As-A-man-Thinketh-(PB)-Liberty-Publication-120x187.jpg",
  
  ];
  //----------------------Backpacks
  const poetry_books = [
    "Of Kings And Nobilities",
    "TRANSGRESSIONS: Poems Inspired By Faiz Ahmed Faiz",
  
  ];
  const poetry_books_imgs = [
    "/bookuploads/9789698729455-120x187.jpg",
    "/bookuploads/TRANSGRESSIONS_-Poems-Inspired-by-Faiz-Ahmed-Faiz-120x187.jpg",
  
  ];
  

  async function seedProducts(titlesArr, imgsArr, categStr) {
    try {
      const categ = await Category.findOne({ title: categStr });
      for (let i = 0; i < titlesArr.length; i++) {
        let prod = new Product({
          productCode: faker.helpers.replaceSymbolWithNumber("####-##########"),
          title: titlesArr[i],
          imagePath: imgsArr[i],
          description: faker.lorem.paragraph(),
          price: faker.random.number({ min: 10, max: 50 }),
          manufacturer: faker.company.companyName(0),
          available: true,
          category: categ._id,
        });
        await prod.save();
      }
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  async function closeDB() {
    console.log("CLOSING CONNECTION");
    await mongoose.disconnect();
  }

  await seedProducts(fiction_books, fiction_books_imgs, "Fiction");
  await seedProducts(poetry_books, poetry_books_imgs, "Poetry");
 

  await closeDB();
}

seedDB();
