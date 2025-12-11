const fs = require("fs")

const http = require("http")
const cors = require("cors")
const express = require("express")

const { v4: uuidv4 } = require("uuid")
const { WebSocketServer } = require("ws")

const app = express()
const server = http.createServer(app)
const io = new WebSocketServer({ noServer: true })

const router = {
    media: express.Router(),
    accounts: express.Router(),
    events: express.Router(),
    communities: express.Router(),
    earth: express.Router()
}

const storage = {
    accounts: (function(){
        if (!fs.existsSync("./storage/accounts.json")) {
            fs.writeFileSync("./storage/accounts.json", JSON.stringify(Object.fromEntries([
                [uuidv4().split("-")[4], {
                    username: "zavier09",
                    token: [uuidv4(), Date.now() + (24 * 60 * 60 * 1000)]
                }]
            ])))
        }
        return JSON.parse(fs.readFileSync("./storage/accounts.json"))
    })(),
    media: (function(){
        return Object.fromEntries(["/storage/media"].map((path, index) => fs.readdirSync(__dirname + "/" + path).filter((filename) => filename.includes(".")).map((filename) => ([btoa(filename).slice(0, (2 ** (index + 2))), __dirname + path + "/" + filename]))).flat())
    })(),
    events: (function(){
        if (!fs.existsSync("./storage/events.json")) {
            fs.writeFileSync("./storage/events.json", JSON.stringify(Object.fromEntries([])))
        }
        return JSON.parse(fs.readFileSync("./storage/events.json"))
    })(),
    communities: (function(){
        if (!fs.existsSync("./storage/communities.json")) {
            fs.writeFileSync("./storage/communities.json", JSON.stringify(Object.fromEntries([])))
        }
        return JSON.parse(fs.readFileSync("./storage/communities.json"))
    })(),
    earth: (function(){
        if (!fs.existsSync("./storage/earth.json")) {
            fs.writeFileSync("./storage/earth.json", JSON.stringify(Object.fromEntries([])))
        }
        return JSON.parse(fs.readFileSync("./storage/earth.json"))
    })(),
    temporary: {

    }
}

app.use(cors())
app.use(express.json())

app.use((request, response, next) => {
    if (request.headers["sec-fetch-mode"] === "navigate") {
        if (request.headers["sec-fetch-dest"] === "document") {
            if (!["/"].includes(request.url)) {
                
            } else {
                next()
            }
        }
    } else if (request.headers["sec-fetch-mode"] === "cors") {
        if (!["/accounts/authorize", "/accounts/create"].includes(request.url)) {
            if (request.headers["authorization"]) {
                if (Object.entries(storage.accounts).filter((account) => account[1].token[0] === authorization.token).length > 0) {
                    next()
                } else {
                    response.json({ error: [100, "Invalid token."] })
                }
            } else {
                response.json({ error: [104, "No token provided."] })
            }
            console.log(request.url)
        } else next()
    }
})

app.get("/", (request, response) => {
    response.sendFile(storage.media["aW5k"])
})

app.use("/media", router.media)
app.use("/accounts", router.accounts)
app.use("/events", router.events)
app.use("/communities", router.communities)
app.use("/earth", router.earth)

router.media.get("/:id", (request, response) => {
    if (storage.media[request.params.id]) {
        console.log(Math.sqrt(request.params.id.length))
        response.sendFile(storage.media[request.params.id])
    }
})

router.accounts.post("/authorize", (request, response) => {
    if (request.headers["authorization"]) {
        authorization = JSON.parse(atob(request.headers["authorization"]))
        if (authorization.token) {
            if (Object.entries(storage.accounts).filter((account) => account[1].token[0] === authorization.token).length > 0) {
                response.json(Object.entries(storage.accounts).filter((account) => account[1].token[0] === authorization.token)[0][1])
            } else {
                response.json({ error: [100, "Invalid token."] })
            }
        } else if (authorization.username && authorization.twofactor) {
            if (Object.entries(storage.accounts).filter((account) => account[1].username === authorization.username).length > 0) {
                account = Object.entries(storage.accounts).filter((account) => account[1].username === authorization.username)[0]
                // Verify two-factor
                storage.accounts[account[0]].token = [uuidv4(), Date.now() + (24 * 60 * 60 * 1000)]
                fs.writeFileSync("./storage/accounts.json", JSON.stringify(storage.accounts))
                response.json(storage.accounts[account[0]])
            } else {
                response.json({ error: [101, "Invalid username."] })
            }
        }
    }
})
router.accounts.use("/create", (request, response) => {
    if (request.method === "POST") {
        if (request.headers["authorization"]) {
            authorization = JSON.parse(atob(request.headers["authorization"]))
            if (authorization.username) {
                if (authorization.twofactor) {

                } else {
                    if (Object.entries(storage.accounts).filter((account) => account[1].username === authorization.username).length === 0) {

                    } else {
                        response.json({ error: [103, "Username already exists."] })
                    }
                }
            }
        }
    } else if (request.method === "GET" && request.query.username) {
        
    }
})

router.events.get("/search", (request, response) => {
    account = Object.entries(storage.accounts).filter((account) => account[1].token[0] === authorization.token)[0]
    events = Object.entries(storage.events).filter((event) => (event[1].public || event[1].participnts.includes(account[1])))
    console.log(events)
    if (request.query.query) {
        response.json(Object.fromEntries(Object.entries(events).filter((event) => [event[1].name, event[1].tags, event[1].description].flat().join("").replace(/\W/g, "").toLowerCase().includes(request.query.query.replace(/\W/g, "").toLowerCase())))) // .replace(/\W/g, "") https://stackoverflow.com/questions/9364400/remove-not-alphanumeric-characters-from-string
    } else if (request.query.latitude && request.query.longitude) { // referenced from https://medium.com/@silva.ala82/working-with-latitude-and-longitude-distances-in-the-backend-node-sql-without-relying-on-5d6556d8ec09
        current = [request.query.longitude, request.query.latitude]
        response.json(Object.fromEntries(Object.entries(events).map((event) => (function(){
            destination = [event[1].location.longitude, event[1].location.latitude]
            radian = [[(Math.PI * current[1])/180, (Math.PI * destination[1])/180], (Math.PI * (current[0] - destination[0]))/180]
            distance = (((Math.acos(Math.sin(radian[0][0]) * Math.sin(radian[0][1]) + Math.cos(radian[0][0]) * Math.cos(radian[0][0]) * Math.cos(radian[1])) * 180)/Math.PI) * 60 * 1.1515) * 1.609344
            return [event[0], [event[1], distance]]
        }()))))
    }
})
router.events.post("/create", (request, response) => {
    id = uuidv4().split("-")[0]
    authorization = JSON.parse(atob(request.headers["authorization"]))
    account = Object.entries(storage.accounts).filter((account) => account[1].token[0] === authorization.token)[0]
    console.log(request.body)
    storage.events[id] = {
        name: request.body.name,
        description: request.body.description,
        scheduled: {
            start: request.body.scheduled.start,
            end: request.body.scheduled.end
        },
        location: {
            latitude: request.body.latitude,
            longitude: request.body.longitude
        },
        public: request.body.public,
        owner: account[0],
        participants: [account[0]]
    }
    fs.writeFileSync("./storage/events.json", JSON.stringify(storage.events))
    response.json([id, storage.events[id]])
})
router.events.get("/:id", (request, response) => {
    if (storage.events[request.params.id]) {
        response.json(storage.events[request.params.id])
    } else {
        response.json({ error: [200, "Invalid event ID."] })
    }
})
router.events.put("/:id", (request, response) => {
    if (storage.events[request.params.id]) {
        authorization = JSON.parse(atob(request.headers["authorization"]))
        account = Object.entries(storage.accounts).filter((account) => account[1].token[0] === authorization.token)[0]
        if (account[0] === storage.events[request.params.id].owner) {
            Object.entries(request.body).forEach((entry) => {
                if (storage.events[request.params.id][entry[0]]) {
                    storage.events[request.params.id][entry[0]] = entry[1]
                }
            })
            fs.writeFileSync("./storage/events.json", JSON.stringify(storage.events))
            response.json(storage.events[request.params.id])
        }
    }
})
router.events.delete("/:id", (request, response) => {
    if (storage.events[request.params.id]) {
        authorization = JSON.parse(atob(request.headers["authorization"]))
        account = Object.entries(storage.accounts).filter((account) => account[1].token[0] === authorization.token)[0]
        if (account[0] === storage.events[request.params.id].owner) {
            delete storage.events[request.params.id]
            response.json({})
        }
    }
})
router.events.post("/:id/join", (request, response) => {
    if (storage.events[request.params.id]) {
        authorization = JSON.parse(atob(request.headers["authorization"]))
        account = Object.entries(storage.accounts).filter((account) => account[1].token[0] === authorization.token)[0]
        if (!storage.events[request.params.id].participants.includes(account[0])) {
            storage.events[request.params.id].participants.push(account[0])
            response.json({})
        }
    }
})

router.communities.get("/search", (request, response) => {

})
router.communities.post("/create", (request, response) => {

})
router.communities.get("/:communityId", (request, response) => {

})
router.communities.get("/:communityId/post/:postId", (request, response) => {
    
})

router.earth.get("/", (request, response) => {

})

io.on("connection", (socket, request) => {

})

server.on("upgrade", (request, socket, head) => {
    io.handleUpgrade(request, socket, head, (socket, request) => {
        io.emit("connection", socket, request)
    })
})

server.listen(5000, () => {
    console.log(storage)
})