require('dotenv').config()
const debug = require('debug')('kiosk:server')
const http = require('http')
const express = require('express');
const session = require('express-session');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const passport = require('passport');
const fileUpload = require('express-fileupload');
const localStrategy = require('passport-local').Strategy;

const SQLiteStore = require('connect-sqlite3')(session);

if (!process.env.SECRET) throw new Error('provide SECRET env')
if (!process.env.ADMIN_USERNAME) throw new Error('provide ADMIN_USERNAME env')
if (!process.env.ADMIN_PASSWORD) throw new Error('provide ADMIN_PASSWORD env')

const io = require('./io');

const mainRoutes = require('./routes/main');
const adminRoutes = require('./routes/admin');

const app = express();

const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

const server = http.createServer(app);

const ioApp = io(server)
app.use(function (req, res, next) {
  req.io = ioApp
  next()
})

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/videos', express.static(path.join(__dirname, 'videos')));
app.use(session({ 
  secret: process.env.SECRET,
  resave: false, // don't save session if unmodified
  saveUninitialized: false, // don't create session until something stored
  store: new SQLiteStore({ db: 'sessions.db', dir: './db/files' })
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(fileUpload({
  useTempFiles : true,
  tempFileDir : '/tmp/',
  uploadTimeout: 0
}));

passport.use(
  new localStrategy((username, password, done) => {
    if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD)
      return done(null, false, {
        message: 'Wrong password',
      })

    return done(null, { username: process.env.ADMIN_USERNAME })
  })
)

passport.serializeUser((user, done) => done(null, user))
passport.deserializeUser((user, done) => done(null, user))

app.use('/', mainRoutes);
app.use('/admin', adminRoutes);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: err
  });
});


server.listen(port)
server.on('error', onError)
server.on('listening', onListening)

function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
