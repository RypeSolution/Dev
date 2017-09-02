/**
 * Created by anthony on 02/09/2017.
 */
const http = require('http')
const WebSocketServer = require('websocket').server;

// Serve up public/ftp folder
const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const app = express()

app.set('view engine', 'ejs')
app.use(logger('":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

app.post('/signup', function(req, res) {
    console.log(req.body)
    res.json({hello: 'world'})
});

app.use(express.static(path.join(__dirname, '../')))

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    
    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;

const server = http.createServer(app)
// Listen
server.listen(8081)

class WebSocketHandler{
    
    constructor(connection){
        this.conn = connection
        this.conn.on('message', this.onMessage.bind(this))
        this.conn.on('close', this.onClose.bind(this))
        
        this.constructor.HANDLERS[Math.random()] = this
    }
    
    onMessage(message){
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            this.send({test:'yes'});
        } else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            this.conn.sendBytes(message.binaryData);
        }
    }
    
    send(data){
        this.conn.sendUTF(data, (error) => {
            if(error){
                console.error(error)
            }else{
                console.log('message sent:', data)
            }
        })
    }
    
    onClose(reasonCode, description){
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    }
    
    static handlers(){
        return this.HANDLERS
    }
}

WebSocketHandler.HANDLERS = {}

wsServer = new WebSocketServer({httpServer: server, autoAcceptConnections: false});

function originIsAllowed(origin) {
    // put logic here to detect whether the specified origin is allowed.
    return true;
}

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
        // Make sure we only accept requests from an allowed origin
        request.reject();
        console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
        return;
    }
    console.dir(request.resourceURL)
    
    const connection = request.accept('echo-protocol', request.origin);
    
    connection._resourceURL = request.resourceURL
    console.log((new Date()) + ' Connection accepted.');
    new WebSocketHandler(connection)
});