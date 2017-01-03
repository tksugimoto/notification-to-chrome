
const host = "127.0.0.1";
const port = 28888;



const http = require("http");
const httpServer = http.createServer((req, res) => {
	const time = Date.now();
	const remoteIP = req.connection.remoteAddress;
	const method = req.method;
	const path = req.url;
	const headers = req.headers;

	new Promise(resolve => {
		if (method === "POST") {
			let body = "";
			req.on("data", chunk => {
				body += chunk.toString();
			});
			req.on("end", () => {
				resolve(body);
			});
		} else {
			resolve(null);
		}
	}).then(body => {
		const clientExists = notify({
			time, remoteIP, method, path, headers, body
		});
		res.writeHead(clientExists ? 200 : 404);
		res.end();
	}).catch(err => {
		console.error(err);
	});
});
httpServer.listen(port, host, function() {
	console.log(`[${new Date()}] Server is listening on http://${host}:${port}/`);
});


function notify(data) {
	const message = JSON.stringify(data);
	return wsConnections.broadcast(message) !== 0;
}

const wsConnections = (() => {
	const list = [];
	return {
		add: ws => {
			list.push(ws);
		},
		remove: ws => {
			const index = list.indexOf(ws);
			console.log({
				type: "remove",
				index
			});
			if (index !== -1) {
				list.splice(index, 1);
			}
		},
		broadcast: message => {
			list.forEach(ws => {
				ws.send(message);
			});
			return list.length;
		}
	};
})();

function isConnectionAllowed(remoteIP, path) {
	return remoteIP === "127.0.0.1";
}

const WebSocketServer = require("ws").Server;
const wsServer = new WebSocketServer({
	server: httpServer
});
wsServer.on("connection", ws => {
	const remoteIP = ws.upgradeReq.connection.remoteAddress;
	const path = ws.upgradeReq.url;
	console.log({
		time: new Date(),
		type: "ws connection start",
		remoteIP,
		path
	});

	if (isConnectionAllowed(remoteIP, path)) {
		wsConnections.add(ws);
		ws.on("close", () => {
			wsConnections.remove(ws);
		});
	}
});
