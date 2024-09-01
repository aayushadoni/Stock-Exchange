import { WebSocketServer } from "ws";
import { UserManager } from "./UserManager";

const wss = new WebSocketServer({ port: 3005 });

wss.on("connection", (ws) => {
    UserManager.getInstance().addUser(ws);
});
