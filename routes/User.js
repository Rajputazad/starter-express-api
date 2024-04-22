const db = require("../database/models/userLogin");
const auth = require("../middleware/auth");
const multer = require("multer")();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const SECRET_KEY = process.env.SECRET_KEY;
module.exports = function (router) {
  router.post("/registeruser", multer.any(), async (req, res) => {
    try {
      const contact = req.body.contact;
      const email = req.body.email;
      const password = req.body.password;
      const existingUser = await db.findOne({ email });
      const findcontact= await db.findOne({contact})
      const pass = req.body.pass;
     
        if (existingUser) {
          return res
            .status(409)
            .json({ success: false, message: "Email already exists" });
        }else if(findcontact){
            return res
              .status(409)
              .json({ success: false, message: "Contact already exists" });

        } else {
          const hashedPassword = await bcrypt.hash(password, 10);

          const creatusere = await db.create({
            contact: contact,
            password: hashedPassword,
            username: req.body.username,
            email: email,
            verify: true,
          });
          const token = jwt.sign({ userid: creatusere._id }, SECRET_KEY, {
            expiresIn: "744h",
          });
          creatusere.token[0] = token;
          await creatusere.save();
          res.status(200).json({
            token: token,
            success: true,
            message: "User registered successfully",
          });
        }
      
    } catch (error) {}
  });

router.post("/loginuser",multer.any(),async(req,res)=>{
try {
    const userID = req.body.userid
    const password = req.body.password
    const query = { $or: [{ email: userID }, { contact: userID }] };
    const user = await db.findOne(query)
if(!user){
    return res
    .status(401)
    .json({ success: false, message: "Invalid UserID" });
}

const ispassword= await bcrypt.compare(password,user.password)
if(!ispassword){
    return res
    .status(401)
    .json({ success: false, message: "Invalid Password" });
}

  const token  = jwt.sign({userid:user._id},SECRET_KEY,{expiresIn:"744h",})

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



})

router.get("/userhome", auth, async (req, res) => {
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

router.post("/cartoken/:carid",multer.any(),auth, async (req,res)=>{
    try {
        const userid = req.decoded.userid;

        const doc = await db.findOneAndUpdate(
            {_id:userid},
            { $push: { cars: req.params.carid } }, // Add itemId to the array field
            { new: true } // Return the updated document
        );
        res.status(200).json({ success: true, message:"car booked" });
    } catch (error) {
        console.log(error);
        res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
})
router.delete("/cartoken/:carid",multer.any(),auth, async (req,res)=>{
    try {
        const userid = req.decoded.userid;

        const doc = await db.findByIdAndUpdate(
            {_id:userid},
            { $pull: { cars: req.params.carid } },
            { new: true }
        );
        res.status(200).json({ success: true, message:"car booked" });
    } catch (error) {
        console.log(error);
        res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
})


  return router;
};
