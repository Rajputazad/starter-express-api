const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const SECRET_KEY = process.env.SECRET_KEY;
const db = require("../database/models/login");
const dbcar = require("../database/models/CarDetails");
const upload = require("../middleware/Cars");
const imagekit = require("../middleware/imagekit");
const fs = require("fs");
const multer = require("multer");
const multe = require("multer")();
const auth = require("../middleware/auth");
const axios = require("axios");
module.exports = function (router) {
  router.post("/register", multe.any(), async (req, res) => {
    try {
      const mobile = req.body.mobile;
      const password = req.body.password;
      const existingUser = await db.findOne({ mobile });
      const pass = req.body.pass;
      if (pass != 999849) {
        res.status(500).json({ success: false, message: "User not valid" });
      } else {
        if (existingUser) {
          return res
            .status(409)
            .json({ success: false, message: "Email already exists" });
        } else {
          const hashedPassword = await bcrypt.hash(password, 10);

          const creatusere = await db.create({
            mobile: mobile,
            password: hashedPassword,
            name: req.body.name,
            role_id: 1,
            verify: true,
          });
          const token = jwt.sign({ userid: creatusere._id }, SECRET_KEY, {
            expiresIn: "744h",
          });
          creatusere.token[0] = token;
          await creatusere.save();
          res
            .status(200)
            .json({
              token: token,
              success: true,
              message: "User registered successfully",
            });
        }
      }
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });
  router.post("/login", multe.any(), async (req, res) => {
    try {
      const mobile = req.body.mobile;
      const password = req.body.password;

      const user = await db.findOne({ mobile });
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { userid: user._id, role_id: user.role_id },
        SECRET_KEY,
        {
          expiresIn: "2h",
        }
      );

      user.token[0] = token;
      await user.save();
      res
        .status(200)
        .json({
          token: token,
          success: true,
          message: "User Login successfully",
        });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });

  router.get("/home", auth, async (req, res) => {
    try {
      const userid = req.decoded.userid;

      const userdatas = await db.findById(userid).select("-password -token");
      // console.log(userdatas);
      if (userdatas == null || userdatas == undefined || !userdatas) {
        res.status(401).json({
          success: false,
          message: "User not found",
        });
      } else {
        res.status(200).json({ success: true, data: userdatas });
      }
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });

  // const dataPerPage = 2;
  // let currentPage = 1;
  router.get("/cars/:page", async (req, res) => {
    try {
      const dataPerPage = 10;
      const skip = (req.params.page - 1) * 10;
      const cardatas = await dbcar
        .find({})
        .sort({ _id: -1 })
        .skip(skip)
        .limit(dataPerPage)
        .lean()
        .exec();
      // const reversedata = cardatas.reverse();
      //  currentPage++;
      res.status(200).json({ success: true, data: cardatas });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });

  router.get("/car/:_id", async (req, res) => {
    try {
      const cardatas = await dbcar.findById(req.params._id);
      res.status(200).json({ success: true, data: cardatas });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });

  router.delete("/cardelete/:_id", auth, async (req, res) => {
    try {
      const dataToDelete = await dbcar.findByIdAndDelete(req.params._id);
      const imagesToDelete = dataToDelete.imagedetails || [];
      for (const image of imagesToDelete) {
        await deleteImage(image.fileId); // Replace with appropriate function
      }
      res.status(200).json({ success: true, message: "successfully Deleted!" });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });
  // router.delete('/cardelete/:fileId', async (req, res) => {
  //   const fileId = req.params.fileId;

  //   const imagekitEndpoint = `https://api.imagekit.io/v1/files/${fileId}`;

  //   const headers = {
  //     Authorization: `Basic ${Buffer.from(imagekitPrivateKey + ':').toString('base64')}`,
  //   };

  //   try {
  //     const response = await axios.delete(imagekitEndpoint, { headers });

  //     if (response.status === 204) {
  //       res.json({ success: true, message: 'Image deleted successfully' });
  //     } else {
  //       res.status(response.status).json({ success: false, message: 'Image deletion failed' });
  //     }
  //   } catch (error) {
  //     console.error('Error deleting image:', error.message);
  // if (error.response) {
  //   console.error('Response data:', error.response.data);
  //   console.error('Response status:', error.response.status);
  // }
  //     res.status(500).json({ success: false, message: 'Internal server error' });
  //   }
  // });
  async function deleteImage(fileId) {
    const imagekitPrivateKey = "private_bhtCtdBNAzTzrJqTanvnGUh0+Aw=";

    const imagekitEndpoint = `https://api.imagekit.io/v1/files/${fileId}`;
    const headers = {
      Authorization: `Basic ${Buffer.from(imagekitPrivateKey + ":").toString(
        "base64"
      )}`,
    };

    try {
      const response = await axios.delete(imagekitEndpoint, { headers });

      if (response.status === 204) {
        console.log("Image deleted successfully");
      } else {
        console.log("Failed to delete image");
      }
    } catch (error) {
      console.error("Error deleting image:", error.message);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
    try {
      const response = await axios.delete(imageUrl, {
        auth: {
          username: imageKitPublicKey,
          password: imageKitPrivateKey,
        },
      });

      if (response.status === 204) {
        console.log("Image deleted successfully");
      } else {
        console.log("Failed to delete image");
      }
    } catch (error) {
      console.error("Error deleting image:", error.message);
    }
  }

  async function deleteImage(filename) {
    try {
      const response = await imagekit.deleteFile(filename);
      console.log("Image deleted successfully:", response);
    } catch (error) {
      console.error("Error deleting image:", error);
    }
  }

  router.put("/carupdate/:_id",multe.any(), auth, async (req, res) => {
    try {
      // console.log(req.body)
    await dbcar.findByIdAndUpdate(req.params._id, {
        $set: req.body,
      });
      // console.log(data);
      res.status(200).json({ success: true, message: "successfully updated!" });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });

  router.post("/upload", auth, async (req, res) => {
    try {
      upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({
            message: "There was an error uploading the files",
          });
        } else if (err) {
          return res.status(400).json({
            message: err.message,
          });
        }
        const files = req.files;
        console.log(files.length);
        if (!files || files.length === 0) {
          return res
            .status(400)
            .json({
              success: false,
              message: "At least one image is required",
            });
        } else {
          Promise.all(
            files.map((file) => {
              return new Promise((resolve, reject) => {
                const fileStream = fs.createReadStream(file.path);

                imagekit.upload(
                  {
                    file: fileStream,
                    fileName: file.originalname,
                    folder: "/Uday_Motors",
                  },
                  function (error, result) {
                    if (error) {
                      reject(error);
                    } else {
                      resolve(result);
                    }
                  }
                );
              });
            })
          )
            .then(async function (results) {
              const data = await dbcar(req.body);
              data.imagedetails = results;
              await data.save();
              // console.log(results);
              return res
                .status(200)
                .json({
                  success: true,
                  message: "Data uploaded successfully",
                  results: results,
                });
            })
            .catch((error) => {
              console.log(error);
              return res.status(400).json({
                message: "There was an error uploading the files",
              });
            });
        }
      });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });

  router.get("/search/:search", async (req, res) => {
    try {
      let search = req.params.search;
      let users = await dbcar.find({
        $or: [
          { carname: { $regex: search, $options: "i" } },
          { numberplate: { $regex: search, $options: "i" } },
          { price: { $regex: search, $options: "i" } },
        ],
      });
      const reversedata = users.reverse();
      res.json({ success: true, data: reversedata });
    } catch (error) {
      res.json({ success: false, message: "something went wrong" });
      console.log(error);
    }
  });

  return router;
};
