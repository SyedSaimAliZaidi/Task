const express = require("express"); 
const cors = require("cors");
const morgan = require("morgan")

const nodemailer = require('nodemailer');
const app = express();
const http = require('http').Server(app);
require('dotenv').config();

const PORT = 2000 

app.use(cors());
app.use(morgan('dev'))

app.use(express.json())
app.use(express.urlencoded({extended: true})) // Allow all primitive types of JSON. If extended:false, only string and arrays will be allowed.

app.get("/",(req,res)=>{
  res.send("API health test.")
})

const Sequelize = require("sequelize");

async function checkConnection(){
  
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }

}

const sequelize = new Sequelize("redink_blog", "root", "", {
  host: "localhost",
  dialect: "mysql",
  operatorsAliases: false,
  pool: { 
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// checking connection is extablished or not
checkConnection()
sequelize.sync();

const Author = sequelize.define("author",{
    name: {
      type: Sequelize.STRING
    },   
    email: {
      type: Sequelize.STRING
    },
  }
)

const Post = sequelize.define("post",{
    title: {
      type: Sequelize.STRING
    },   
    description: {
      type: Sequelize.STRING
    },
  }
)

Author.hasMany(Post, {as:"posts"});
Post.belongsTo(Author)

// routes
// Authors
app.post("/author/create", (req,res)=>{
  Author.create(req.body)
  .then((author)=>{
    res.send("Author Created.")
  })
  .catch(err=>{
    res.send(err)
  })
})
app.get("/author/getAll", (req,res)=>{
  Author.findAll({})
  .then((author)=>{
    res.send(author)
  })
  .catch(err=>{
    res.send(err)
  })
})

function mail(data){
  console.log("email",data.email)
  
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'etester1010@gmail.com',
      pass: 'test@1234!'
    }
  });

  var mailOptions = {
    from: "etester1010@gmail.com",
    to: data.email,
    subject: "New Blog Post",
    text: 'New Blog Posted By '+ data.name
  };
  
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

// Posts
// create post
app.post("/post/create", (req,res)=>{
  Post.create(req.body)
  .then((post)=>{
    Author.findAll({})
    .then((author)=>{
      let result = author.filter(val=>val.id != req.body.authorId)
      result.forEach(element => {
        mail(element)
      });  
      res.send("Post Created.")
    })
    .catch(err=>{
      res.send(err)
    })
  })
  .catch(err=>{
    res.send(err)
  })
})
// get all posts
app.get("/post/getAll", (req,res)=>{
  Post.findAll({})
  .then((post)=>{
    res.send(post)
  })
  .catch(err=>{
    res.send(err)
  })
})
// Get all posts by author id.
app.get("/post/getAllByAuthorId/:id", (req,res)=>{
  Post.findAll({authorId:req.params.id})
  .then((post)=>{
    res.send(post)
  })
  .catch(err=>{
    res.send(err)
  })
})
// Update each post using post id.
app.put("/post/updatePostById/:id", (req,res)=>{
  Post.update(
    req.body ,
    { where: { id: req.params.id } }
  )
  .then((post)=>{
    if(post===1){
      res.send("Updated Successfully")
    }
    else{
      res.send("Something went wrong")
    }

  })
  .catch(err=>{
    res.send(err)
  })
})
// Delete post by id.
app.delete("/post/deletePostById/:id", (req,res)=>{
  Post.destroy(
    { where: { id: req.params.id } }
  )
  .then((post)=>{
    if(post===1){
      res.send("Deleted Successfully")
    }
    else{
      res.send("Something went wrong")
    }
  })
  .catch(err=>{
    res.send(err)
  })
})



try {
  http.listen( PORT, () => {
    console.log( "Server has successfully started on port", PORT );
  });
} catch(err){
   console.log(err);
}
