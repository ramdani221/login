var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const saltRounds = 10;

/* GET home page. */
module.exports = function (db) {
  router.get('/', function (req, res, next) {
    res.render('index', { failedInfo: req.flash('failedInfo'), successInfo: req.flash('successInfo') });
  });

  router.post('/', async function (req, res) {
    try {
      const { email, password } = req.body;
      const { rows: user } = await db.query('SELECT * FROM "user" WHERE email = $1', [email]);

      if (user.length == 0) {
        req.flash('failedInfo', `Email dosn't exist`)
        res.redirect('/')
      } else {
        if (!bcrypt.compareSync(password, user[0].password)) {
          req.flash('failedInfo', "Password is wrong")
          res.redirect('/')
        } else {
          req.session.user = { email: user[0].email, userid: user[0].id}
          res.redirect('./users')
        }
      }
    } catch {
      console.log(e)
      res.redirect('/')
    }

  })

  router.get('/register', function (req, res) {
    res.render('register', { failedInfo: req.flash('failedInfo') })
  })

  router.post('/register', async function (req, res) {
    const { email, password, repassword } = req.body;
    if (password !== repassword) {
      req.flash('failedInfo', "Password dosn't match")
      res.redirect('/register')
    } else {
      const hash = bcrypt.hashSync(password, saltRounds);
      try {
        const {rows: users} = await db.query('SELECT * FROM "user" WHERE email = $1', [email])
        if (users.length > 0) {
          req.flash('failedInfo', "Email already exist")
          res.redirect('/register')
        } else {
          await db.query('INSERT INTO "user" (email, password) VALUES ($1, $2)', [email, hash]);
          req.flash('successInfo', 'Succesfully registered, please sign in!')
          res.redirect('/')
        }
      } catch {
        req.flash('failedInfo', "An error occurred while entering data")
        res.redirect('/register')
      }
    }
  })

  router.get('/logout', function (req, res) {
    req.session.destroy(function (err) {
      res.redirect('/')
    })
  })

  return router;
}
