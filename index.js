const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const store = require('./store')

const uuid = require('uuid/v4')
const cookieParser = require('cookie-parser');
const session = require('express-session')

app.use(express.static('public'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser());
// app.use(session({secret: "Your secret key"}));
app.use(session({
    secret: "Your secret key",
    resave: true,
    saveUninitialized: true
}));

var path = require('path');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.get('/token', function(req, res){
 res.render('token');
});
app.post('/createToken', (req, res) => {
  store
  .createToken({
    password: req.body.token_name,
    prize_id: req.body.prize_id,
    event_id: req.body.event_id
  })
  .then(() => res.sendStatus(200))
})

app.get('/', function(req, res){
 res.render('login', { error_message: req.query.error_message})
});
app.get('/user/registration', function(req, res){
 res.render('registration');
});
app.get('/user/logout', function(req, res){
 req.session.destroy(function(){
    console.log("user logged out.")
 });
 res.redirect('/');
});
app.post('/createUser', (req, res) => {
  store
  .createUser({
    username: req.body.username,
    password: req.body.password
  })
  .then(() => res.sendStatus(200))
})

app.post('/login', (req, res) => {
  store
  .authenticate({
    username: req.body.username,
    password: req.body.password
  })
  .then(({ success, is_admin }) => {
    if (is_admin) {
      console.log(is_admin)
      req.session.username = req.body.username;
      // res.render('admin')
      if (success) res.redirect('/admin')
      // else res.sendStatus(401)
      else res.redirect('/?error_message=Username or password is incorrect')
    } else {
      console.log(is_admin)
      req.session.username = req.body.username;
      // if (success) res.sendStatus(200)
      if (success) res.redirect('/dashboard')
      // else res.sendStatus(401)
      else res.redirect('/?error_message=Username or password is incorrect')

    }
  })
})

app.get('/dashboard/', checkSignIn, function(req, res){
  store
  .getAllEvent({
    owner_name: req.session.username
  })
  .then(({ events }) => {
    // if (success) res.sendStatus(200)
    if (events) res.render('dashboard', { events: events, username: req.session.username})
    else res.sendStatus(401)
  })
  // res.render('dashboard', {username: req.session.username});
});
app.get('/event_detail/:event_id', checkSignIn, function(req, res){
  store
  .getEventDetail({
    event_id: req.params.event_id
  })
  .then(({ event_detail, scratchcard_array }) => {
    // console.log(scratchcard_array)
    // console.log(event_detail)
    // if (success) res.sendStatus(200)
    if (event_detail) res.render('dashboard_event_detail', { event_detail: event_detail, username: req.session.username, scratchcard_array})
    else res.sendStatus(401)
  })
  // res.render('dashboard', {username: req.session.username});
});
app.get('/event_prize/:event_id', checkSignIn, function(req, res){
  store
  .getEventAllPrize({
    event_id: req.params.event_id
  })
  .then(({ prize_id_array }) => {
    // console.log(event_detail)
    // if (success) res.sendStatus(200)
    // console.log(prize_id_array)
    res.render('dashboard_event_prize', { username: req.session.username, prize_id_array });
    // if (event_detail) res.render('dashboard_event_detail', { username: req.session.username })
    // else res.sendStatus(401)
  })
  // res.render('dashboard', {username: req.session.username});
});


// app.get('/', (req, res) => {
//   // res.send('HEY!')
//   // res.render('rules');
//   res.render('home', { prize_token: req.query.prize_token });
// })

app.get('/home', (req, res) => {
  // res.render('home', { prize_token: req.query.prize_token });
  res.render('finished');
})


app.get('/scratch-card', (req, res) => {
  // res.send('HEY!')
  // res.render('home');
  store
  .checkMyPrize({
    prize_token: req.query.prize_token
  })
  .then(({ success, prize }) => {
    var error_message = 'Please scan the QR code again'
    // console.log(prize)
    // if (success) res.sendStatus(200)
    if (success) res.render('scratch_card', { prize_id: prize.prize_id, prize_token: prize.prize_token, qr_color: prize.qr_color })
    // if (machines) res.render('user_machines', { machines: machines, username: req.session.username})
    else res.render('home', { error_message: error_message })
  })
  // res.render('show_my_machines');
})

app.post('/get-prize', (req, res) => {

  store
  .checkMyPrizeAndUpdateScratchedAt({
    prize_token: req.body.token
  })
  .then(({ success, prize }) => {
    console.log(prize)
    // console.log(prize.id)
    var prize_id = prize.prize_id
    // if (success) res.sendStatus(200)
    // if (prize.id =) res.render('get_prize_big', { token: req.body.token })
    
    // switch (prize_id) {
    //   case 4:
    //   case 5:
    //   case 6:
    //   case 7:
    //   case 8:
    //     res.render('get_prize_big', { token: req.body.token });
    //     break;
    //   case 2:
    //   case 3:
    //   case 9:
    //     res.render('get_prize_small', { redeem_qr: prize.redeem_qr });
    //     break;
    // }
        res.render('get_prize_small', { token: req.body.token, prize });
    // if (machines) res.render('user_machines', { machines: machines, username: req.session.username})
      // else res.sendStatus(401)
    })

  // res.send('HEY!')
  // res.render('get_prize_big');
})
app.post('/send-winner-data', (req, res) => {

  store
  .storeWinnerDataAndReturnWinnerInfo({
    name_chi: req.body.name,
    hk_id: req.body.hk_id,
    phone_no: req.body.phone_no,
    email: req.body.email,
    token: req.body.token
  })
  .then(({ winner_infos }) => {
    console.log(winner_infos)
    // if (success) res.sendStatus(200)
    if (winner_infos.length > 0) {
      var original_id = winner_infos[0]['id']
      var formattedNumber = ("0000" + original_id).slice(-5);

      // var myNumber = '117';
  // var formattedNumber = ("0000" + myNumber).slice(-5);
      console.log(formattedNumber);
      winner_infos[0]['id'] = formattedNumber

      res.render('winner_info', { winner_info: winner_infos[0] })
    }
    // if (machines) res.render('user_machines', { machines: machines, username: req.session.username})
      else res.sendStatus(401)
    })

  // // res.send('HEY!')
  // res.render('get_prize_big');
})

app.get('/rules', (req, res) => {
  // res.send('HEY!')
  res.render('rules');
})

app.get('/check-winner', (req, res) => {
  store
  .checkWinner({
  })
  .then(({ prizes_array, winners_array }) => {

    var winner_2_count = 0;
    var winner_3_count = 0;
    var winner_9_count = 0;

    // console.log(prizes_array)
    for (var i in prizes_array) {
      console.log(prizes_array[i]);
      // if (prizes_array[i]['prize_id'])
      switch (prizes_array[i]['prize_id']) {
        case 2:
          winner_2_count++;
          break;
        case 3:
          winner_3_count++;
          break;
        case 9:
          winner_9_count++;
          break;
      }
    }
    
    if (prizes_array) res.render('check_winner', { winner_2_count: winner_2_count, winner_3_count: winner_3_count, winner_9_count: winner_9_count, winners_array: winners_array })
  })
  // res.render('check_winner');
})

app.listen(3000, () => console.log('Server running on port 3000'))



function checkSignIn(req, res, next){
   if(req.session.username){
      next();     //If session exists, proceed to page
   } else {
      var err = new Error("Not logged in!");
      // next(err);  //Error, trying to access unauthorized page!
      res.redirect('/')
   }
}
