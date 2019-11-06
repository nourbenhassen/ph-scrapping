const puppeteer = require("puppeteer");
const Product = require("./models/product");
const mongoose = require("mongoose");

const PAGE_LINK = "https://www.producthunt.com/";
const LIST_PRODUCTLINK_SELECTOR = index =>
  `#app > div > div.constraintWidth_c5ad2.content_d43b3 > main > div > div > div.container_88f8e.large_bbe28 > div.content_2d8bd.white_09016.hideOverflow_77a4e > div > ul > li:nth-child(${index}) div.item_54fdd`;

const PRODUCT_LIST_TODAY = `#app > div > div.constraintWidth_c5ad2.content_d43b3 > main > div > div > div.container_88f8e.large_bbe28 > div.content_2d8bd.white_09016.hideOverflow_77a4e > div > ul > li`;

async function run() {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto(PAGE_LINK);
    const productNumber = await page.evaluate(sel => {
      return document.querySelectorAll(sel).length;
    }, PRODUCT_LIST_TODAY);

    for (let i = 1; i <= productNumber; i++) {
      let productSelector = LIST_PRODUCTLINK_SELECTOR(i); //.replace("INDEX", i);

      let result = await page.evaluate(sel => {
        const doc = document.querySelector(sel);
        if (doc === null) {
          return null;
        }
        return {
          name: doc.querySelector("a h3").innerText,
          description: doc.querySelector("a p").innerText,
          upvote: doc.querySelector("div button span span").innerText
        };
      }, productSelector);

      if (!result) {
        continue;
      }
      const { name, description, upvote } = result;
      console.log(
        "Name :",
        name,
        "Description :",
        description,
        "Upvote :",
        upvote
      );

      await insertProduct({
        name,
        description,
        upvote,
        date: new Date()
      });
    }
    await Promise.all([browser.close(), mongoose.disconnect()]);
  } catch (e) {
    console.error(e);
  }
}

run();

const insertProduct = productObj =>
  new Promise((resolve, reject) => {
    const { name, description, upvote, date } = productObj;
    const DB_URL = "mongodb://api:api@localhost:27017/mydb";

    if (mongoose.connection.readyState === 0) {
      mongoose
        .connect(DB_URL, {
          useNewUrlParser: true,
          useUnifiedTopology: true
        })
        .then(() => console.log("DB Connected!"))
        .catch(err => {
          console.log(err);
        });
    }

    // if this name exists, update the entry, don't insert
    let conditions = { name };
    let options = { upsert: true, new: true, setDefaultsOnInsert: true };

    Product.findOneAndUpdate(conditions, productObj, options, (err, result) => {
      if (err) return reject(err);
      return resolve(result);
    });
  });
