const fs = require("fs")

const http = require("http")
const cors = require("cors")
const express = require("express")

const { v4: uuidv4 } = require("uuid")
const { setHeapSnapshotNearHeapLimit } = require("v8")

const app = express()
const server = http.createServer(app)

const router = {
    media: express.Router(),
    accounts: express.Router(),
    events: express.Router(),
    community: express.Router(),
    inbox: express.Router(),
    missions: express.Router()
}

const storage = {
    accounts: (function(){
        if (!fs.existsSync("./storage/accounts.json")) {
            fs.writeFileSync("./storage/accounts.json", JSON.stringify(Object.fromEntries([
                [uuidv4().split("-")[4], {
                    username: "zavier09",
                    token: [uuidv4(), Date.now() + (24 * 60 * 60 * 1000)],
                    missions: {},
                    inbox: {},
                    statistics: { hearts: 0 }
                }],
                [uuidv4().split("-")[4], {
                    username: "jeyrome92",
                    token: [uuidv4(), Date.now() + (24 * 60 * 60 * 1000)],
                    missions: {},
                    inbox: {},
                    statistics: { hearts: 0 }
                }]
            ])))
        }
        return JSON.parse(fs.readFileSync("./storage/accounts.json"))
    })(),
    media: (function(){
        return Object.fromEntries(["/storage/media", "/storage/media/earth"].map((path, index) => fs.readdirSync(__dirname + "/" + path).filter((filename) => filename.includes(".")).map((filename) => ([btoa(filename).slice(0, (2 ** (index + 2))), __dirname + path + "/" + filename]))).flat())
    })(),
    events: (function(){
        if (!fs.existsSync("./storage/events.json")) {
            fs.writeFileSync("./storage/events.json", JSON.stringify(Object.fromEntries([])))
        }
        return JSON.parse(fs.readFileSync("./storage/events.json"))
    })(),
    community: (function(){
        if (!fs.existsSync("./storage/community.json")) {
            fs.writeFileSync("./storage/community.json", JSON.stringify([]))
        }
        return JSON.parse(fs.readFileSync("./storage/community.json"))
    })(),
    admin: (function(){
        if (!fs.existsSync("./storage/admin.json")) {
            fs.writeFileSync("./storage/admin.json", JSON.stringify({
                queue: []
            }))
        }
        return JSON.parse(fs.readFileSync("./storage/admin.json"))
    })()
}

app.use(cors())
app.use(express.json())

app.use((request, response, next) => {
    if (request.headers["sec-fetch-mode"] === "navigate") {
        if (request.headers["sec-fetch-dest"] === "document") {
            if (!["/", "/media"].includes(request.url)) {
                
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
    } else if (request.headers["sec-fetch-mode"] === "no-cors") {
        next()
    }
})

app.get("/", (request, response) => {
    response.sendFile(storage.media["aW5k"])
})

app.use("/media", router.media)
app.use("/accounts", router.accounts)
app.use("/events", router.events)
app.use("/community", router.community)
app.use("/inbox", router.inbox)
app.use("/missions", router.missions)

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
                response.json(Object.entries(storage.accounts).filter((account) => account[1].token[0] === authorization.token)[0])
            } else {
                response.json({ error: [100, "Invalid token."] })
            }
        } else if (authorization.username && authorization.twofactor) {
            if (Object.entries(storage.accounts).filter((account) => account[1].username === authorization.username).length > 0) {
                account = Object.entries(storage.accounts).filter((account) => account[1].username === authorization.username)[0]
                // Verify two-factor
                storage.accounts[account[0]].token = [uuidv4(), Date.now() + (24 * 60 * 60 * 1000)]
                fs.writeFileSync("./storage/accounts.json", JSON.stringify(storage.accounts))
                response.json([account[0], storage.accounts[account[0]]])
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
            fs.writeFileSync("./storage/event.json", JSON.stringify(storage.events))
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
            fs.writeFileSync("./storage/event.json", JSON.stringify(storage.events))
            response.json({})
        }
    }
})

router.community.get("/", (request, response) => {
    response.json(storage.community.sort(function(a, b){ return b.timestamp - a.timestamp }).slice(0, 50))
})
router.community.post("/post", (request, response) => {
    console.log(request)
    authorization = JSON.parse(atob(request.headers["authorization"]))
    account = Object.entries(storage.accounts).filter((account) => account[1].token[0] === authorization.token)[0]
    storage.community.push({
        from: [account[0], account[1].username],
        content: request.body.content,
        timestamp: Date.now()
    })
    fs.writeFileSync("./storage/community.json", JSON.stringify(storage.community))
    response.json(storage.community[storage.community.length-1])
})

router.inbox.get("/", (request, response) => {
    authorization = JSON.parse(atob(request.headers["authorization"]))
    account = Object.entries(storage.accounts).filter((account) => account[1].token[0] === authorization.token)[0]
    response.json(Object.fromEntries(Object.entries(account[1].inbox).filter((mail) => (Date.now() - mail[1].timestamp) < (10 * 24 * 60 * 60 * 1000))))
})
router.inbox.post("/send", (request, response) => {
    id = uuidv4().split("-")[2]
    authorization = JSON.parse(atob(request.headers["authorization"]))
    account = Object.entries(storage.accounts).filter((account) => account[1].token[0] === authorization.token)[0]
    account[1].inbox[id] = {
        title: request.body.title,
        to: request.body.to,
        from: account[0],
        content: request.body.content,
        timestamp: Date.now()
    }
    response.json(account[1].inbox[id])
})

router.missions.get("/", (request, response) => {
    authorization = JSON.parse(atob(request.headers["authorization"]))
    account = Object.entries(storage.accounts).filter((account) => account[1].token[0] === authorization.token)[0]
    console.log(account)
    response.json(account[1].missions)
})
router.missions.post("/verify/:id", (request, response) => {
    authorization = JSON.parse(atob(request.headers["authorization"]))
    account = Object.entries(storage.accounts).filter((account) => account[1].token[0] === authorization.token)[0]
    if (account[1].missions[request.params.id]) {

    }
})
router.missions.post("/accept", (request, response) => {
    authorization = JSON.parse(atob(request.headers["authorization"]))
    account = Object.entries(storage.accounts).filter((account) => account[1].token[0] === authorization.token)[0]
    if (account[1].inbox[request.body.mailId]) {
        if (account[1].inbox[request.body.mailId].missions) {
            Object.entries(account[1].inbox[request.body.mailId].missions).forEach((mission) => {
                account[1].missions[mission[0]] = mission[1]
            })
            delete account[1].inbox[request.body.mailId]
            response.json(account[1].missions)
        }
    }
    // console.log(request.body.mailId, Object.entries(account[1].inbox).filter((mail) => mail[1].to === account[0]))
})

server.listen(5000, () => {
    id = uuidv4().split("-")[2]
    storage.accounts["c2da2346c2c0"].inbox[id] = {
        title: "Are you Ready?",
        from: "AMOR HQ",
        content: "Dear Agent Jeyrome,<br><br>Welcome to Project Amor.<br>We are an international group created for one purpose: to save the world through love.<br><br>Your first mission is to spend time with a loved one.<br>Are you up for the job?<br><br>This message would be auto deleted in 10 days.<br><br>Yours Sincerely,<br>President of Project Amor",
        timestamp: Date.now(),
        missions: Object.fromEntries([
            [uuidv4().split("-")[3], { title: "Spend time with a loved one", timestamp: Date.now() }]
        ])
    }
    console.log(storage)
})