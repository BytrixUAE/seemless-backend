# Socket.IO Endpoints – Postman Reference

**Base:** Connect to your server (e.g. `http://localhost:3002`) with Socket.IO client.  
**Auth:** Send JWT in handshake query: `?authorization=<base64_encoded_jwt>` (see below).

---

## How to connect the socket

### 1. Get your access token (JWT)

Use your normal **login API** (e.g. `POST /api/user/login` or token endpoint). The response should contain an **access token** (JWT). That same token is used for both REST API and Socket.IO.

### 2. Encode the token for Socket

The server expects the JWT to be sent in the handshake **query** as **base64**:

- **Query param name:** `authorization`
- **Value:** Base64 encoding of the **raw JWT string** (not "Bearer " + token; just the token encoded in base64).

**JavaScript (browser / Node):**
```js
const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."; // from login
const authQuery = Buffer.from(jwt, 'utf8').toString('base64');
// In browser: btoa(jwt) or use a base64 lib
```

**Example:** If JWT is `abc123`, then `authorization` = base64 of `"abc123"` → e.g. `YWJjMTIz`.

### 3. Connect (JavaScript client)

```js
const io = require("socket.io-client");  // or <script src="socket.io.js">

const jwt = "YOUR_ACCESS_TOKEN_FROM_LOGIN";
const authBase64 = Buffer.from(jwt, "utf8").toString("base64");

const socket = io("http://localhost:3002", {
  query: {
    authorization: authBase64
  },
  transports: ["websocket"]
});

socket.on("connect", () => {
  console.log("Connected", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("Connection failed", err.message);
});
```

### 4. Connect in Postman

1. New request → **Socket.IO**.
2. **URL:** `http://localhost:3002` (or your backend URL).
3. **Query params:**
   - Key: `authorization`  
   - Value: **base64 of your JWT** (e.g. use Postman pre-request script or a base64 encoder).
4. Click **Connect**. If auth fails you’ll get a connection error (401).

### 5. Notes

- Socket runs on the **same port** as your Express server (e.g. `BACKEND_PORT=3002`).
- Optional: `authorization` can be sent as `Bearer <base64_jwt>`; the server strips the `"Bearer "` prefix and still decodes the rest as base64.
- After connect, the server joins the socket to `user_<user_id>` and the user’s chat rooms; you can then emit events like `_sendMessage`, `_getChatThreads`, etc.

---

## Connection / Presence

### 1. Online / Offline (server → client, no request)

Listen for presence; no client emit required.

| Server emitter   | When           | Payload (dummy)        | Comment                          |
|------------------|----------------|------------------------|----------------------------------|
| `user_online`    | User connects  | `{ "user_id": 1 }`     | User came online                 |
| `user_offline`   | User disconnects | `{ "user_id": 1 }`   | User went offline                |

---

### 2. `_getOnlineStatus`

Get online user IDs or check specific users.

**Emit (client → server):**

```json
{
  "user_ids": [1, 2, 3]
}
```

- **Empty / omit `user_ids`:** returns all online user IDs.
- **With `user_ids`:** returns which of those are online.

**Response:** Via callback (e.g. 2nd argument of `emit(..., callback)`).

**Dummy request (all online):**
```json
{}
```

**Dummy request (specific users):**
```json
{
  "user_ids": [1, 2, 3]
}
```

**Callback response (all):**
```json
{
  "online_user_ids": [1, 5, 12]
}
```

**Callback response (specific):**
```json
{
  "users": { "1": true, "2": false, "3": true },
  "online_user_ids": [1, 3]
}
```

---

### 3. `_joinRoom`

Join a room by ID (e.g. for receiving room events).

**Emit:**
- `params` can be the room ID (number or string), e.g. `5` → joins `room_5`.

**Dummy:** `5` or `"5"`

**Server emitter (to sender):** `room_` — e.g. `"Room joined successfully"`.

---

### 4. `_leaveRoom`

Leave a room by ID.

**Emit:** Room ID, e.g. `5`.

**Dummy:** `5` or `"5"`

**Server emitter (to sender):** `room_` — e.g. `"Room leaved successfully"`.

---

## Chat messages

### 5. `_sendMessage`

Send a text or file message.

**Emit (client → server):**

```json
{
  "chat_room_id": 1,
  "message_type": "TEXT",
  "message": "Hello!"
}
```

- **1:1 chat:** use `target_user_id` instead of `chat_room_id` (room created if needed).
- **Text:** `message_type: "TEXT"`, `message` required.
- **File:** `message_type: "FILE"`, `file_type`, `file_name`, `file_url` required.

**Dummy (text, existing room):**
```json
{
  "chat_room_id": 1,
  "message_type": "TEXT",
  "message": "Hello world"
}
```

**Dummy (text, 1:1 by user):**
```json
{
  "target_user_id": 2,
  "message_type": "TEXT",
  "message": "Hi there"
}
```

**Dummy (file):**
```json
{
  "chat_room_id": 1,
  "message_type": "FILE",
  "file_type": "image",
  "file_name": "photo.jpg",
  "file_url": "user/abc-123.jpg"
}
```

**Server emitters:**
- To sender: response via controller (e.g. success payload).
- To room: `receivedMessage_` — all in `room_<chat_room_id>`.
- New 1:1 thread: `newThread_` to both users (`user_<user_id>`).

---

### 6. `_deleteChatMessage`

Delete a message for self or for everyone (if sender).

**Emit:**
```json
{
  "message_id": 10,
  "is_fromEveryone": false
}
```

- `is_fromEveryone: true` — delete for everyone (only sender allowed); server emits `deleteChatMessage_` to room.
- `is_fromEveryone: false` — delete for self only; server emits `deleteChatMessage_` to sender.

**Dummy:**
```json
{
  "message_id": 10,
  "is_fromEveryone": false
}
```

**Server emitter:** `deleteChatMessage_` (to room or to sender as above).

---

### 7. `_getChatThreads`

List 1:1 chat threads (with last message, unread, is_online).

**Emit:**
```json
{
  "page": 1,
  "limit": 20
}
```

**Dummy:**
```json
{
  "page": 1,
  "limit": 20
}
```

**Server emitter (to sender):** `getChatThreads_` — paginated list; each thread has `is_online` for the other user.

---

### 8. `_getGroupThreads`

List group chat threads.

**Emit:** Optional body, e.g. `{}`.

**Dummy:** `{}`

**Server emitter (to sender):** `getGroupThreads_` — list of groups; members include `is_online`.

---

### 9. `_getUnreadThreadsCount`

Get unread counts for chat and group threads.

**Emit:** `{}`

**Dummy:** `{}`

**Server emitter (to sender):** `getUnreadThreadsCount_` — e.g. `{ "chat_count": 2, "group_count": 1 }`.

---

### 10. `_loadChatHistory`

Load messages for a chat room (paginated).

**Emit:**
```json
{
  "chat_room_id": 1,
  "page": 1,
  "limit": 20,
  "offset": 0
}
```

**Dummy:**
```json
{
  "chat_room_id": 1,
  "page": 1,
  "limit": 20
}
```

**Server emitter (to sender):** `loadChatHistory_` — messages + total; also resets unread count for that room.

---

### 11. `_loadChatHistoryBetweenUsers`

Load chat history by other user ID (1:1).

**Emit:**
```json
{
  "user_id": 2,
  "page": 1,
  "limit": 20
}
```

**Dummy:**
```json
{
  "user_id": 2,
  "page": 1,
  "limit": 20
}
```

**Server emitter (to sender):** `loadChatHistoryBetweenUsers_` — messages for the 1:1 room.

---

### 12. `_resetMessageCount`

Reset unread count for a room.

**Emit:**
```json
{
  "chat_room_id": 1
}
```

**Dummy:** `{ "chat_room_id": 1 }`

**Server emitter (to sender):** `resetMessageCount_` — e.g. `{ "chat_room_id": 1 }`.

---

### 13. `_markMessagesAsSeen`

Mark messages as read/seen in a room.

**Emit:**
```json
{
  "chat_room_id": 1,
  "last_message_id": 50
}
```

- Omit `last_message_id` to mark all messages in the room as seen.

**Dummy:**
```json
{
  "chat_room_id": 1,
  "last_message_id": 50
}
```

**Server emitters:**
- To sender: `markMessagesAsSeen_` — e.g. `{ chat_room_id, last_message_id, updated_count }`.
- To room: `messagesSeen_` — `{ chat_room_id, user_id, last_message_id, updated_count }` (for read receipts).

---

### 14. `_blockChatThread`

Block a chat thread (room).

**Emit:**
```json
{
  "chat_room_id": 1
}
```

**Dummy:** `{ "chat_room_id": 1 }`

**Server emitter (to sender):** `blockChatThread_`.

---

### 15. `_deleteChatThread`

Delete/hide a chat thread for the current user.

**Emit:**
```json
{
  "chat_room_id": 1
}
```

**Dummy:** `{ "chat_room_id": 1 }`

**Server emitter (to sender):** `deleteChatThread_`.

---

### 16. `_findOrCreateRoom`

Get or create 1:1 room with another user.

**Emit:**
```json
{
  "target_user_id": 2
}
```

**Dummy:** `{ "target_user_id": 2 }`

**Server emitters:**
- To sender: `findOrCreateRoom_` — room + user info.
- If new room created: `newRoom_` to the other user (`user_<target_user_id>`).

---

## Group chat

### 17. `_createGroup`

Create a group and add members.

**Emit:**
```json
{
  "title": "My Group",
  "image_url": "user/group-avatar.jpg",
  "members": [2, 3, 4]
}
```

**Dummy:**
```json
{
  "title": "My Group",
  "image_url": "user/group-avatar.jpg",
  "members": [2, 3, 4]
}
```

**Server emitters:**
- To creator: `createGroup_` — group record.
- To each member: `newGroup_` (to `user_<user_id>`).

---

### 18. `_updateGroupDetails`

Update group title and image.

**Emit:**
```json
{
  "chat_room_id": 1,
  "title": "Updated Title",
  "image_url": "user/new-image.jpg"
}
```

**Dummy:** As above.

**Server emitter (to room):** `updateGroupDetails_` — updated group; also may emit `receivedMessage_` for system message.

---

### 19. `_addMember`

Add members to a group.

**Emit:**
```json
{
  "chat_room_id": 1,
  "members": [5, 6]
}
```

**Dummy:** As above.

**Server emitters:**
- To room: `newMemberAdded_`.
- To each new member: `receivedAddedInGroupMessage_` (to `user_<user_id>`).
- To room: `receivedMessage_` (system message).

---

### 20. `_removeMember`

Remove member(s) from group.

**Emit:**
```json
{
  "chat_room_id": 1,
  "members": [5]
}
```

**Dummy:** As above.

**Server emitters:**
- To room: `removeMember_`, `receivedMessage_`.
- To removed user: `receivedRemoveFromGroupMessage_` (to `user_<user_id>`).

---

### 21. `_leaveGroup`

Current user leaves the group.

**Emit:**
```json
{
  "chat_room_id": 1
}
```

**Dummy:** `{ "chat_room_id": 1 }`

**Server emitters:**
- To room: `memberLeaved_`, `receivedMessage_`.
- If new admin assigned: `becomeAdmin_` to that user.
- To sender: `leaveGroup_`.

---

## Quick reference: all client events and main server emitters

| Client emit              | Main server response / broadcast |
|--------------------------|-----------------------------------|
| `_getOnlineStatus`       | Callback: `online_user_ids` or `users` |
| `_joinRoom`             | `room_` (to sender)              |
| `_leaveRoom`            | `room_` (to sender)               |
| `_sendMessage`          | `receivedMessage_` (room), `newThread_` (if new 1:1) |
| `_deleteChatMessage`    | `deleteChatMessage_` (room or sender) |
| `_getChatThreads`       | `getChatThreads_` (sender)       |
| `_getGroupThreads`      | `getGroupThreads_` (sender)      |
| `_getUnreadThreadsCount`| `getUnreadThreadsCount_` (sender) |
| `_loadChatHistory`      | `loadChatHistory_` (sender)      |
| `_loadChatHistoryBetweenUsers` | `loadChatHistoryBetweenUsers_` (sender) |
| `_resetMessageCount`    | `resetMessageCount_` (sender)    |
| `_markMessagesAsSeen`   | `markMessagesAsSeen_` (sender), `messagesSeen_` (room) |
| `_blockChatThread`      | `blockChatThread_` (sender)      |
| `_deleteChatThread`     | `deleteChatThread_` (sender)     |
| `_findOrCreateRoom`     | `findOrCreateRoom_` (sender), `newRoom_` (other user) |
| `_createGroup`          | `createGroup_` (sender), `newGroup_` (members) |
| `_updateGroupDetails`   | `updateGroupDetails_` (room)    |
| `_addMember`            | `newMemberAdded_` (room), `receivedAddedInGroupMessage_` (new members) |
| `_removeMember`         | `removeMember_` (room), `receivedRemoveFromGroupMessage_` (removed) |
| `_leaveGroup`           | `leaveGroup_` (sender), `memberLeaved_` (room), `becomeAdmin_` (new admin) |

---

## Postman Socket.IO setup

1. New request → **Socket.IO**.
2. URL: `http://localhost:3002` (or your server).
3. Query params: `authorization` = your base64-encoded JWT (same as app).
4. Connect, then add **Event name** (e.g. `_sendMessage`) and **Message** body (e.g. the JSON dummies above).
5. Listen for the corresponding emitter (e.g. `receivedMessage_`, `getChatThreads_`) in the Socket.IO response/events panel.

Use the dummies in this doc as request bodies and the table above to know which event to listen for.
